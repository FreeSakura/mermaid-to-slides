# Changelog

Each iteration links its demand evidence, implementation PR, validation and release. Feature hypotheses are not presented as customer testimonials.

## 0.4.0 — 2026-09-10

Iteration 003: [tracking issue #5](https://github.com/FreeSakura/mermaid-to-slides/issues/5) · [slide readability research](docs/research/2026-09-10-slide-readability.md).

- Add slide direction overrides, best-fit direction selection and comfortable/compact spacing. **Fit to slide** selects best-fit direction with compact spacing.
- Show resolved direction and nominal node-label size. Density warnings also account for the smaller group titles and edge labels.
- Preserve original Mermaid source; the SVG/PPT use the selected layout and PPT notes record the settings.
- Save layout settings in project schema v2 and opt-in drafts. Existing v1 projects/drafts migrate to source-direction/comfortable defaults. Source-only files stay unchanged.
- Add a fitted architecture example and a reproducible `scripts/readability-report.mjs` comparison.

The grouped example's nominal node size increases from 9.22 pt to 16.00 pt with this heuristic. This is a measured example, not a universal readability guarantee. Dense diagrams may still need splitting; font substitution/autofit can change rendering. Defaults preserve v0.3.0 geometry.

Validation: default geometry equality, graph semantics across layout candidates, best-fit scoring/ties, schema migration, draft/project/undo/import roundtrips, actual bundle PPTX export, and PowerPoint renders of source/optimized examples. See the iteration PR for CI/deployment records.

## 0.3.0 — 2026-09-10

Iteration 002: [tracking issue #3](https://github.com/FreeSakura/mermaid-to-slides/issues/3) · [architecture grouping research](docs/research/2026-09-10-architecture-groups.md).

- Support explicit-ID and bare-identifier subgraphs, nested up to four levels, with editable PowerPoint container titles/boundaries.
- Preserve node membership and cross-group node endpoints. Reserve group header space in the shared SVG/PPT layout.
- Add a grouped architecture example and a PowerPoint-rendered preview.
- Reject empty groups, ID/ownership conflicts, missing `end`, local direction and edges to entire groups with explanatory errors.
- Namespace layout IDs so reserved-looking user node IDs remain safe.

Groups inherit the global direction. Containers are visual boundaries, not Office object groups; moving one does not move its children. Existing manual freeform line adjustment remains unchanged. Full Mermaid compatibility is not claimed.

Validation: nested containment, four directions, cross-group references, native editable container XML, Chinese titles, ID/limit errors and existing project/export regressions. Representative old/new PPTX files opened and rendered in Microsoft PowerPoint; exact checks and deployment records are linked from the iteration PR.

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
