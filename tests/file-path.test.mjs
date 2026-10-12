import test from 'node:test'
import assert from 'node:assert/strict'

const {
  getAncestorFolderURLs,
  getRelativeFolderSegments,
  getRelativeSegments,
  pickRoot,
  detectEOL,
  applyEOL,
  hasChangedOnDisk,
} = await import('../src/core/file-path.ts')

test('splits the decoded path of a file under its root', () => {
  assert.deepEqual(
    getRelativeSegments(
      'file:///C:/notes/sub%20dir/caf%C3%A9.md',
      'file:///C:/notes/',
    ),
    ['sub dir', 'café.md'],
  )
})

test('rejects a file outside the root, a folder and unwalkable segments', () => {
  assert.equal(
    getRelativeSegments('file:///C:/other/a.md', 'file:///C:/notes/'),
    undefined,
  )
  assert.equal(
    getRelativeSegments('file:///C:/notes/sub/', 'file:///C:/notes/'),
    undefined,
  )
  assert.equal(
    getRelativeSegments('file:///C:/notes/', 'file:///C:/notes/'),
    undefined,
  )
  assert.equal(
    getRelativeSegments('file:///C:/notes/a//b.md', 'file:///C:/notes/'),
    undefined,
  )
  assert.equal(
    getRelativeSegments('file:///C:/notes/a.md', 'file:///C:/notes'),
    undefined,
  )
})

test('picks the most specific root holding the file', () => {
  const roots = ['file:///C:/notes/', 'file:///C:/notes/agents/', 'file:///D:/']
  assert.equal(
    pickRoot('file:///C:/notes/agents/plan.md', roots),
    'file:///C:/notes/agents/',
  )
  assert.equal(
    pickRoot('file:///C:/notes/readme.md', roots),
    'file:///C:/notes/',
  )
  assert.equal(pickRoot('file:///E:/x.md', roots), undefined)
})

test('detects and restores line endings', () => {
  assert.equal(detectEOL('a\r\nb\r\n'), '\r\n')
  assert.equal(detectEOL('a\nb\n'), '\n')
  assert.equal(detectEOL('no breaks'), '\n')
  assert.equal(detectEOL('\nleading'), '\n')
  assert.equal(applyEOL('a\nb\r\nc', '\r\n'), 'a\r\nb\r\nc')
  assert.equal(applyEOL('a\r\nb', '\n'), 'a\nb')
})

test('reports a change on disk from the text, not the line endings', () => {
  assert.equal(hasChangedOnDisk('a\nb', 'a\r\nb'), false)
  assert.equal(hasChangedOnDisk('a\nb', 'a\nb\n'), true)
  assert.equal(hasChangedOnDisk('a', 'b'), true)
})

test('lists the folders above a file, closest first', () => {
  assert.deepEqual(
    getAncestorFolderURLs('file:///C:/WORKSPACE/notes/plan.md?view=x#h'),
    ['file:///C:/WORKSPACE/notes/', 'file:///C:/WORKSPACE/', 'file:///C:/'],
  )
  assert.deepEqual(getAncestorFolderURLs('file:///a.md'), ['file:///'])
})

test('lists a folder itself first among its ancestors', () => {
  assert.deepEqual(getAncestorFolderURLs('file:///C:/WORKSPACE/notes/'), [
    'file:///C:/WORKSPACE/notes/',
    'file:///C:/WORKSPACE/',
    'file:///C:/',
  ])
})

test('walks from an ancestor down to a folder', () => {
  assert.deepEqual(
    getRelativeFolderSegments('file:///C:/WORKSPACE/notes/', 'file:///C:/'),
    ['WORKSPACE', 'notes'],
  )
  assert.deepEqual(
    getRelativeFolderSegments('file:///C:/WORKSPACE/', 'file:///C:/WORKSPACE/'),
    [],
  )
  assert.equal(
    getRelativeFolderSegments('file:///D:/x/', 'file:///C:/WORKSPACE/'),
    undefined,
  )
})
