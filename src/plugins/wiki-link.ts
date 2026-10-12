import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import className from '@/config/class-name'

interface WikiLinkEnvironment {
  wikiLinkSourceURL?: string
  wikiLinkRootURL?: string
}

export default function wikiLinkPlugin(md: MarkdownIt) {
  md.inline.ruler.before('link', 'wiki_link', parseWikiLink)
}

function parseWikiLink(state: StateInline, silent: boolean): boolean {
  const start = state.pos
  if (
    state.src.charCodeAt(start) !== 0x5b ||
    state.src.charCodeAt(start + 1) !== 0x5b ||
    (start > 0 && state.src.charCodeAt(start - 1) === 0x21)
  ) {
    return false
  }

  const end = state.src.indexOf(']]', start + 2)
  if (end < 0) return false

  const content = state.src.slice(start + 2, end).trim()
  const separator = content.indexOf('|')
  const rawTarget = separator < 0 ? content : content.slice(0, separator)
  const target = rawTarget.replace(/\\$/, '').trim()
  if (!target) return false

  const rawLabel = separator < 0 ? '' : content.slice(separator + 1)
  const label = rawLabel.replace(/\\\|/g, '|').trim() || getDefaultLabel(target)

  if (!silent) {
    const environment = (state.env || {}) as WikiLinkEnvironment
    const open = state.push('link_open', 'a', 1)
    const unresolved =
      Boolean(environment.wikiLinkRootURL) && isBareWikiLinkTarget(target)
    open.attrSet(
      'href',
      unresolved ? '#' : resolveWikiLinkURL(target, environment),
    )
    open.attrSet('class', className.WIKI_LINK)
    open.attrSet('title', target)
    open.attrSet('data-wiki-target', target)
    if (unresolved) open.attrSet('data-wiki-unresolved', 'true')
    const text = state.push('text', '', 0)
    text.content = label
    state.push('link_close', 'a', -1)
  }

  state.pos = end + 2
  return true
}

function isBareWikiLinkTarget(target: string): boolean {
  const filePath = target.split('#', 1)[0]
  return (
    Boolean(filePath) &&
    !filePath.includes('/') &&
    !/^[a-z][a-z\d+.-]*:/i.test(filePath)
  )
}

function resolveWikiLinkURL(
  target: string,
  environment: WikiLinkEnvironment,
): string {
  const hashIndex = target.indexOf('#')
  let filePath = hashIndex < 0 ? target : target.slice(0, hashIndex)
  const heading = hashIndex < 0 ? '' : target.slice(hashIndex + 1)

  if (!filePath) return heading ? `#${normalizeHeading(heading)}` : '#'
  if (/^[a-z][a-z\d+.-]*:/i.test(filePath)) return target

  if (!hasFileExtension(filePath)) filePath += '.md'
  const explicitlyRelative = /^\.{1,2}\//.test(filePath)
  const vaultRelative = filePath.startsWith('/') || filePath.includes('/')
  const baseURL =
    !explicitlyRelative && vaultRelative && environment.wikiLinkRootURL
      ? environment.wikiLinkRootURL
      : environment.wikiLinkSourceURL
  if (!baseURL) {
    return `${filePath}${heading ? `#${normalizeHeading(heading)}` : ''}`
  }

  try {
    const path =
      environment.wikiLinkRootURL === baseURL && filePath.startsWith('/')
        ? filePath.slice(1)
        : filePath
    const url = new URL(path, baseURL)
    if (heading) url.hash = normalizeHeading(heading)
    return url.href
  } catch {
    return `${filePath}${heading ? `#${normalizeHeading(heading)}` : ''}`
  }
}

function getDefaultLabel(target: string): string {
  const [filePath, heading] = target.split('#', 2)
  if (!filePath) return heading || target
  const name = filePath.split('/').pop() || filePath
  return name.replace(/\.md$/i, '')
}

function hasFileExtension(path: string): boolean {
  const name = path.split('/').pop() || ''
  return /\.[^./]+$/.test(name)
}

function normalizeHeading(heading: string): string {
  return encodeURIComponent(heading.toLowerCase().trim().replace(/\s+/g, '-'))
}
