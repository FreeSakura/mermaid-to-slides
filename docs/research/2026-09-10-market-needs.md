# Market signals and iteration 001

Research date: 2026-09-10. This is a small qualitative review, not a market-size study or a forecast of GitHub stars.

## Baseline

GitHub API snapshot for FreeSakura/mermaid-to-slides: 0 stars, 0 forks, 0 open issues; the all-state issue list was empty. No customer interviews, usage analytics or retention measurements exist. Do not claim product-market fit or invent demand counts.

## Evidence

| Source                                                                                                                                    | Observed signal                                                                         | What it does and does not establish                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [Mermaid issue #3239](https://github.com/mermaid-js/mermaid/issues/3239), opened 2022-07-18                                               | A user requests PowerPoint/Slides export with editable text and nodes                   | Direct qualitative support for the core use case; an old request does not quantify current demand                      |
| [Slidev issue #2721](https://github.com/slidevjs/slidev/issues/2721)                                                                      | Editable PPTX export discussion describes text metrics, SVG and font portability limits | Evidence that output fidelity is a real engineering problem; not proof that our implementation meets every requirement |
| [Mermaid NG editor](https://github.com/NextGenPowerToys/mermaid-visual-editor/blob/main/vscode-extension/README.md)                       | Documents file import, save-back, source files and multi-diagram workflows              | Competitor workflow evidence for source portability; not a request from our users                                      |
| [Mermalaid](https://github.com/highvoltag3/mermalaid)                                                                                     | Documents local autosave and source file import/export                                  | Competitor evidence for continuing work across sessions; no adoption inference                                         |
| [Mermaid discussion #7722](https://github.com/orgs/mermaid-js/discussions/7722), 2026-05-07                                               | A contributor proposes manual positioning and rerouting edges                           | A useful layout pain hypothesis, not an accepted upstream roadmap or broad customer consensus                          |
| [diagram-pptx](https://github.com/sci-gen/diagram-pptx) and [offipy changelog](https://github.com/Zn070515/offipy/blob/main/CHANGELOG.md) | Editable conversion and subgraph support are already offered by alternatives            | Subgraphs are a competitive capability gap, not an empty market                                                        |

## Priorities

Scores below are maintainer judgments, not survey results. Preference goes to a reproducible task failure, clear acceptance criteria and manageable compatibility risk.

1. **Continue and transfer work (iteration 001, v0.2.0):** v0.1.0 resets the editor on refresh, has no file import, and only preserves source inside PPT notes. Add explicit opt-in device drafts, Mermaid source import/export, and a versioned project file containing source, title and theme. This lowers the cost of repeat use without cloud storage.
2. **Architecture grouping:** investigate simple subgraphs with native editable containers. Require preview/PPT parity and nesting/cross-group fixtures before claiming support.
3. **Layout editing and connected edges:** validate the actual desired workflow before replacing the current freeform connections. PowerPoint acceptance and endpoint behavior are mandatory checks; XML well-formedness alone is insufficient.
4. **Readable larger diagrams:** compare split-slides and adjustable layout before merely shrinking text. Keep explicit warnings about density.

## Iteration 001 acceptance

- Source text survives `.mmd` export and reimport without content loss.
- A project JSON restores source, title and theme; unsupported versions or malformed files preserve the current editor.
- Device storage is opt-in, visibly local, and can be cleared. Unavailable/corrupt storage cannot crash the editor.
- Invalid work-in-progress syntax can be saved and restored.
- Import or example replacement can be undone; an asynchronous file read must not overwrite newer edits.
- Existing PowerPoint/SVG export continues to pass the actual bundle integration test.

## Success measures and next review

This release can establish task completion and compatibility, not retention or star growth. At the next review, inspect repository issues and released-example failures, note the current public counters with a date, and ask for anonymized input examples through the issue template. Do not add telemetry to manufacture a metric. Reprioritize when concrete user feedback differs from this hypothesis.
