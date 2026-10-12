import className from '@/config/class-name'
import i18n from '@/config/i18n'

type Localize = ReturnType<typeof i18n>

interface ResolveWikiLinksResponse {
  ok: boolean
  links?: Record<string, string>
  error?: string
}

const resolvedLinks = new Map<string, string>()

// sourceURL is the file the links are in, which a folder page shows; see
// getViewerURL.
export async function resolveWikiLinks(
  container: ParentNode,
  rootURL: string,
  localize: Localize = i18n(),
  sourceURL: string = window.location.href,
): Promise<void> {
  const links = Array.from(
    container.querySelectorAll<HTMLAnchorElement>(
      `a.${className.WIKI_LINK}[data-wiki-unresolved="true"]`,
    ),
  )
  if (!links.length) return

  const targets = Array.from(
    new Set(links.map(link => link.dataset.wikiTarget).filter(Boolean)),
  )
  const resolved = await requestResolvedLinks(targets, rootURL, sourceURL)
  links.forEach(link => applyResolvedLink(link, resolved, localize))
}

export async function resolveWikiLink(
  link: HTMLAnchorElement,
  rootURL: string,
  localize: Localize = i18n(),
  sourceURL: string = window.location.href,
): Promise<string | undefined> {
  const target = link.dataset.wikiTarget
  if (!target) return undefined

  const cacheKey = getCacheKey(rootURL, sourceURL, target)
  const cached = resolvedLinks.get(cacheKey)
  if (cached) {
    applyResolvedLink(link, { [target]: cached }, localize)
    return cached
  }

  const resolved = await requestResolvedLinks([target], rootURL, sourceURL)
  applyResolvedLink(link, resolved, localize)
  return resolved[target]
}

function requestResolvedLinks(
  targets: string[],
  rootURL: string,
  sourceURL: string,
): Promise<Record<string, string>> {
  const missing = targets.filter(
    target => !resolvedLinks.has(getCacheKey(rootURL, sourceURL, target)),
  )
  const cached = Object.fromEntries(
    targets
      .map(target => [
        target,
        resolvedLinks.get(getCacheKey(rootURL, sourceURL, target)),
      ])
      .filter(([, url]) => Boolean(url)),
  )
  if (!missing.length) return Promise.resolve(cached)

  return new Promise(resolve => {
    try {
      chrome.runtime.sendMessage(
        {
          action: 'resolveWikiLinks',
          data: { rootURL, sourceURL, targets: missing },
        },
        (response: ResolveWikiLinksResponse) => {
          if (chrome.runtime.lastError || !response?.ok) {
            resolve(cached)
            return
          }
          const links = response.links || {}
          Object.entries(links).forEach(([target, url]) => {
            resolvedLinks.set(getCacheKey(rootURL, sourceURL, target), url)
          })
          resolve({ ...cached, ...links })
        },
      )
    } catch {
      resolve(cached)
    }
  })
}

function applyResolvedLink(
  link: HTMLAnchorElement,
  resolved: Record<string, string>,
  localize: Localize,
) {
  const target = link.dataset.wikiTarget
  const url = target && resolved[target]
  if (!url) {
    link.title = target
      ? `${localize('wiki_link_not_found')}: ${target}`
      : localize('wiki_link_no_target')
    return
  }
  link.href = url
  link.removeAttribute('data-wiki-unresolved')
}

function getCacheKey(
  rootURL: string,
  sourceURL: string,
  target: string,
): string {
  return `${rootURL}\n${sourceURL}\n${target}`
}
