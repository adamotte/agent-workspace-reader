import className from '@/config/class-name'

interface ResolveWikiLinksResponse {
  ok: boolean
  links?: Record<string, string>
  error?: string
}

const resolvedLinks = new Map<string, string>()

export async function resolveWikiLinks(
  container: ParentNode,
  rootURL: string,
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
  const resolved = await requestResolvedLinks(targets, rootURL)
  links.forEach(link => applyResolvedLink(link, resolved))
}

export async function resolveWikiLink(
  link: HTMLAnchorElement,
  rootURL: string,
): Promise<string | undefined> {
  const target = link.dataset.wikiTarget
  if (!target) return undefined

  const cacheKey = getCacheKey(rootURL, target)
  const cached = resolvedLinks.get(cacheKey)
  if (cached) {
    applyResolvedLink(link, { [target]: cached })
    return cached
  }

  const resolved = await requestResolvedLinks([target], rootURL)
  applyResolvedLink(link, resolved)
  return resolved[target]
}

function requestResolvedLinks(
  targets: string[],
  rootURL: string,
): Promise<Record<string, string>> {
  const missing = targets.filter(
    target => !resolvedLinks.has(getCacheKey(rootURL, target)),
  )
  const cached = Object.fromEntries(
    targets
      .map(target => [target, resolvedLinks.get(getCacheKey(rootURL, target))])
      .filter(([, url]) => Boolean(url)),
  )
  if (!missing.length) return Promise.resolve(cached)

  return new Promise(resolve => {
    try {
      chrome.runtime.sendMessage(
        {
          action: 'resolveWikiLinks',
          data: { rootURL, targets: missing },
        },
        (response: ResolveWikiLinksResponse) => {
          if (chrome.runtime.lastError || !response?.ok) {
            resolve(cached)
            return
          }
          const links = response.links || {}
          Object.entries(links).forEach(([target, url]) => {
            resolvedLinks.set(getCacheKey(rootURL, target), url)
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
) {
  const target = link.dataset.wikiTarget
  const url = target && resolved[target]
  if (!url) {
    link.title = target ? `未找到：${target}` : '未找到目标文件'
    return
  }
  link.href = url
  link.removeAttribute('data-wiki-unresolved')
}

function getCacheKey(rootURL: string, target: string): string {
  return `${rootURL}\n${window.location.href}\n${target}`
}
