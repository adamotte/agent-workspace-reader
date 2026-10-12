import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'
import mSub from 'markdown-it-sub'
import mSup from 'markdown-it-sup'
import mIns from 'markdown-it-ins'
import mAbbr from 'markdown-it-abbr'
import mMark from 'markdown-it-mark'
import mEmoji from 'markdown-it-emoji'
import mDeflist from 'markdown-it-deflist'
import mFootnote from 'markdown-it-footnote'
import mTaskLists from 'markdown-it-task-lists'
import mToc from 'markdown-it-table-of-contents'
import mKatex from '@traptitech/markdown-it-katex'
import mMermaid from '@/core/mermaid'
import mAlert from '@/plugins/alert'
import mGraphvizBlock from '@/plugins/graphviz-block'
import mWikiLink from '@/plugins/wiki-link'
import mMultimdTable from 'markdown-it-multimd-table'
import MD_PLUGINS from '@/config/md-plugins'
import { isDarkTheme } from '@/config/page-themes'
import successIcon from '@/images/icon_success.svg'
import copyIcon from '@/images/icon_copy.svg'
import className from '@/config/class-name'
import Ele, { svg } from './ele'
import { escapeHtml } from 'markdown-it/lib/common/utils.mjs'
import GithubCompatPlugin, { MathFencePlugin } from '@/core/github/compat'
import {
  renderFrontmatterTable,
  splitFrontmatter,
} from '@/core/github/frontmatter'
import { renderWarningBanner, type WarningEnv } from '@/core/github/warnings'

type Plugins = { [p: string]: ((a: MdOptions) => any[]) | any[] }
const PLUGINS: Plugins = {
  Emoji: [mEmoji],
  Sub: [mSub],
  Sup: [mSup],
  Ins: [mIns],
  Abbr: [mAbbr],
  Katex: [mKatex],
  Mermaid: ({ theme, mermaidLook, mermaidLayout, githubCompat }) => [
    mMermaid,
    {
      theme: isDarkTheme(theme) ? 'dark' : 'default',
      // GitHub renders Mermaid with its classic look and dagre layout.
      look: githubCompat ? 'classic' : mermaidLook,
      layout: githubCompat ? 'dagre' : mermaidLayout,
    },
  ],
  Mark: [mMark],
  Deflist: [mDeflist],
  Footnote: [mFootnote],
  TaskLists: [mTaskLists],
  TOC: [mToc],
  Alert: ({ githubCompat }) => [mAlert, { github: githubCompat }],
}

export interface MdOptions {
  [key: string]: any
  config?: MarkdownIt.Options
  plugins?: Array<string>
  githubCompat?: boolean
}

// Plugins whose syntax GitHub doesn't support and that GitHub-compatible mode
// leaves unparsed, so the source shows as GitHub would show it. (`~x~` is
// strikethrough on GitHub, not subscript.) Sup, Ins and Mark stay installed so
// their syntax can be flagged; see GithubCompatPlugin.
const GITHUB_UNSUPPORTED_PLUGINS = ['Sub', 'Abbr', 'Deflist', 'TOC']

function initRender(options: MdOptions) {
  const {
    config = {},
    plugins = [...MD_PLUGINS],
    githubCompat = false,
  } = options
  const copyButton = new Ele<HTMLElement>(
    'button',
    {
      className: [className.MD_BUTTON, className.COPY_BTN],
      title: 'Copy',
    },
    [
      svg(copyIcon, { className: 'icon-copy' }),
      svg(successIcon, { className: 'icon-success' }),
    ],
  )

  const md = new MarkdownIt({
    html: true,
    breaks: false,
    linkify: true,
    xhtmlOut: true,
    typographer: !githubCompat,
    highlight(str: string, language: string) {
      if (language && hljs.getLanguage(language)) {
        try {
          return `<pre class="hljs-pre md-reader__code-block"><code class="hljs" lang="${language}">${
            hljs.highlight(str, { language, ignoreIllegals: true }).value
          }</code>${copyButton.ele.outerHTML}</pre>`
        } catch (err) {
          console.error(err)
          return 'parse error'
        }
      }
      const code = escapeHtml(str)
      return `<pre class="hljs-pre md-reader__code-block"><code class="hljs ${language}">${code}</code>${copyButton.ele.outerHTML}</pre>`
    },
    ...config,
  })

  // parse email
  md.linkify.set({ fuzzyEmail: true })
  // builtin plugins; GitHub only has plain GFM tables
  if (!githubCompat) md.use(mMultimdTable)
  // wiki links stay on in GitHub mode: they drive local vault navigation
  md.use(mWikiLink)

  // custom plugins
  plugins.forEach(name => {
    if (githubCompat && GITHUB_UNSUPPORTED_PLUGINS.includes(name)) return
    let plugin = PLUGINS[name]
    if (typeof plugin === 'function') {
      plugin = plugin(options)
    }
    plugin && md.use(plugin[0], ...plugin.slice(1))
  })

  if (plugins.includes('Mermaid') && !githubCompat) {
    // Install after diagram plugins so Graphviz can override Mermaid fences when
    // the block content is actually DOT syntax. GitHub doesn't render DOT.
    md.use(mGraphvizBlock)
  }

  md.use(MathFencePlugin)
  if (githubCompat) md.use(GithubCompatPlugin)

  return md
}

// identify & filter frontmatter
function removeFrontmatter(content: string): string {
  const frontmatterRegex = /^---[\s\S]+?---\n/
  return content.replace(frontmatterRegex, '')
}

// Allow tags/attributes used by markdown-it plugins (KaTeX, Mermaid, alerts, etc.)
const PURIFY_CONFIG: DOMPurify.Config = {
  ADD_TAGS: [
    'semantics',
    'annotation',
    'mrow',
    'mi',
    'mo',
    'mn',
    'ms',
    'mtext',
    'mfrac',
    'msqrt',
    'mroot',
    'msub',
    'msup',
    'msubsup',
    'munder',
    'mover',
    'munderover',
    'mtable',
    'mtr',
    'mtd',
    'mspace',
    'mpadded',
    'menclose',
    'mglyph',
    'math',
    'svg',
    'g',
    'path',
    'rect',
    'circle',
    'line',
    'polyline',
    'polygon',
    'text',
    'tspan',
    'defs',
    'marker',
    'foreignObject',
    'use',
    'clipPath',
    'linearGradient',
    'radialGradient',
    'stop',
    'pattern',
    'mask',
    'image',
    'switch',
    'desc',
    'title',
    'symbol',
  ],
  ADD_ATTR: [
    'style',
    'mathvariant',
    'encoding',
    'xmlns',
    'overflow',
    'lspace',
    'rspace',
    'stretchy',
    'fence',
    'separator',
    'accent',
    'accentunder',
    'columnalign',
    'rowalign',
    'columnspacing',
    'rowspacing',
    'columnlines',
    'rowlines',
    'frame',
    'framespacing',
    'displaystyle',
    'scriptlevel',
    'linethickness',
    'notation',
    'viewBox',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-dasharray',
    'stroke-linecap',
    'stroke-linejoin',
    'transform',
    'd',
    'cx',
    'cy',
    'r',
    'rx',
    'ry',
    'x',
    'y',
    'x1',
    'y1',
    'x2',
    'y2',
    'points',
    'marker-end',
    'marker-start',
    'marker-mid',
    'text-anchor',
    'dominant-baseline',
    'font-size',
    'font-family',
    'font-weight',
    'clip-path',
    'opacity',
    'lang',
    'width',
    'height',
    'xmlns:xlink',
    'xlink:href',
    'aria-hidden',
    'aria-label',
    'role',
    'focusable',
    'tabindex',
  ],
  ALLOW_DATA_ATTR: true,
  ALLOW_ARIA_ATTR: true,
  // DOMPurify's default URI allow-list plus file:, which wiki links resolve to
  // when a local vault is browsed. markdown-it still rejects file: in plain links.
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix|file):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  // Mermaid flowchart labels are HTML inside <foreignObject>; DOMPurify drops
  // HTML under SVG unless the parent is listed as an integration point.
  HTML_INTEGRATION_POINTS: { 'annotation-xml': true, foreignobject: true },
}

interface MdRender {
  (code: string, options: MdOptions): string
  md?: MarkdownIt
  githubCompat?: boolean
}
export const mdRender: MdRender = (code, options): string => {
  if (!mdRender.md || options) {
    mdRender.md = initRender(options ?? {})
    mdRender.githubCompat = !!options?.githubCompat
  }
  const env: WarningEnv & {
    wikiLinkSourceURL?: string
    wikiLinkRootURL?: string
  } = {
    wikiLinkSourceURL: options?.wikiLinkSourceURL,
    wikiLinkRootURL: options?.wikiLinkRootURL,
  }
  let prefix = ''
  let body: string
  if (mdRender.githubCompat) {
    // GitHub shows front matter as a table rather than hiding it.
    const frontmatter = splitFrontmatter(code)
    body = frontmatter ? frontmatter.body : code
    prefix = frontmatter ? renderFrontmatterTable(frontmatter.yaml) : ''
  } else {
    body = removeFrontmatter(code)
  }
  const rawHtml = mdRender.md.render(body, env)
  const banner = mdRender.githubCompat ? renderWarningBanner(env) : ''
  return DOMPurify.sanitize(banner + prefix + rawHtml, PURIFY_CONFIG)
}

export default initRender
