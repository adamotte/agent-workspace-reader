import test from 'node:test'
import assert from 'node:assert/strict'
import MarkdownIt from 'markdown-it'

const load = name => import(`../src/core/github/${name}.ts`)

test('strikethrough matches GitHub (single and double tildes)', async () => {
  const { default: Strike } = await load('strikethrough')
  const md = new MarkdownIt().use(Strike)
  const html = md.render(
    '~one~ ~~two~~ ~~~three~~~ ~a b~ ~x~~ H~2~O ~ spaced ~ a~~b~~c',
  )
  assert.equal(
    html.trim(),
    '<p><del>one</del> <del>two</del> ~~~three~~~ <del>a b</del> ~x~~ H<del>2</del>O ~ spaced ~ a<del>b</del>c</p>',
  )
})

test('raw HTML is filtered like GitHub', async () => {
  const { filterGithubHtml, emptyHtmlFilterReport } = await load('html-filter')
  const report = emptyHtmlFilterReport()
  const out = filterGithubHtml(
    '<div style="color:red" align="center" class="x" onclick="evil()"><span title="t">x</span></div>' +
      '<font color="red">f</font><a href="javascript:alert(1)">js</a><a href="https://ok.com" target="_blank">ok</a>' +
      '<img src="x.png" width="40" onerror="bad()"><script>alert(1)</script><details open><summary>S</summary></details>',
    report,
  )
  assert.equal(
    out,
    '<div align="center"><span title="t">x</span></div>' +
      'fjs</a><a href="https://ok.com">ok</a>' +
      '<img src="x.png" width="40">&lt;script>alert(1)&lt;/script><details open><summary>S</summary></details>',
  )
  assert.ok(
    report.removedAttrs >= 4 &&
      report.removedTags >= 1 &&
      report.escapedTags === 2,
  )
})

test('front matter renders as a GitHub-style table', async () => {
  const { splitFrontmatter, renderFrontmatterTable } = await load('frontmatter')
  const fm = splitFrontmatter(
    '---\ntitle: Front <b>\ntags: [a, b]\n---\n# Body\n',
  )
  assert.equal(fm.body, '# Body\n')
  assert.equal(
    renderFrontmatterTable(fm.yaml).trim(),
    '<table class="md-reader__gh-frontmatter"><thead><tr><th>title</th><th>tags</th></tr></thead>' +
      '<tbody><tr><td><div>Front &lt;b&gt;</div></td><td><table><tbody><tr><td><div>a</div></td><td><div>b</div></td></tr></tbody></table></td></tr></tbody></table>',
  )
  assert.match(renderFrontmatterTable('a: [unclosed'), /Error in user YAML/)
  assert.equal(splitFrontmatter('# no front matter'), null)
})

test('warnings are counted for the banner', async () => {
  const { inlineWarningOpen, blockWarning, renderWarningBanner } = await load(
    'warnings',
  )
  const env = {}
  inlineWarningOpen(env, 'mark')
  inlineWarningOpen(env, 'mark')
  blockWarning(env, 'graphviz')
  const banner = renderWarningBanner(env)
  assert.match(banner, /==highlight==.*\(2×\)/)
  assert.match(banner, /Graphviz/)
  assert.equal(renderWarningBanner({}), '')
})
