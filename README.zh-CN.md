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

无需账号、API Key 或上传图表。提供三套主题、三个示例、SVG 导出、中文自动换行和文字过小提示。原始 Mermaid 会保存在幻灯片备注中。

## v0.2.0：保存和继续编辑

- **Open file**：打开 `.mmd`、`.mermaid` 源码或项目 JSON。导入源码会保留当前标题和主题。
- **Save .mmd**：下载完整源码，即使图还没写完也可以保存。
- **Save project**：下载 `.mts.json` 项目文件，包含源码、标题和主题，可在另一台设备导入继续编辑。
- **Remember draft on this device**：手动开启本机草稿，刷新后自动恢复；默认关闭。
- **Clear saved draft**：清除已保存副本并关闭草稿存储，不清空当前编辑器。
- **Undo replace**：撤销刚才的文件导入或示例切换。

草稿仅保存在当前浏览器、当前网站域名下；共享同一浏览器配置的人也可能读取它，清理浏览器数据会删除草稿。它不是云同步，长期备份请下载项目文件。存储不可用时会提示，编辑和文件导出仍可使用。导入文件限制 256 KB，源码仍受原有长度限制。

[更新记录](CHANGELOG.md) · [调研与迭代规则](docs/ITERATION_POLICY.md)

## 重要边界

- 节点文字在图形内部，移动节点时文字随之移动。
- 每条连线是独立的原生自由曲线，可以编辑顶点；**移动节点后连线不会自动重新连接或布线**。
- 边标签是单独的文本对象。
- 使用自有的流程图子集解析器，不支持全部 Mermaid 语法，也不保证与 Mermaid 官方渲染外观一致。
- 支持 LR/RL/TB/TD/BT、矩形、圆角、胶囊、菱形、圆形、数据库节点，以及箭头、虚线、粗线、文字标签、链式连接、注释和中文。
- 暂不支持子图、classDef、自定义 style、HTML/Markdown 标签、时序图、类图、ER 图、图片或任意 SVG 导入。不支持的输入会明确报错。
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

仓库中的三个 PPT 示例已在 Windows Microsoft PowerPoint 中打开、渲染验证。自动检查覆盖语法、几何布局、原生对象、转义和界面控制逻辑；并不意味着所有办公软件都能完全一致地显示。

欢迎提交不含敏感信息的案例和问题。详细语法、开发说明与第三方致谢见 [英文 README](README.md)。MIT 开源协议。
