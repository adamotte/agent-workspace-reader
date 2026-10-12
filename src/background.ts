import storage from '@/core/storage'
import commands from '@/core/commands'
import { getFileType, hasKnownExtension } from '@/core/file-types'

const VAULT_INDEX_TTL = 5 * 60 * 1000
interface NativeFolderEntry {
  name: string
  url: string
  isDirectory: boolean
}
const directoryEntriesCache = new Map<
  string,
  {
    createdAt: number
    entries: Promise<NativeFolderEntry[]>
  }
>()

chrome.runtime.onMessage.addListener(({ action, data }, sender, callback) => {
  messageHandler(action, data, sender, callback)
  return true
})

async function messageHandler(
  action: string,
  data: any,
  sender: chrome.runtime.MessageSender,
  callback?: (response?: any) => void,
) {
  switch (action) {
    case 'storage':
      await storage.set({ [data.key]: data.value })
      updatePage(data.key, data.value)
      callback?.(data)
      break
    case 'fetch':
      fetchData(sender.url).then(callback)
      break
    case 'fetchUrl':
      fetchLocalURL(data?.url, sender.url).then(callback)
      break
    case 'resolveWikiLinks':
      resolveWikiLinkTargets(data, sender.url).then(callback)
      break
    case 'reloadExtension':
      // After an update of the unpacked extension; see onInstalled below.
      await storage.set({ reloadPagesOnStart: true })
      chrome.runtime.reload()
      break
    case 'openSettings':
      // The popup, as a window of its own: a page opened with --app has no
      // toolbar to reach it from.
      chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        width: 420,
        height: 780,
      })
      callback?.()
      break
  }
}

async function resolveWikiLinkTargets(data: any, senderURL?: string) {
  try {
    const rootURL = normalizeDirectoryURL(data?.rootURL)
    if (!rootURL || !senderURL || !isURLWithinRoot(senderURL, rootURL)) {
      throw new Error('WikiLink resolution must stay inside the local root.')
    }
    // The file the links are in, which a folder page shows
    const sourceURL =
      typeof data?.sourceURL === 'string' &&
      isURLWithinRoot(data.sourceURL, rootURL)
        ? data.sourceURL
        : senderURL
    const targets = Array.isArray(data?.targets)
      ? data.targets.filter(target => typeof target === 'string')
      : []
    const fileNames = targets.map(
      target => splitWikiLinkTarget(target).fileName,
    )
    const candidatesByName = await findVaultFiles(rootURL, fileNames, sourceURL)
    const links: Record<string, string> = {}
    for (const target of targets) {
      const { fileName, heading } = splitWikiLinkTarget(target)
      const candidates =
        candidatesByName.get(fileName.toLocaleLowerCase('zh-CN')) || []
      const selected = selectNearestCandidate(candidates, sourceURL)
      if (!selected) continue
      const url = new URL(selected)
      if (heading) url.hash = normalizeHeading(heading)
      links[target] = url.href
    }
    return { ok: true, links }
  } catch (error) {
    return { ok: false, error: error.message || String(error) }
  }
}

async function findVaultFiles(
  rootURL: string,
  fileNames: string[],
  senderURL: string,
): Promise<Map<string, string[]>> {
  const requested = new Set(
    fileNames.map(name => name.toLocaleLowerCase('zh-CN')),
  )
  const matches = new Map<string, string[]>()
  const queue = [rootURL]
  const visited = new Set<string>()
  const senderSegments = getDirectorySegments(senderURL)

  while (queue.length && matches.size < requested.size) {
    queue.sort(
      (left, right) =>
        getPathDistance(senderSegments, getDirectorySegments(left)) -
        getPathDistance(senderSegments, getDirectorySegments(right)),
    )
    const batch = queue.splice(0, 8).filter(url => !visited.has(url))
    batch.forEach(url => visited.add(url))
    const results = await Promise.all(
      batch.map(directoryURL => getDirectoryEntries(directoryURL, rootURL)),
    )

    results.flat().forEach(entry => {
      if (entry.isDirectory) {
        if (!visited.has(entry.url)) queue.push(entry.url)
        return
      }
      const key = entry.name.toLocaleLowerCase('zh-CN')
      if (!requested.has(key)) return
      const urls = matches.get(key) || []
      urls.push(entry.url)
      matches.set(key, urls)
    })
  }
  return matches
}

function getDirectoryEntries(
  directoryURL: string,
  rootURL: string,
): Promise<NativeFolderEntry[]> {
  const cached = directoryEntriesCache.get(directoryURL)
  if (cached && Date.now() - cached.createdAt < VAULT_INDEX_TTL) {
    return cached.entries
  }

  const entries = (async () => {
    try {
      const response = await fetch(directoryURL)
      if (!response.ok && response.status !== 0) return []
      return parseNativeDirectoryEntries(
        await response.text(),
        directoryURL,
        rootURL,
      )
    } catch {
      return []
    }
  })()
  directoryEntriesCache.set(directoryURL, {
    createdAt: Date.now(),
    entries,
  })
  return entries
}

function parseNativeDirectoryEntries(
  html: string,
  directoryURL: string,
  rootURL: string,
): NativeFolderEntry[] {
  const entries: NativeFolderEntry[] = []
  const base = new URL(directoryURL)
  const basePath = base.pathname.endsWith('/')
    ? base.pathname
    : `${base.pathname}/`
  const addRowPattern =
    /addRow\(("(?:\\.|[^"\\])*"),\s*("(?:\\.|[^"\\])*"),\s*([01]),\s*(?:-?\d+(?:\.\d+)?|null),\s*(?:"(?:\\.|[^"\\])*")\s*,\s*(-?\d+(?:\.\d+)?|null),\s*(?:"(?:\\.|[^"\\])*")\s*\);?/g

  for (const match of html.matchAll(addRowPattern)) {
    try {
      const isDirectory = match[3] === '1'
      const url = new URL(JSON.parse(match[2]), base)
      if (isDirectory && !url.pathname.endsWith('/')) url.pathname += '/'
      if (
        url.protocol !== 'file:' ||
        !url.pathname.startsWith(basePath) ||
        !isURLWithinRoot(url.href, rootURL)
      ) {
        continue
      }
      const relativePath = url.pathname.slice(basePath.length)
      const comparablePath = isDirectory
        ? relativePath.replace(/\/$/, '')
        : relativePath
      if (!comparablePath || comparablePath.includes('/')) continue
      const name = decodeName(JSON.parse(match[1]))
      if (isDirectory && (name.startsWith('.') || name === 'node_modules')) {
        continue
      }
      if (!isDirectory && !getFileType(name)) continue
      entries.push({ name, url: url.href, isDirectory })
    } catch {
      // Ignore malformed browser-generated rows.
    }
  }
  return entries
}

function splitWikiLinkTarget(target: string) {
  const hashIndex = target.indexOf('#')
  let fileName = hashIndex < 0 ? target : target.slice(0, hashIndex)
  const heading = hashIndex < 0 ? '' : target.slice(hashIndex + 1)
  if (!hasKnownExtension(fileName)) fileName += '.md'
  return { fileName, heading }
}

function selectNearestCandidate(
  candidates: string[],
  senderURL: string,
): string | undefined {
  const senderSegments = getDirectorySegments(senderURL)
  return [...candidates].sort((left, right) => {
    const distanceDiff =
      getPathDistance(senderSegments, getDirectorySegments(left)) -
      getPathDistance(senderSegments, getDirectorySegments(right))
    return distanceDiff || left.localeCompare(right)
  })[0]
}

function getDirectorySegments(url: string): string[] {
  const path = decodeURLPath(new URL('.', url))
  return path.split('/').filter(Boolean)
}

function getPathDistance(left: string[], right: string[]): number {
  let common = 0
  while (
    common < left.length &&
    common < right.length &&
    left[common] === right[common]
  ) {
    common += 1
  }
  return left.length + right.length - common * 2
}

function normalizeDirectoryURL(value?: string): string | undefined {
  try {
    const url = new URL(value)
    if (url.protocol !== 'file:') return undefined
    url.hash = ''
    url.search = ''
    if (!url.pathname.endsWith('/')) url.pathname += '/'
    return url.href
  } catch {
    return undefined
  }
}

function isURLWithinRoot(url: string, rootURL: string): boolean {
  try {
    const target = new URL(url)
    const root = new URL(rootURL)
    return (
      target.protocol === root.protocol &&
      target.host === root.host &&
      decodeURLPath(target).startsWith(decodeURLPath(root))
    )
  } catch {
    return false
  }
}

function decodeURLPath(url: URL): string {
  try {
    return decodeURIComponent(url.pathname)
  } catch {
    return url.pathname
  }
}

function decodeName(name: string): string {
  try {
    return decodeURIComponent(name)
  } catch {
    return name
  }
}

function normalizeHeading(heading: string): string {
  return encodeURIComponent(heading.toLowerCase().trim().replace(/\s+/g, '-'))
}

async function fetchLocalURL(url?: string, senderURL?: string) {
  try {
    if (!url || new URL(url).protocol !== 'file:') {
      throw new Error('Only local file URLs are allowed.')
    }
    if (!senderURL || new URL(senderURL).protocol !== 'file:') {
      throw new Error('Local file requests must come from a local page.')
    }
    const response = await fetch(url)
    if (!response.ok && response.status !== 0) {
      throw new Error(`Read failed with status ${response.status}.`)
    }
    return { ok: true, text: decodeText(await response.arrayBuffer()) }
  } catch (error) {
    console.error(error)
    return { ok: false, error: error.message || String(error) }
  }
}

// UTF-8, or Windows-1252 for files that aren't valid UTF-8, such as CSV
// files that Excel saves with a French locale.
function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('windows-1252').decode(buffer)
  }
}

async function fetchData(url?: string) {
  if (!url) {
    const error = new Error('Fetch error: URL is undefined.')
    console.error(error)
    return error.message
  }
  if (new URL(url).protocol !== 'file:') {
    const error = new Error('Fetch error: only local files are read.')
    console.error(error)
    return error.message
  }

  return fetch(url)
    .then(res => res.text())
    .catch(err => {
      console.error(err)
      return err.message
    })
}

// Chrome extension shortcuts
chrome.commands.onCommand.addListener(action => {
  commands[action]?.(messageHandler)
})

const actionMap = {
  enable: 'reload',
  refresh: 'toggleRefresh',
  centered: 'toggleCentered',
  mdPlugins: 'updateMdPlugins',
  githubCompat: 'updateMdPlugins',
  pageTheme: 'updatePageTheme',
  mermaidLook: 'updateMdPlugins',
  mermaidLayout: 'updateMdPlugins',
  hiddenSide: 'toggleSide',
  showExtensions: 'toggleExtensions',
  folderRootPath: 'reload',
  editing: 'toggleEditing',
}

function updatePage(key: keyof typeof actionMap, value?: any) {
  const action = actionMap[key]
  if (!action) return

  // Every local page follows, whichever window the settings were changed
  // from: the popup, or its own window opened from a page.
  chrome.tabs.query({ url: 'file://*/*' }, tabs => {
    for (const tab of tabs) {
      if (tab.id === undefined) continue
      chrome.tabs.sendMessage(tab.id, { action, data: { key, value } }, () => {
        const error = chrome.runtime.lastError
        if (error && !error.message?.includes('Receiving end does not exist')) {
          console.warn('Failed to update a tab:', error.message)
        }
      })
    }
  })
}

// Reloads the local pages after the popup's reload button, so that they run
// the new content script rather than the orphaned one.
chrome.runtime.onInstalled.addListener(async () => {
  const { reloadPagesOnStart } = await storage.get('reloadPagesOnStart')
  if (!reloadPagesOnStart) return
  await storage.set({ reloadPagesOnStart: false })
  chrome.tabs.query({ url: 'file://*/*' }, tabs => {
    for (const tab of tabs) {
      if (tab.id !== undefined) chrome.tabs.reload(tab.id)
    }
  })
})
