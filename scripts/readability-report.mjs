import { examples, planDiagram, slideMetrics } from "../src/diagram.js";
for (const [name, example] of Object.entries(examples)) {
  const original = planDiagram(example.source);
  const fitted = planDiagram(example.source, {
    direction: "auto",
    spacing: "compact",
  });
  console.log(
    JSON.stringify({
      name,
      sourceDirection: original.direction,
      sourceNodePt: +slideMetrics(original).fontSize.toFixed(2),
      fitDirection: fitted.direction,
      fitNodePt: +slideMetrics(fitted).fontSize.toFixed(2),
    }),
  );
}
