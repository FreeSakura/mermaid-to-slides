# Iteration 003: fit diagrams to a presentation slide

Date: 2026-09-10. The repository API reports 0 stars, 0 forks and 0 open issues at this review. No adoption, retention or conversion data is available. This is an engineering/usability hypothesis backed by a reproducible case, not a customer testimonial.

## External evidence

- [Mermaid issue #2162](https://github.com/mermaid-js/mermaid/issues/2162) describes complex/subgraph diagrams being continually reduced to fit a page, with increasingly hard-to-read content. It requests viewer zoom; it does not request this project's slide-layout optimizer.
- [Live Editor issue #1271](https://github.com/mermaid-js/mermaid-live-editor/issues/1271) reports large exported PNG diagrams becoming unreadable. Raster resolution differs from editable PPT text sizing, but this is a related readability symptom, not evidence that SVG or PPT universally solves it.
- [Zed discussion #62511](https://github.com/zed-industries/zed/discussions/62511) asks for zoom and expansion to inspect larger diagrams. This supports separating inspection controls from exported readability: browser zoom alone does not increase the text size on the exported slide.

## Reproduction on v0.3.0

`slideMetrics(layoutDiagram(...)).fontSize` on the existing examples gives these nominal node-label point sizes on the fixed 16:9 slide:

| Example | Source direction | Source size | Horizontal candidate |
| --- | --- | --- | --- |
| Grouped architecture | TB | 9.22 pt | 15.07 pt (LR) |
| System architecture | TB | 12.55 pt | 15.38 pt (LR) |
| Product release | LR | 11.12 pt | 11.12 pt (LR) |

These are calculated layout sizes, not observed reading speeds or guaranteed final font sizes. PowerPoint autofit and font substitution may change actual text rendering. This establishes a concrete opportunity to improve some existing diagrams without changing their nodes or connections.

## Decision and acceptance

- Keep existing default output unchanged: source direction and comfortable spacing.
- Add presentation direction (source, best fit, LR/RL/TB/BT), comfortable/compact spacing, and a one-click best-fit+compact action.
- Best fit evaluates the supported global directions for the selected spacing and maximizes nominal node-label size. Prefer the source direction on ties. It is a bounded heuristic, not an optimal graph-layout solver.
- Preserve the original Mermaid source. SVG and PPT use the selected layout; speaker notes record the layout selection and original source.
- Project schema v2 and opt-in drafts retain the settings. Read existing schema-v1 files/drafts with source/comfortable defaults; reject invalid or unknown settings. Source-only `.mmd` remains unchanged and does not carry presentation overrides.
- Show resolved direction and nominal node-label size, retain density warnings and explicitly note that large diagrams may still require splitting.
- Test graph semantics, default regressions, schema migration, import/undo/draft roundtrips and bundle export. Inspect representative optimized and source-layout exports in PowerPoint before release.

## Deferred

Viewer zoom, manual node positioning and automatic multi-slide splitting remain separate work. None is implied to be completed by this iteration. Reprioritize them using actual feedback when available.
