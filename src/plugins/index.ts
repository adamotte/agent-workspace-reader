import imageViewerPlugin from './img-viewer'
import blockCopyPlugin from './block-copy'
import graphvizRendererPlugin from './graphviz-renderer'
import mermaidRendererPlugin from './mermaid-renderer'
import tableColumnsPlugin from './table-columns'
import { usePlugin } from '@/core/plugin'
export { initPlugins } from '@/core/plugin'

usePlugin([
  blockCopyPlugin,
  imageViewerPlugin,
  graphvizRendererPlugin,
  mermaidRendererPlugin,
  tableColumnsPlugin,
])
