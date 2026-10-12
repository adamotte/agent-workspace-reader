// A folder page shows one of the files under it through md-reader when its
// URL names the file in this query parameter. Browsing keeps to the one page,
// whose URL can then change without a reload: the History API only lets a
// file: page change its query and fragment, not its path.
const VIEW_PARAM = 'view'

export function getParentDirectoryURL(url: string): string {
  return new URL('./', url).href
}

export function getViewerURL(
  fileURL: string,
  folderURL: string = getParentDirectoryURL(fileURL),
): string {
  const folder = fileURL.startsWith(folderURL)
    ? folderURL
    : getParentDirectoryURL(fileURL)
  // Still percent-encoded, which getViewedFileURL relies on
  const path = fileURL.slice(folder.length)
  const view = encodeURIComponent(path).replace(/%2F/gi, '/')
  return `${folder}?${VIEW_PARAM}=${view}`
}

export function getViewedFileURL(pageURL: string): string | undefined {
  const page = new URL(pageURL)
  const path = page.searchParams.get(VIEW_PARAM)
  if (!path) return undefined
  page.search = ''
  page.hash = ''
  try {
    const file = new URL(path, page)
    // Only a file under this folder
    const inFolder =
      !file.search &&
      !file.hash &&
      !file.pathname.endsWith('/') &&
      isURLWithinRoot(file.href, page.href)
    return inFolder ? file.href : undefined
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

export function decodeURLPath(url: URL): string {
  try {
    return decodeURIComponent(url.pathname)
  } catch {
    return url.pathname
  }
}

// A file shown on a folder page resolves its relative links and images
// against its own URL rather than the page's.
export function rebaseURL(value: string, baseURL: string): string {
  const url = value.trim()
  if (!url || url.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(url)) {
    return value
  }
  try {
    return new URL(url, baseURL).href
  } catch {
    return value
  }
}

export function rebaseSrcset(value: string, baseURL: string): string {
  // A comma inside a data: URL would split it; those need no rebasing.
  if (/data:/i.test(value)) return value
  return value
    .split(',')
    .map(candidate => {
      const [url, ...descriptors] = candidate.trim().split(/\s+/)
      return [rebaseURL(url, baseURL), ...descriptors].join(' ')
    })
    .join(', ')
}
