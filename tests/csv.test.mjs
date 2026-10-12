import test from 'node:test'
import assert from 'node:assert/strict'

const { parseDelimited, detectDelimiter } = await import('../src/core/csv.ts')

test('parses quoted fields, escaped quotes and embedded line breaks', () => {
  const text = '﻿name,quote\r\n"Smith, J.","He said ""hi""\nthen left"\n'
  assert.deepEqual(parseDelimited(text, ','), [
    ['name', 'quote'],
    ['Smith, J.', 'He said "hi"\nthen left'],
  ])
})

test('keeps empty fields and a last line without a line break', () => {
  assert.deepEqual(parseDelimited('a;;c\n1;2;', ';'), [
    ['a', '', 'c'],
    ['1', '2', ''],
  ])
})

test('stops after the requested number of rows', () => {
  assert.equal(parseDelimited('1\n2\n3\n4', ',', 2).length, 2)
})

test('detects the delimiter', () => {
  assert.equal(detectDelimiter('a,b,c\n1,2,3\n'), ',')
  // French Excel export: semicolons, decimal commas
  assert.equal(
    detectDelimiter('nom;prix;qté\npomme;1,5;3\npoire;2,25;4\n'),
    ';',
  )
  assert.equal(detectDelimiter('a\tb\n"x, y"\t2\n'), '\t')
  assert.equal(detectDelimiter('a|b|c\n1|2|3\n'), '|')
  // A single column falls back to commas
  assert.equal(detectDelimiter('alone\nvalues\n'), ',')
})
