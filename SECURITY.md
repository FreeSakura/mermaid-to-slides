# Security and privacy

Diagrams are processed in the browser. There is no application backend, telemetry, user account, remote model call or image upload. Do not add untrusted HTML to the preview: labels must pass through the XML escaper. The parser limits source size, labels, node count and edge count.

Local draft storage is opt-in and uses the `mermaid-to-slides:draft:v1` localStorage key. Clearing the saved draft removes only that key. Drafts are scoped to a site origin/browser profile; people sharing the profile or code running on that origin may access them. Project JSON files contain source text and should be shared with the same care as the original diagram. They are validated as data and never evaluated as code. A corrupt, future-version or unreadable project must not replace the current editor.

The legacy storage key is retained for compatibility; payloads now use project schema v2, which also includes presentation-layout settings. Existing v1 payloads migrate without deleting source. Unsupported direction/spacing values are rejected before replacing editor state.

The development server binds to loopback by default. Deploy the built `dist/` assets, not the development server.

## Dependency audit note (2026-09-10)

PptxGenJS 4.0.1 has a transitive `image-size` dependency flagged for image-decoder denial of service ([ICNS](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [JXL/HEIF](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq)). The upstream audit currently offers no compatible patched `image-size` release. This app does not accept images, call image sizing, or expose a server-side export endpoint. The affected image-decoding path is not used by the current flowchart export. The dependency advisory still exists: do not interpret passing functional tests as a clean dependency audit, and reassess before adding any image support.

PptxGenJS also marks `image-size` as unavailable in its browser package mapping. The static browser build does not contain those image decoders. Local Node-based example generation still installs the transitive package but never feeds it images.

Report security issues through [private vulnerability reporting](https://github.com/FreeSakura/mermaid-to-slides/security/advisories/new), instead of including sensitive diagrams or credentials in a public issue. Reports should identify the affected commit and contain a minimal, non-sensitive reproduction.
