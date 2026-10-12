import test from 'node:test'
import assert from 'node:assert/strict'

const { isLocalURL, isLocalSrcset, isLocalCSS, isLocalAttribute } =
  await import('../src/core/local-resources.ts')

const base = 'file:///C:/Notes/doc.md'

test('accepts files on this computer and inline data', () => {
  assert.equal(isLocalURL('img/a.png', base), true)
  assert.equal(isLocalURL('../a.png', base), true)
  assert.equal(isLocalURL('file:///C:/Images/a.png', base), true)
  assert.equal(isLocalURL('file://localhost/C:/a.png', base), true)
  assert.equal(isLocalURL('#marker', base), true)
  assert.equal(isLocalURL('data:image/png;base64,AAAA', base), true)
})

test('refuses other hosts, including Windows shares', () => {
  assert.equal(isLocalURL('https://example.com/a.png', base), false)
  assert.equal(isLocalURL('http://example.com/a.png', base), false)
  assert.equal(isLocalURL('//example.com/a.png', base), false)
  assert.equal(isLocalURL('file://server/share/a.png', base), false)
  assert.equal(isLocalURL('\\\\server\\share\\a.png', base), false)
  assert.equal(isLocalURL('https:', base), false)
})

test('checks every srcset candidate', () => {
  assert.equal(isLocalSrcset('a.png 1x, b.png 2x', base), true)
  assert.equal(isLocalSrcset('data:image/png;base64,AAAA 1x', base), true)
  assert.equal(
    isLocalSrcset('a.png 1x, https://example.com/b.png 2x', base),
    false,
  )
})

test('refuses CSS that fetches from another host', () => {
  assert.equal(isLocalCSS('color: red; width: 10px', base), true)
  assert.equal(isLocalCSS('background: url(img/a.png)', base), true)
  assert.equal(isLocalCSS('marker-end: url(#arrow)', base), true)
  assert.equal(
    isLocalCSS('background: url("https://example.com/a.png")', base),
    false,
  )
  assert.equal(
    isLocalCSS("background: URL( 'https://example.com/a.png' )", base),
    false,
  )
  assert.equal(isLocalCSS('background: url(//example.com/a.png)', base), false)
  assert.equal(isLocalCSS('@import "https://example.com/a.css";', base), false)
  assert.equal(
    isLocalCSS('background: image-set("https://example.com/a.png" 1x)', base),
    false,
  )
})

test('decodes CSS escapes before looking for url( and @import', () => {
  assert.equal(
    isLocalCSS('background: \\75 rl(https://example.com/a.png)', base),
    false,
  )
  assert.equal(
    isLocalCSS('background: u\\72l(https://example.com/a.png)', base),
    false,
  )
  assert.equal(
    isLocalCSS('@\\69mport "https://example.com/a.css";', base),
    false,
  )
  assert.equal(
    isLocalCSS('background: url("https\\3a //example.com/a.png")', base),
    false,
  )
})

test('refuses a url( it cannot read', () => {
  assert.equal(
    isLocalCSS('background: url(/**/"https://example.com/a.png")', base),
    false,
  )
})

test('keeps links but drops remote resources', () => {
  assert.equal(isLocalAttribute('a', 'href', 'https://example.com', base), true)
  assert.equal(
    isLocalAttribute('img', 'src', 'https://example.com/a.png', base),
    false,
  )
  assert.equal(isLocalAttribute('img', 'src', './a.png', base), true)
  assert.equal(
    isLocalAttribute('image', 'xlink:href', 'https://example.com/a.png', base),
    false,
  )
  assert.equal(isLocalAttribute('use', 'href', '#shape', base), true)
  assert.equal(
    isLocalAttribute('td', 'background', 'https://example.com/a.png', base),
    false,
  )
  assert.equal(
    isLocalAttribute('rect', 'fill', 'url(https://example.com/p.svg#g)', base),
    false,
  )
  assert.equal(isLocalAttribute('span', 'style', 'color: red', base), true)
  assert.equal(isLocalAttribute('img', 'alt', 'C:\\Notes\\a.png', base), true)
})
