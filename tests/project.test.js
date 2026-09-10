import test from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  serializeProject,
  importProjectText,
  createDraftStore,
  DRAFT_KEY,
} from "../src/project.js";

const project = createProject({
  source: "flowchart LR\n A[中文] --> B\n",
  title: "中文标题",
  theme: "blue",
});
test("project roundtrip retains source, title and theme; unfinished syntax is saveable", () => {
  assert.deepEqual(
    importProjectText(serializeProject(project), "diagram.mts.json", project),
    project,
  );
  const unfinished = createProject({
    ...project,
    source: "flowchart LR\n A[unfinished",
  });
  assert.deepEqual(
    importProjectText(serializeProject(unfinished), "work.json", project),
    unfinished,
  );
});
test("Mermaid import preserves exact content except optional UTF-8 BOM", () => {
  for (const name of ["flow.mmd", "flow.MERMAID"])
    assert.equal(
      importProjectText("\uFEFF" + project.source, name, project).source,
      project.source,
    );
});
test("invalid, oversized and future project inputs fail explicitly", () => {
  for (const text of [
    "{broken",
    "[]",
    JSON.stringify({ ...project, version: 3 }),
    JSON.stringify({ ...project, theme: "__proto__" }),
    JSON.stringify({ ...project, theme: ["mint"] }),
    JSON.stringify({ ...project, title: 123 }),
    JSON.stringify({ ...project, source: "x".repeat(30001) }),
  ])
    assert.throws(() => importProjectText(text, "file.json", project));
  assert.throws(() => importProjectText("text", "file.html", project));
});
test("device drafts recover and clear only this app key; errors never escape", () => {
  const data = new Map([["unrelated", "keep"]]);
  const store = createDraftStore(() => ({
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  }));
  assert.equal(store.read().status, "empty");
  assert.equal(store.save(project), true);
  assert.deepEqual(store.read(), { status: "found", project });
  assert.equal(store.clear(), true);
  assert.equal(data.get("unrelated"), "keep");
  data.set(DRAFT_KEY, "bad JSON");
  assert.equal(store.read().status, "error");
  const blocked = createDraftStore(() => {
    throw Error("Storage blocked");
  });
  assert.equal(blocked.read().status, "error");
  assert.equal(blocked.save(project), false);
  assert.equal(blocked.clear(), false);
});
