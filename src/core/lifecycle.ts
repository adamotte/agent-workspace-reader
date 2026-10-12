import Ele, { type ElementType } from './ele'
import { HTML, BODY, HEAD, getAssetsURL } from '@/shared'
import { rootThemeDisabledPrefix } from '@/config/page-themes'

const htmlHeadTags = [
  {
    tag: 'meta',
    attrs: {
      name: 'referrer',
      content: 'no-referrer',
    },
  },
  // PNGs drawn for each size: the browser picks the one that matches the
  // screen's pixel density, where a scaled SVG blurs at 16 px.
  {
    tag: 'link',
    attrs: {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      href: getAssetsURL('images/icon-16.png'),
    },
  },
  {
    tag: 'link',
    attrs: {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: getAssetsURL('images/icon-32.png'),
    },
  },
]

let container: Ele<HTMLElement> = null
let showContainerRaw: boolean = true

export default {
  init(element: HTMLElement) {
    if (element) {
      container = new Ele<HTMLElement>(element)
      container.hide()
    }
    htmlHeadTags.forEach(el => HEAD.appendChild(new Ele(el.tag, el.attrs).ele))
    BODY.classList.add('md-reader')
  },
  mount(nodes: Array<ElementType | Ele>) {
    nodes.forEach(node => BODY.appendChild(Ele.from(node)))
  },
  toggleRaw(eles: Array<Ele>) {
    BODY.classList.toggle('md-reader')

    if (container) {
      container.toggle(showContainerRaw)
    }
    showContainerRaw = !showContainerRaw
    if (showContainerRaw) {
      delete HTML.dataset[rootThemeDisabledPrefix]
    } else {
      HTML.dataset[rootThemeDisabledPrefix] = ''
    }
    eles.forEach(ele => ele.toggle(showContainerRaw))
  },
}
