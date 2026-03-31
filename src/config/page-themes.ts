export type Theme =
  | 'light' | 'dark'
  | 'tokyo-midnight' | 'monokai-pro'
  | 'dracula' | 'nord'
  | 'solarized-dark' | 'solarized-light'
  | 'one-dark' | 'catppuccin-mocha'
  | 'rose-pine' | 'gruvbox-dark'
  | 'auto'

export const rootThemePrefix = 'mdReaderTheme'
export const rootThemeDisabledPrefix = 'mdReaderThemeSchemeDisabled'

export const darkThemes: ReadonlySet<string> = new Set([
  'dark', 'tokyo-midnight', 'monokai-pro', 'dracula', 'nord',
  'solarized-dark', 'one-dark', 'catppuccin-mocha', 'rose-pine', 'gruvbox-dark',
])

export function isDarkTheme(theme: Exclude<Theme, 'auto'>): boolean {
  return darkThemes.has(theme)
}

export default <Theme[]>[
  'light', 'dark',
  'dracula', 'nord', 'one-dark',
  'catppuccin-mocha', 'rose-pine', 'gruvbox-dark',
  'tokyo-midnight', 'monokai-pro',
  'solarized-dark', 'solarized-light',
  'auto',
]
