import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";
import {
  examples,
  parseFlowchart,
  layoutDiagram,
  diagramSvg,
  wrapText,
} from "../src/diagram.js";
import { exportPptx } from "../src/export.js";

test("all shipped examples export editable nodes and freeform lines, never pictures", async () => {
  for (const [key, e] of Object.entries(examples)) {
    const d = layoutDiagram(parseFlowchart(e.source));
    assert.ok(
      d.nodes.every((n) =>
        [n.x, n.y, n.width, n.height].every(Number.isFinite),
      ),
      key,
    );
    assert.ok(
      d.edges.every(
        (e) =>
          e.points.length >= 2 &&
          e.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
      ),
    );
    const zip = await JSZip.loadAsync(
      await exportPptx(d, { title: e.title, source: e.source }),
    );
    const xml = await zip.file("ppt/slides/slide1.xml").async("string");
    const errors = [];
    const dom = new DOMParser({
      onError: (level, message) => errors.push(`${level}: ${message}`),
    }).parseFromString(xml, "text/xml");
    assert.deepEqual(errors, [], key);
    const paths = dom.getElementsByTagName("a:path");
    assert.equal(paths.length, d.edges.length);
    for (const point of dom.getElementsByTagName("a:pt")) {
      assert.ok(Number.isFinite(Number(point.getAttribute("x"))));
      assert.ok(Number.isFinite(Number(point.getAttribute("y"))));
    }
    assert.equal((xml.match(/name="node:/g) || []).length, d.nodes.length, key);
    assert.equal((xml.match(/name="edge:/g) || []).length, d.edges.length, key);
    assert.equal(
      (xml.match(/<a:custGeom>/g) || []).length,
      d.edges.length,
      key,
    );
    assert.doesNotMatch(
      xml,
      /<p:cxnSp>/,
      "PowerPoint does not accept custom geometry inside a connector",
    );
    assert.doesNotMatch(xml, /<p:pic>|undefined|NaN/);
    const ids = [...xml.matchAll(/<p:cNvPr id="(\d+)"/g)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, "unique shape IDs");
    for (const ref of xml.matchAll(/<a:(?:stCxn|endCxn) id="(\d+)"/g))
      assert.ok(ids.includes(ref[1]));
    const notes = await zip
      .file("ppt/notesSlides/notesSlide1.xml")
      .async("string");
    assert.ok(notes.includes("Mermaid source"));
    if (key === "chinese") {
      assert.ok(xml.includes("收集需求"));
      assert.ok(xml.includes("Microsoft YaHei"));
    }
  }
});
test("supported shape syntax, named edges, chains, declarations and comments", () => {
  const d = parseFlowchart(
    '%% heading\ngraph TD; A["semi; colon"] --> B(Round) -->|Yes| C{Decision}; C -- done --> D((Circle)); D -.-> E[(Data)]; E ==> F([End]); A --- F',
  );
  assert.equal(d.nodes.length, 6);
  assert.equal(d.edges.length, 6);
  assert.equal(d.direction, "TB");
  assert.equal(d.nodes[0].label, "semi; colon");
  assert.equal(d.edges[1].label, "Yes");
  assert.equal(d.edges[2].label, "done");
  assert.equal(d.edges[3].dashed, true);
  assert.equal(d.edges[5].arrow, false);
});
test("duplicate declarations update labels, references preserve them", () => {
  const d = parseFlowchart(
    "flowchart LR\nA[Original] --> B\nB --> A\nA[Final]",
  );
  assert.equal(d.nodes.length, 2);
  assert.equal(d.nodes[0].label, "Final");
});
test("compact Mermaid arrows work without spaces and IDs may contain hyphens", () => {
  const d = parseFlowchart("flowchart LR; A-->B-.->C==>my-service; C---A");
  assert.equal(d.nodes.length, 4);
  assert.equal(d.edges.length, 4);
  assert.equal(d.nodes.at(-1).id, "my-service");
});
test("decision connections meet the diamond outline", () => {
  const d = layoutDiagram(
    parseFlowchart("flowchart LR; A{Question} --> B; A --> C"),
  );
  const n = d.nodes.find((n) => n.id === "A");
  for (const e of d.edges) {
    const p = e.points[0];
    assert.ok(
      Math.abs(
        Math.abs(p.x - n.x) / (n.width / 2) +
          Math.abs(p.y - n.y) / (n.height / 2) -
          1,
      ) < 1e-8,
    );
  }
});
test("unsupported syntax is rejected instead of dropping content", () => {
  for (const s of [
    "sequenceDiagram\nA->>B: Hi",
    "flowchart LR\nsubgraph Group\nA-->B\nend\nGroup-->C",
    "flowchart LR\nA[Hello]\nstyle A fill:red",
    "flowchart LR\nA[broken",
    "flowchart LR\nA & B --> C",
    "flowchart LR\nA[<img src=x>]",
  ])
    assert.throws(() => parseFlowchart(s), undefined, s);
});
test("SVG escapes user labels and never injects markup", () => {
  const d = layoutDiagram(
    parseFlowchart(
      'flowchart LR\nA["Tom & Jerry"] -->|"yes & no"| B["< literal"]',
    ),
  );
  const svg = diagramSvg(d);
  assert.ok(svg.includes("Tom &amp; Jerry"));
  assert.ok(svg.includes("&lt; literal"));
  assert.ok(svg.includes("yes &amp; no"));
});
test("CJK wrapping preserves all non-whitespace content", () => {
  const s = "这是一个用来验证中文换行不会丢失字符的很长的节点标题";
  const lines = wrapText(s, 16);
  assert.ok(lines.length > 1);
  assert.equal(lines.join(""), s);
});
test("all flowchart directions, cycles, parallel edges and self loops have finite geometry", () => {
  for (const dir of ["LR", "RL", "TB", "BT"]) {
    const d = layoutDiagram(
      parseFlowchart(
        `flowchart ${dir}\nA --> B\nB --> A\nA -->|again| A\nA -->|other| B`,
      ),
    );
    assert.ok(d.width > 0 && d.height > 0);
    assert.equal(d.edges.length, 4);
    assert.ok(
      d.edges.every((e) =>
        e.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
      ),
    );
  }
});
