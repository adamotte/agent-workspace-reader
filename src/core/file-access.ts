import { getRelativeSegments, pickRoot } from '@/core/file-path'

// Writing a local file from a file: page goes through the File System Access
// API: the user grants a folder once, and the files under it can be saved.
// The granted handles live in IndexedDB on the file: origin, keyed by the URL
// of the folder they stand for, as a handle doesn't know its own path.

const DB_NAME = 'md-reader'
const STORE = 'roots'

export class FolderMismatchError extends Error {
  constructor(public rootURL: string) {
    super('The chosen folder does not hold the file')
    this.name = 'FolderMismatchError'
  }
}

export class PickerCancelledError extends Error {
  constructor() {
    super('No folder chosen')
    this.name = 'PickerCancelledError'
  }
}

export interface ResolvedFile {
  handle: FileSystemFileHandle
  rootURL: string
}

export function isFileAccessSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.showDirectoryPicker === 'function' &&
    typeof indexedDB !== 'undefined'
  )
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('IndexedDB blocked'))
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDB()
  try {
    const store = db.transaction(STORE, mode).objectStore(STORE)
    return await requestToPromise(run(store))
  } finally {
    db.close()
  }
}

// The granted folders, by URL. Fails soft: without storage, the user picks
// the folder again on the next page.
export async function listRoots(): Promise<
  Map<string, FileSystemDirectoryHandle>
> {
  try {
    const [keys, values] = await Promise.all([
      withStore('readonly', store => store.getAllKeys()),
      withStore('readonly', store => store.getAll()),
    ])
    const roots = new Map<string, FileSystemDirectoryHandle>()
    keys.forEach((key, index) => {
      const handle = values[index]
      if (typeof key === 'string' && handle?.kind === 'directory') {
        roots.set(key, handle)
      }
    })
    return roots
  } catch {
    return new Map()
  }
}

export async function putRoot(
  rootURL: string,
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  try {
    await withStore('readwrite', store => store.put(handle, rootURL))
  } catch {
    // The handle still works for this page.
  }
}

export async function deleteRoot(rootURL: string): Promise<void> {
  try {
    await withStore('readwrite', store => store.delete(rootURL))
  } catch {
    // Nothing to forget.
  }
}

// Whether the handle may be written to, asking the user when the browser
// forgot the grant (it does at every browser restart). Must run on a user
// gesture when it may ask.
async function ensureWritable(handle: FileSystemHandle): Promise<boolean> {
  const descriptor = { mode: 'readwrite' as const }
  if ((await handle.queryPermission(descriptor)) === 'granted') return true
  return (await handle.requestPermission(descriptor)) === 'granted'
}

async function walkToFile(
  root: FileSystemDirectoryHandle,
  segments: string[],
): Promise<FileSystemFileHandle> {
  let directory = root
  for (const segment of segments.slice(0, -1)) {
    directory = await directory.getDirectoryHandle(segment)
  }
  return directory.getFileHandle(segments[segments.length - 1])
}

export async function readFile(
  handle: FileSystemFileHandle,
): Promise<{ text: string; lastModified: number }> {
  const file = await handle.getFile()
  return { text: await file.text(), lastModified: file.lastModified }
}

export async function writeFile(
  handle: FileSystemFileHandle,
  text: string,
): Promise<void> {
  const writable = await handle.createWritable()
  try {
    await writable.write(text)
  } finally {
    await writable.close()
  }
}

export interface ResolveOptions {
  fileURL: string
  // The folders the picker may stand for, most specific first: the user is
  // asked to pick the first one that holds the file.
  candidateRootURLs: string[]
  // The file's text as read through its URL: a picked folder is only kept
  // when the same path under it reads the same, as handles have no path.
  currentText: string
  // Called before the picker opens, with the folder URL the user should pick.
  onPick?: (rootURL: string) => void
}

// The handle of the file to save, through a granted folder or one the user
// picks now. Throws PickerCancelledError, FolderMismatchError, or a DOMException
// such as NotAllowedError or SecurityError from the browser.
export async function resolveFileHandle(
  options: ResolveOptions,
): Promise<ResolvedFile> {
  const { fileURL, currentText } = options
  const roots = await listRoots()
  const knownRoot = pickRoot(fileURL, roots.keys())
  if (knownRoot) {
    const root = roots.get(knownRoot)
    const segments = getRelativeSegments(fileURL, knownRoot)
    try {
      if (await ensureWritable(root)) {
        return { handle: await walkToFile(root, segments), rootURL: knownRoot }
      }
    } catch (e) {
      // A moved or deleted folder: forget it and ask again.
      if (!(e instanceof DOMException && e.name === 'NotFoundError')) throw e
      await deleteRoot(knownRoot)
    }
  }

  const rootURL = options.candidateRootURLs.find(url =>
    getRelativeSegments(fileURL, url),
  )
  if (!rootURL) throw new FolderMismatchError(fileURL)
  options.onPick?.(rootURL)
  let picked: FileSystemDirectoryHandle
  try {
    picked = await window.showDirectoryPicker({
      id: 'md-reader-root',
      mode: 'readwrite',
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new PickerCancelledError()
    }
    throw e
  }
  const segments = getRelativeSegments(fileURL, rootURL)
  let handle: FileSystemFileHandle
  try {
    handle = await walkToFile(picked, segments)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'NotFoundError') {
      throw new FolderMismatchError(rootURL)
    }
    throw e
  }
  const { text } = await readFile(handle)
  if (normalize(text) !== normalize(currentText)) {
    throw new FolderMismatchError(rootURL)
  }
  await putRoot(rootURL, picked)
  return { handle, rootURL }
}

// The page reads files through fetch, which strips a BOM; File.text() keeps
// it. Line endings also don't tell two readings of one file apart.
function normalize(text: string): string {
  return text.replace(/^﻿/, '').replace(/\r\n?/g, '\n')
}
