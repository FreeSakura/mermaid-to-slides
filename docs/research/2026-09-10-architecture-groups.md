# Iteration 002: architecture groups

Date: 2026-09-10. GitHub snapshot: 0 stars, 0 forks, no open issues or PRs after iteration 001. There is still no external feedback on this project; this is a maintainer hypothesis, not a claim of product-market fit.

## Demand signals

- [Mermaid flowchart documentation](https://mermaid.js.org/syntax/flowchart.html#subgraphs) defines subgraphs and explicit IDs. Its direction section also documents interactions between internal directions and external node links. This establishes expected syntax, not market size.
- [Issue #6785](https://github.com/mermaid-js/mermaid/issues/6785) describes large systems with different desired flows inside modules. The issue discussion shows demand for layout control; the opening assertion that Mermaid lacks local directions should not be repeated as a fact, because the documentation supports that syntax with limitations.
- [Issue #7946](https://github.com/mermaid-js/mermaid/issues/7946) reports surprising external links and direction behavior in subgraphs. This is a user report awaiting triage, not an independently reproduced upstream defect.
- [Issue #7298](https://github.com/mermaid-js/mermaid/issues/7298) asks about positioning cloud, DMZ and on-premises groups without annotating every edge. It concerns Mermaid's separate architecture syntax; it supports grouping as a workflow need, not compatibility with that diagram type.
- The alternatives in iteration 001 already offer grouping. The opportunity is a small browser workflow with editable output, not an unoccupied conversion market.

## Decision

v0.2.0 rejects every `subgraph` statement. A grouped architecture example therefore cannot complete the existing paste → PowerPoint flow. Add explicit-ID subgraphs and bare identifier titles, up to four nesting levels and fifteen groups, while retaining all existing node/edge limits.

All groups inherit the graph's LR/RL/TB/BT direction in this release. Explicit local `direction`, group-endpoint edges, empty groups, ID collisions and conflicting node ownership must produce actionable errors. Do not silently ignore them or advertise full Mermaid compatibility. Declare nodes within their intended groups before using cross-group references; references to already grouped nodes preserve ownership.

## Acceptance and verification

- Keep container titles, nesting and node membership in the shared model, SVG and native editable PowerPoint rectangles.
- Route cross-group node edges without changing their semantic endpoints.
- Reserve title space and avoid overlaps between headers and their descendants. Test four global directions, nested groups, external references and long Chinese titles.
- Containers are visual boundaries, not PowerPoint object groups; moving a boundary does not move its children. State this limitation alongside the existing manual line adjustment limitation.
- Regress old examples, source/project persistence, XML escaping and editable-object export. Open and render old and new examples in Microsoft PowerPoint before release.
- Publish issue, PR, changelog, release assets and production verification. No adoption or star-growth claims without evidence.
