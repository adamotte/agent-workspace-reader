import type MarkdownIt from 'markdown-it'
import GithubStrikethroughPlugin from './strikethrough'
import { emptyHtmlFilterReport, filterGithubHtml } from './html-filter'
import {
  blockWarning,
  inlineWarningOpen,
  recordWarning,
  type WarningKind,
} from './warnings'

const GRAPHVIZ_FENCES = new Set(['dot', 'graphviz', 'digraph'])
const MERMAID_ELK_RE =
  /(?:^|\n)\s*flowchart-elk\b|\blayout\s*:\s*['"]?elk\b|["']layout["']\s*:\s*["']elk/

// Makes markdown-it render the way GitHub does. Install after all other
// plugins: it wraps the fence, html and extension-syntax renderers.
export default function GithubCompatPlugin(md: MarkdownIt) {
  md.set({ typographer: false })
  md.use(GithubStrikethroughPlugin)
  restrictAutolinks(md)

  // Extension syntax GitHub lacks: show the literal markers, as GitHub
  // would, inside a warning marker.
  const markers: [string, string, WarningKind][] = [
    ['mark', '==', 'mark'],
    ['ins', '++', 'ins'],
    ['sup', '^', 'sup'],
  ]
  for (const [type, markup, kind] of markers) {
    md.renderer.rules[`${type}_open`] = (tokens, idx, options, env) =>
      `${inlineWarningOpen(env, kind)}${markup}`
    md.renderer.rules[`${type}_close`] = () => `${markup}</span>`
  }

  const paragraphOpen =
    md.renderer.rules.paragraph_open ??
    ((tokens, idx, options, env, self) =>
      self.renderToken(tokens, idx, options))
  md.renderer.rules.paragraph_open = (tokens, idx, options, env, self) => {
    const content =
      tokens[idx + 1]?.type === 'inline' ? tokens[idx + 1].content : ''
    let prefix = ''
    if (/^\s*\[\[toc\]\]\s*$/i.test(content)) prefix = blockWarning(env, 'toc')
    else if (/^:::/.test(content)) prefix = blockWarning(env, 'container')
    return prefix + paragraphOpen(tokens, idx, options, env, self)
  }

  for (const rule of ['html_block', 'html_inline'] as const) {
    md.renderer.rules[rule] = (tokens, idx, options, env) => {
      // markdown-it-task-lists emits its checkboxes as html tokens.
      if (
        tokens[idx].content.startsWith('<input class="task-list-item-checkbox"')
      ) {
        return tokens[idx].content
      }
      const report = emptyHtmlFilterReport()
      const html = filterGithubHtml(tokens[idx].content, report)
      if (report.removedTags || report.removedAttrs || report.escapedTags) {
        recordWarning(env, 'html')
      }
      return html
    }
  }

  // GitHub numbers footnote references without brackets.
  if (md.renderer.rules.footnote_caption) {
    md.renderer.rules.footnote_caption = (tokens, idx) =>
      String(tokens[idx].meta.id + 1)
  }

  const fence = md.renderer.rules.fence!.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const info = token.info.trim().split(/\s+/)[0].toLowerCase()
    if (GRAPHVIZ_FENCES.has(info)) {
      return (
        blockWarning(env, 'graphviz') + fence(tokens, idx, options, env, self)
      )
    }
    if (info === 'mermaid' && MERMAID_ELK_RE.test(token.content)) {
      return (
        blockWarning(env, 'mermaid-elk') +
        fence(tokens, idx, options, env, self)
      )
    }
    return fence(tokens, idx, options, env, self)
  }
}

// GitHub autolinks URLs with a scheme, `www.` hosts and email addresses, but
// not bare domains like `example.com`.
function restrictAutolinks(md: MarkdownIt) {
  const linkify = md.linkify
  const match = linkify.match.bind(linkify)
  // markdown-it iterates the result whenever test() passed, so return an
  // empty list (not null) when every match is filtered out.
  linkify.match = (text: string) =>
    match(text)?.filter(
      link => link.schema !== '' || /^www\./i.test(link.raw),
    ) ?? null
}

// ```math fences render as display math, as on GitHub.
export function MathFencePlugin(md: MarkdownIt) {
  const fence = md.renderer.rules.fence!.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const mathBlock = md.renderer.rules.math_block
    if (token.info.trim().toLowerCase() === 'math' && mathBlock) {
      return mathBlock(tokens, idx, options, env, self)
    }
    return fence(tokens, idx, options, env, self)
  }
}
