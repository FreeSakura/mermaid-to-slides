import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import {
  examples,
  parseFlowchart,
  layoutDiagram,
  planDiagram,
  slideMetrics,
} from "../src/diagram.js";
import {
  createProject,
  validateProject,
  serializeProject,
  importProjectText,
} from "../src/project.js";
import { exportPptx } from "../src/export.js";

const semantics = (d) => ({
  nodes: d.nodes.map(({ id, label, type, parent }) => ({
    id,
    label,
    type,
    parent,
  })),
  edges: d.edges.map(({ id, from, to, label, arrow, dashed, thick }) => ({
    id,
    from,
    to,
    label,
    arrow,
    dashed,
    thick,
  })),
  groups: d.groups.map(({ id, label, parent, depth }) => ({
    id,
    label,
    parent,
    depth,
  })),
});
test("default presentation layout exactly preserves existing node and edge geometry", () => {
  for (const example of Object.values(examples)) {
    const expected = layoutDiagram(parseFlowchart(example.source)),
      actual = planDiagram(example.source);
    assert.deepEqual(actual.nodes, expected.nodes);
    assert.deepEqual(actual.edges, expected.edges);
    assert.deepEqual(actual.groups, expected.groups);
    assert.equal(actual.width, expected.width);
    assert.equal(actual.height, expected.height);
  }
});
test("best fit scores at least as well as source direction without changing graph semantics", () => {
  for (const example of Object.values(examples))
    for (const spacing of ["comfortable", "compact"]) {
      const model = parseFlowchart(example.source),
        auto = planDiagram(example.source, { direction: "auto", spacing });
      for (const direction of ["LR", "TB", "RL", "BT"])
        assert.ok(
          slideMetrics(auto).fontSize >=
            slideMetrics(layoutDiagram({ ...model, direction }, { spacing }))
              .fontSize -
              0.0001,
        );
      assert.deepEqual(semantics(auto), semantics(planDiagram(example.source)));
    }
  const grouped = planDiagram(examples.grouped.source, {
    direction: "auto",
    spacing: "comfortable",
  });
  assert.equal(grouped.direction, "LR");
  assert.ok(slideMetrics(grouped).fontSize > 15);
});
test("best-fit ties retain source reading direction", () => {
  for (const direction of ["LR", "RL", "TB", "BT"])
    assert.equal(
      planDiagram(`flowchart ${direction}; A`, { direction: "auto" }).direction,
      direction,
    );
});
test("compact grouped layouts retain header clearance in every direction", () => {
  for (const direction of ["LR", "RL", "TB", "BT"]) {
    const d = planDiagram(examples.grouped.source, {
      direction,
      spacing: "compact",
    });
    for (const group of d.groups)
      for (const child of [...d.groups, ...d.nodes].filter(
        (n) => n.parent === group.id,
      ))
        assert.ok(
          child.y - child.height / 2 >=
            group.y - group.height / 2 + group.titleHeight - 0.01,
        );
  }
});
test("schema v1 migrates to source layout while schema v2 retains layout settings", () => {
  const old = {
    format: "mermaid-to-slides",
    version: 1,
    source: examples.grouped.source,
    title: "Legacy",
    theme: "mint",
  };
  const upgraded = validateProject(old);
  assert.equal(upgraded.version, 2);
  assert.deepEqual(upgraded.layout, {
    direction: "source",
    spacing: "comfortable",
  });
  const modern = createProject({
    ...old,
    layout: { direction: "auto", spacing: "compact" },
  });
  assert.deepEqual(
    importProjectText(serializeProject(modern), "test.mts.json", upgraded),
    modern,
  );
  assert.deepEqual(
    importProjectText("flowchart LR; A", "source.mmd", modern).layout,
    modern.layout,
  );
  for (const layout of [
    null,
    {},
    [],
    { direction: "sideways", spacing: "compact" },
    { direction: "auto", spacing: "none" },
    { direction: ["LR"], spacing: "compact" },
  ])
    assert.throws(() => validateProject({ ...modern, layout }));
});
test("PPTX retains original source and resolved presentation layout in notes", async () => {
  const source = examples.grouped.source,
    d = planDiagram(source, { direction: "auto", spacing: "compact" });
  const zip = await JSZip.loadAsync(await exportPptx(d, { source }));
  const notes = await zip
    .file("ppt/notesSlides/notesSlide1.xml")
    .async("string");
  assert.ok(notes.includes("flowchart TB"));
  assert.ok(notes.includes(`Slide direction: ${d.direction}`));
  assert.ok(notes.includes("spacing: compact"));
  const xml = await zip.file("ppt/slides/slide1.xml").async("string");
  assert.equal((xml.match(/name="node:/g) || []).length, 5);
  assert.equal((xml.match(/name="group:/g) || []).length, 3);
});
