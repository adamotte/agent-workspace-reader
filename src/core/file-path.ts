// Pure helpers behind the edit mode: where a file sits under a granted
// folder, and what the file on disk looks like compared to the editor.
// Self-contained, so that the unit tests can import it under Node.

export type EOL = '\n' | '\r\n'

// The decoded path segments of a file under a root folder, as the File
// System Access API walks them, or undefined when the file isn't under the
// root or its path can't be walked (empty, '.' or '..' segments).
export function getRelativeSegments(
  fileURL: string,
  rootURL: string,
): string[] | undefined {
  let file: URL
  let root: URL
  try {
    file = new URL(fileURL)
    root = new URL(rootURL)
  } catch {
    return undefined
  }
  if (file.protocol !== root.protocol || file.host !== root.host) {
    return undefined
  }
  const rootPath = decodePath(root)
  const filePath = decodePath(file)
  if (!rootPath.endsWith('/') || !filePath.startsWith(rootPath)) {
    return undefined
  }
  const relative = filePath.slice(rootPath.length)
  if (!relative || relative.endsWith('/')) return undefined
  const segments = relative.split('/')
  const walkable = segments.every(
    segment => segment !== '' && segment !== '.' && segment !== '..',
  )
  return walkable ? segments : undefined
}

function decodePath(url: URL): string {
  try {
    return decodeURIComponent(url.pathname)
  } catch {
    return url.pathname
  }
}

// The decoded path segments from an ancestor folder down to a folder: none
// for the folder itself, undefined when it isn't under the ancestor.
export function getRelativeFolderSegments(
  folderURL: string,
  ancestorURL: string,
): string[] | undefined {
  if (!folderURL.endsWith('/')) return undefined
  const trimmed = folderURL.slice(0, -1)
  if (trimmed === ancestorURL.replace(/\/$/, '')) return []
  if (trimmed.endsWith('/')) return undefined
  return getRelativeSegments(trimmed, ancestorURL)
}

// The folders above the file, from its own folder up to the drive or root
// folder: the ones a user may pick to grant it.
export function getAncestorFolderURLs(fileURL: string): string[] {
  let url: URL
  try {
    url = new URL(fileURL)
  } catch {
    return []
  }
  url.search = ''
  url.hash = ''
  const folders: string[] = []
  // A folder's own URL first when given one
  let folder = url.pathname.endsWith('/') ? url.href : new URL('./', url).href
  while (true) {
    folders.push(folder)
    const parent = new URL('../', folder).href
    if (parent === folder) break
    folder = parent
  }
  return folders
}

// The most specific of the roots that hold the file, or undefined.
export function pickRoot(
  fileURL: string,
  rootURLs: Iterable<string>,
): string | undefined {
  let best: string | undefined
  for (const root of rootURLs) {
    if (
      getRelativeSegments(fileURL, root) &&
      (!best || root.length > best.length)
    ) {
      best = root
    }
  }
  return best
}

// The line ending the file uses, CRLF when its first line break is one.
export function detectEOL(text: string): EOL {
  const index = text.indexOf('\n')
  return index > 0 && text[index - 1] === '\r' ? '\r\n' : '\n'
}

// The editor works with LF; this restores the file's own line endings.
export function applyEOL(text: string, eol: EOL): string {
  const normalized = text.replace(/\r\n?/g, '\n')
  return eol === '\n' ? normalized : normalized.replace(/\n/g, '\r\n')
}

// Whether the file on disk differs from the text the editor started from.
// The text decides: a writer may touch the file without changing it.
export function hasChangedOnDisk(baseText: string, diskText: string): boolean {
  return applyEOL(baseText, '\n') !== applyEOL(diskText, '\n')
}
