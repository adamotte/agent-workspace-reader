import { Compartment, EditorState, type Extension } from '@codemirror/state'
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands'
import {
  HighlightStyle,
  LanguageDescription,
  StreamLanguage,
  bracketMatching,
  syntaxHighlighting,
} from '@codemirror/language'
import { search, searchKeymap } from '@codemirror/search'
import { tags } from '@lezer/highlight'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { json } from '@codemirror/lang-json'
import { yaml, yamlFrontmatter } from '@codemirror/lang-yaml'
import { javascript } from '@codemirror/lang-javascript'
import { css } from '@codemirror/lang-css'
import { less } from '@codemirror/lang-less'
import { sass } from '@codemirror/lang-sass'
import { python } from '@codemirror/lang-python'
import { xml } from '@codemirror/lang-xml'
import { sql } from '@codemirror/lang-sql'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { rust } from '@codemirror/lang-rust'
import { go } from '@codemirror/lang-go'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { powerShell } from '@codemirror/legacy-modes/mode/powershell'
import { properties } from '@codemirror/legacy-modes/mode/properties'
import { toml } from '@codemirror/legacy-modes/mode/toml'
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile'
import { csharp } from '@codemirror/legacy-modes/mode/clike'

// The code editor of the edit mode: CodeMirror 6, with the languages the
// reader shows and a theme drawn from the page theme's CSS variables.

export interface EditorOptions {
  parent: HTMLElement
  doc: string
  // The highlight.js language of the file, 'markdown' for Markdown and text
  // files, or undefined for no highlighting
  language?: string
  dark: boolean
  onChange: (doc: string) => void
  // Ctrl+S / Cmd+S
  onSave: () => void
  // Escape, outside the search panel
  onEscape?: () => void
}

export interface Editor {
  view: EditorView
  getDoc(): string
  // Replaces the whole document, keeping the history and the cursor's line.
  setDoc(doc: string): void
  setTheme(dark: boolean): void
  focus(): void
  destroy(): void
}

// Fenced code blocks in Markdown highlight with these languages.
const CODE_LANGUAGES = [
  LanguageDescription.of({
    name: 'javascript',
    alias: ['js', 'ts', 'typescript', 'jsx', 'tsx'],
    load: async () => javascript({ typescript: true }),
  }),
  LanguageDescription.of({
    name: 'json',
    load: async () => json(),
  }),
  LanguageDescription.of({
    name: 'yaml',
    alias: ['yml'],
    load: async () => yaml(),
  }),
  LanguageDescription.of({
    name: 'python',
    alias: ['py'],
    load: async () => python(),
  }),
  LanguageDescription.of({
    name: 'bash',
    alias: ['sh', 'shell', 'zsh', 'console'],
    load: async () => StreamLanguage.define(shell),
  }),
  LanguageDescription.of({
    name: 'powershell',
    alias: ['ps1', 'pwsh'],
    load: async () => StreamLanguage.define(powerShell),
  }),
  LanguageDescription.of({
    name: 'sql',
    load: async () => sql(),
  }),
  LanguageDescription.of({
    name: 'css',
    load: async () => css(),
  }),
  LanguageDescription.of({
    name: 'xml',
    alias: ['html', 'svg'],
    load: async () => xml(),
  }),
  LanguageDescription.of({
    name: 'toml',
    load: async () => StreamLanguage.define(toml),
  }),
  LanguageDescription.of({
    name: 'go',
    load: async () => go(),
  }),
  LanguageDescription.of({
    name: 'rust',
    alias: ['rs'],
    load: async () => rust(),
  }),
  LanguageDescription.of({
    name: 'java',
    load: async () => java(),
  }),
  LanguageDescription.of({
    name: 'cpp',
    alias: ['c', 'c++', 'h'],
    load: async () => cpp(),
  }),
]

// By the highlight.js names of file-types.ts
const LANGUAGES: Record<string, () => Extension> = {
  markdown: () =>
    markdown({
      base: markdownLanguage,
      codeLanguages: CODE_LANGUAGES,
    }),
  json: () => json(),
  yaml: () => yamlFrontmatter({ content: yaml() }),
  javascript: () => javascript(),
  typescript: () => javascript({ typescript: true }),
  css: () => css(),
  less: () => less(),
  scss: () => sass(),
  python: () => python(),
  xml: () => xml(),
  sql: () => sql(),
  java: () => java(),
  c: () => cpp(),
  cpp: () => cpp(),
  rust: () => rust(),
  go: () => go(),
  bash: () => StreamLanguage.define(shell),
  powershell: () => StreamLanguage.define(powerShell),
  // Batch files have no mode; the shell one highlights comments and strings.
  dos: () => StreamLanguage.define(shell),
  ini: () => StreamLanguage.define(properties),
  properties: () => StreamLanguage.define(properties),
  toml: () => StreamLanguage.define(toml),
  dockerfile: () => StreamLanguage.define(dockerFile),
  makefile: () => StreamLanguage.define(shell),
  csharp: () => StreamLanguage.define(csharp),
}

function languageExtension(language?: string): Extension {
  const factory = language && LANGUAGES[language]
  return factory ? factory() : []
}

const WRAPPING_LANGUAGES = new Set(['markdown', 'plaintext', undefined])

// Colors come from the page theme (variable.less), so that the editor follows
// all of its themes.
function themeExtension(dark: boolean): Extension {
  const theme = EditorView.theme(
    {
      '&': {
        color: 'var(--color-text-primary)',
        backgroundColor: 'var(--color-bg)',
        height: '100%',
        fontSize: '14px',
      },
      '.cm-scroller': {
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        lineHeight: '1.6',
      },
      '.cm-content': {
        caretColor: 'var(--color-primary)',
        padding: '12px 0',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'var(--color-primary)',
      },
      '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
        {
          backgroundColor: 'var(--color-primary-alpha-10)',
        },
      '&.cm-focused .cm-selectionBackground': {
        backgroundColor:
          'color-mix(in srgb, var(--color-primary) 25%, transparent)',
      },
      '.cm-activeLine': {
        backgroundColor:
          'color-mix(in srgb, var(--color-text-primary) 5%, transparent)',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-gray)',
        borderRight: '1px solid var(--color-border)',
      },
      '.cm-activeLineGutter': {
        backgroundColor:
          'color-mix(in srgb, var(--color-text-primary) 5%, transparent)',
        color: 'var(--color-text-primary)',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 8px 0 12px',
        minWidth: '40px',
      },
      '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
        backgroundColor: 'var(--color-primary-alpha-10)',
        outline: '1px solid var(--color-primary)',
      },
      '.cm-searchMatch': {
        backgroundColor: 'var(--color-warning-alpha-10)',
        outline: '1px solid var(--color-warning)',
      },
      '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: 'var(--color-warning)',
        color: 'var(--color-bg)',
      },
      '.cm-panels': {
        backgroundColor: 'var(--color-side-bg, var(--color-bg))',
        color: 'var(--color-text-primary)',
        borderBottom: '1px solid var(--color-border)',
      },
      '.cm-panels.cm-panels-bottom': {
        borderTop: '1px solid var(--color-border)',
        borderBottom: 'none',
      },
      '.cm-panel input, .cm-panel button': {
        color: 'inherit',
        backgroundColor: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
        backgroundImage: 'none',
      },
      '.cm-panel button:hover': {
        backgroundColor: 'var(--color-primary-alpha-10)',
      },
      '.cm-tooltip': {
        backgroundColor: 'var(--color-side-bg, var(--color-bg))',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border)',
      },
    },
    { dark },
  )
  const highlight = HighlightStyle.define([
    { tag: tags.heading, color: 'var(--color-primary)', fontWeight: 'bold' },
    { tag: tags.strong, fontWeight: 'bold' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strikethrough, textDecoration: 'line-through' },
    { tag: tags.link, color: 'var(--color-primary)' },
    {
      tag: tags.url,
      color: 'var(--color-primary)',
      textDecoration: 'underline',
    },
    { tag: tags.monospace, color: 'var(--color-important)' },
    { tag: tags.quote, color: 'var(--color-text-secondary)' },
    { tag: tags.list, color: 'var(--color-primary)' },
    { tag: tags.contentSeparator, color: 'var(--color-text-gray)' },
    {
      tag: [tags.processingInstruction, tags.meta],
      color: 'var(--color-text-gray)',
    },
    {
      tag: [tags.comment, tags.lineComment, tags.blockComment],
      color: 'var(--color-text-gray)',
      fontStyle: 'italic',
    },
    {
      tag: [
        tags.keyword,
        tags.modifier,
        tags.operatorKeyword,
        tags.controlKeyword,
        tags.definitionKeyword,
        tags.moduleKeyword,
      ],
      color: 'var(--color-primary)',
    },
    {
      tag: [tags.string, tags.special(tags.string), tags.character],
      color: 'var(--color-success)',
    },
    {
      tag: [
        tags.number,
        tags.integer,
        tags.float,
        tags.bool,
        tags.null,
        tags.atom,
      ],
      color: 'var(--color-warning)',
    },
    { tag: [tags.regexp, tags.escape], color: 'var(--color-danger)' },
    {
      tag: [
        tags.function(tags.variableName),
        tags.function(tags.propertyName),
        tags.definition(tags.function(tags.variableName)),
      ],
      color: 'var(--color-important)',
    },
    {
      tag: [tags.typeName, tags.className, tags.namespace, tags.tagName],
      color: 'var(--color-important)',
    },
    {
      tag: [tags.propertyName, tags.attributeName, tags.labelName],
      color: 'var(--color-text-primary)',
    },
    {
      tag: [tags.definition(tags.variableName), tags.variableName],
      color: 'var(--color-text-primary)',
    },
    { tag: tags.operator, color: 'var(--color-text-secondary)' },
    {
      tag: [tags.punctuation, tags.bracket, tags.separator],
      color: 'var(--color-text-secondary)',
    },
    { tag: tags.invalid, color: 'var(--color-danger)' },
  ])
  return [theme, syntaxHighlighting(highlight)]
}

export function createEditor(options: EditorOptions): Editor {
  const language = new Compartment()
  const theme = new Compartment()
  const wrapping = WRAPPING_LANGUAGES.has(options.language)
    ? EditorView.lineWrapping
    : []
  const state = EditorState.create({
    doc: options.doc,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      drawSelection(),
      bracketMatching(),
      search({ top: true }),
      EditorView.contentAttributes.of({ spellcheck: 'true' }),
      keymap.of([
        {
          key: 'Mod-s',
          preventDefault: true,
          run: () => {
            options.onSave()
            return true
          },
        },
        {
          key: 'Escape',
          run: view => {
            // Lets the search panel close on its own Escape first.
            if (view.dom.querySelector('.cm-search')) return false
            options.onEscape?.()
            return Boolean(options.onEscape)
          },
        },
        indentWithTab,
        ...searchKeymap,
        ...historyKeymap,
        ...defaultKeymap,
      ]),
      language.of(languageExtension(options.language)),
      theme.of(themeExtension(options.dark)),
      wrapping,
      EditorView.updateListener.of(update => {
        if (update.docChanged) options.onChange(update.state.doc.toString())
      }),
    ],
  })
  const view = new EditorView({ state, parent: options.parent })

  return {
    view,
    getDoc: () => view.state.doc.toString(),
    setDoc(doc) {
      const current = view.state.doc
      if (current.toString() === doc) return
      const line = current.lineAt(view.state.selection.main.head).number
      view.dispatch({
        changes: { from: 0, to: current.length, insert: doc },
      })
      const target = view.state.doc.line(Math.min(line, view.state.doc.lines))
      view.dispatch({
        selection: { anchor: target.from },
        scrollIntoView: true,
      })
    },
    setTheme(dark) {
      view.dispatch({ effects: theme.reconfigure(themeExtension(dark)) })
    },
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  }
}
