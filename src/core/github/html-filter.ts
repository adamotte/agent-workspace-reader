// Approximates GitHub's sanitization of raw HTML in Markdown: the GFM
// tagfilter escapes a few dangerous tags outright, other tags outside the
// allowlist are dropped (their content stays), and attributes outside the
// allowlist are removed. Applied only to raw HTML tokens, not to markup that
// md-reader itself generates.

// GFM spec "Disallowed Raw HTML": rendered as literal text.
const TAGFILTER = new Set([
  'title',
  'textarea',
  'style',
  'xmp',
  'iframe',
  'noembed',
  'noframes',
  'script',
  'plaintext',
])

const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'bdo',
  'blockquote',
  'br',
  'caption',
  'cite',
  'code',
  'dd',
  'del',
  'details',
  'dfn',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'h7',
  'h8',
  'hr',
  'i',
  'img',
  'ins',
  'kbd',
  'li',
  'mark',
  'ol',
  'p',
  'picture',
  'pre',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'small',
  'source',
  'span',
  'strike',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'tt',
  'ul',
  'var',
  'video',
  'wbr',
])

const GLOBAL_ATTRS = new Set([
  'abbr',
  'accept',
  'accept-charset',
  'accesskey',
  'action',
  'align',
  'alt',
  'aria-describedby',
  'aria-hidden',
  'aria-label',
  'aria-labelledby',
  'axis',
  'cellpadding',
  'cellspacing',
  'char',
  'charoff',
  'charset',
  'checked',
  'clear',
  'color',
  'cols',
  'colspan',
  'compact',
  'coords',
  'datetime',
  'dir',
  'disabled',
  'enctype',
  'for',
  'frame',
  'headers',
  'height',
  'hreflang',
  'hspace',
  'id',
  'ismap',
  'itemprop',
  'label',
  'lang',
  'maxlength',
  'media',
  'method',
  'multiple',
  'name',
  'nohref',
  'noshade',
  'nowrap',
  'open',
  'progress',
  'prompt',
  'readonly',
  'rel',
  'rev',
  'role',
  'rows',
  'rowspan',
  'rules',
  'scope',
  'selected',
  'shape',
  'size',
  'span',
  'start',
  'summary',
  'tabindex',
  'title',
  'type',
  'usemap',
  'valign',
  'value',
  'vspace',
  'width',
])

const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href']),
  img: new Set(['src', 'longdesc', 'loading']),
  source: new Set(['srcset']),
  div: new Set(['itemscope', 'itemtype']),
  blockquote: new Set(['cite']),
  del: new Set(['cite']),
  ins: new Set(['cite']),
  q: new Set(['cite']),
  video: new Set(['src', 'controls', 'poster']),
}

const URL_ATTRS = new Set(['href', 'src', 'longdesc', 'cite', 'poster'])
const ALLOWED_PROTOCOLS = new Set(['http', 'https', 'mailto'])

export interface HtmlFilterReport {
  removedTags: number
  removedAttrs: number
  escapedTags: number
}

export function emptyHtmlFilterReport(): HtmlFilterReport {
  return { removedTags: 0, removedAttrs: 0, escapedTags: 0 }
}

const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g
const ATTR_RE =
  /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

export function filterGithubHtml(
  html: string,
  report: HtmlFilterReport = emptyHtmlFilterReport(),
): string {
  return html.replace(TAG_RE, (tag, slash: string, rawName: string, rest) => {
    const name = rawName.toLowerCase()
    if (TAGFILTER.has(name)) {
      report.escapedTags++
      return `&lt;${tag.slice(1)}`
    }
    if (!ALLOWED_TAGS.has(name)) {
      report.removedTags++
      return ''
    }
    if (slash) return `</${name}>`

    const selfClosing = /\/\s*$/.test(rest)
    const attrs: string[] = []
    for (const match of rest.replace(/\/\s*$/, '').matchAll(ATTR_RE)) {
      const attr = match[1].toLowerCase()
      const value = match[2] ?? match[3] ?? match[4]
      if (!isAllowedAttr(name, attr, value)) {
        report.removedAttrs++
        continue
      }
      attrs.push(
        value === undefined
          ? attr
          : `${attr}="${value.replace(/"/g, '&quot;')}"`,
      )
    }
    // GitHub drops links whose href was removed (e.g. javascript:), keeping
    // the text; a stray closing tag is ignored by the HTML parser.
    if (
      name === 'a' &&
      /\bhref=/.test(rest) &&
      !attrs.some(a => a.startsWith('href='))
    ) {
      return ''
    }
    return `<${name}${attrs.map(a => ` ${a}`).join('')}${
      selfClosing ? ' /' : ''
    }>`
  })
}

function isAllowedAttr(tag: string, attr: string, value?: string): boolean {
  if (!GLOBAL_ATTRS.has(attr) && !TAG_ATTRS[tag]?.has(attr)) return false
  if (URL_ATTRS.has(attr) && value !== undefined) {
    const protocol = value.trim().match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/)?.[1]
    if (protocol && !ALLOWED_PROTOCOLS.has(protocol.toLowerCase())) return false
  }
  return true
}
