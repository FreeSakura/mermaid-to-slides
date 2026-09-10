import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import {
  parseFlowchart,
  layoutDiagram,
  diagramSvg,
  examples,
} from "../src/diagram.js";
import { exportPptx } from "../src/export.js";
const rect = (n) => ({
  l: n.x - n.width / 2,
  r: n.x + n.width / 2,
  t: n.y - n.height / 2,
  b: n.y + n.height / 2,
});

test("nested groups preserve membership and cross-group endpoints in all global directions", () => {
  for (const dir of ["TB", "BT", "LR", "RL"]) {
    const d = layoutDiagram(
      parseFlowchart(
        examples.grouped.source.replace("flowchart TB", "flowchart " + dir),
      ),
    );
    assert.equal(d.groups.length, 3);
    assert.equal(d.nodes.length, 5);
    assert.equal(d.edges.length, 4);
    assert.equal(d.nodes.find((n) => n.id === "DB").parent, "storage");
    assert.ok(d.edges.some((e) => e.from === "Web" && e.to === "API"));
    for (const group of d.groups) {
      const box = rect(group);
      assert.ok(
        [group.x, group.y, group.width, group.height].every(Number.isFinite),
      );
      for (const child of [...d.nodes, ...d.groups].filter(
        (n) => n.parent === group.id,
      )) {
        const c = rect(child);
        assert.ok(
          c.l >= box.l - 0.01 && c.r <= box.r + 0.01,
          `${dir}: ${child.id} horizontal containment`,
        );
        assert.ok(
          c.t >= box.t + group.titleHeight - 0.01,
          `${dir}: ${child.id} overlaps header in ${group.id}`,
        );
        assert.ok(
          c.b <= box.b + 0.01,
          `${dir}: ${child.id} bottom containment`,
        );
      }
    }
    for (const edge of d.edges)
      assert.ok(
        edge.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
      );
  }
});
test("grouped nodes can be referenced outside their group without moving", () => {
  const d = parseFlowchart(
    "flowchart LR; A-->B; subgraph one [One]; A[Start]; end; subgraph two [Two]; B[End]; B-->A; end",
  );
  assert.equal(d.nodes.find((n) => n.id === "A").parent, "one");
  assert.equal(d.nodes.find((n) => n.id === "B").parent, "two");
});
test("group titles and boundaries export as native text-bearing rectangles", async () => {
  const d = layoutDiagram(parseFlowchart(examples.grouped.source));
  const zip = await JSZip.loadAsync(
    await exportPptx(d, { source: examples.grouped.source }),
  );
  const xml = await zip.file("ppt/slides/slide1.xml").async("string");
  assert.equal((xml.match(/name="group:/g) || []).length, 3);
  assert.ok(xml.includes('<a:highlight>'), 'header text must remain readable across crossing routes');
  assert.ok(xml.includes("应用服务"));
  assert.ok(xml.includes("Data services"));
  assert.doesNotMatch(xml, /<p:pic>|NaN|undefined/);
  assert.ok(
    xml.indexOf('name="group:server"') < xml.indexOf('name="group:storage"'),
  );
  for (const group of d.groups) {
    const escaped = group.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const shape = xml.match(
      new RegExp(
        '<p:sp><p:nvSpPr><p:cNvPr[^>]+name="group:' +
          escaped +
          '"[\\s\\S]*?</p:sp>',
      ),
    )?.[0];
    assert.ok(shape);
    assert.ok(shape.includes('<a:prstGeom prst="rect">'));
    assert.ok(shape.includes("<a:t>"));
  }
});
test("empty groups, unmatched end, reused IDs and unsupported direction/endpoints are clear errors", () => {
  const bad = [
    ["flowchart LR; end", "matching"],
    ["flowchart LR; subgraph group; A", "Missing end"],
    ["flowchart LR; subgraph group; end; A", "empty"],
    ["flowchart LR; subgraph group; A; end; group-->B", "not to the group"],
    ["flowchart LR; group-->A; subgraph group; B; end", "already used"],
    [
      "flowchart LR; subgraph group; A; end; subgraph group; B; end",
      "already used",
    ],
    [
      "flowchart LR; subgraph a; N[X]; end; subgraph b; N[Y]; end",
      "already in",
    ],
    [
      "flowchart LR; subgraph a; direction TB; A; end",
      "Local subgraph direction",
    ],
  ];
  for (const [source, message] of bad)
    assert.throws(
      () => parseFlowchart(source),
      (e) => e.message.includes(message),
      source,
    );
});
test("limits, escaping, long Chinese titles and reserved-looking IDs remain safe", () => {
  assert.throws(
    () =>
      parseFlowchart(
        "flowchart LR;" +
          Array.from({ length: 5 }, (_, i) => "subgraph g" + i + ";").join("") +
          "A;end;end;end;end;end",
      ),
    /four nesting/,
  );
  const title = "中文分组标题".repeat(8);
  const d = layoutDiagram(
    parseFlowchart(
      `flowchart LR; subgraph group ["${title} & data"]; __proto__[Safe]-->constructor; end`,
    ),
  );
  assert.ok(d.groups[0].titleLines.length > 1);
  assert.ok(diagramSvg(d).includes("&amp;"));
  assert.ok(d.nodes.every((n) => Number.isFinite(n.x)));
});
test("nested sibling containers do not overlap and group self loops stay finite", () => {
  const source =
    "flowchart LR; subgraph parent; subgraph one; A; end; subgraph two; B; end; A-->B; B-->B; end";
  const d = layoutDiagram(parseFlowchart(source));
  const [a, b] = ["one", "two"].map((id) =>
    rect(d.groups.find((g) => g.id === id)),
  );
  assert.ok(a.r <= b.l || b.r <= a.l || a.b <= b.t || b.b <= a.t);
  assert.ok(
    d.edges.every((e) =>
      e.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    ),
  );
});
