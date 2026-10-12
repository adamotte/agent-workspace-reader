import type { FileKind } from '@/core/file-types'

// Outline icons adapted from Tabler Icons (MIT), drawn on a 24px grid.
const FILE_CORNER = '<path d="M14 3v4a1 1 0 0 0 1 1h4"/>'
const FILE_SHAPE =
  '<path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"/>'

export type IconName = FileKind | 'chevron' | 'folder' | 'folder-open'

const ICONS: Record<IconName, string> = {
  chevron: '<path d="M9 6l6 6l-6 6"/>',
  folder:
    '<path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2"/>',
  'folder-open':
    '<path d="M5 19l2.757 -7.351a1 1 0 0 1 .936 -.649h12.307a1 1 0 0 1 .986 1.164l-.996 5.211a2 2 0 0 1 -1.964 1.625h-14.026a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2h4l3 3h7a2 2 0 0 1 2 2v2"/>',
  markdown:
    '<path d="M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2z"/><path d="M7 15v-6l2 2l2 -2v6"/><path d="M14 13l2 2l2 -2m-2 2v-6"/>',
  text: `${FILE_CORNER}${FILE_SHAPE}<path d="M9 9h1"/><path d="M9 13h6"/><path d="M9 17h6"/>`,
  json: '<path d="M7 4a2 2 0 0 0 -2 2v3a2 3 0 0 1 -2 3a2 3 0 0 1 2 3v3a2 2 0 0 0 2 2"/><path d="M17 4a2 2 0 0 1 2 2v3a2 3 0 0 0 2 3a2 3 0 0 0 -2 3v3a2 2 0 0 1 -2 2"/>',
  yaml: `${FILE_CORNER}${FILE_SHAPE}<path d="M10 13l-1 2l1 2"/><path d="M14 13l1 2l-1 2"/>`,
  html: '<path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18z"/><path d="M3.6 9h16.8"/><path d="M3.6 15h16.8"/><path d="M11.5 3a17 17 0 0 0 0 18"/><path d="M12.5 3a17 17 0 0 1 0 18"/>',
  pdf: `${FILE_CORNER}<path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4"/><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6"/><path d="M17 18h2"/><path d="M20 15h-3v6"/><path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z"/>`,
}

export function createIcon(name: IconName, className: string): SVGSVGElement {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  icon.setAttribute('viewBox', '0 0 24 24')
  icon.setAttribute('fill', 'none')
  icon.setAttribute('stroke', 'currentColor')
  icon.setAttribute('stroke-width', '2')
  icon.setAttribute('stroke-linecap', 'round')
  icon.setAttribute('stroke-linejoin', 'round')
  icon.setAttribute('aria-hidden', 'true')
  icon.setAttribute('class', `${className} ${className}--${name}`)
  // Static markup from the table above, never user content.
  icon.innerHTML = ICONS[name]
  return icon
}
