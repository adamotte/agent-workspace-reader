import localeJson from './locale.json'

/* Unmatched language (in locale.json file) default use the 'en'. */
const DEFAULT_LOCALE: string = 'en'

/* Exact match first ('fr-FR'), then the base language ('fr'), else 'en'.
 * Also maps a language saved by an older build (e.g. 'zh-CN') back to 'en'. */
function resolveLocale(locale: string = ''): string {
  const has = (key: string) =>
    Object.prototype.hasOwnProperty.call(localeJson, key)
  if (has(locale)) return locale
  const base = locale.split(/[-_]/)[0]
  return has(base) ? base : DEFAULT_LOCALE
}

/* The language of your browser Settings. */
const targetLocale = resolveLocale(chrome.i18n.getUILanguage())

interface Localize {
  (field: string): string
  locale: string
}

interface I18n {
  (locale?: string): Localize
  locales: string[]
}

const i18n: I18n = (locale: string = targetLocale): Localize => {
  locale = resolveLocale(locale)
  const defaultLocalizeMap: Object = localeJson[DEFAULT_LOCALE]
  const localizeMap: Object = localeJson[locale]

  const localize: Localize = (field: string): string => {
    /* Also includes fields (default 'en') */
    return localizeMap[field] || defaultLocalizeMap[field] || field
  }
  localize.locale = locale

  return localize
}

i18n.locales = Object.keys(localeJson)

export default i18n
