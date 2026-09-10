import { themes, normalizeLayout } from "./diagram.js";

export const PROJECT_FORMAT = "mermaid-to-slides";
export const DRAFT_KEY = "mermaid-to-slides:draft:v1";
export const MAX_FILE_BYTES = 256 * 1024;

export function validateProject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("This is not a Mermaid to Slides project file.");
  if (value.format !== PROJECT_FORMAT || ![1, 2].includes(value.version))
    throw Error(
      "Unsupported project format or version. Open a version 1 or 2 Mermaid to Slides project.",
    );
  if (typeof value.source !== "string" || value.source.length > 30000)
    throw Error("Project source must be text under 30,000 characters.");
  if (typeof value.title !== "string" || value.title.length > 90)
    throw Error("Project title must be text under 90 characters.");
  if (typeof value.theme !== "string" || !Object.hasOwn(themes, value.theme))
    throw Error("This project uses an unsupported theme.");
  if (
    value.version === 2 &&
    (!value.layout ||
      typeof value.layout.direction !== "string" ||
      typeof value.layout.spacing !== "string")
  )
    throw Error(
      "Version 2 projects must contain direction and spacing settings.",
    );
  const layout = normalizeLayout(
    value.version === 1 ? undefined : value.layout,
  );
  return {
    format: PROJECT_FORMAT,
    version: 2,
    source: value.source,
    title: value.title,
    theme: value.theme,
    layout,
  };
}

export function createProject({ source, title, theme, layout }) {
  return validateProject({
    format: PROJECT_FORMAT,
    version: 2,
    source,
    title,
    theme,
    layout: normalizeLayout(layout),
  });
}

export function serializeProject(project) {
  return JSON.stringify(validateProject(project), null, 2) + "\n";
}

export function importProjectText(text, fileName, current) {
  if (typeof text !== "string") throw Error("Could not read the file as text.");
  const clean = text.replace(/^\uFEFF/, "");
  if (/\.json$/i.test(fileName)) {
    let value;
    try {
      value = JSON.parse(clean);
    } catch {
      throw Error("Invalid project JSON. Your current work has not changed.");
    }
    return validateProject(value);
  }
  if (!/\.(mmd|mermaid)$/i.test(fileName))
    throw Error(
      "Choose a .mmd, .mermaid or Mermaid to Slides .json project file.",
    );
  return createProject({ ...current, source: clean });
}

// Access storage lazily because reading window.localStorage itself may throw.
export function createDraftStore(getStorage) {
  return {
    read() {
      try {
        const raw = getStorage().getItem(DRAFT_KEY);
        return raw === null
          ? { status: "empty" }
          : { status: "found", project: validateProject(JSON.parse(raw)) };
      } catch {
        return { status: "error" };
      }
    },
    save(project) {
      try {
        getStorage().setItem(DRAFT_KEY, serializeProject(project));
        return true;
      } catch {
        return false;
      }
    },
    clear() {
      try {
        getStorage().removeItem(DRAFT_KEY);
        return true;
      } catch {
        return false;
      }
    },
  };
}
