export type Theme = 'light' | 'dark' | 'tokyo-midnight' | 'monokai-pro' | 'auto'

export const rootThemePrefix = 'mdReaderTheme'
export const rootThemeDisabledPrefix = 'mdReaderThemeSchemeDisabled'

export const darkThemes: ReadonlySet<string> = new Set(['dark', 'tokyo-midnight', 'monokai-pro'])

export function isDarkTheme(theme: Exclude<Theme, 'auto'>): boolean {
  return darkThemes.has(theme)
}

export default <Theme[]>['light', 'dark', 'tokyo-midnight', 'monokai-pro', 'auto']
