import className from '@/config/class-name'
import { BLOCKED_SRC_ATTR, imagePlaceholderText } from '@/core/local-resources'

type Localize = (field: string) => string

// An image the page can't show, because its src was remote or its file is
// missing, becomes a small chip with its alt text, so that a badge still
// reads and a broken image doesn't vanish without a word.
export function showImageAlt(root: ParentNode, localize: Localize): void {
  root.querySelectorAll<HTMLImageElement>('img').forEach(img => {
    const blocked = img.getAttribute(BLOCKED_SRC_ATTR)
    if (blocked !== null) {
      replaceWithAlt(img, blocked, localize('image_remote'))
      return
    }
    if (!img.getAttribute('src')) {
      replaceWithAlt(img, '', localize('image_missing'))
      return
    }
    const missing = () =>
      replaceWithAlt(img, img.src, localize('image_missing'))
    // A failure the browser remembers from an earlier render fires no event.
    if (img.complete && img.naturalWidth === 0) missing()
    else img.addEventListener('error', missing, { once: true })
  })
}

function replaceWithAlt(img: HTMLImageElement, url: string, reason: string) {
  const chip = document.createElement('span')
  chip.className = className.IMAGE_ALT
  chip.textContent = imagePlaceholderText(img.alt, url)
  chip.title = url ? `${reason}: ${url}` : reason
  img.replaceWith(chip)
}
