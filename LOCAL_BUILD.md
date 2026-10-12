# Agent Workspace Reader

Agent Workspace Reader is based on [md-reader](https://github.com/md-reader/md-reader)
(MIT) and merges two of its forks:

- [mdsakalu/md-reader](https://github.com/mdsakalu/md-reader): GitHub-compatible
  rendering mode, DOMPurify sanitizing, Mermaid 12, extra page themes.
- [mxgnene01/md-reader](https://github.com/mxgnene01/md-reader): local folder
  browser and Obsidian-style wiki links.

## Build

```bash
pnpm install
pnpm run build
```

The unpacked extension lands in `extension/`, the
`agent-workspace-reader-<version>.zip` package in `dist/`.

The same zip is attached to each
[GitHub release](https://github.com/adamotte/agent-workspace-reader/releases),
built by `.github/workflows/build.yml`.

## Install

1. Open `chrome://extensions/` (or `edge://extensions/`).
2. Turn on Developer mode.
3. Disable Markdown Reader, the original extension, if it is installed from a
   store, so two content scripts don't both handle Markdown pages.
4. Click "Load unpacked" and select the `extension/` folder, or the folder
   where you unzipped a release.
5. Open the extension's details and turn on "Allow access to file URLs".
6. Optionally, set the local folder root in the popup, for example
   `C:\Users\name\Notes` or `/Users/name/Obsidian`.

## Use

- Opening a local `.md`, `.mdx`, `.mdc`, `.mkd`, `.markdown` or `.txt` file
  renders it, with the current folder's files and subfolders listed at the top
  of the side panel and the current file highlighted.
- The folder list shows each file with a type icon and, unless "File
  extensions" is turned on in the popup, without its extension:
  - Markdown and text files, including extensionless `LICENSE`, `README`,
    `CHANGELOG`, `NOTICE`, `AUTHORS`, `COPYING` and `LICENCE`, render as
    Markdown.
  - Code and configuration files (JSON, YAML, TOML, INI, XML, JavaScript,
    TypeScript, CSS, Python, shell, PowerShell, SQL, Go, Rust, Java, C, C++,
    C#, logs, `Dockerfile`, `Makefile`) render as highlighted code.
  - CSV and TSV files render as a table. The separator (comma, semicolon, tab
    or pipe) is detected and can be changed above the table; files that
    aren't valid UTF-8 are read as Windows-1252.
  - Images, video and audio play in the page.
  - HTML and PDF files open in a new tab with the browser's own viewer.
- Files that the browser would download (CSV) or show without md-reader
  (images, XML) open on their folder's page, at `folder/?view=file`. Links to
  them in Markdown open there too.
- Opening a folder (`file:///C:/path/to/folder/`) shows the folder page.
- Subfolders come first. The sort button switches between name and modified
  time, ascending or descending; the choice is saved.
- With a root set, the side panel keeps the tree from the root down to the
  current file and expands its ancestor folders.
- Wiki links such as `[[folder/note|Alias]]` link to the matching local file;
  bare links such as `[[2026-06-23]]` are looked up by file name under the root.
- Drag the side panel's right edge to change its width, and the line between
  the folder list and the outline to change their heights. Both are saved;
  double-click a handle to reset it.
