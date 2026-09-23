import type MarkdownIt from 'markdown-it'

// GitHub strikethrough: `~text~` or `~~text~~`. Opener and closer must be the
// same length, and runs of three or more tildes are left as text. Replaces
// markdown-it's built-in rule, which only accepts `~~`.
export default function GithubStrikethroughPlugin(md: MarkdownIt) {
  md.inline.ruler.at('strikethrough', tokenize)
  md.inline.ruler2.at('strikethrough', postProcessAll)
}

const TILDE = 0x7e

function tokenize(state, silent: boolean): boolean {
  const start = state.pos
  if (silent || state.src.charCodeAt(start) !== TILDE) return false

  const scanned = state.scanDelims(start, true)
  const run = '~'.repeat(scanned.length)
  const token = state.push('text', '', 0)
  token.content = run

  if (scanned.length <= 2) {
    state.delimiters.push({
      marker: TILDE,
      length: 0, // disable the emphasis "rule of 3"
      token: state.tokens.length - 1,
      end: -1,
      open: scanned.can_open,
      close: scanned.can_close,
    })
  }

  state.pos += scanned.length
  return true
}

function postProcess(state, delimiters) {
  for (const startDelim of delimiters) {
    if (startDelim.marker !== TILDE || startDelim.end === -1) continue
    const endDelim = delimiters[startDelim.end]
    const open = state.tokens[startDelim.token]
    const close = state.tokens[endDelim.token]
    if (open.content !== close.content) continue

    const markup = open.content
    Object.assign(open, {
      type: 's_open',
      tag: 'del',
      nesting: 1,
      markup,
      content: '',
    })
    Object.assign(close, {
      type: 's_close',
      tag: 'del',
      nesting: -1,
      markup,
      content: '',
    })
  }
}

function postProcessAll(state) {
  postProcess(state, state.delimiters)
  for (const meta of state.tokens_meta) {
    if (meta?.delimiters) postProcess(state, meta.delimiters)
  }
}
