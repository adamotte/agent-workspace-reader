import DOMPurify from 'dompurify'
import { removeRemoteResources } from '@/core/local-resources'

// A private instance keeps this hook apart from the ones mermaid adds to the
// shared one.
export const purify = DOMPurify(window)

purify.addHook('afterSanitizeAttributes', node => {
  if (node.nodeType === Node.ELEMENT_NODE) {
    removeRemoteResources(node as Element, document.baseURI)
  }
})

// Graphviz turns a node's href or URL attribute into an SVG link as is, so a
// javascript: URL would run when clicked.
export function sanitizeSvg(svg: string): SVGSVGElement | null {
  const fragment = purify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    RETURN_DOM_FRAGMENT: true,
  })
  return fragment.querySelector('svg')
}

// Parses markup from a trusted renderer such as mermaid in an inert template,
// which fetches nothing, and removes remote resources before it joins the page.
export function parseLocalHTML(html: string): DocumentFragment {
  const template = document.createElement('template')
  template.innerHTML = html
  template.content
    .querySelectorAll('*')
    .forEach(element => removeRemoteResources(element, document.baseURI))
  return template.content
}
