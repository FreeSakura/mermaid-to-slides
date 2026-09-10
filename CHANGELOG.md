# Changelog

Each iteration links its demand evidence, implementation PR, validation and release. Feature hypotheses are not presented as customer testimonials.

## 0.2.0 — 2026-09-10

Iteration 001: [tracking issue #1](https://github.com/FreeSakura/mermaid-to-slides/issues/1) · [market/decision note](docs/research/2026-09-10-market-needs.md).

- Import `.mmd`/`.mermaid` source and export exact source text.
- Save/open versioned `.mts.json` project files containing source, title and theme, including unfinished diagrams.
- Opt-in local device draft recovery; clear saved drafts without clearing the editor.
- Undo file/example replacements. Slow file reads cannot overwrite newer edits.
- Handle malformed/future project formats, file-size limits and denied/corrupt browser storage.
- Keep a PowerPoint download's filename tied to the title at export start.

Storage is local to a browser and site origin, not cloud sync. Default draft storage remains off. Project files are the portable option. The Mermaid subset and PowerPoint freeform-line limitation are unchanged.

Validation: source/project roundtrips, opt-in/reload/clear flows, corrupt/blocked storage, async import races, and existing PPTX/SVG regressions. Release links and hosted-check results are recorded in the iteration PR.

## 0.1.0 — 2026-09-10

[Initial release](https://github.com/FreeSakura/mermaid-to-slides/releases/tag/v0.1.0): Mermaid flowchart subset to editable PowerPoint, three themes, Chinese labels, SVG export and three PowerPoint-verified examples.
