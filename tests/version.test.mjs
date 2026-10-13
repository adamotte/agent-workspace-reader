import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatVersion, buildVersion } from '../build/version.js'

test('names the version after the UTC day and the short hash', () => {
  assert.deepEqual(formatVersion(new Date('2026-10-03T23:30:00Z'), '4a6cac3'), {
    version: '2026.10.3',
    versionName: '2026.10.03-4a6cac3',
  })
})

test('keeps Chrome version parts free of leading zeros', () => {
  const { version } = formatVersion(new Date('2026-01-05T00:00:00Z'), 'x')
  assert.equal(version, '2026.1.5')
})

test('builds the version from the last commit', () => {
  const { version, versionName } = buildVersion()
  assert.match(version, /^\d{4}\.\d{1,2}\.\d{1,2}$/)
  assert.match(versionName, /^\d{4}\.\d{2}\.\d{2}-[0-9a-f]{7}$/)
})
