import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { JSDOM } from "jsdom";
import { DRAFT_KEY } from "../src/project.js";
import JSZip from "jszip";

const bundle = build({
  entryPoints: ["src/main.js"],
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
  loader: { ".css": "empty" },
}).then((r) => r.outputFiles[0].text);
async function editor(stored, blocked = false) {
  const dom = new JSDOM('<div id="app"></div>', {
    url: "https://example.test/",
    runScripts: "outside-only",
  });
  const w = dom.window,
    downloads = [];
  w.Blob = Blob;
  w.structuredClone = structuredClone;
  w.setImmediate = setImmediate;
  w.clearImmediate = clearImmediate;
  w.TextEncoder = TextEncoder;
  w.TextDecoder = TextDecoder;
  w.URL.createObjectURL = (b) => {
    downloads.push(b);
    return "blob:download";
  };
  w.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = function () {};
  if (stored) w.localStorage.setItem(DRAFT_KEY, stored);
  if (blocked)
    Object.defineProperty(w, "localStorage", {
      get() {
        throw Error("Blocked");
      },
    });
  w.eval(await bundle);
  const $ = (s) => w.document.querySelector(s);
  const type = (selector, text) => {
    $(selector).value = text;
    $(selector).dispatchEvent(new w.Event("input"));
  };
  const open = async (file) => {
    Object.defineProperty($("#file-input"), "files", {
      configurable: true,
      value: [file],
    });
    $("#file-input").dispatchEvent(new w.Event("change"));
    await new Promise((resolve) => setImmediate(resolve));
  };
  return { dom, w, $, type, open, downloads };
}

test("drafts are opt-in, restore unfinished source and settings, and clear without clearing the editor", async () => {
  const e = await editor();
  e.type("#source", "flowchart LR\n A[unfinished");
  e.type("#title", "Work in progress");
  e.$("#theme").value = "blue";
  e.$("#theme").dispatchEvent(new e.w.Event("change"));
  e.w.dispatchEvent(new e.w.Event("pagehide"));
  assert.equal(e.w.localStorage.getItem(DRAFT_KEY), null);
  e.$("#remember-draft").click();
  const stored = e.w.localStorage.getItem(DRAFT_KEY);
  assert.ok(stored);
  const restored = await editor(stored);
  assert.equal(restored.$("#source").value, "flowchart LR\n A[unfinished");
  assert.equal(restored.$("#title").value, "Work in progress");
  assert.equal(restored.$("#theme").value, "blue");
  assert.equal(restored.$("#remember-draft").checked, true);
  restored.$("#clear-draft").click();
  restored.w.dispatchEvent(new restored.w.Event("pagehide"));
  assert.equal(restored.w.localStorage.getItem(DRAFT_KEY), null);
  assert.equal(restored.$("#source").value, "flowchart LR\n A[unfinished");
  e.dom.window.close();
  restored.dom.window.close();
});

test("file import/export and undo preserve content; malformed projects do not overwrite", async () => {
  const e = await editor();
  const before = e.$("#source").value;
  const input = "flowchart TB\n A[中文] --> B\n";
  await e.open({
    name: "diagram.mmd",
    size: input.length,
    text: async () => input,
  });
  assert.equal(e.$("#source").value, input);
  e.$("#save-source").click();
  assert.equal(await e.downloads[0].text(), input);
  e.type("#title", "Transfer me");
  e.$("#save-project").click();
  const saved = JSON.parse(await e.downloads[1].text());
  assert.equal(saved.title, "Transfer me");
  assert.equal(saved.source, input);
  await e.open({ name: "broken.json", size: 3, text: async () => "{x" });
  assert.equal(e.$("#source").value, input);
  assert.ok(e.$("#notice").textContent.includes("Invalid project JSON"));
  e.$("#undo-replace").click();
  assert.equal(e.$("#source").value, before);
  await e.open({
    name: "transfer.json",
    size: 200,
    text: async () => JSON.stringify(saved),
  });
  assert.equal(e.$("#title").value, "Transfer me");
  assert.equal(e.$("#source").value, input);
  e.$('[data-example="chinese"]').click();
  e.$("#undo-replace").click();
  assert.equal(e.$("#source").value, input);
  e.dom.window.close();
});

test("slow imports and oversized files cannot overwrite newer edits", async () => {
  const e = await editor();
  let release;
  await e.open({
    name: "slow.mmd",
    size: 20,
    text: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  e.type("#source", "flowchart LR\n New[Newer edit]");
  release("flowchart LR\n Old[Old file]");
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(e.$("#source").value.includes("Newer edit"));
  assert.ok(e.$("#notice").textContent.includes("editor changed"));
  await e.open({
    name: "huge.mmd",
    size: 300000,
    text: async () => {
      throw Error("must not read");
    },
  });
  assert.ok(e.$("#notice").textContent.includes("too large"));
  e.dom.window.close();
});

test("corrupt or denied storage never blocks editing and export controls", async () => {
  for (const e of [await editor("corrupt"), await editor(null, true)]) {
    assert.ok(e.$("#diagram svg"));
    assert.equal(e.$("#export").disabled, false);
    assert.ok(e.$("#draft-status").textContent.includes("could not be read"));
    e.$("#remember-draft").click();
    e.$("#clear-draft").click();
    assert.ok(e.$("#diagram svg"));
    e.dom.window.close();
  }
});

test("the latest file selection wins even if an earlier read resolves first", async () => {
  const e = await editor();
  let first, second;
  await e.open({
    name: "first.mmd",
    size: 30,
    text: () =>
      new Promise((resolve) => {
        first = resolve;
      }),
  });
  await e.open({
    name: "second.mmd",
    size: 30,
    text: () =>
      new Promise((resolve) => {
        second = resolve;
      }),
  });
  first("flowchart LR; First[Old selection]");
  await new Promise((resolve) => setImmediate(resolve));
  second("flowchart LR; Second[Latest selection]");
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(e.$("#source").value.includes("Latest selection"));
  e.dom.window.close();
});

test("fit settings survive project, draft and undo roundtrips while source stays unchanged", async () => {
  const e = await editor();
  e.$('[data-example="grouped"]').click();
  const source = e.$("#source").value;
  e.$("#fit-slide").click();
  assert.equal(e.$("#source").value, source);
  assert.equal(e.$("#layout-direction").value, "auto");
  assert.equal(e.$("#layout-spacing").value, "compact");
  assert.ok(e.$("#layout-summary").textContent.includes("LR"));
  e.$("#save-project").click();
  const saved = JSON.parse(await e.downloads[0].text());
  assert.equal(saved.version, 2);
  assert.deepEqual(saved.layout, { direction: "auto", spacing: "compact" });
  e.$("#export").click();
  for (let i = 0; i < 100 && e.downloads.length < 2; i++)
    await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(e.downloads.length, 2);
  const deck = await JSZip.loadAsync(await e.downloads[1].arrayBuffer());
  const notes = await deck
    .file("ppt/notesSlides/notesSlide1.xml")
    .async("string");
  assert.ok(notes.includes("Slide direction: LR"));
  assert.ok(notes.includes("flowchart TB"));
  assert.ok(notes.includes("spacing: compact"));
  e.$("#remember-draft").click();
  const restored = await editor(e.w.localStorage.getItem(DRAFT_KEY));
  assert.equal(restored.$("#layout-direction").value, "auto");
  assert.equal(restored.$("#layout-spacing").value, "compact");
  const legacy = {
    format: "mermaid-to-slides",
    version: 1,
    source: "flowchart TB; A-->B",
    title: "Legacy",
    theme: "mint",
  };
  await e.open({
    name: "old.json",
    size: 200,
    text: async () => JSON.stringify(legacy),
  });
  assert.equal(e.$("#layout-direction").value, "source");
  e.$("#undo-replace").click();
  assert.equal(e.$("#source").value, source);
  assert.equal(e.$("#layout-direction").value, "auto");
  await e.open({
    name: "bad.json",
    size: 200,
    text: async () =>
      JSON.stringify({
        ...saved,
        layout: { direction: "sideways", spacing: "compact" },
      }),
  });
  assert.equal(e.$("#source").value, source);
  assert.equal(e.$("#layout-direction").value, "auto");
  e.dom.window.close();
  restored.dom.window.close();
});
test("legacy device drafts migrate without losing source or title", async () => {
  const legacy = {
    format: "mermaid-to-slides",
    version: 1,
    source: "flowchart RL; Old[Legacy]",
    title: "Old project",
    theme: "blue",
  };
  const e = await editor(JSON.stringify(legacy));
  assert.equal(e.$("#source").value, legacy.source);
  assert.equal(e.$("#title").value, legacy.title);
  assert.equal(e.$("#layout-direction").value, "source");
  assert.equal(e.$("#layout-spacing").value, "comfortable");
  e.w.dispatchEvent(new e.w.Event("pagehide"));
  assert.equal(JSON.parse(e.w.localStorage.getItem(DRAFT_KEY)).version, 2);
  e.dom.window.close();
});
