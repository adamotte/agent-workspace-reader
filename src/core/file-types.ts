export type FileKind =
  // rendered as Markdown
  | 'markdown'
  // plain text, rendered as Markdown like .txt files always were
  | 'text'
  // one highlighted code block
  | 'code'
  // CSV or TSV, rendered as a table
  | 'table'
  | 'image'
  | 'video'
  | 'audio'
  // HTML and PDF, which the browser shows itself
  | 'native'

export type FileIcon =
  | 'markdown'
  | 'text'
  | 'json'
  | 'config'
  | 'code'
  | 'table'
  | 'image'
  | 'video'
  | 'audio'
  | 'html'
  | 'pdf'

export interface FileType {
  kind: FileKind
  icon: FileIcon
  // highlight.js language of a code file
  language?: string
}

const MARKDOWN: FileType = { kind: 'markdown', icon: 'markdown' }
const TEXT: FileType = { kind: 'text', icon: 'text' }
const TABLE: FileType = { kind: 'table', icon: 'table' }
const IMAGE: FileType = { kind: 'image', icon: 'image' }
const VIDEO: FileType = { kind: 'video', icon: 'video' }
const AUDIO: FileType = { kind: 'audio', icon: 'audio' }

function code(language: string, icon: FileIcon = 'code'): FileType {
  return { kind: 'code', icon, language }
}

const TYPES_BY_EXTENSION: Record<string, FileType> = {
  md: MARKDOWN,
  mdx: MARKDOWN,
  mdc: MARKDOWN,
  mkd: MARKDOWN,
  markdown: MARKDOWN,
  txt: TEXT,
  log: code('plaintext', 'text'),
  json: code('json', 'json'),
  yaml: code('yaml', 'config'),
  yml: code('yaml', 'config'),
  toml: code('ini', 'config'),
  ini: code('ini', 'config'),
  cfg: code('ini', 'config'),
  conf: code('ini', 'config'),
  properties: code('properties', 'config'),
  xml: code('xml'),
  js: code('javascript'),
  mjs: code('javascript'),
  cjs: code('javascript'),
  ts: code('typescript'),
  css: code('css'),
  scss: code('scss'),
  less: code('less'),
  py: code('python'),
  sh: code('bash'),
  bash: code('bash'),
  ps1: code('powershell'),
  bat: code('dos'),
  cmd: code('dos'),
  sql: code('sql'),
  go: code('go'),
  rs: code('rust'),
  java: code('java'),
  c: code('c'),
  h: code('c'),
  cpp: code('cpp'),
  cs: code('csharp'),
  csv: TABLE,
  tsv: TABLE,
  png: IMAGE,
  jpg: IMAGE,
  jpeg: IMAGE,
  gif: IMAGE,
  webp: IMAGE,
  svg: IMAGE,
  avif: IMAGE,
  bmp: IMAGE,
  ico: IMAGE,
  mp4: VIDEO,
  webm: VIDEO,
  ogv: VIDEO,
  mp3: AUDIO,
  wav: AUDIO,
  ogg: AUDIO,
  oga: AUDIO,
  flac: AUDIO,
  m4a: AUDIO,
  opus: AUDIO,
  html: { kind: 'native', icon: 'html' },
  htm: { kind: 'native', icon: 'html' },
  pdf: { kind: 'native', icon: 'pdf' },
}

// Well-known extensionless files, by upper-case name.
const TYPES_BY_NAME: Record<string, FileType> = {
  AUTHORS: TEXT,
  CHANGELOG: TEXT,
  COPYING: TEXT,
  LICENCE: TEXT,
  LICENSE: TEXT,
  NOTICE: TEXT,
  README: TEXT,
  DOCKERFILE: code('dockerfile'),
  MAKEFILE: code('makefile'),
}

function own<T>(table: Record<string, T>, key: string): T | undefined {
  return Object.prototype.hasOwnProperty.call(table, key)
    ? table[key]
    : undefined
}

function getExtension(name: string): string | undefined {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : undefined
}

export function hasKnownExtension(name: string): boolean {
  const extension = getExtension(name)
  return extension !== undefined && !!own(TYPES_BY_EXTENSION, extension)
}

export function getFileType(path: string): FileType | undefined {
  const name = path.split('/').pop() || ''
  const extension = getExtension(name)
  return extension === undefined
    ? own(TYPES_BY_NAME, name.toUpperCase())
    : own(TYPES_BY_EXTENSION, extension)
}

// The name without the extension, which the file's icon already conveys.
export function getDisplayName(name: string): string {
  return hasKnownExtension(name) ? name.slice(0, name.lastIndexOf('.')) : name
}

// md-reader shows these files on the folder page: opened directly, the
// browser downloads some of them (CSV) and shows the others without
// md-reader (images, XML).
export function opensInViewer(type: FileType): boolean {
  return !['markdown', 'text', 'native'].includes(type.kind)
}
