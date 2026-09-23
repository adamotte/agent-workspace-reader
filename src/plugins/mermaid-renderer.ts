import mermaid from 'mermaid'
import {
  MERMAID_CLASS,
  MERMAID_CONTENT_CLASS,
  MERMAID_ERROR_CLASS,
  MERMAID_STATUS_ATTR,
  MERMAID_THEME_ATTR,
  MERMAID_LOOK_ATTR,
  MERMAID_LAYOUT_ATTR,
} from '@/core/mermaid'

let renderId = 0
let initializedKey: string | null = null

// Site-wide config; a diagram's own frontmatter `config:` or init directive
// still takes precedence over these.
function initMermaid(theme: string, look: string, layout: string) {
  const key = `${theme}|${look}|${layout}`
  if (initializedKey === key) {
    return
  }
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    // Throw on bad syntax instead of injecting mermaid's own error SVG.
    suppressErrorRendering: true,
    theme: theme as any,
    // Mermaid 12 defaults to the shadowed "neo" look, ELK's orthogonal layout,
    // and narrow label wrapping; keep the classic Mermaid 9 appearance.
    look: look as any,
    layout,
    flowchart: { wrappingWidth: 600 },
  })
  initializedKey = key
}

function createErrorElement(message: string) {
  const error = document.createElement('div')
  error.className = MERMAID_ERROR_CLASS
  error.textContent = message
  return error
}

async function renderMermaidElement(element: HTMLElement) {
  const status = element.getAttribute(MERMAID_STATUS_ATTR)
  if (status === 'rendering' || status === 'ready') {
    return
  }

  const codeElement = element.querySelector(`.${MERMAID_CONTENT_CLASS}`)
  const code = codeElement?.textContent ?? ''
  if (!code.trim()) {
    return
  }

  element.querySelector(`.${MERMAID_ERROR_CLASS}`)?.remove()
  element.setAttribute(MERMAID_STATUS_ATTR, 'rendering')

  try {
    initMermaid(
      element.getAttribute(MERMAID_THEME_ATTR) || 'default',
      element.getAttribute(MERMAID_LOOK_ATTR) || 'classic',
      element.getAttribute(MERMAID_LAYOUT_ATTR) || 'dagre',
    )
    const { svg, bindFunctions } = await mermaid.render(
      `md-reader-mermaid-${renderId++}`,
      code,
    )
    const wrapper = document.createElement('div')
    wrapper.className = `${MERMAID_CLASS}-svg`
    wrapper.innerHTML = svg
    codeElement.replaceWith(wrapper)
    bindFunctions?.(wrapper)
    element.setAttribute(MERMAID_STATUS_ATTR, 'ready')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    element.appendChild(createErrorElement(message))
    element.setAttribute(MERMAID_STATUS_ATTR, 'error')
  }
}

// mermaid.render shares global state (config, temp DOM), so every render —
// including ones from an overlapping re-render on theme change — runs in order.
let queue: Promise<void> = Promise.resolve()

export function renderMermaid(container: ParentNode = document) {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(`.${MERMAID_CLASS}`),
  )
  for (const element of elements) {
    queue = queue.then(() => renderMermaidElement(element))
  }
  return queue
}

export default function MermaidRendererPlugin({ event }) {
  event.on('contentRendered', (container: HTMLElement) => {
    void renderMermaid(container)
  })
}
