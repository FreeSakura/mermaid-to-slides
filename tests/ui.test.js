import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { build } from "esbuild";
import JSZip from "jszip";
// Execute the actual app controller in a DOM implementation; no duplicated UI logic.
import * as diagram from "../src/diagram.js";
import * as project from "../src/project.js";
test("editor examples, theme, invalid input, SVG download and recovery", async () => {
  const dom = new JSDOM('<div id="app"></div>', {
    url: "https://example.test/",
  });
  const { window } = dom;
  const doc = window.document;
  const code = (
    await readFile(new URL("../src/main.js", import.meta.url), "utf8")
  ).replace(/^import [\s\S]*?;\r?\n/gm, "");
  const downloaded = [];
  const urls = {
    createObjectURL: (blob) => {
      downloaded.push(blob);
      return "blob:example";
    },
    revokeObjectURL: () => {},
  };
  window.HTMLAnchorElement.prototype.click = function () {};
  new Function(
    "document",
    "window",
    "Blob",
    "URL",
    "setTimeout",
    "clearTimeout",
    ...Object.keys(diagram),
    ...Object.keys(project),
    code,
  )(
    doc,
    window,
    window.Blob,
    urls,
    (fn) => {
      fn();
      return 1;
    },
    () => {},
    ...Object.values(diagram),
    ...Object.values(project),
  );
  assert.ok(doc.querySelector("#diagram svg"));
  assert.equal(doc.querySelector("#export").disabled, false);
  doc.querySelector('[data-example="chinese"]').click();
  assert.ok(doc.querySelector("#diagram").textContent.includes("收集需求"));
  const theme = doc.querySelector("#theme");
  theme.value = "blue";
  theme.dispatchEvent(new window.Event("change"));
  assert.ok(doc.querySelector("#diagram").innerHTML.includes("#DBEAFE"));
  const title = doc.querySelector("#title");
  title.value = "<img src=x onerror=alert(1)>";
  title.dispatchEvent(new window.Event("input"));
  assert.equal(doc.querySelector("#slide-title img"), null);
  doc.querySelector("#svg-export").click();
  assert.equal(downloaded.length, 1);
  const source = doc.querySelector("#source");
  source.value = "sequenceDiagram";
  source.dispatchEvent(new window.Event("input"));
  assert.equal(doc.querySelector("#export").disabled, true);
  assert.equal(doc.querySelector("#slide").hidden, true);
  assert.ok(
    doc.querySelector("#notice").textContent.includes("Only flowcharts"),
  );
  doc.querySelector("#reset").click();
  assert.equal(doc.querySelector("#export").disabled, false);
  assert.equal(doc.querySelector("#slide").hidden, false);
  doc.querySelector('[data-example="grouped"]').click();
  assert.ok(doc.querySelector('#stats').textContent.includes('3 groups'));
  assert.equal(doc.querySelector('#group-note').hidden, false);
  doc.querySelector('#reset').click();
  assert.equal(doc.querySelector('#group-note').hidden, true);
});

test("browser bundle downloads a readable PowerPoint from the real export button", async () => {
  const result = await build({
    entryPoints: ["src/main.js"],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    loader: { ".css": "empty" },
  });
  const dom = new JSDOM('<div id="app"></div>', {
    url: "https://example.test/",
    runScripts: "outside-only",
  });
  const downloads = [];
  dom.window.Blob = Blob;
  dom.window.structuredClone = structuredClone;
  // jsdom does not emulate browser postMessage's event.source. Supply the
  // scheduler that JSZip otherwise polyfills using that missing behavior.
  dom.window.setImmediate = setImmediate;
  dom.window.clearImmediate = clearImmediate;
  dom.window.TextEncoder = TextEncoder;
  dom.window.TextDecoder = TextDecoder;
  dom.window.URL.createObjectURL = (blob) => {
    downloads.push(blob);
    return "blob:download";
  };
  dom.window.URL.revokeObjectURL = () => {};
  dom.window.HTMLAnchorElement.prototype.click = function () {};
  dom.window.eval(result.outputFiles[0].text);
  dom.window.document.querySelector("#export").click();
  for (let i = 0; i < 100 && !downloads.length; i++)
    await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(
    downloads.length,
    1,
    dom.window.document.querySelector("#notice").textContent,
  );
  const z = await JSZip.loadAsync(await downloads[0].arrayBuffer());
  assert.ok(z.file("ppt/slides/slide1.xml"));
  assert.ok(
    (await z.file("ppt/slides/slide1.xml").async("string")).includes("node:A"),
  );
  dom.window.close();
});
