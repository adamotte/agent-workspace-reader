import className from '@/config/class-name'
import type i18n from '@/config/i18n'
import {
  DELIMITERS,
  detectDelimiter,
  parseDelimited,
  type Delimiter,
} from '@/core/csv'

type Localize = ReturnType<typeof i18n>
export type DelimiterChoice = Delimiter | 'auto'

// Rows beyond this stay out of the page to keep it responsive.
const MAX_TABLE_ROWS = 5000
const DELIMITER_KEYS: Record<Delimiter, string> = {
  ',': 'table_separator_comma',
  ';': 'table_separator_semicolon',
  '\t': 'table_separator_tab',
  '|': 'table_separator_pipe',
}
const NUMBER = /^[-+]?(\d[\d\s]*)?[.,]?\d+([eE][-+]?\d+)?\s*%?$/

function format(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match)
}

export function renderTable(
  container: HTMLElement,
  text: string,
  choice: DelimiterChoice,
  localize: Localize,
  onChoice: (choice: DelimiterChoice) => void,
) {
  const detected = detectDelimiter(text)
  const rows = parseDelimited(text, choice === 'auto' ? detected : choice)
  const columns = Math.max(0, ...rows.map(row => row.length))
  const number = (value: number) => value.toLocaleString(localize.locale)

  const select = document.createElement('select')
  const options: DelimiterChoice[] = ['auto', ...DELIMITERS]
  for (const value of options) {
    const option = document.createElement('option')
    option.value = value
    option.textContent =
      value === 'auto'
        ? format(localize('table_separator_auto'), {
            detected: localize(DELIMITER_KEYS[detected]),
          })
        : localize(DELIMITER_KEYS[value])
    select.append(option)
  }
  select.value = choice
  select.addEventListener('change', () =>
    onChoice(select.value as DelimiterChoice),
  )
  const label = document.createElement('label')
  label.append(`${localize('table_separator')} `, select)

  const size = document.createElement('span')
  size.textContent = format(localize('table_size'), {
    rows: number(Math.max(0, rows.length - 1)),
    columns: number(columns),
  })
  const toolbar = document.createElement('div')
  toolbar.className = className.TABLE_TOOLBAR
  toolbar.append(label, size)

  const table = document.createElement('table')
  const [header = [], ...body] = rows
  const head = table.createTHead().insertRow()
  for (let i = 0; i < columns; i++) {
    const cell = document.createElement('th')
    cell.textContent = header[i] ?? ''
    head.append(cell)
  }
  const tbody = table.createTBody()
  for (const row of body.slice(0, MAX_TABLE_ROWS)) {
    const tr = tbody.insertRow()
    for (let i = 0; i < columns; i++) {
      const cell = tr.insertCell()
      const value = row[i] ?? ''
      cell.textContent = value
      if (NUMBER.test(value)) cell.className = className.TABLE_NUMBER
    }
  }
  const wrap = document.createElement('div')
  wrap.className = className.TABLE_WRAP
  wrap.append(table)

  container.replaceChildren(toolbar, wrap)
  if (body.length > MAX_TABLE_ROWS) {
    const note = document.createElement('p')
    note.className = className.VIEWER_STATUS
    note.textContent = format(localize('table_truncated'), {
      shown: number(MAX_TABLE_ROWS),
      total: number(body.length),
    })
    container.append(note)
  }
}

export function renderMedia(
  container: HTMLElement,
  url: string,
  kind: 'image' | 'video' | 'audio',
  name: string,
) {
  let media: HTMLImageElement | HTMLMediaElement
  if (kind === 'image') {
    media = new Image()
    media.alt = name
  } else {
    media = document.createElement(kind)
    media.controls = true
    media.preload = 'metadata'
  }
  media.src = url
  const caption = document.createElement('figcaption')
  caption.textContent = name
  const figure = document.createElement('figure')
  figure.className = className.MEDIA
  figure.append(media, caption)
  container.replaceChildren(figure)
}

export function renderStatus(
  container: HTMLElement,
  message: string,
  error = false,
) {
  const status = document.createElement('p')
  status.className = className.VIEWER_STATUS
  status.classList.toggle(className.VIEWER_ERROR, error)
  status.textContent = message
  container.replaceChildren(status)
}
