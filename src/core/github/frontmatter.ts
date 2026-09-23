import { parse } from 'yaml'

// GitHub renders YAML front matter as a table: keys as header cells and the
// values in a single row beneath, with lists and maps as nested tables.
const FRONTMATTER_RE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/

export interface Frontmatter {
  yaml: string
  body: string
}

export function splitFrontmatter(content: string): Frontmatter | null {
  const match = content.match(FRONTMATTER_RE)
  if (!match) return null
  return { yaml: match[1], body: content.slice(match[0].length) }
}

export function renderFrontmatterTable(yaml: string): string {
  let data: unknown
  try {
    data = parse(yaml)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return `<div class="md-reader__gh-frontmatter-error"><strong>Error in user YAML:</strong> ${escapeHtml(
      message.split('\n')[0],
    )}</div><pre><code>${escapeHtml(yaml)}</code></pre>\n`
  }
  if (data === null || data === undefined) return ''
  return `<table class="md-reader__gh-frontmatter">${renderValue(
    data,
    true,
  )}</table>\n`
}

function renderValue(value: unknown, top = false): string {
  if (Array.isArray(value)) {
    const cells = value.map(v => `<td>${cell(v)}</td>`).join('')
    return wrap(`<tbody><tr>${cells}</tr></tbody>`, top)
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
    const head = entries.map(([k]) => `<th>${escapeHtml(k)}</th>`).join('')
    const body = entries.map(([, v]) => `<td>${cell(v)}</td>`).join('')
    return wrap(
      `<thead><tr>${head}</tr></thead><tbody><tr>${body}</tr></tbody>`,
      top,
    )
  }
  return wrap(`<tbody><tr><td>${cell(value)}</td></tr></tbody>`, top)
}

function cell(value: unknown): string {
  if (value !== null && typeof value === 'object') return renderValue(value)
  return `<div>${escapeHtml(value === null ? '' : String(value))}</div>`
}

function wrap(inner: string, top: boolean): string {
  return top ? inner : `<table>${inner}</table>`
}

function escapeHtml(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
