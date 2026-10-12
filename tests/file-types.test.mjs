import test from 'node:test'
import assert from 'node:assert/strict'

const { getFileType, getDisplayName, hasKnownExtension, opensInViewer } =
  await import('../src/core/file-types.ts')

const kind = name => getFileType(name)?.kind

test('classifies files by extension, case-insensitively', () => {
  assert.equal(kind('note.md'), 'markdown')
  assert.equal(kind('dir/Note.MARKDOWN'), 'markdown')
  assert.equal(kind('todo.txt'), 'text')
  assert.deepEqual(getFileType('data.json'), {
    kind: 'code',
    icon: 'json',
    language: 'json',
  })
  assert.equal(getFileType('conf.YML').language, 'yaml')
  assert.equal(getFileType('app.ts').language, 'typescript')
  assert.equal(getFileType('feed.xml').language, 'xml')
  assert.equal(kind('data.csv'), 'table')
  assert.equal(kind('data.tsv'), 'table')
  assert.equal(kind('photo.JPG'), 'image')
  assert.equal(kind('clip.webm'), 'video')
  assert.equal(kind('song.mp3'), 'audio')
  assert.equal(kind('page.htm'), 'native')
  assert.equal(kind('doc.pdf'), 'native')
  assert.equal(kind('archive.zip'), undefined)
  assert.equal(kind('a.constructor'), undefined)
})

test('lists well-known extensionless files only', () => {
  assert.equal(kind('LICENSE'), 'text')
  assert.equal(kind('repo/License'), 'text')
  assert.equal(getFileType('Dockerfile').language, 'dockerfile')
  assert.equal(kind('Procfile'), undefined)
  assert.equal(kind('.gitignore'), undefined)
})

test('drops only extensions the icon conveys', () => {
  assert.equal(getDisplayName('note-a.md'), 'note-a')
  assert.equal(getDisplayName('v1.2 notes.md'), 'v1.2 notes')
  assert.equal(getDisplayName('data.csv'), 'data')
  assert.equal(getDisplayName('LICENSE'), 'LICENSE')
  assert.equal(getDisplayName('archive.tar.gz'), 'archive.tar.gz')
  assert.equal(hasKnownExtension('README'), false)
})

test('routes files the browser cannot show with md-reader to the viewer', () => {
  for (const name of ['data.csv', 'app.ts', 'feed.xml', 'a.png', 'a.mp4']) {
    assert.equal(opensInViewer(getFileType(name)), true, name)
  }
  for (const name of ['note.md', 'todo.txt', 'LICENSE', 'doc.pdf']) {
    assert.equal(opensInViewer(getFileType(name)), false, name)
  }
})
