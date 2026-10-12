export const DELIMITERS = [',', ';', '\t', '|'] as const
export type Delimiter = typeof DELIMITERS[number]

// Parses delimiter-separated values as RFC 4180 does: double quotes wrap
// fields that hold delimiters or line breaks, and "" escapes a quote.
export function parseDelimited(
  text: string,
  delimiter: string,
  maxRows: number = Infinity,
): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0

  const endRow = () => {
    row.push(field)
    rows.push(row)
    row = []
    field = ''
  }

  for (; i < text.length && rows.length < maxRows; i++) {
    const char = text[i]
    if (quoted) {
      if (char !== '"') field += char
      else if (text[i + 1] === '"') field += text[++i]
      else quoted = false
    } else if (char === '"' && field === '') {
      quoted = true
    } else if (char === delimiter) {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      endRow()
    } else {
      field += char
    }
  }
  // A last line without a line break
  if (rows.length < maxRows && (field !== '' || row.length)) endRow()
  return rows
}

// Picks the delimiter that splits the first rows into the same number of
// columns most often, preferring more columns on a tie.
export function detectDelimiter(text: string): Delimiter {
  const sample = text.slice(0, 64 * 1024)
  let best: Delimiter = ','
  let bestRatio = 0
  let bestColumns = 1
  for (const delimiter of DELIMITERS) {
    const rows = parseDelimited(sample, delimiter, 21)
    // The sample may cut the last row short.
    if (rows.length > 1 && sample.length < text.length) rows.pop()
    const columns = rows[0]?.length ?? 0
    if (columns < 2) continue
    const ratio =
      rows.filter(row => row.length === columns).length / rows.length
    if (ratio > bestRatio || (ratio === bestRatio && columns > bestColumns)) {
      best = delimiter
      bestRatio = ratio
      bestColumns = columns
    }
  }
  return best
}
