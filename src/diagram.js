import dagre from "@dagrejs/dagre";

export const themes = {
  mint: {
    name: "Studio Mint",
    paper: "F8FAFC",
    ink: "172333",
    fill: "DDF9EE",
    border: "138264",
    line: "64748B",
    accent: "138264",
  },
  blue: {
    name: "Blueprint",
    paper: "F5F8FF",
    ink: "172C52",
    fill: "DBEAFE",
    border: "2563EB",
    line: "647898",
    accent: "2563EB",
  },
  mono: {
    name: "Paper & Ink",
    paper: "FFFFFF",
    ink: "202020",
    fill: "F5F5F5",
    border: "444444",
    line: "737373",
    accent: "202020",
  },
};

export function slideMetrics(d) {
  const scale = Math.min(12.13 / d.width, 5.58 / d.height);
  return {
    scale,
    x: (13.333333 - d.width * scale) / 2,
    y: 1.28 + (5.58 - d.height * scale) / 2,
    fontSize: 18 * scale * 72,
  };
}
export const examples = {
  product: {
    name: "Product release",
    title: "From idea to release",
    source: `flowchart LR
  A([New idea]) --> B[Build prototype]
  B --> C{Ready to ship?}
  C -->|Yes| D[Release]
  C -->|Not yet| E[Collect feedback]
  E --> B
  D --> F([Measure impact])`,
  },
  architecture: {
    name: "System architecture",
    title: "A simple web architecture",
    source: `flowchart TB
  A([Web client]) --> B[API gateway]
  B --> C[Auth service]
  B --> D[Application service]
  D --> E[(Database)]
  D -.-> F[(Cache)]
  C --> E`,
  },
  chinese: {
    name: "中文工作流",
    title: "从需求到交付",
    source: `flowchart LR
  A([收集需求]) --> B[设计与开发]
  B --> C{测试通过？}
  C -->|通过| D[发布新版本]
  C -->|需要修改| E[记录问题并改进]
  E --> B
  D --> F([收集用户反馈])`,
  },
};

function statements(source) {
  const out = [];
  let text = "",
    stack = [],
    quote = false,
    line = 1,
    start = 1;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (!quote && !stack.length && c === "%" && source[i + 1] === "%") {
      while (i < source.length && source[i] !== "\n") i++;
      i--;
      continue;
    }
    if (c === '"' && source[i - 1] !== "\\") quote = !quote;
    if (!quote) {
      if ("([{".includes(c)) stack.push(c);
      if (")]}".includes(c)) {
        const match = { ")": "(", "]": "[", "}": "{" };
        if (stack.pop() !== match[c])
          throw Error(`Line ${line}: unmatched ${c}.`);
      }
    }
    if ((c === "\n" || c === ";") && !quote && !stack.length) {
      if (text.trim()) out.push({ text: text.trim(), line: start });
      text = "";
      start = line + (c === "\n" ? 1 : 0);
    } else text += c;
    if (c === "\n") line++;
  }
  if (quote || stack.length) throw Error("Unclosed node label or quote.");
  if (text.trim()) out.push({ text: text.trim(), line: start });
  return out;
}

export function parseFlowchart(source) {
  if (source.length > 30000)
    throw Error("Please keep the source under 30,000 characters.");
  const parts = statements(source);
  const header = parts.shift();
  const m = header?.text.match(/^(?:flowchart|graph)\s+(TB|TD|BT|LR|RL)$/);
  if (!m)
    throw Error(
      "Start with flowchart LR or flowchart TB on its own line. Only flowcharts are supported.",
    );
  const nodes = new Map(),
    edges = [];
  const labelText = (t) => {
    let s = t.trim();
    if (s.startsWith('"') && s.endsWith('"'))
      s = s.slice(1, -1).replace(/\\"/g, '"');
    s = s.replace(/<br\s*\/?\s*>/gi, "\n").replace(/\\n/g, "\n");
    if (/<[^>]*>|`/.test(s))
      throw Error(
        "HTML and Markdown labels are not supported; use plain text or <br/>.",
      );
    if (s.length > 240)
      throw Error("Node and edge labels must be at most 240 characters.");
    return s;
  };
  for (const { text, line } of parts) {
    let rest = text;
    const fail = (msg) => {
      throw Error(`Line ${line}: ${msg}`);
    };
    if (
      /^(subgraph|end\b|style\b|classDef\b|class\b|click\b|linkStyle\b|direction\b)/.test(
        rest,
      )
    )
      fail("Subgraphs, custom styles and interactions are not supported yet.");
    const readNode = () => {
      const match = rest.match(/^([A-Za-z_]\w*(?:-[A-Za-z0-9_]+)*)/);
      if (!match) fail("Expected a node ID such as A or service_1.");
      const id = match[1];
      rest = rest.slice(id.length).trimStart();
      let type = "rect",
        label = id,
        defined = false;
      const delimiters = [
        ["([", "])", "stadium"],
        ["((", "))", "circle"],
        ["[(", ")]", "cylinder"],
        ["[", "]", "rect"],
        ["(", ")", "roundRect"],
        ["{", "}", "diamond"],
      ];
      for (const [open, close, shape] of delimiters)
        if (rest.startsWith(open)) {
          let end = -1,
            quoted = false;
          for (let k = open.length; k < rest.length; k++) {
            if (rest[k] === '"' && rest[k - 1] !== "\\") quoted = !quoted;
            if (!quoted && rest.startsWith(close, k)) {
              end = k;
              break;
            }
          }
          if (end < 0) fail("Unclosed node.");
          label = labelText(rest.slice(open.length, end));
          type = shape;
          defined = true;
          rest = rest.slice(end + close.length).trimStart();
          break;
        }
      if (!nodes.has(id) || defined) nodes.set(id, { id, label, type });
      return id;
    };
    let from = readNode();
    while (rest) {
      let kind,
        arrow = true,
        label = "";
      const edge = rest.match(/^(-->|---|-\.->|==>)/);
      if (edge) {
        kind = edge[1];
        arrow = kind !== "---";
        rest = rest.slice(kind.length).trimStart();
      } else {
        const named = rest.match(/^--\s+(.+?)\s+-->/);
        if (!named) fail("Unsupported syntax. Use A --> B or A -->|Label| B.");
        kind = "-->";
        label = labelText(named[1]);
        rest = rest.slice(named[0].length).trimStart();
      }
      if (rest.startsWith("|")) {
        const end = rest.indexOf("|", 1);
        if (end < 0) fail("Unclosed edge label.");
        label = labelText(rest.slice(1, end));
        rest = rest.slice(end + 1).trimStart();
      }
      const to = readNode();
      edges.push({
        id: `e${edges.length}`,
        from,
        to,
        label,
        arrow,
        dashed: kind === "-.->",
        thick: kind === "==>",
      });
      from = to;
    }
  }
  if (!nodes.size) throw Error("Add at least one node, for example A[Hello].");
  if (nodes.size > 60 || edges.length > 100)
    throw Error(
      "A single slide supports up to 60 nodes and 100 connections. Split larger diagrams.",
    );
  return {
    direction: m[1] === "TD" ? "TB" : m[1],
    nodes: [...nodes.values()],
    edges,
  };
}

export function wrapText(text, max = 20) {
  const lines = [];
  for (const paragraph of text.split("\n")) {
    let row = "",
      width = 0;
    for (const token of paragraph.match(/[A-Za-z0-9_]+\s*|[^A-Za-z0-9_]/gu) || [
      "",
    ]) {
      const units = [...token].reduce(
        (n, c) => n + (c.codePointAt(0) > 255 ? 1.8 : 1),
        0,
      );
      if (width + units > max && row) {
        lines.push(row.trimEnd());
        row = "";
        width = 0;
      }
      for (const c of token) {
        const w = c.codePointAt(0) > 255 ? 1.8 : 1;
        if (width + w > max && row) {
          lines.push(row.trimEnd());
          row = "";
          width = 0;
        }
        row += c;
        width += w;
      }
    }
    lines.push(row.trimEnd());
  }
  return lines;
}

export function layoutDiagram(model) {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({
    rankdir: model.direction,
    nodesep: 38,
    ranksep: 78,
    marginx: 26,
    marginy: 26,
  });
  g.setDefaultEdgeLabel(() => ({}));
  const prepared = model.nodes.map((n) => {
    const lines = wrapText(n.label, n.type === "diamond" ? 16 : 21);
    let width = 184,
      height = Math.max(68, lines.length * 23 + 32);
    if (n.type === "diamond") {
      width = 230;
      height = Math.max(130, lines.length * 36 + 60);
    }
    if (n.type === "circle") {
      width = height = Math.max(150, lines.length * 25 + 65);
    }
    if (n.type === "cylinder") height += 18;
    const node = { ...n, lines, width, height };
    g.setNode(n.id, node);
    return node;
  });
  for (const e of model.edges)
    g.setEdge(
      e.from,
      e.to,
      {
        ...e,
        width: e.label ? Math.max(80, [...e.label].length * 12) : 0,
        height: e.label ? 32 : 0,
        labelpos: "c",
      },
      e.id,
    );
  dagre.layout(g);
  const nodes = prepared.map((n) => ({
    ...n,
    x: g.node(n.id).x,
    y: g.node(n.id).y,
  }));
  const edges = model.edges.map((e) => ({
    ...e,
    ...g.edge({ v: e.from, w: e.to, name: e.id }),
  }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const intersect = (n, p) => {
    if (!["diamond", "circle"].includes(n.type)) return null;
    const dx = p.x - n.x,
      dy = p.y - n.y,
      rx = n.width / 2,
      ry = n.height / 2;
    const divisor =
      n.type === "diamond"
        ? Math.abs(dx) / rx + Math.abs(dy) / ry
        : Math.hypot(dx / rx, dy / ry);
    return divisor ? { x: n.x + dx / divisor, y: n.y + dy / divisor } : null;
  };
  for (const e of edges) {
    const first = intersect(byId.get(e.from), e.points[1]),
      last = intersect(byId.get(e.to), e.points.at(-2));
    if (first) e.points[0] = first;
    if (last) e.points[e.points.length - 1] = last;
  }
  return {
    ...model,
    nodes,
    edges,
    width: g.graph().width,
    height: g.graph().height,
  };
}

export const escapeXml = (s) =>
  String(s).replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
export function diagramSvg(d, theme = "mint") {
  const t = themes[theme],
    shapes = d.nodes
      .map((n) => {
        const x = n.x - n.width / 2,
          y = n.y - n.height / 2,
          common = `fill="#${t.fill}" stroke="#${t.border}" stroke-width="1.8"`;
        let shape;
        if (n.type === "diamond")
          shape = `<polygon points="${n.x},${y} ${x + n.width},${n.y} ${n.x},${y + n.height} ${x},${n.y}" ${common}/>`;
        else if (n.type === "circle")
          shape = `<ellipse cx="${n.x}" cy="${n.y}" rx="${n.width / 2}" ry="${n.height / 2}" ${common}/>`;
        else if (n.type === "cylinder")
          shape = `<path d="M${x},${y + 13} a${n.width / 2},13 0 0 1 ${n.width},0 v${n.height - 26} a${n.width / 2},13 0 0 1 -${n.width},0 Z" ${common}/><ellipse cx="${n.x}" cy="${y + 13}" rx="${n.width / 2}" ry="13" ${common}/>`;
        else
          shape = `<rect x="${x}" y="${y}" width="${n.width}" height="${n.height}" rx="${n.type === "stadium" ? n.height / 2 : n.type === "roundRect" ? 14 : 5}" ${common}/>`;
        return `<g>${shape}<text text-anchor="middle" font-size="18" fill="#${t.ink}">${n.lines.map((l, i) => `<tspan x="${n.x}" y="${n.y - (n.lines.length - 1) * 11.5 + i * 23 + 6}">${escapeXml(l)}</tspan>`).join("")}</text></g>`;
      })
      .join("");
  const edgePaths = d.edges
    .map(
      (e) =>
        `<polyline points="${e.points.map((p) => `${p.x},${p.y}`).join(" ")}" fill="none" stroke="#${t.line}" stroke-width="${e.thick ? 3 : 1.7}" ${e.dashed ? 'stroke-dasharray="6 5"' : ""} ${e.arrow ? 'marker-end="url(#arrow)"' : ""}/>`,
    )
    .join("");
  const labels = d.edges
    .filter((e) => e.label)
    .map(
      (e) =>
        `<g><rect x="${e.x - e.width / 2}" y="${e.y - 15}" width="${e.width}" height="30" rx="5" fill="#${t.paper}"/><text x="${e.x}" y="${e.y + 5}" text-anchor="middle" font-size="15" fill="#${t.ink}">${escapeXml(e.label)}</text></g>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Flowchart preview" viewBox="0 0 ${d.width} ${d.height}" style="font-family:Arial,'Microsoft YaHei',sans-serif;background:#${t.paper}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#${t.line}"/></marker></defs>${edgePaths}${shapes}${labels}</svg>`;
}
