import test from 'node:test'
import assert from 'node:assert/strict'

const {
  getViewerURL,
  getViewedFileURL,
  isURLWithinRoot,
  rebaseSrcset,
  rebaseURL,
} = await import('../src/core/view-url.ts')

test('names a file on the folder page of its own folder by default', () => {
  assert.equal(
    getViewerURL('file:///C:/notes/data.csv'),
    'file:///C:/notes/?view=data.csv',
  )
})

test('names a file under a folder by its path, keeping slashes', () => {
  const url = getViewerURL(
    'file:///C:/notes/sub%20dir/my%20note.md',
    'file:///C:/notes/',
  )
  assert.equal(url, 'file:///C:/notes/?view=sub%2520dir/my%2520note.md')
  assert.equal(getViewedFileURL(url), 'file:///C:/notes/sub%20dir/my%20note.md')
})

test('falls back to the file folder when the folder does not hold it', () => {
  assert.equal(
    getViewerURL('file:///C:/other/a.md', 'file:///C:/notes/'),
    'file:///C:/other/?view=a.md',
  )
})

test('round-trips names with reserved characters', () => {
  const file = 'file:///C:/notes/a%23b%3Fc&d=e.md'
  assert.equal(getViewedFileURL(getViewerURL(file)), file)
})

test('ignores the fragment of the folder page', () => {
  assert.equal(
    getViewedFileURL('file:///C:/notes/?view=sub/a.md#heading'),
    'file:///C:/notes/sub/a.md',
  )
})

test('only shows files under the folder', () => {
  const page = 'file:///C:/notes/sub/'
  assert.equal(getViewedFileURL(`${page}?view=../a.md`), undefined)
  assert.equal(getViewedFileURL(`${page}?view=%2e%2e/a.md`), undefined)
  assert.equal(getViewedFileURL(`${page}?view=/C:/a.md`), undefined)
  assert.equal(getViewedFileURL(`${page}?view=file:///C:/a.md`), undefined)
  assert.equal(getViewedFileURL(`${page}?view=deeper/`), undefined)
  assert.equal(getViewedFileURL(`${page}?view=a.md%3Fx`), undefined)
  assert.equal(getViewedFileURL(page), undefined)
})

test('tells whether a URL is under a root', () => {
  assert.equal(
    isURLWithinRoot('file:///C:/notes/sub/a.md', 'file:///C:/notes/'),
    true,
  )
  assert.equal(
    isURLWithinRoot('file:///C:/notes2/a.md', 'file:///C:/notes/'),
    false,
  )
})

test('rebases relative URLs on the file, leaving the rest', () => {
  const base = 'file:///C:/notes/sub/a.md'
  assert.equal(rebaseURL('img.png', base), 'file:///C:/notes/sub/img.png')
  assert.equal(rebaseURL('../b.md#x', base), 'file:///C:/notes/b.md#x')
  assert.equal(rebaseURL('?q', base), 'file:///C:/notes/sub/a.md?q')
  assert.equal(rebaseURL('#heading', base), '#heading')
  assert.equal(rebaseURL('', base), '')
  assert.equal(rebaseURL('https://example.com/', base), 'https://example.com/')
  assert.equal(rebaseURL('mailto:a@b.c', base), 'mailto:a@b.c')
  assert.equal(
    rebaseURL('data:image/png;base64,AA', base),
    'data:image/png;base64,AA',
  )
})

test('rebases each candidate of a srcset', () => {
  const base = 'file:///C:/notes/sub/a.md'
  assert.equal(
    rebaseSrcset('a.png 1x, b.png 2x', base),
    'file:///C:/notes/sub/a.png 1x, file:///C:/notes/sub/b.png 2x',
  )
  const inline = 'data:image/png;base64,A,A 1x'
  assert.equal(rebaseSrcset(inline, base), inline)
})
