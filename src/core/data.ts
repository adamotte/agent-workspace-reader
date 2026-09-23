import MD_PLUGINS from '@/config/md-plugins'
import PAGE_THEMES from '@/config/page-themes'
import i18n from '@/config/i18n'
import {
  MERMAID_LAYOUTS,
  MERMAID_LOOKS,
  type MermaidLayout,
  type MermaidLook,
} from '@/config/mermaid-options'

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
}

export function getDefaultData(mergeData: Data = {}): Data {
  return {
    enable: true,
    refresh: false,
    centered: true,
    githubCompat: true,
    hiddenSide: false,
    language: i18n().locale,
    mdPlugins: [...MD_PLUGINS],
    pageTheme: PAGE_THEMES[0],
    mermaidLook: MERMAID_LOOKS[0],
    mermaidLayout: MERMAID_LAYOUTS[0],
    ...mergeData,
  }
}
