# Mermaid to Slides

**Paste a Mermaid flowchart. Download editable PowerPoint shapes.**

[Live demo](https://freesakura.github.io/mermaid-to-slides/) · [中文说明](README.zh-CN.md) · [Download example PPTX](examples/product.pptx) · [Report a bug](https://github.com/FreeSakura/mermaid-to-slides/issues/new?template=bug_report.yml)

![CI](https://github.com/FreeSakura/mermaid-to-slides/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

![An actual PowerPoint export: a product release flowchart](docs/powerpoint-preview.png)

AI tools are good at writing Mermaid. Your teammates still need to change the diagram in a slide deck. Mermaid to Slides turns a focused subset of Mermaid into native PowerPoint objects: editable text inside shapes, editable vector paths, and separate edge labels.

## Try it

1. Open the **[live editor](https://freesakura.github.io/mermaid-to-slides/)**.
2. Paste a flowchart, or choose one of the three examples.
3. Pick a theme and download the `.pptx`.
4. Open it in PowerPoint. Click a node to edit its text or formatting. Use **Edit Points** to adjust a connection.

No account, API key or diagram upload. Parsing, layout and export run in your browser. The site serves application assets normally; it contains no analytics, diagram API or remote fonts. Refreshing the page resets your work, so copy the source before leaving.

## What you get

- Native PowerPoint nodes with text inside the shape, not a screenshot.
- One editable freeform path per connection, with arrowheads and dashed/thick styles.
- A 16:9 slide, three themes, SVG export and the original source in speaker notes.
- Chinese and English label wrapping, plus a warning when a diagram becomes too dense.
- Clear errors for unsupported syntax rather than silently missing diagram content.

**Connections do not automatically reroute when a node moves.** Edit their points manually. Edge labels are separate text objects. The preview and PowerPoint share geometry, but font rendering can vary by operating system and presentation application. Chinese text uses Microsoft YaHei when available, with application font substitution otherwise.

## Supported Mermaid subset

This project uses its own deliberately small parser and Dagre layout. It is **not the complete Mermaid renderer** and does not reproduce Mermaid's default styling.

```mermaid
flowchart LR
  A([New idea]) --> B[Build prototype]
  B --> C{Ready to ship?}
  C -->|Yes| D[Release]
  C -->|Not yet| E[Collect feedback]
  E --> B
  D --> F([Measure impact])
```

| Feature        | Supported                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------- |
| Diagram header | `flowchart` / `graph`, LR / RL / TB / TD / BT                                                 |
| Nodes          | Rectangle `[ ]`, rounded `( )`, pill `([ ])`, diamond `{ }`, circle `(( ))`, database `[( )]` |
| Edges          | `-->`, `---`, `-.->`, `==>`                                                                   |
| Edge labels    | `A -->\|Yes\| B` or `A -- Yes --> B`                                                          |
| Text           | Plain text, quoted labels, Chinese, `<br/>` line breaks                                       |
| Other          | Chains, repeated node references, `%%` comments, semicolon-separated statements               |
| Limits         | 60 nodes, 100 edges, 30,000 source characters, 240 characters per label                       |

Not supported yet: subgraphs, `classDef`, `style`, click actions, HTML/Markdown labels, Mermaid initialization directives, sequence/class/ER diagrams, images or arbitrary SVG import. Split large diagrams into separate slides. SVG export contains the diagram only; PPTX includes the slide title.

## Run locally

Requires Node.js **22.13 or newer**.

```bash
git clone https://github.com/FreeSakura/mermaid-to-slides.git
cd mermaid-to-slides
npm ci
npm run dev
```

```bash
npm run check                  # parser, export, UI-controller tests and production build
node scripts/generate-examples.mjs
npm run preview                # serve the production build locally
```

`npm run build` produces a static `dist/` folder. It works on GitHub Pages and other static hosts, including a repository subpath. No server or environment variables are needed.

## How it works

`Mermaid subset → graph model → Dagre layout → SVG preview / PptxGenJS + OOXML export`

Node text stays inside its PowerPoint shape. Routed edges use a single native freeform shape per edge; they are not embedded images. The export avoids custom geometry in `p:cxnSp`, which PowerPoint rejected during compatibility testing. Source is retained in slide notes for regeneration.

The repository includes parser/geometry regression tests, source escaping checks, native-object export checks and DOM-based controller tests. The three shipped PPTX examples were additionally opened and rendered in Microsoft PowerPoint on Windows. Automated tests are not a guarantee of identical rendering in every slide application; please report the application/version with compatibility issues.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Small, well-tested parser improvements and real-world anonymized examples are welcome. When adding syntax, update parsing, preview, PPTX export, tests and the support table together.

If this saves you time, a star helps other people discover it.

## Credits and license

[Dagre](https://github.com/dagrejs/dagre) for graph layout, [PptxGenJS](https://github.com/gitbrent/PptxGenJS) for presentation generation, [JSZip](https://github.com/Stuk/jszip) for package editing, and [Vite](https://github.com/vitejs/vite) for the build. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

MIT © 2026 FreeSakura. This independent project is not affiliated with Mermaid or Microsoft.
