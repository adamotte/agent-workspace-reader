# Markdown Reader Local

这是基于 `md-reader/md-reader` MIT 开源项目构建的本地版本，增加了本地文件夹目录浏览能力。

## 安装

1. 打开 `chrome://extensions/`。
2. 开启“开发者模式”。
3. 如果商店版 Markdown Reader 仍在运行，先将它停用，避免两个内容脚本同时处理 Markdown 页面。
4. 点击“加载已解压的扩展程序”。
5. 选择 `/Users/bytedance/mxg/work/md-reader/extension`。
6. 打开 `Markdown Reader Local` 的“详情”，开启“允许访问文件网址”。
7. 点击扩展图标，在“本地目录根路径”中填入绝对路径，例如 `/Users/用户名/Obsidian`。

## 使用

- 直接在 Chrome 打开任意 `.md`、`.mdx`、`.mdc`、`.mkd`、`.markdown` 或 `.txt` 文件，会自动渲染。
- 左侧顶部显示当前文件夹中的 Markdown 文件和子文件夹，当前文件会高亮。
- 子文件夹始终优先；默认按文件名倒序，排序方式可切换并自动保存。
- 设置根路径后，侧边栏始终保留从根目录到当前文件的层级，并自动展开当前文件的祖先目录。
- 点击目录标题右侧的排序按钮，可在文件名正序/倒序、编辑时间正序/倒序之间切换；文件夹始终优先。
- Obsidian WikiLink（如 `[[../../30_entities/people/孟祥国|孟祥国]]`）会显示为可点击别名链接，并跳转到对应的本地 Markdown 文件；裸链接（如 `[[2026-06-23]]`）会在配置的根目录中按文件名查找。
- 文件夹与正文目录之间的分隔线可上下拖动；比例会自动保存，双击分隔线恢复默认。
- 在地址栏打开 `file:///某个文件夹路径/`，会进入文件夹目录页。
- 点击文件夹后的“上级”，可以向上切换目录。

源码仓库：https://github.com/md-reader/md-reader
