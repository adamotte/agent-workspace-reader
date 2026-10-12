# Agent Workspace Reader

<img alt="Agent Workspace Reader logo" src="./src/images/logo-stroke.svg" align="right" width="120">

English | [Français](./README-fr.md)

Agent Workspace Reader is a browser extension for reading local workspaces, such as the folders your AI agents write their deliverables to: it renders Markdown, text, JSON and YAML files opened from `file://` URLs and lets you browse their folders from a side panel.

It is based on [md-reader](https://github.com/md-reader/md-reader) by Bener and merges two of its forks: [mdsakalu/md-reader](https://github.com/mdsakalu/md-reader) and [mxgnene01/md-reader](https://github.com/mxgnene01/md-reader).

- **File formats**: renders local `.md`, `.mdx`, `.mdc`, `.mkd`, `.markdown` and `.txt` files, JSON and YAML files as highlighted code, and extensionless `LICENSE`, `README`, `CHANGELOG` or `NOTICE` files as text.
- **Folder browser**: the side panel lists the current folder with a type icon for each file, sorted by name or modified time. With a root folder set, it keeps the tree from the root down to the current file.
- **Wiki links**: `[[folder/note|Alias]]` and `[[note]]` link to the matching local file.
- **Syntax plugins**: emoji, superscripts/subscripts, task lists, math, Mermaid and Graphviz diagrams, table of contents, insertions, abbreviations, footnotes, alerts.
- **Themes**: light/dark themes, a GitHub-compatible rendering mode and code highlighting.
- **Hot reloading**: real-time document changes and centered display for better reading.
- **Shortcuts**: toggle the side panel, the centered layout, hot reloading and the theme from the keyboard.

![banner](./example/example-1.png)

The default theme styles are stored in https://github.com/md-reader/theme.

## Installation

Agent Workspace Reader is not published on extension stores: build it from source.

```bash
# Clone this repository
git clone https://github.com/adamotte/md-reader.git && cd md-reader

# Install dependencies
pnpm install

# Build the extension
pnpm build
```

The unpacked extension lands in `extension/` and the `agent-workspace-reader-xxx.zip` package in `dist/`.

Then, in Chrome or Edge:

1. Open `chrome://extensions/` (or `edge://extensions/`) and turn on Developer mode.
2. Click "Load unpacked" and select the `extension/` folder.

## Usage

### Allowing File Access Permission

> For security reasons, Chrome doesn't let extensions access local files by default, so you need to enable it after installing the extension.

In the Chrome Extensions management page, open the details of "Agent Workspace Reader" and turn on "Allow access to file URLs". Agent Workspace Reader only reads and displays your files: it never modifies or uploads them.

Then open a local file or folder, such as `file:///C:/Users/name/Notes/`, or drag a Markdown file into the browser. Try it with [`example/example.md`](./example/example.md) from this repository.

Set a root folder in the popup to keep the whole tree in the side panel and resolve bare wiki links. [LOCAL_BUILD.md](./LOCAL_BUILD.md) details how the folder browser behaves.

## License

[MIT](./LICENSE)

© 2018-present, [Bener](https://github.com/Heroor) (md-reader)
© 2026-present, Anthony Damotte (Agent Workspace Reader)
