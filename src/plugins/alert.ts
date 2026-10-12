import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import { alert } from '@mdit/plugin-alert'
import mContainer from 'markdown-it-container'

// GitHub mode: only GitHub's own alerts (> [!NOTE] etc.), top level only.
export default function AlertPlugin(
  md: MarkdownIt,
  { github = false }: { github?: boolean } = {},
) {
  if (github) {
    md.use(alert, { deep: false })
    return
  }
  const customContainers = [
    [alert, { deep: true }],
    [
      mContainer,
      'note',
      {
        render(tokens: Token[], idx: number) {
          return tokens[idx].nesting === 1
            ? '<blockquote class="info">\n'
            : '</blockquote>\n'
        },
      },
    ],
    [
      mContainer,
      'info',
      {
        render(tokens: Token[], idx: number) {
          return tokens[idx].nesting === 1
            ? '<blockquote class="info">\n'
            : '</blockquote>\n'
        },
      },
    ],
    [
      mContainer,
      'tips',
      {
        render(tokens: Token[], idx: number) {
          return tokens[idx].nesting === 1
            ? '<blockquote class="tip">\n'
            : '</blockquote>\n'
        },
      },
    ],
    [
      mContainer,
      'tip',
      {
        render(tokens: Token[], idx: number) {
          return tokens[idx].nesting === 1
            ? '<blockquote class="tip">\n'
            : '</blockquote>\n'
        },
      },
    ],
    [
      mContainer,
      'success',
      {
        render(tokens: Token[], idx: number) {
          return tokens[idx].nesting === 1
            ? '<blockquote class="success">\n'
            : '</blockquote>\n'
        },
      },
    ],
    [
      mContainer,
      'warning',
      {
        render(tokens: Token[], idx: number) {
          return tokens[idx].nesting === 1
            ? '<blockquote class="warning">\n'
            : '</blockquote>\n'
        },
      },
    ],
    [
      mContainer,
      'danger',
      {
        render(tokens: Token[], idx: number) {
          return tokens[idx].nesting === 1
            ? '<blockquote class="danger">\n'
            : '</blockquote>\n'
        },
      },
    ],
  ]
  customContainers.forEach(p => {
    md.use(p[0], ...p.slice(1))
  })
}
