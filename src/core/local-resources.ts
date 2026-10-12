// md-reader only shows what is on this computer: opening a document must not
// make the browser contact another host. A remote image or stylesheet would
// tell its owner when and from where the document was read, and on Windows a
// file://host/share address sends the user's credentials to that host. Links
// stay, since following one is the reader's choice.

// Attributes whose URL the browser fetches on its own.
const RESOURCE_ATTRS = new Set(['src', 'poster', 'background', 'data'])
const SRCSET_ATTRS = new Set(['srcset', 'imagesrcset'])
// Attributes holding CSS, which fetches through url(), image-set() or @import.
const CSS_ATTRS = new Set([
  'style',
  'fill',
  'stroke',
  'filter',
  'clip-path',
  'mask',
  'marker-start',
  'marker-mid',
  'marker-end',
  'cursor',
])
// Elements whose href is a link to follow rather than a resource to fetch.
const LINK_TAGS = new Set(['a', 'area'])

const CSS_ESCAPE =
  /\\(?:([0-9a-f]{1,6})[ \t\n\r\f]?|(\r\n|[\n\r\f])|([\s\S]))/gi
const CSS_FETCH = /@import|image-set\(|src\(/i
const CSS_URL_CALL = /url\(/gi
const CSS_URL = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^"'()\s]*))\s*\)/gi

export function isLocalURL(value: string, base: string): boolean {
  try {
    const url = new URL(value.trim(), base)
    if (url.protocol === 'data:' || url.protocol === 'blob:') return true
    return url.protocol === 'file:' && !url.host
  } catch {
    return false
  }
}

export function isLocalSrcset(value: string, base: string): boolean {
  // Splitting on every comma cuts data: URLs short, which only ever leaves a
  // relative, local piece.
  return value.split(',').every(candidate => {
    const url = candidate.trim().split(/\s+/)[0]
    return !url || isLocalURL(url, base)
  })
}

export function isLocalCSS(css: string, base: string): boolean {
  // Escapes can spell url( or @import, so match against the decoded text.
  const text = unescapeCSS(css)
  if (CSS_FETCH.test(text)) return false
  const calls = text.match(CSS_URL_CALL)?.length ?? 0
  const urls = Array.from(
    text.matchAll(CSS_URL),
    match => match[1] ?? match[2] ?? match[3],
  )
  // A url( the pattern can't read is refused rather than guessed at.
  return urls.length === calls && urls.every(url => isLocalURL(url, base))
}

export function isLocalAttribute(
  tagName: string,
  name: string,
  value: string,
  base: string,
): boolean {
  const attr = name.toLowerCase()
  if (RESOURCE_ATTRS.has(attr)) return isLocalURL(value, base)
  if (SRCSET_ATTRS.has(attr)) return isLocalSrcset(value, base)
  if (attr === 'href' || attr.endsWith(':href')) {
    return LINK_TAGS.has(tagName.toLowerCase()) || isLocalURL(value, base)
  }
  if (CSS_ATTRS.has(attr)) return isLocalCSS(value, base)
  return true
}

// Drops what would make the browser fetch from another host: the attribute
// that holds the address, or the whole stylesheet.
export function removeRemoteResources(element: Element, base: string): void {
  if (
    element.localName === 'style' &&
    !isLocalCSS(element.textContent ?? '', base)
  ) {
    element.textContent = ''
  }
  for (const name of element.getAttributeNames()) {
    const value = element.getAttribute(name) ?? ''
    if (!isLocalAttribute(element.localName, name, value, base)) {
      element.removeAttribute(name)
    }
  }
}

function unescapeCSS(css: string): string {
  return css.replace(CSS_ESCAPE, (_, hex, newline, char) => {
    if (newline) return ''
    if (!hex) return char
    const codePoint = parseInt(hex, 16)
    return codePoint && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : '�'
  })
}
