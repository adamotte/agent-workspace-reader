export type FileKind = 'markdown' | 'text' | 'json' | 'yaml' | 'html' | 'pdf'

const KINDS_BY_EXTENSION: Record<string, FileKind> = {
  md: 'markdown',
  mdx: 'markdown',
  mdc: 'markdown',
  mkd: 'markdown',
  markdown: 'markdown',
  txt: 'text',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  html: 'html',
  htm: 'html',
  pdf: 'pdf',
}

// Extensionless files that read as plain text, such as a repository's LICENSE.
const TEXT_FILE_NAMES = new Set([
  'AUTHORS',
  'CHANGELOG',
  'COPYING',
  'LICENCE',
  'LICENSE',
  'NOTICE',
  'README',
])

// Files the browser displays itself; md-reader opens them in a new tab.
export const NATIVE_KINDS: ReadonlyArray<FileKind> = ['html', 'pdf']

// Files md-reader shows as one highlighted code block, by highlight.js language.
export const CODE_LANGUAGES: Readonly<Partial<Record<FileKind, string>>> = {
  json: 'json',
  yaml: 'yaml',
}

function getExtension(name: string): string | undefined {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : undefined
}

function getKindByExtension(extension: string): FileKind | undefined {
  return Object.prototype.hasOwnProperty.call(KINDS_BY_EXTENSION, extension)
    ? KINDS_BY_EXTENSION[extension]
    : undefined
}

export function hasKnownExtension(name: string): boolean {
  const extension = getExtension(name)
  return extension !== undefined && !!getKindByExtension(extension)
}

export function getFileKind(path: string): FileKind | undefined {
  const name = path.split('/').pop() || ''
  const extension = getExtension(name)
  if (extension === undefined) {
    return TEXT_FILE_NAMES.has(name.toUpperCase()) ? 'text' : undefined
  }
  return getKindByExtension(extension)
}

// The name without the extension, which the file's icon already conveys.
export function getDisplayName(name: string): string {
  return hasKnownExtension(name) ? name.slice(0, name.lastIndexOf('.')) : name
}
