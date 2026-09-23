import test from 'node:test'
import assert from 'node:assert/strict'

const loadSlug = () => import('../src/core/slug.ts')

test('matches GitHub heading slugs', async () => {
  const { slugify } = await loadSlug()

  assert.equal(
    slugify('What we know, and what has to be measured'),
    'what-we-know-and-what-has-to-be-measured',
  )
  assert.equal(slugify('TL;DR'), 'tldr')
  assert.equal(slugify('Rejected / not feasible'), 'rejected--not-feasible')
  assert.equal(
    slugify('A note on “upstream” and “downstream”'),
    'a-note-on-upstream-and-downstream',
  )
  assert.equal(slugify('snake_case & kebab-case'), 'snake_case--kebab-case')
  assert.equal(slugify('Überblick über 2026'), 'überblick-über-2026')
})

test('decodes percent-encoded fragments', async () => {
  const { decodeHash } = await loadSlug()

  assert.equal(decodeHash('#%C3%BCberblick'), 'überblick')
  assert.equal(decodeHash('#bad%E0'), 'bad%E0')
  assert.equal(decodeHash(''), '')
})

test('keeps the legacy id format for old links', async () => {
  const { legacySlug } = await loadSlug()

  assert.equal(
    legacySlug('What we know, and what has to be measured'),
    'what-we-know%2C-and-what-has-to-be-measured',
  )
})
