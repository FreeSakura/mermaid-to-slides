import "./style.css";
import {
  examples,
  themes,
  parseFlowchart,
  layoutDiagram,
  diagramSvg,
  slideMetrics,
  planDiagram,
} from "./diagram.js";

import {
  createProject,
  serializeProject,
  importProjectText,
  createDraftStore,
  MAX_FILE_BYTES,
} from "./project.js";

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
  )}</div></div><div class="file-bar"><button id="open-source" class="secondary">Open file</button><button id="save-source" class="secondary">Save .mmd</button><button id="save-project" class="secondary">Save project</button><button id="undo-replace" class="text-button" disabled>Undo replace</button><input id="file-input" type="file" accept=".mmd,.mermaid,.json" hidden aria-label="Open Mermaid source or project"></div><div class="draft-bar"><label><input id="remember-draft" type="checkbox"> Remember draft on this device</label><button id="clear-draft" class="text-button">Clear saved draft</button><span id="draft-status" role="status">Draft storage is off.</span></div><div class="code-wrap"><label class="sr-only" for="source">Mermaid flowchart source</label><textarea id="source" spellcheck="false" autocapitalize="off" autocomplete="off" aria-describedby="syntax-note"></textarea></div><div class="source-bottom"><span id="source-count"></span><span>Ctrl / ⌘ + Enter to export</span></div><details><summary>Supported syntax</summary><div id="syntax-note"><p><code>flowchart</code> / <code>graph</code> with LR, RL, TB, TD or BT.</p><p><code>A[Rectangle]</code> · <code>B(Rounded)</code> · <code>C{Decision}</code> · <code>D((Circle))</code> · <code>E[(Database)]</code> · <code>F([Pill])</code></p><p>Connections: <code>--&gt;</code>, <code>--- </code>, <code>-.→</code> (write <code>-.-></code>), <code>==&gt;</code>. Labels: <code>A --&gt;|Yes| B</code>. Quoted labels, chains, comments and Chinese text are supported.</p><p>Groups: <code>subgraph id [Title]</code> … <code>end</code>, up to 15 groups and four nesting levels. Groups inherit the global direction. Declare nodes in their groups before cross-group references. Local direction, group-endpoint edges, custom styles, HTML, Markdown labels and other diagram types are not supported. Up to 60 nodes / 100 connections.</p></div></details></section>
<section class="preview-panel" aria-labelledby="preview-heading"><div class="panel-bar"><h2 id="preview-heading"><span class="step">02</span> Slide preview</h2><span class="format">16:9 · PPTX</span></div><div class="preview-options"><label>Slide title<input id="title" maxlength="90" value="From idea to release"></label><label>Theme<select id="theme">${Object.entries(
  themes,
)
  .map(([k, t]) => `<option value="${k}">${t.name}</option>`)
  .join(
    "",
  )}</select></label></div><div class="layout-controls"><label>Slide direction<select id="layout-direction"><option value="source">From source</option><option value="auto">Best fit</option><option value="LR">Left → right</option><option value="TB">Top → bottom</option><option value="RL">Right → left</option><option value="BT">Bottom → top</option></select></label><label>Spacing<select id="layout-spacing"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label><button id="fit-slide" class="secondary">Fit to slide</button></div><p id="layout-summary" class="layout-summary" role="status"></p><p class="layout-hint">Layout changes affect the slide and SVG. Your Mermaid source stays unchanged.</p><div class="stage"><div class="slide" id="slide"><div class="slide-title" id="slide-title"></div><div class="slide-rule"></div><div class="diagram-area" id="diagram"></div></div><div class="empty" id="empty" hidden>Fix the source to preview your diagram.</div></div><div class="preview-footer"><span id="stats" aria-live="polite"></span><span class="native-badge">Editable shapes & lines</span></div><div id="notice" role="status" aria-live="polite"></div><div class="export-row"><button id="svg-export" class="secondary">Save SVG</button><button id="export" class="primary">Download PowerPoint <span aria-hidden="true">↓</span></button></div><p class="export-note">Edit nodes and text together. Lines are editable freeforms; rerouting is manual. Source is saved in slide notes.</p><p id="group-note" class="export-note" hidden>Group frames are editable boundaries. Moving a frame does not move its contents.</p></section></div>
<footer><span>Built for the last mile between an idea and a slide.</span><span>Open source · MIT license</span></footer></main>`;
const $ = (s) => document.querySelector(s),
  source = $("#source"),
  title = $("#title"),
  theme = $("#theme");
let current = null,
  timer,
  exporting = false;
let revision = 0,
  importRequest = 0,
  previousProject = null,
  savingTimer;
const drafts = createDraftStore(() => window.localStorage);
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
    current = planDiagram(source.value, layoutSettings());
    $("#diagram").innerHTML = diagramSvg(current, theme.value);
    $("#group-note").hidden = !current.groups.length;
    $("#slide").hidden = false;
    $("#empty").hidden = true;
    $("#export").disabled = exporting;
    $("#svg-export").disabled = false;
    $("#stats").textContent =
      `${current.nodes.length} nodes · ${current.edges.length} connections${current.groups.length ? ` · ${current.groups.length} groups` : ""}`;
    const size = slideMetrics(current).fontSize;
    const smallest =
      size *
      Math.min(
        1,
        current.groups.length ? 16 / 18 : 1,
        current.edges.some((edge) => edge.label) ? 15 / 18 : 1,
      );
    $("#layout-summary").textContent =
      `${current.direction} · node labels ≈ ${size.toFixed(1)} pt${current.layoutOptions.direction === "auto" ? " · best fit of 4 directions" : ""}`;
    notify(
      smallest < 12
        ? `Some diagram text is about ${smallest.toFixed(1)} pt. Try Fit to slide, shorten labels or split the diagram. PowerPoint may render text differently.`
        : "",
      smallest < 12 ? "warning" : "",
    );
  } catch (err) {
    current = null;
    $("#group-note").hidden = true;
    $("#layout-summary").textContent =
      "Fix the source to compare slide layouts.";
    $("#slide").hidden = true;
    $("#empty").hidden = false;
    $("#export").disabled = true;
    $("#svg-export").disabled = true;
    $("#stats").textContent = "Source needs attention";
    notify(err.message, "error");
  }
}
function layoutSettings() {
  return {
    direction: $("#layout-direction").value,
    spacing: $("#layout-spacing").value,
  };
}
function snapshot() {
  return {
    format: "mermaid-to-slides",
    version: 2,
    source: source.value,
    title: title.value,
    theme: theme.value,
    layout: layoutSettings(),
  };
}
function draftStatus(text) {
  $("#draft-status").textContent = text;
}
function saveDraft() {
  if (!$("#remember-draft").checked) return;
  let saved = false;
  try {
    saved = drafts.save(snapshot());
  } catch {}
  draftStatus(
    saved
      ? "Draft saved on this device."
      : "Could not save draft. Download a project file to keep your work.",
  );
}
function edited() {
  revision++;
  clearTimeout(savingTimer);
  if ($("#remember-draft").checked) savingTimer = setTimeout(saveDraft, 200);
}
function applyProject(project, rememberPrevious = true) {
  clearTimeout(timer);
  if (rememberPrevious) {
    previousProject = snapshot();
    $("#undo-replace").disabled = false;
  }
  source.value = project.source;
  title.value = project.title;
  theme.value = project.theme;
  $("#layout-direction").value = project.layout.direction;
  $("#layout-spacing").value = project.layout.spacing;
  document
    .querySelectorAll(".example")
    .forEach((b) => b.setAttribute("aria-pressed", "false"));
  edited();
  render();
}
function load(id, rememberPrevious = true) {
  const e = examples[id];
  applyProject(
    createProject({ ...e, theme: theme.value, layout: layoutSettings() }),
    rememberPrevious,
  );
  document
    .querySelectorAll(".example")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.example === id)),
    );
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
  const exportName = filename();
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
      `${exportName}.pptx`,
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
  edited();
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
title.addEventListener("input", () => {
  edited();
  render();
});
theme.addEventListener("change", () => {
  edited();
  render();
});
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
for (const id of ["#layout-direction", "#layout-spacing"])
  $(id).addEventListener("change", () => {
    edited();
    render();
  });
$("#fit-slide").addEventListener("click", () => {
  $("#layout-direction").value = "auto";
  $("#layout-spacing").value = "compact";
  edited();
  render();
});
$("#save-source").addEventListener("click", () =>
  download(source.value, filename() + ".mmd", "text/plain;charset=utf-8"),
);
$("#save-project").addEventListener("click", () => {
  try {
    download(
      serializeProject(snapshot()),
      filename() + ".mts.json",
      "application/json",
    );
  } catch (e) {
    notify(e.message, "error");
  }
});
$("#open-source").addEventListener("click", () => $("#file-input").click());
$("#file-input").addEventListener("change", async () => {
  const input = $("#file-input"),
    file = input.files?.[0];
  input.value = "";
  if (!file) return;
  const request = ++importRequest;
  const initialRevision = revision;
  try {
    if (file.size > MAX_FILE_BYTES)
      throw Error("File is too large. Choose a file under 256 KB.");
    const text = await file.text();
    if (request !== importRequest) return;
    if (revision !== initialRevision)
      throw Error(
        "Your editor changed while the file was opening. Open the file again to replace it.",
      );
    const project = importProjectText(text, file.name, snapshot());
    applyProject(project);
  } catch (e) {
    if (request !== importRequest) return;
    notify(e.message, "error");
  }
});
$("#undo-replace").addEventListener("click", () => {
  if (!previousProject) return;
  const restore = previousProject;
  previousProject = null;
  applyProject(restore, false);
  $("#undo-replace").disabled = true;
});
$("#remember-draft").addEventListener("change", () => {
  clearTimeout(savingTimer);
  if ($("#remember-draft").checked) saveDraft();
  else
    draftStatus(
      drafts.clear()
        ? "Draft storage is off. Saved copy cleared."
        : "Could not clear saved copy. Clear this site's browser data to remove it.",
    );
});
$("#clear-draft").addEventListener("click", () => {
  clearTimeout(savingTimer);
  $("#remember-draft").checked = false;
  draftStatus(
    drafts.clear()
      ? "Saved draft cleared. Editor content is unchanged."
      : "Could not clear saved copy. Clear this site's browser data to remove it.",
  );
});
window.addEventListener("pagehide", saveDraft);
load("product", false);
const saved = drafts.read();
if (saved.status === "found") {
  $("#remember-draft").checked = true;
  applyProject(saved.project, false);
  draftStatus("Restored your draft from this device.");
} else if (saved.status === "error") {
  draftStatus(
    "Saved draft could not be read, or storage is unavailable. You can still use project files.",
  );
}
