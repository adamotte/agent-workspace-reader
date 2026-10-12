# Markdown Reader Local

A local build of [md-reader](https://github.com/md-reader/md-reader) (MIT) that
merges two forks:

- [mdsakalu/md-reader](https://github.com/mdsakalu/md-reader): GitHub-compatible
  rendering mode, DOMPurify sanitizing, Mermaid 12, extra page themes.
- [mxgnene01/md-reader](https://github.com/mxgnene01/md-reader): local folder
  browser and Obsidian-style wiki links.

## Build

```bash
pnpm install
pnpm run build
```

The unpacked extension lands in `extension/`, the zip in `dist/`.

## Install

1. Open `chrome://extensions/` (or `edge://extensions/`).
2. Turn on Developer mode.
3. Disable the store version of Markdown Reader if it is installed, so two
   content scripts don't both handle Markdown pages.
4. Click "Load unpacked" and select the `extension/` folder.
5. Open the extension's details and turn on "Allow access to file URLs".
6. Optionally, set the local folder root in the popup, for example
   `C:\Users\name\Notes` or `/Users/name/Obsidian`.

## Use

- Opening a local `.md`, `.mdx`, `.mdc`, `.mkd`, `.markdown` or `.txt` file
  renders it, with the current folder's Markdown files and subfolders listed at
  the top of the side panel and the current file highlighted.
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
