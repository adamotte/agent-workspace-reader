// Markers for syntax that renders here but not on GitHub. Each marker records
// its kind in the render env so a summary banner can be shown at the top.
export type WarningKind =
  | 'mark'
  | 'ins'
  | 'sup'
  | 'toc'
  | 'container'
  | 'graphviz'
  | 'mermaid-elk'
  | 'html'

export const WARNING_TEXT: Record<WarningKind, string> = {
  mark: 'GitHub does not support ==highlight== syntax; it shows the text with the equals signs.',
  ins: 'GitHub does not support ++inserted++ syntax; it shows the text with the plus signs.',
  sup: 'GitHub does not support ^superscript^ syntax; use <sup>…</sup> instead.',
  toc: 'GitHub does not support [[toc]]; it shows the literal text. GitHub has its own outline button instead.',
  container:
    'GitHub does not support ::: containers; use an alert (> [!NOTE]) instead.',
  graphviz:
    'GitHub does not render Graphviz/DOT diagrams; it shows this as a code block. Use Mermaid instead.',
  'mermaid-elk':
    "GitHub's Mermaid does not support the ELK layout; the diagram may fail or use the default layout there.",
  html: 'GitHub strips some of the raw HTML in this document (disallowed tags, style/class/event attributes, unsafe links).',
}

export interface WarningEnv {
  githubWarnings?: Partial<Record<WarningKind, number>>
}

export const WARNING_CLASS = 'md-reader__gh-warn'

export function recordWarning(env: WarningEnv, kind: WarningKind, count = 1) {
  if (count <= 0) return
  env.githubWarnings ??= {}
  env.githubWarnings[kind] = (env.githubWarnings[kind] ?? 0) + count
}

export function inlineWarningOpen(env: WarningEnv, kind: WarningKind) {
  recordWarning(env, kind)
  return `<span class="${WARNING_CLASS}" title="${escapeAttr(
    WARNING_TEXT[kind],
  )}">`
}

export function blockWarning(env: WarningEnv, kind: WarningKind): string {
  recordWarning(env, kind)
  return `<div class="${WARNING_CLASS}-block">⚠ ${escapeText(
    WARNING_TEXT[kind],
  )}</div>\n`
}

export function renderWarningBanner(env: WarningEnv): string {
  const entries = Object.entries(env.githubWarnings ?? {}) as [
    WarningKind,
    number,
  ][]
  if (!entries.length) return ''
  const items = entries
    .map(
      ([kind, count]) =>
        `<li>${escapeText(WARNING_TEXT[kind])}${
          count > 1 ? ` (${count}×)` : ''
        }</li>`,
    )
    .join('')
  return `<details class="${WARNING_CLASS}-banner"><summary>⚠ This document will render differently on GitHub</summary><ul>${items}</ul></details>\n`
}

function escapeText(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(content: string): string {
  return escapeText(content).replace(/"/g, '&quot;')
}
