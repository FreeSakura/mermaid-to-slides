import PptxGenJS from "pptxgenjs";
import JSZip from "jszip";
import { themes, slideMetrics } from "./diagram.js";

export async function exportPptx(
  d,
  { title = "My flowchart", theme = "mint", source = "" } = {},
) {
  const t = themes[theme],
    pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Mermaid to Slides";
  pptx.subject = "Editable Mermaid flowchart";
  pptx.title = title;
  pptx.company = "";
  pptx.lang = "en-US";
  pptx.theme = { headFontFace: "Arial", bodyFontFace: "Arial", lang: "en-US" };
  const slide = pptx.addSlide();
  slide.background = { color: t.paper };
  slide.addText(title, {
    x: 0.6,
    y: 0.38,
    w: 12.1,
    h: 0.54,
    fontSize: 26,
    bold: true,
    color: t.ink,
    margin: 0,
    breakLine: false,
    fit: "shrink",
    objectName: "Diagram title",
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.6,
    y: 1.02,
    w: 12.13,
    h: 0,
    line: { color: t.border, width: 1 },
  });
  const { scale: s, x: ox, y: oy, fontSize } = slideMetrics(d);
  const X = (x) => ox + x * s,
    Y = (y) => oy + y * s;
  // Temporary lines become one editable native freeform per edge.
  // PowerPoint rejects custom geometry inside p:cxnSp; use p:sp for routed paths.
  for (const e of d.edges)
    slide.addShape(pptx.ShapeType.line, {
      x: 0,
      y: 0,
      w: 1,
      h: 0,
      objectName: `edge:${e.id}`,
    });
  for (const group of d.groups ?? []) {
    slide.addText(group.titleLines.join("\n"), {
      shape: "rect",
      x: X(group.x - group.width / 2),
      y: Y(group.y - group.height / 2),
      w: group.width * s,
      h: group.height * s,
      fontFace: /[^\u0000-\u024f]/.test(group.label)
        ? "Microsoft YaHei"
        : "Arial",
      fontSize: 16 * s * 72,
      bold: true,
      color: t.ink,
      valign: "top",
      align: "left",
      margin: [10 * s * 72, 14 * s * 72, 10 * s * 72, 14 * s * 72],
      paraSpaceAfter: 0,
      fill: { color: t.paper, transparency: 100 },
      highlight: t.paper,
      line: { color: t.border, width: 1, dashType: "dash" },
      objectName: `group:${group.id}`,
    });
  }
  const types = {
    rect: "rect",
    roundRect: "roundRect",
    stadium: "roundRect",
    diamond: "diamond",
    circle: "ellipse",
    cylinder: "can",
  };
  for (const n of d.nodes)
    slide.addText(n.lines.join("\n"), {
      shape: types[n.type],
      x: X(n.x - n.width / 2),
      y: Y(n.y - n.height / 2),
      w: n.width * s,
      h: n.height * s,
      rectRadius:
        n.type === "stadium"
          ? (Math.min(n.width, n.height) * s) / 2
          : n.type === "roundRect"
            ? 14 * s
            : undefined,
      fontFace: /[^\u0000-\u024f]/.test(n.label) ? "Microsoft YaHei" : "Arial",
      fontSize,
      color: t.ink,
      align: "center",
      valign: "mid",
      margin: 0,
      paraSpaceAfter: 0,
      breakLine: false,
      fit: "shrink",
      fill: { color: t.fill },
      line: { color: t.border, width: 1.3 },
      objectName: `node:${n.id}`,
    });
  for (const e of d.edges)
    if (e.label)
      slide.addText(e.label, {
        x: X(e.x - e.width / 2),
        y: Y(e.y - 15),
        w: e.width * s,
        h: 30 * s,
        fontFace: /[^\u0000-\u024f]/.test(e.label)
          ? "Microsoft YaHei"
          : "Arial",
        fontSize: 15 * s * 72,
        color: t.ink,
        align: "center",
        valign: "mid",
        margin: 0,
        fit: "shrink",
        fill: { color: t.paper },
        objectName: `label:${e.id}`,
      });
  slide.addNotes(
    `Created with Mermaid to Slides. Nodes and freeform lines are editable. Lines do not automatically reroute when nodes move.\nSlide direction: ${d.direction}; selected mode: ${d.layoutOptions?.direction ?? "source"}; spacing: ${d.layoutOptions?.spacing ?? "comfortable"}; source direction: ${d.sourceDirection ?? d.direction}.\n\nMermaid source:\n${source}`,
  );
  const raw = await pptx.write({ outputType: "uint8array" }),
    zip = await JSZip.loadAsync(raw);
  let xml = await zip.file("ppt/slides/slide1.xml").async("string");
  const emu = (v) => Math.round(v * 914400);
  xml = xml.replace(/<p:sp>.*?<\/p:sp>/gs, (sp) => {
    const match = sp.match(/<p:cNvPr id="(\d+)" name="edge:(e\d+)"/);
    if (!match) return sp;
    const e = d.edges.find((e) => e.id === match[2]),
      pts = e.points;
    const minX = Math.min(...pts.map((p) => p.x)),
      minY = Math.min(...pts.map((p) => p.y));
    const w = Math.max(1, emu((Math.max(...pts.map((p) => p.x)) - minX) * s)),
      h = Math.max(1, emu((Math.max(...pts.map((p) => p.y)) - minY) * s));
    const path = pts
      .map(
        (p, i) =>
          `<a:${i ? "lnTo" : "moveTo"}><a:pt x="${emu((p.x - minX) * s)}" y="${emu((p.y - minY) * s)}"/></a:${i ? "lnTo" : "moveTo"}>`,
      )
      .join("");
    return `<p:sp><p:nvSpPr><p:cNvPr id="${match[1]}" name="edge:${e.id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${emu(X(minX))}" y="${emu(Y(minY))}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/><a:pathLst><a:path w="${w}" h="${h}" fill="none">${path}</a:path></a:pathLst></a:custGeom><a:noFill/><a:ln w="${e.thick ? 25400 : 15240}"><a:solidFill><a:srgbClr val="${t.line}"/></a:solidFill>${e.dashed ? '<a:prstDash val="dash"/>' : ""}${e.arrow ? '<a:tailEnd type="triangle" w="sm" len="sm"/>' : ""}</a:ln></p:spPr><p:style><a:lnRef idx="0"><a:schemeClr val="accent1"/></a:lnRef><a:fillRef idx="0"><a:schemeClr val="accent1"/></a:fillRef><a:effectRef idx="0"><a:schemeClr val="accent1"/></a:effectRef><a:fontRef idx="minor"><a:schemeClr val="lt1"/></a:fontRef></p:style></p:sp>`;
  });
  zip.file("ppt/slides/slide1.xml", xml);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
