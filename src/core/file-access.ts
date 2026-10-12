import {
  getAncestorFolderURLs,
  getRelativeFolderSegments,
  getRelativeSegments,
  pickRoot,
} from '@/core/file-path'

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
  // The folder the user is asked to pick, in order of preference: the first
  // one that holds the file. Any folder above the file is accepted though.
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
  const picked = await pickDirectory()
  // Which folder above the file was picked: the one under which the file's
  // relative path leads to the same text. Closest folders first, so that a
  // same-named file higher up can't pass for it.
  for (const folderURL of getAncestorFolderURLs(fileURL)) {
    const segments = getRelativeSegments(fileURL, folderURL)
    if (!segments) continue
    let handle: FileSystemFileHandle
    try {
      handle = await walkToFile(picked, segments)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'NotFoundError') continue
      if (e instanceof DOMException && e.name === 'TypeMismatchError') continue
      throw e
    }
    const { text } = await readFile(handle)
    if (normalize(text) !== normalize(currentText)) continue
    await putRoot(folderURL, picked)
    return { handle, rootURL: folderURL }
  }
  throw new FolderMismatchError(rootURL)
}

// The page reads files through fetch, which strips a BOM; File.text() keeps
// it. Line endings also don't tell two readings of one file apart.
function normalize(text: string): string {
  return text.replace(/^﻿/, '').replace(/\r\n?/g, '\n')
}

export interface FolderEntryName {
  name: string
  isDirectory: boolean
}

// How many of the folder's entries a picked folder must show to pass for it
const CHECKED_ENTRIES = 8

async function pickDirectory(): Promise<FileSystemDirectoryHandle> {
  try {
    return await window.showDirectoryPicker({
      id: 'md-reader-root',
      mode: 'readwrite',
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new PickerCancelledError()
    }
    throw e
  }
}

async function walkToDirectory(
  root: FileSystemDirectoryHandle,
  segments: string[],
): Promise<FileSystemDirectoryHandle> {
  let directory = root
  for (const segment of segments) {
    directory = await directory.getDirectoryHandle(segment)
  }
  return directory
}

// Whether the handle holds the entries the browser lists for the folder
async function holdsEntries(
  directory: FileSystemDirectoryHandle,
  entries: FolderEntryName[],
  expectedName: string,
): Promise<boolean> {
  if (!entries.length) return directory.name === expectedName
  for (const entry of entries.slice(0, CHECKED_ENTRIES)) {
    try {
      if (entry.isDirectory) {
        await directory.getDirectoryHandle(entry.name)
      } else {
        await directory.getFileHandle(entry.name)
      }
    } catch {
      return false
    }
  }
  return true
}

// Grants a folder from its own page, before any file is edited: the user
// picks the folder, or one above it, and the handle is kept for its URL.
// Throws PickerCancelledError or FolderMismatchError.
export async function grantFolder(
  folderURL: string,
  entries: FolderEntryName[],
): Promise<string> {
  const picked = await pickDirectory()
  const expectedName = decodeURIComponent(
    folderURL.replace(/\/$/, '').split('/').pop() || '',
  )
  for (const ancestorURL of getAncestorFolderURLs(folderURL)) {
    const segments = getRelativeFolderSegments(folderURL, ancestorURL)
    if (!segments) continue
    let directory: FileSystemDirectoryHandle
    try {
      directory = await walkToDirectory(picked, segments)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'NotFoundError') continue
      if (e instanceof DOMException && e.name === 'TypeMismatchError') continue
      throw e
    }
    if (await holdsEntries(directory, entries, expectedName)) {
      await putRoot(ancestorURL, picked)
      return ancestorURL
    }
  }
  throw new FolderMismatchError(folderURL)
}
