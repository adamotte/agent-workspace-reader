import test from 'node:test'
import assert from 'node:assert/strict'

const {
  getFileKind,
  getDisplayName,
  hasKnownExtension,
  CODE_LANGUAGES,
  NATIVE_KINDS,
} = await import('../src/core/file-types.ts')

test('classifies files by extension, case-insensitively', () => {
  assert.equal(getFileKind('note.md'), 'markdown')
  assert.equal(getFileKind('dir/Note.MARKDOWN'), 'markdown')
  assert.equal(getFileKind('todo.txt'), 'text')
  assert.equal(getFileKind('data.json'), 'json')
  assert.equal(getFileKind('conf.yml'), 'yaml')
  assert.equal(getFileKind('conf.YAML'), 'yaml')
  assert.equal(getFileKind('page.htm'), 'html')
  assert.equal(getFileKind('doc.pdf'), 'pdf')
  assert.equal(getFileKind('data.csv'), undefined)
  assert.equal(getFileKind('a.constructor'), undefined)
})

test('lists well-known extensionless text files only', () => {
  assert.equal(getFileKind('LICENSE'), 'text')
  assert.equal(getFileKind('repo/License'), 'text')
  assert.equal(getFileKind('Makefile'), undefined)
  assert.equal(getFileKind('.gitignore'), undefined)
})

test('drops only extensions the icon conveys', () => {
  assert.equal(getDisplayName('note-a.md'), 'note-a')
  assert.equal(getDisplayName('v1.2 notes.md'), 'v1.2 notes')
  assert.equal(getDisplayName('doc.pdf'), 'doc')
  assert.equal(getDisplayName('LICENSE'), 'LICENSE')
  assert.equal(getDisplayName('archive.tar.gz'), 'archive.tar.gz')
  assert.equal(hasKnownExtension('README'), false)
})

test('maps code and native kinds', () => {
  assert.equal(CODE_LANGUAGES.json, 'json')
  assert.equal(CODE_LANGUAGES.yaml, 'yaml')
  assert.equal(CODE_LANGUAGES.markdown, undefined)
  assert.deepEqual([...NATIVE_KINDS].sort(), ['html', 'pdf'])
})
