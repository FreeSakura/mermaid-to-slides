import "./style.css";
import {
  examples,
  themes,
  parseFlowchart,
  layoutDiagram,
  diagramSvg,
  slideMetrics,
} from "./diagram.js";

const icon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="7" height="6" rx="1.5"/><rect x="14" y="15" width="7" height="6" rx="1.5"/><path d="M6.5 9v9H14m-3-3 3 3-3 3"/></svg>';
document.querySelector("#app").innerHTML = `
<header><a class="brand" href="./">${icon}<span>Mermaid <span class="muted">to</span> Slides</span><span class="beta">BETA</span></a><a class="github" href="https://github.com/FreeSakura/mermaid-to-slides" target="_blank" rel="noopener">GitHub <span aria-hidden="true">↗</span></a></header>
<main><div class="intro"><div><div class="eyebrow">FROM CODE TO YOUR NEXT PRESENTATION</div><h1>Your diagram. <em>Fully editable.</em></h1><p>Paste a Mermaid flowchart. Download real PowerPoint shapes.</p></div><div class="privacy"><span aria-hidden="true">◈</span> Processed in your browser<br><span>No uploads. No account. No API key.</span></div></div>
<div class="workbench"><section class="editor-panel" aria-labelledby="source-heading"><div class="panel-bar"><h2 id="source-heading"><span class="step">01</span> Mermaid source</h2><button id="reset" class="text-button">Reset</button></div><div class="examples"><span>Try an example</span><div>${Object.entries(
  examples,
)
  .map(
    ([id, e]) =>
      `<button class="example" data-example="${id}">${e.name}</button>`,
  )
  .join(
    "",
  )}</div></div><div class="code-wrap"><label class="sr-only" for="source">Mermaid flowchart source</label><textarea id="source" spellcheck="false" autocapitalize="off" autocomplete="off" aria-describedby="syntax-note"></textarea></div><div class="source-bottom"><span id="source-count"></span><span>Ctrl / ⌘ + Enter to export</span></div><details><summary>Supported syntax</summary><div id="syntax-note"><p><code>flowchart</code> / <code>graph</code> with LR, RL, TB, TD or BT.</p><p><code>A[Rectangle]</code> · <code>B(Rounded)</code> · <code>C{Decision}</code> · <code>D((Circle))</code> · <code>E[(Database)]</code> · <code>F([Pill])</code></p><p>Connections: <code>--&gt;</code>, <code>--- </code>, <code>-.→</code> (write <code>-.-></code>), <code>==&gt;</code>. Labels: <code>A --&gt;|Yes| B</code>. Quoted labels, chains, comments and Chinese text are supported.</p><p>Subgraphs, custom styles, HTML, Markdown labels and other diagram types are not supported in this beta. Up to 60 nodes / 100 connections.</p></div></details></section>
<section class="preview-panel" aria-labelledby="preview-heading"><div class="panel-bar"><h2 id="preview-heading"><span class="step">02</span> Slide preview</h2><span class="format">16:9 · PPTX</span></div><div class="preview-options"><label>Slide title<input id="title" maxlength="90" value="From idea to release"></label><label>Theme<select id="theme">${Object.entries(
  themes,
)
  .map(([k, t]) => `<option value="${k}">${t.name}</option>`)
  .join(
    "",
  )}</select></label></div><div class="stage"><div class="slide" id="slide"><div class="slide-title" id="slide-title"></div><div class="slide-rule"></div><div class="diagram-area" id="diagram"></div></div><div class="empty" id="empty" hidden>Fix the source to preview your diagram.</div></div><div class="preview-footer"><span id="stats" aria-live="polite"></span><span class="native-badge">Editable shapes & lines</span></div><div id="notice" role="status" aria-live="polite"></div><div class="export-row"><button id="svg-export" class="secondary">Save SVG</button><button id="export" class="primary">Download PowerPoint <span aria-hidden="true">↓</span></button></div><p class="export-note">Edit nodes and text together. Lines are editable freeforms; rerouting is manual. Source is saved in slide notes.</p></section></div>
<footer><span>Built for the last mile between an idea and a slide.</span><span>Open source · MIT license</span></footer></main>`;
const $ = (s) => document.querySelector(s),
  source = $("#source"),
  title = $("#title"),
  theme = $("#theme");
let current = null,
  timer,
  exporting = false;
function notify(text, kind = "") {
  const n = $("#notice");
  n.textContent = text;
  n.className = kind;
}
function render() {
  $("#source-count").textContent = `${source.value.split("\n").length} lines`;
  $("#slide-title").textContent = title.value.trim() || "My flowchart";
  const t = themes[theme.value];
  $("#slide").style.setProperty("--paper", `#${t.paper}`);
  $("#slide").style.setProperty("--ink", `#${t.ink}`);
  $("#slide").style.setProperty("--accent", `#${t.accent}`);
  try {
    current = layoutDiagram(parseFlowchart(source.value));
    $("#diagram").innerHTML = diagramSvg(current, theme.value);
    $("#slide").hidden = false;
    $("#empty").hidden = true;
    $("#export").disabled = exporting;
    $("#svg-export").disabled = false;
    $("#stats").textContent =
      `${current.nodes.length} nodes · ${current.edges.length} connections`;
    const size = slideMetrics(current).fontSize;
    notify(
      size < 12
        ? `This diagram is dense (about ${size.toFixed(1)} pt on the slide). Shorten labels or split it for readable presentation text.`
        : "",
      size < 12 ? "warning" : "",
    );
  } catch (err) {
    current = null;
    $("#slide").hidden = true;
    $("#empty").hidden = false;
    $("#export").disabled = true;
    $("#svg-export").disabled = true;
    $("#stats").textContent = "Source needs attention";
    notify(err.message, "error");
  }
}
function load(id) {
  const e = examples[id];
  source.value = e.source;
  title.value = e.title;
  document
    .querySelectorAll(".example")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.example === id)),
    );
  render();
}
function download(data, name, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const filename = () =>
  (title.value.trim() || "flowchart")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/[. ]+$/, "")
    .slice(0, 90) || "flowchart";
async function exportSlide() {
  if (exporting) return;
  clearTimeout(timer);
  render();
  if (!current) return;
  exporting = true;
  $("#export").disabled = true;
  $("#export").textContent = "Preparing PowerPoint…";
  const snapshot = current,
    opts = {
      title: title.value.trim() || "My flowchart",
      theme: theme.value,
      source: source.value,
    };
  try {
    const { exportPptx } = await import("./export.js");
    const data = await exportPptx(snapshot, opts);
    download(
      data,
      `${filename()}.pptx`,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
    notify(
      "PowerPoint downloaded. Each node and its text can be edited together.",
      "success",
    );
  } catch (e) {
    notify(`Could not export: ${e.message}`, "error");
  } finally {
    exporting = false;
    $("#export").disabled = !current;
    $("#export").innerHTML =
      'Download PowerPoint <span aria-hidden="true">↓</span>';
  }
}
source.addEventListener("input", () => {
  clearTimeout(timer);
  $("#export").disabled = true;
  $("#svg-export").disabled = true;
  timer = setTimeout(render, 300);
  document
    .querySelectorAll(".example")
    .forEach((b) => b.setAttribute("aria-pressed", "false"));
});
source.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    source.setRangeText(
      "  ",
      source.selectionStart,
      source.selectionEnd,
      "end",
    );
    source.dispatchEvent(new Event("input"));
  }
});
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    exportSlide();
  }
});
title.addEventListener("input", render);
theme.addEventListener("change", render);
document
  .querySelectorAll(".example")
  .forEach((b) => b.addEventListener("click", () => load(b.dataset.example)));
$("#reset").addEventListener("click", () => load("product"));
$("#export").addEventListener("click", exportSlide);
$("#svg-export").addEventListener("click", () => {
  clearTimeout(timer);
  render();
  if (current)
    download(
      diagramSvg(current, theme.value),
      `${filename()}.svg`,
      "image/svg+xml",
    );
});
load("product");
