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
}

export function getDefaultData(mergeData: Data = {}): Data {
  return {
    enable: true,
    refresh: false,
    centered: true,
    githubCompat: true,
    hiddenSide: false,
    outlineExpanded: false,
    showExtensions: false,
    sideWidth: 260,
    folderPaneRatio: 0.42,
    folderRootPath: '',
    folderSortOrder: 'name-desc',
    language: i18n().locale,
    mdPlugins: [...MD_PLUGINS],
    pageTheme: PAGE_THEMES[0],
    mermaidLook: MERMAID_LOOKS[0],
    mermaidLayout: MERMAID_LAYOUTS[0],
    ...mergeData,
  }
}
