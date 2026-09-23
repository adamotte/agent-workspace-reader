// GitHub-style heading slugs, so `#fragment` links written for GitHub (and most
// other renderers) resolve here: lowercase, drop punctuation and symbols, and
// turn each space into a hyphen. Letters, numbers, marks, `-` and `_` survive.
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
    .replace(/ /g, '-')
}

// The ids md-reader generated before GitHub-style slugs; still matched so
// existing links keep working.
export function legacySlug(text: string): string {
  return encodeURIComponent(text.trim().toLowerCase().replace(/\s+/g, '-'))
}

export function decodeHash(hash: string): string {
  const fragment = hash.replace(/^#/, '')
  try {
    return decodeURIComponent(fragment)
  } catch {
    return fragment
  }
}
