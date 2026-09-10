# Contributing

Use Node.js 22.12+ and run `npm ci`, then `npm run dev`.

Before submitting a pull request, run `npm run check`. Add a regression test for a parser, escaping, geometry or export behavior change. If a syntax feature is added, update the support table and both export paths. Do not silently ignore unsupported syntax.

PPTX export is tested structurally and the examples have been checked in PowerPoint. For changes to OOXML, regenerate examples with `node scripts/generate-examples.mjs` and check that PowerPoint opens them without repair prompts. A valid ZIP or XML file alone does not establish compatibility.

Report a bug with a minimal, anonymized Mermaid example, expected behavior, and browser/PowerPoint version. Never include customer diagrams, credentials or internal system details.

Keep conversion local. Do not introduce telemetry, external diagram uploads or paid API dependencies into the default flow.
