import test from 'node:test'
import assert from 'node:assert/strict'
import MarkdownIt from 'markdown-it'

const loadMermaid = () => import('../src/core/mermaid.ts')

test('renders mermaid fences as escaped placeholders', async () => {
  const { default: MermaidPlugin } = await loadMermaid()
  const md = new MarkdownIt().use(MermaidPlugin, { theme: 'dark' })

  const html = md.render('```mermaid\ngraph TD\n  A["a < b"] --> B\n```')

  assert.match(html, /class="mermaid md-reader__mermaid"/)
  assert.match(html, /data-mermaid-theme="dark"/)
  assert.match(html, /data-mermaid-status="pending"/)
  assert.match(html, /A\[&quot;a &lt; b&quot;\]/)
  assert.doesNotMatch(html, /<b"/)
})

test('leaves other fences to the default renderer', async () => {
  const { default: MermaidPlugin } = await loadMermaid()
  const md = new MarkdownIt().use(MermaidPlugin)

  const html = md.render('```js\nconst a = 1\n```')

  assert.doesNotMatch(html, /md-reader__mermaid/)
  assert.match(html, /language-js/)
})

test('defaults to the light mermaid theme', async () => {
  const { renderMermaidPlaceholder } = await loadMermaid()

  assert.match(
    renderMermaidPlaceholder('graph TD'),
    /data-mermaid-theme="default"/,
  )
})

test('carries the page-wide look and layout onto placeholders', async () => {
  const { default: MermaidPlugin, renderMermaidPlaceholder } =
    await loadMermaid()
  const md = new MarkdownIt().use(MermaidPlugin, { look: 'neo', layout: 'elk' })

  const html = md.render('```mermaid\ngraph TD\n  A --> B\n```')

  assert.match(html, /data-mermaid-look="neo"/)
  assert.match(html, /data-mermaid-layout="elk"/)
  assert.match(
    renderMermaidPlaceholder('graph TD'),
    /data-mermaid-look="classic" data-mermaid-layout="dagre"/,
  )
  assert.doesNotMatch(
    renderMermaidPlaceholder('graph TD', { look: '"><script>' }),
    /<script>/,
  )
})
