import fs from "node:fs/promises";
import { examples, planDiagram, diagramSvg } from "../src/diagram.js";
import { exportPptx } from "../src/export.js";
import { createProject, serializeProject } from "../src/project.js";
const example = examples.grouped;
const project = createProject({
  ...example,
  theme: "mint",
  layout: { direction: "auto", spacing: "compact" },
});
const diagram = planDiagram(project.source, project.layout);
await fs.mkdir("examples", { recursive: true });
await fs.writeFile("examples/grouped-fit.mts.json", serializeProject(project));
await fs.writeFile(
  "examples/grouped-fit.pptx",
  await exportPptx(diagram, project),
);
await fs.writeFile(
  "examples/grouped-fit.svg",
  diagramSvg(diagram, project.theme),
);
console.log("Generated fitted architecture project, SVG and editable PPTX.");
