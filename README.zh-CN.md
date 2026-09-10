# Mermaid to Slides

**粘贴 Mermaid 流程图，下载真正可编辑的 PowerPoint 图形。**

[在线使用](https://freesakura.github.io/mermaid-to-slides/) · [English](README.md) · [中文 PPT 示例](examples/chinese.pptx)

![实际 PowerPoint 导出预览](docs/powerpoint-preview.png)

AI 可以很快生成 Mermaid，但汇报时经常还要在 PPT 里改文字、颜色和节点。本项目将一部分常用 Mermaid 流程图语法转换为 PowerPoint 原生对象，整个过程在浏览器本地完成。

## 使用方法

1. 打开在线编辑器，粘贴流程图或选择示例。
2. 设置幻灯片标题与主题。
3. 点击 **Download PowerPoint**。
4. 在 PowerPoint 中直接修改节点文字、颜色和位置。

无需账号、API Key 或上传图表。提供三套主题、四个示例、SVG 导出、中文自动换行和文字过小提示。原始 Mermaid 会保存在幻灯片备注中。

## v0.2.0：保存和继续编辑

- **Open file**：打开 `.mmd`、`.mermaid` 源码或项目 JSON。导入源码会保留当前标题和主题。
- **Save .mmd**：下载完整源码，即使图还没写完也可以保存。
- **Save project**：下载 `.mts.json` 项目文件，包含源码、标题和主题，可在另一台设备导入继续编辑。
- **Remember draft on this device**：手动开启本机草稿，刷新后自动恢复；默认关闭。
- **Clear saved draft**：清除已保存副本并关闭草稿存储，不清空当前编辑器。
- **Undo replace**：撤销刚才的文件导入或示例切换。

草稿仅保存在当前浏览器、当前网站域名下；共享同一浏览器配置的人也可能读取它，清理浏览器数据会删除草稿。它不是云同步，长期备份请下载项目文件。存储不可用时会提示，编辑和文件导出仍可使用。导入文件限制 256 KB，源码仍受原有长度限制。

[更新记录](CHANGELOG.md) · [调研与迭代规则](docs/ITERATION_POLICY.md)

## v0.4.0：适配幻灯片布局

**Fit to slide** 会以紧凑间距比较四种全局方向，选择估算节点字号更大的布局。也可以手动选择方向与间距。默认仍为 **From source + Comfortable**，保持原有输出。

分组示例的估算节点字号从 9.22pt 提升到 16.00pt，可运行 `node scripts/readability-report.mjs` 复现。这个结果不代表所有图都能变得易读；分组标题和边标签更小，字体替换和 PowerPoint 自动适配也会影响实际显示。复杂图仍可能需要缩短标签或拆分。

原始 Mermaid 和 `.mmd` 导出不被改写。布局设置会作用于 SVG/PPT，并写入 PPT 备注。新项目文件采用 v2 格式保存方向与间距；旧 v1 文件和草稿仍可打开，默认迁移到原始方向与舒适间距。旧版应用可能无法读取 v2 文件。

[下载优化后的项目文件](examples/grouped-fit.mts.json) · [下载对应 PPT](examples/grouped-fit.pptx)。

## v0.3.0：架构图分组

新增 **Grouped architecture** 示例：[下载可编辑 PPT](examples/grouped.pptx)。使用 `subgraph id [分组标题]` 与 `end` 包围节点，支持最多 15 个分组、四层嵌套和跨组节点连线。所有分组继承全图方向；请先在所属分组声明节点，再通过节点 ID 引用。

分组标题和边框也是 PPT 原生可编辑对象。但它们是视觉边界，不是 Office 对象组合，移动边框不会带动内部节点。局部 `direction`、连到整个分组、空分组和折叠分组暂不支持，会明确报错。

## 重要边界

- 节点文字在图形内部，移动节点时文字随之移动。
- 每条连线是独立的原生自由曲线，可以编辑顶点；**移动节点后连线不会自动重新连接或布线**。
- 边标签是单独的文本对象。
- 使用自有的流程图子集解析器，不支持全部 Mermaid 语法，也不保证与 Mermaid 官方渲染外观一致。
- 支持 LR/RL/TB/TD/BT、矩形、圆角、胶囊、菱形、圆形、数据库节点，以及箭头、虚线、粗线、文字标签、链式连接、注释和中文。
- 暂不支持子图局部方向、连到整个分组、折叠分组、classDef、自定义 style、HTML/Markdown 标签、时序图、类图、ER 图、图片或任意 SVG 导入。不支持的输入会明确报错。
- 单张限制 60 个节点、100 条连线。复杂图建议拆分；不同操作系统字体和演示软件可能带来差异。

## 本地运行

需要 Node.js 22.13 或更新版本。

```bash
git clone https://github.com/FreeSakura/mermaid-to-slides.git
cd mermaid-to-slides
npm ci
npm run dev
```

运行 `npm run check` 完成自动检查和构建，`npm run build` 生成可部署的静态 `dist/`。不需要后端服务。

仓库中的四个 PPT 示例已在 Windows Microsoft PowerPoint 中打开、渲染验证。自动检查覆盖语法、几何布局、原生对象、转义和界面控制逻辑；并不意味着所有办公软件都能完全一致地显示。

欢迎提交不含敏感信息的案例和问题。详细语法、开发说明与第三方致谢见 [英文 README](README.md)。MIT 开源协议。
