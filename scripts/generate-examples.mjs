import { mkdir, writeFile } from "node:fs/promises";
import {
  examples,
  parseFlowchart,
  layoutDiagram,
  diagramSvg,
} from "../src/diagram.js";
import { exportPptx } from "../src/export.js";
await mkdir("examples", { recursive: true });
for (const [name, e] of Object.entries(examples)) {
  const d = layoutDiagram(parseFlowchart(e.source));
  await writeFile(`examples/${name}.mmd`, e.source + "\n");
  await writeFile(`examples/${name}.svg`, diagramSvg(d));
  await writeFile(
    `examples/${name}.pptx`,
    await exportPptx(d, { title: e.title, source: e.source }),
  );
}
console.log(
  `Generated ${Object.keys(examples).length} Mermaid, SVG and editable PowerPoint examples.`,
);
