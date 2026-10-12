import className from '@/config/class-name'
import i18n from '@/config/i18n'
import { FOLDER_SORT_ORDERS, type FolderSortOrder } from '@/core/data'

type Localize = ReturnType<typeof i18n>

const MARKDOWN_EXTENSIONS = new Set([
  'md',
  'mdx',
  'mdc',
  'mkd',
  'markdown',
  'txt',
])

export interface FolderEntry {
  name: string
  url: string
  isDirectory: boolean
  modifiedTime?: number
}

interface FetchUrlResponse {
  ok: boolean
  text?: string
  error?: string
}

interface FolderBrowserOptions {
  container: HTMLElement
  rootURL: string
  currentURL?: string
  initialHTML?: string
  showParentLink?: boolean
  sortOrder?: FolderSortOrder
  onSortOrderChange?: (sortOrder: FolderSortOrder) => void
  localize?: Localize
}

export function isLocalDirectoryPage(
  url: string = window.location.href,
  contentType: string = document.contentType,
): boolean {
  const parsed = new URL(url)
  return (
    parsed.protocol === 'file:' &&
    parsed.pathname.endsWith('/') &&
    contentType === 'text/html'
  )
}

export function getParentDirectoryURL(url: string): string {
  return new URL('./', url).href
}

export function normalizeFolderRootURL(value?: string): string | undefined {
  const path = value?.trim()
  if (!path) return undefined

  try {
    let target = path
    if (/^[a-z]:[\\/]/i.test(target)) {
      target = `file:///${target.replace(/\\/g, '/')}`
    } else if (target.startsWith('/')) {
      target = `file://${target}`
    }

    const url = new URL(target)
    if (url.protocol !== 'file:') return undefined
    url.hash = ''
    url.search = ''
    if (!url.pathname.endsWith('/')) url.pathname += '/'
    return url.href
  } catch {
    return undefined
  }
}

export function isURLWithinRoot(url: string, rootURL: string): boolean {
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

export function isSameLocalURL(left: string, right: string): boolean {
  try {
    return normalizeURL(left) === normalizeURL(right)
  } catch {
    return false
  }
}

export function getDirectoryName(url: string): string {
  const pathname = new URL(url).pathname.replace(/\/$/, '')
  const encodedName = pathname.split('/').pop()
  if (!encodedName) return '/'
  try {
    return decodeURIComponent(encodedName)
  } catch {
    return encodedName
  }
}

export function parseDirectoryEntries(
  html: string,
  directoryURL: string,
  sortOrder: FolderSortOrder = 'name-desc',
): FolderEntry[] {
  const base = new URL(directoryURL)
  const basePath = base.pathname.endsWith('/')
    ? base.pathname
    : `${base.pathname}/`
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const seen = new Map<string, FolderEntry>()
  const entries: FolderEntry[] = []

  const addEntry = (
    href: string,
    directoryHint?: boolean,
    nameHint?: string,
    modifiedTimeHint?: number,
  ) => {
    let target: URL
    try {
      target = new URL(href, base)
    } catch {
      return
    }

    target.hash = ''
    target.search = ''
    if (directoryHint && !target.pathname.endsWith('/')) {
      target.pathname += '/'
    }
    if (target.protocol !== 'file:' || !target.pathname.startsWith(basePath)) {
      return
    }

    const relativePath = target.pathname.slice(basePath.length)
    const isDirectory = target.pathname.endsWith('/')
    const comparablePath = isDirectory
      ? relativePath.slice(0, -1)
      : relativePath
    if (!comparablePath || comparablePath.includes('/')) return
    if (!isDirectory && !isMarkdownFile(comparablePath)) return
    const knownEntry = seen.get(target.href)
    if (knownEntry) {
      if (
        knownEntry.modifiedTime === undefined &&
        Number.isFinite(modifiedTimeHint)
      ) {
        knownEntry.modifiedTime = modifiedTimeHint
      }
      return
    }

    const name = nameHint ? decodeName(nameHint) : decodeName(comparablePath)
    if (isDirectory && (name.startsWith('.') || name === 'node_modules')) {
      return
    }

    const entry = {
      name,
      url: target.href,
      isDirectory,
      modifiedTime: Number.isFinite(modifiedTimeHint)
        ? modifiedTimeHint
        : undefined,
    }
    seen.set(target.href, entry)
    entries.push(entry)
  }

  parsed.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(anchor => {
    const cells = anchor
      .closest('tr')
      ?.querySelectorAll<HTMLTableCellElement>('td')
    const modifiedTime = Number(cells?.[2]?.dataset.value)
    addEntry(
      anchor.getAttribute('href'),
      undefined,
      undefined,
      Number.isFinite(modifiedTime) ? modifiedTime : undefined,
    )
  })

  // Chrome returns directory listings fetched in a service worker as source
  // containing addRow(...) calls. DOMParser does not execute those scripts, so
  // parse their JSON string arguments explicitly instead of evaluating script.
  const addRowPattern =
    /addRow\(("(?:\\.|[^"\\])*"),\s*("(?:\\.|[^"\\])*"),\s*([01]),\s*(?:-?\d+(?:\.\d+)?|null),\s*(?:"(?:\\.|[^"\\])*")\s*,\s*(-?\d+(?:\.\d+)?|null),\s*(?:"(?:\\.|[^"\\])*")\s*\);?/g
  for (const match of html.matchAll(addRowPattern)) {
    try {
      const modifiedTime = match[4] === 'null' ? undefined : Number(match[4])
      addEntry(
        JSON.parse(match[2]),
        match[3] === '1',
        JSON.parse(match[1]),
        Number.isFinite(modifiedTime) ? modifiedTime : undefined,
      )
    } catch {
      // Ignore malformed browser-generated rows.
    }
  }

  return entries.sort((left, right) =>
    compareFolderEntries(left, right, sortOrder),
  )
}

export async function renderFolderBrowser({
  container,
  rootURL,
  currentURL,
  initialHTML,
  showParentLink = true,
  sortOrder = 'name-desc',
  onSortOrderChange,
  localize = i18n(),
}: FolderBrowserOptions): Promise<void> {
  container.replaceChildren()
  let activeSortOrder = normalizeFolderSortOrder(sortOrder)

  const header = document.createElement('div')
  header.className = className.FOLDER_HEADER

  const rootLink = document.createElement('a')
  rootLink.href = rootURL
  rootLink.className = className.FOLDER_ROOT
  rootLink.title = rootURL
  rootLink.textContent = `📁 ${getDirectoryName(rootURL)}`

  const parentLink = document.createElement('a')
  parentLink.href = new URL('../', rootURL).href
  parentLink.className = className.FOLDER_PARENT
  parentLink.title = localize('folder_parent_title')
  parentLink.textContent = localize('folder_parent')

  const sortControl = document.createElement('label')
  sortControl.className = className.FOLDER_SORT
  const sortIcon = document.createElement('span')
  sortIcon.textContent = '⇅'
  sortIcon.setAttribute('aria-hidden', 'true')
  const sortSelect = document.createElement('select')
  sortSelect.setAttribute('aria-label', localize('folder_sort'))
  for (const value of FOLDER_SORT_ORDERS) {
    const optionElement = document.createElement('option')
    optionElement.value = value
    optionElement.textContent = localize(`folder_sort_${value}`)
    sortSelect.append(optionElement)
  }
  sortSelect.value = activeSortOrder
  updateSortControlTitle(sortControl, activeSortOrder, localize)
  sortControl.append(sortIcon, sortSelect)

  header.append(rootLink, sortControl)
  if (showParentLink) header.append(parentLink)

  const tree = document.createElement('ul')
  tree.className = className.FOLDER_TREE
  const status = document.createElement('div')
  status.className = className.FOLDER_STATUS
  status.textContent = localize('folder_loading')
  container.append(header, status, tree)

  try {
    const html = initialHTML ?? (await fetchLocalText(rootURL, localize))
    let renderVersion = 0
    const renderTree = async () => {
      const version = ++renderVersion
      const entries = parseDirectoryEntries(html, rootURL, activeSortOrder)
      const nextTree = document.createElement('ul')
      await renderEntries(
        nextTree,
        entries,
        currentURL,
        activeSortOrder,
        localize,
      )
      if (version !== renderVersion) return

      tree.replaceChildren(...Array.from(nextTree.childNodes))
      status.remove()
      requestAnimationFrame(() => {
        tree
          .querySelector(`.${className.FOLDER_FILE_ACTIVE}`)
          ?.scrollIntoView({ block: 'nearest' })
      })
      if (!entries.length) {
        status.textContent = localize('folder_empty')
        container.insertBefore(status, tree)
      }
    }

    sortSelect.addEventListener('change', () => {
      activeSortOrder = normalizeFolderSortOrder(sortSelect.value)
      updateSortControlTitle(sortControl, activeSortOrder, localize)
      onSortOrderChange?.(activeSortOrder)
      void renderTree()
    })
    await renderTree()
  } catch (error) {
    status.classList.add(className.FOLDER_STATUS_ERROR)
    status.textContent = `${localize('folder_read_failed')}: ${
      error.message || error
    }`
  }
}

async function renderEntries(
  list: HTMLUListElement,
  entries: FolderEntry[],
  currentURL?: string,
  sortOrder: FolderSortOrder = 'name-desc',
  localize: Localize = i18n(),
): Promise<void> {
  for (const entry of entries) {
    const item = document.createElement('li')

    if (entry.isDirectory) {
      const details = document.createElement('details')
      const summary = document.createElement('summary')
      summary.textContent = entry.name
      summary.title = entry.url
      const children = document.createElement('ul')
      details.append(summary, children)
      let loadPromise: Promise<void> | undefined
      const loadChildren = () => {
        if (loadPromise) return loadPromise
        loadPromise = (async () => {
          summary.classList.add(className.FOLDER_LOADING)
          try {
            const html = await fetchLocalText(entry.url, localize)
            const childEntries = parseDirectoryEntries(
              html,
              entry.url,
              sortOrder,
            )
            await renderEntries(
              children,
              childEntries,
              currentURL,
              sortOrder,
              localize,
            )
            if (!childEntries.length) {
              const empty = document.createElement('li')
              empty.className = className.FOLDER_EMPTY
              empty.textContent = localize('folder_empty')
              children.append(empty)
            }
          } catch (error) {
            const failed = document.createElement('li')
            failed.className = className.FOLDER_STATUS_ERROR
            failed.textContent = localize('folder_child_failed')
            children.append(failed)
          } finally {
            summary.classList.remove(className.FOLDER_LOADING)
          }
        })()
        return loadPromise
      }
      details.addEventListener('toggle', () => {
        if (details.open) void loadChildren()
      })
      item.append(details)
      list.append(item)

      if (currentURL && isURLWithinRoot(currentURL, entry.url)) {
        details.open = true
        await loadChildren()
      }
    } else {
      const link = document.createElement('a')
      link.href = entry.url
      link.title = entry.name
      link.textContent = entry.name
      if (sameFileURL(entry.url, currentURL)) {
        link.classList.add(className.FOLDER_FILE_ACTIVE)
      }
      item.append(link)
      list.append(item)
    }
  }
}

function compareFolderEntries(
  left: FolderEntry,
  right: FolderEntry,
  sortOrder: FolderSortOrder,
): number {
  if (left.isDirectory !== right.isDirectory) {
    return left.isDirectory ? -1 : 1
  }

  const nameDiff = left.name.localeCompare(right.name, 'zh-CN', {
    numeric: true,
  })
  if (sortOrder === 'name-asc') return nameDiff
  if (sortOrder === 'name-desc') return -nameDiff

  const leftTime = left.modifiedTime
  const rightTime = right.modifiedTime
  if (leftTime === undefined && rightTime !== undefined) return 1
  if (leftTime !== undefined && rightTime === undefined) return -1
  const modifiedDiff =
    sortOrder === 'modified-desc' ? rightTime - leftTime : leftTime - rightTime
  if (modifiedDiff) return modifiedDiff
  return sortOrder === 'modified-desc' ? -nameDiff : nameDiff
}

function normalizeFolderSortOrder(value: string): FolderSortOrder {
  return FOLDER_SORT_ORDERS.includes(value as FolderSortOrder)
    ? (value as FolderSortOrder)
    : 'name-desc'
}

function updateSortControlTitle(
  control: HTMLElement,
  sortOrder: FolderSortOrder,
  localize: Localize,
) {
  control.title = `${localize('folder_sort')}: ${localize(
    `folder_sort_${sortOrder}`,
  )}`
}

function fetchLocalText(url: string, localize: Localize): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'fetchUrl', data: { url } },
      (response: FetchUrlResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        if (!response?.ok) {
          reject(new Error(response?.error || localize('folder_unreadable')))
          return
        }
        resolve(response.text || '')
      },
    )
  })
}

function isMarkdownFile(path: string): boolean {
  const extension = path.split('.').pop()?.toLowerCase()
  return MARKDOWN_EXTENSIONS.has(extension)
}

function decodeName(name: string): string {
  try {
    return decodeURIComponent(name)
  } catch {
    return name
  }
}

function sameFileURL(left: string, right?: string): boolean {
  if (!right) return false
  return normalizeURL(left) === normalizeURL(right)
}

function normalizeURL(url: string): string {
  const parsed = new URL(url)
  return `${parsed.protocol}//${parsed.host}${decodeURLPath(parsed)}`
}

function decodeURLPath(url: URL): string {
  try {
    return decodeURIComponent(url.pathname)
  } catch {
    return url.pathname
  }
}
