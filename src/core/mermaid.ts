import type MarkdownIt from 'markdown-it'

export const MERMAID_CLASS = 'md-reader__mermaid'
export const MERMAID_CONTENT_CLASS = `${MERMAID_CLASS}-content`
export const MERMAID_ERROR_CLASS = `${MERMAID_CLASS}-error`
export const MERMAID_STATUS_ATTR = 'data-mermaid-status'
export const MERMAID_THEME_ATTR = 'data-mermaid-theme'
export const MERMAID_LOOK_ATTR = 'data-mermaid-look'
export const MERMAID_LAYOUT_ATTR = 'data-mermaid-layout'

export type MermaidTheme = 'default' | 'dark'

export interface MermaidOptions {
  theme?: MermaidTheme
  look?: string
  layout?: string
}

export function isMermaidCodeBlock(info: string = ''): boolean {
  return info.trim().toLowerCase() === 'mermaid'
}

// Mermaid renders asynchronously, so markdown-it emits the escaped source as a
// placeholder and the mermaid-renderer plugin swaps in the SVG afterwards. The
// `mermaid` class keeps the page-wide box-sizing reset off the rendered SVG.
export function renderMermaidPlaceholder(
  code: string,
  {
    theme = 'default',
    look = 'classic',
    layout = 'dagre',
  }: MermaidOptions = {},
): string {
  return `<pre class="mermaid ${MERMAID_CLASS}" ${MERMAID_THEME_ATTR}="${escapeHtml(
    theme,
  )}" ${MERMAID_LOOK_ATTR}="${escapeHtml(
    look,
  )}" ${MERMAID_LAYOUT_ATTR}="${escapeHtml(
    layout,
  )}" ${MERMAID_STATUS_ATTR}="pending"><code class="${MERMAID_CONTENT_CLASS}">${escapeHtml(
    code,
  )}</code></pre>`
}

export default function MermaidBlockPlugin(
  md: MarkdownIt,
  mermaidOptions: MermaidOptions = {},
) {
  const fallbackFence = md.renderer.rules.fence?.bind(md.renderer.rules)

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]

    if (isMermaidCodeBlock(token.info)) {
      return renderMermaidPlaceholder(token.content.trim(), mermaidOptions)
    }

    if (fallbackFence) {
      return fallbackFence(tokens, idx, options, env, self)
    }

    return self.renderToken(tokens, idx, options)
  }
}

function escapeHtml(content: string): string {
  return String(content)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
