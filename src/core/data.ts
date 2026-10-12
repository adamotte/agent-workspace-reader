import MD_PLUGINS from '@/config/md-plugins'
import PAGE_THEMES from '@/config/page-themes'
import i18n from '@/config/i18n'
import {
  MERMAID_LAYOUTS,
  MERMAID_LOOKS,
  type MermaidLayout,
  type MermaidLook,
} from '@/config/mermaid-options'

export const FOLDER_SORT_ORDERS = [
  'name-asc',
  'name-desc',
  'modified-desc',
  'modified-asc',
] as const

export type FolderSortOrder = typeof FOLDER_SORT_ORDERS[number]

export interface Data {
  enable?: boolean
  refresh?: boolean
  language?: string
  centered?: boolean
  githubCompat?: boolean
  mdPlugins?: typeof MD_PLUGINS
  pageTheme?: typeof PAGE_THEMES[0]
  mermaidLook?: MermaidLook
  mermaidLayout?: MermaidLayout
  hiddenSide?: boolean
  outlineExpanded?: boolean
  showExtensions?: boolean
  sideWidth?: number
  folderPaneRatio?: number
  folderRootPath?: string
  folderSortOrder?: FolderSortOrder
  // The edit mode: off until the user turns it on
  editing?: boolean
  // The rendered preview beside the editor in edit mode
  editorPreview?: boolean
  // The folders the user granted writing to, for the popup to show; the
  // handles themselves live in IndexedDB on the file: origin
  writeRoots?: string[]
}

export function getDefaultData(mergeData: Data = {}): Data {
  return {
    enable: true,
    refresh: true,
    centered: true,
    githubCompat: true,
    hiddenSide: false,
    outlineExpanded: false,
    showExtensions: true,
    sideWidth: 260,
    folderPaneRatio: 0.42,
    folderRootPath: '',
    folderSortOrder: 'name-asc',
    editing: false,
    editorPreview: true,
    writeRoots: [],
    language: i18n().locale,
    mdPlugins: [...MD_PLUGINS],
    pageTheme: PAGE_THEMES[0],
    mermaidLook: MERMAID_LOOKS[0],
    mermaidLayout: MERMAID_LAYOUTS[0],
    ...mergeData,
  }
}
