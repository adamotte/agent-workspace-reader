import throttle from 'lodash.throttle'
import Event from '@/core/event'
import storage from '@/core/storage'
import Ele, { svg } from '@/core/ele'
import { initPlugins } from '@/plugins'
import lifecycle from '@/core/lifecycle'
import className from '@/config/class-name'
import i18n from '@/config/i18n'
import type { Theme } from '@/config/page-themes'
import { getDefaultData, type Data } from '@/core/data'
import { mdRender, type MdOptions } from '@/core/markdown'
import { createIcon } from '@/core/file-icons'
import {
  getFileType,
  opensInViewer,
  type FileKind,
  type FileType,
} from '@/core/file-types'
import { decodeHash, legacySlug, slugify } from '@/core/slug'
import { resolveWikiLink, resolveWikiLinks } from '@/core/wiki-link'
import { showImageAlt } from '@/core/image-alt'
import {
  rebaseRelativeURLs,
  renderMedia,
  renderStatus,
  renderTable,
  type DelimiterChoice,
} from '@/core/viewer'
import {
  fetchLocalText,
  getDirectoryName,
  isSameLocalURL,
  isLocalDirectoryPage,
  normalizeFolderRootURL,
  renderFolderBrowser,
  type FolderBrowser,
} from '@/core/folder'
import {
  getParentDirectoryURL,
  getViewedFileURL,
  getViewerURL,
  isURLWithinRoot,
} from '@/core/view-url'
import {
  getHeads,
  getRawContainer,
  setTheme,
  CONTENT_TYPES,
  darkMediaQuery,
  getMediaQueryTheme,
  toTheme,
} from '@/shared'
import codeIcon from '@/images/icon_code.svg'
import sideIcon from '@/images/icon_side.svg'
import goTopIcon from '@/images/icon_go_top.svg'
import '@/style/index.less'

function main(data: Data) {
  const configData = getDefaultData(data)
  const localize = i18n(configData.language)
  const directoryPage = isLocalDirectoryPage()
  // The folder itself on a folder page, which may carry a ?view= query
  const pageFolderURL = getParentDirectoryURL(window.location.href)
  const viewedURL = directoryPage
    ? getViewedFileURL(window.location.href)
    : undefined
  const viewedType = viewedURL && getFileType(viewedURL)
  let delimiter: DelimiterChoice = 'auto'
  // A folder page can show any file under it, and switch files in place;
  // see getViewerURL and openFile.
  let viewedFileURL: string | undefined
  let fileURL: string
  let fileName: string
  let fileType: FileType | undefined
  setFile(viewedType ? viewedURL : undefined)
  const localPage = window.location.protocol === 'file:'
  const configuredRootURL = normalizeFolderRootURL(configData.folderRootPath)
  const useConfiguredRoot = Boolean(
    configuredRootURL &&
      isURLWithinRoot(window.location.href, configuredRootURL),
  )
  const rootURL = useConfiguredRoot ? configuredRootURL : pageFolderURL
  const directoryHTML = directoryPage
    ? document.documentElement.outerHTML
    : null
  const actions = {
    reload() {
      window.location.reload()
    },
    updateMdPlugins() {
      reloading = true
      if (mdRaw) {
        contentRender(mdRaw)
        renderSide()
      } else {
        window.location.reload()
      }
      reloading = false
    },
    updatePageTheme(theme: Theme, prevTheme: Theme) {
      setTheme(theme)
      renderContentByTheme(theme, prevTheme)
    },
    toggleRefresh(value) {
      clearTimeout(pollingTimer)
      value && polling()
    },
    toggleCentered(value) {
      mdContent.classList.toggle('centered', value)
    },
    toggleSide() {
      onToggleSide()
    },
    toggleExtensions(value) {
      document.body.classList.toggle(className.SHOW_EXTENSIONS, value)
    },
  }
  chrome.runtime.onMessage.addListener(({ action, data: { key, value } }) => {
    const oldValue = configData[key]
    configData[key] = value
    actions[action]?.(value, oldValue)
  })

  if (viewedType?.kind === 'native') {
    window.location.replace(viewedURL)
    return
  }
  if (
    !configData.enable ||
    !(
      directoryPage ||
      CONTENT_TYPES.includes(document.contentType) ||
      // Code and tables that the browser shows as plain text
      (['code', 'table'].includes(fileType?.kind) &&
        document.body?.querySelector('pre'))
    )
  ) {
    reveal()
    return
  }

  let pollingTimer: number = null
  // Counts files shown, so that a slow read can't replace a later file
  let showing = 0
  let reloading: boolean = false
  let mdRaw: string = null
  let isSideHover: boolean = false
  let globalEvent: Event = new Event()

  initPlugins({ event: globalEvent })

  /* init md page */
  setTheme(configData.pageTheme)
  document.body.classList.toggle(
    className.SIDE_COLLAPSED,
    configData.hiddenSide,
  )
  document.body.classList.toggle(
    className.SHOW_EXTENSIONS,
    configData.showExtensions,
  )

  // A folder page has no raw text of its own; this holds the shown file's.
  const rawContainer = directoryPage ? createRawContainer() : getRawContainer()
  if (directoryPage) {
    document.body.replaceChildren(rawContainer)
  }
  lifecycle.init(rawContainer)
  mdRaw = viewedFileURL
    ? ''
    : directoryPage
    ? getFolderIndex()
    : rawContainer?.textContent

  /* render content */
  const mdContent = new Ele<HTMLElement>('article', {
    className: `${className.MD_CONTENT} ${
      configData.centered ? 'centered' : ''
    }`,
  })

  const mdRenderer =
    (target: HTMLElement | Ele) =>
    (code: string = '', options?: MdOptions) => {
      const ele = target instanceof Ele ? target.ele : target
      const kind = fileType?.kind
      if (kind === 'table') {
        renderTable(ele, code, delimiter, localize, choice => {
          delimiter = choice
          contentRender(mdRaw)
        })
      } else if (isMedia(kind)) {
        // Re-rendering would restart a playing video.
        if (!ele.querySelector(`.${className.MEDIA}`)) {
          renderMedia(ele, fileURL, kind, fileName)
        }
      } else {
        const source =
          kind === 'code' ? toCodeFence(code, fileType.language) : code
        const html = mdRender(source, {
          theme: toTheme(configData.pageTheme),
          plugins: configData.mdPlugins,
          githubCompat: configData.githubCompat,
          mermaidLook: configData.mermaidLook,
          mermaidLayout: configData.mermaidLayout,
          wikiLinkSourceURL: fileURL,
          wikiLinkRootURL: useConfiguredRoot ? configuredRootURL : undefined,
          localize,
          ...options,
        })
        if (viewedFileURL) {
          // Parsed in an inert template, so that nothing loads from the
          // page's folder before the URLs point at the file's.
          const template = document.createElement('template')
          template.innerHTML = html
          rebaseRelativeURLs(template.content, fileURL)
          ele.replaceChildren(template.content)
        } else {
          target.innerHTML = html
        }
        showImageAlt(ele, localize)
        if (useConfiguredRoot && configuredRootURL) {
          void resolveWikiLinks(ele, configuredRootURL, localize, fileURL)
        }
      }
      document.title =
        ele.querySelector('h1')?.textContent.trim() ??
        (fileType && fileType.kind !== 'markdown' ? fileName : '')
      globalEvent.emit('contentRendered', ele)
    }
  const contentRender = mdRenderer(mdContent)
  // A file shown on a folder page is read once the page is set up; see
  // showFile.
  if (!viewedFileURL) {
    contentRender(mdRaw)
  } else if (!isMedia(fileType.kind)) {
    renderStatus(mdContent.ele, localize('viewer_loading'))
  }

  mdContent.on(
    'click',
    async e => {
      const clicked = e.target as HTMLElement
      const unresolvedLink = clicked.closest<HTMLAnchorElement>(
        `a.${className.WIKI_LINK}[data-wiki-unresolved="true"]`,
      )
      if (unresolvedLink && useConfiguredRoot && configuredRootURL) {
        e.preventDefault()
        const resolved = await resolveWikiLink(
          unresolvedLink,
          configuredRootURL,
          localize,
          fileURL,
        )
        if (resolved) openFile(resolved)
        return
      }
      // Opened directly, the browser would download a CSV file or show an
      // image without md-reader. Other files can open in a new tab as they
      // are.
      const link = clicked.closest<HTMLAnchorElement>('a[href]')
      const linkType =
        link?.protocol === 'file:' && !link.target && getFileType(link.pathname)
      if (
        linkType &&
        linkType.kind !== 'native' &&
        (opensInViewer(linkType) || !isModifiedClick(e))
      ) {
        e.preventDefault()
        openFile(link.href)
        return
      }
      globalEvent.emit('click', e.target)
    },
    true,
  )

  const mdBody = new Ele<HTMLElement>(
    'main',
    { className: className.MD_BODY },
    mdContent,
  )

  /* render side */
  const mdOutline = new Ele<HTMLElement>('ul', {
    className: className.MD_OUTLINE,
    id: OUTLINE_ID,
  })
  const mdSide = new Ele<HTMLElement>('aside', {
    className: className.MD_SIDE,
  })
  let folderView: FolderBrowser | undefined
  if (localPage) {
    const folderBrowser = new Ele<HTMLElement>('nav', {
      className: className.FOLDER_BROWSER,
    })
    const folderResizer = new Ele<HTMLElement>('div', {
      className: className.FOLDER_RESIZER,
      role: 'separator',
      tabindex: '0',
      title: localize('folder_resize_title'),
      'aria-label': localize('folder_resize'),
      'aria-orientation': 'horizontal',
    })
    mdSide.append([folderBrowser, folderResizer])
    setupFolderPaneResize(
      mdSide.ele,
      folderBrowser.ele,
      folderResizer.ele,
      configData.folderPaneRatio,
      ratio => {
        configData.folderPaneRatio = ratio
        void storage.set('folderPaneRatio', ratio)
      },
    )
    folderView = renderFolderBrowser({
      container: folderBrowser.ele,
      rootURL,
      currentURL: fileURL,
      initialHTML:
        directoryPage && isSameLocalURL(rootURL, window.location.href)
          ? directoryHTML
          : undefined,
      showParentLink: !useConfiguredRoot,
      sortOrder: configData.folderSortOrder,
      onSortOrderChange: sortOrder => {
        configData.folderSortOrder = sortOrder
        void storage.set('folderSortOrder', sortOrder)
      },
      localize,
    })
    folderBrowser.on('click', (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>(
        'a[data-file-url]',
      )
      if (!link || link.target || isModifiedClick(e)) return
      e.preventDefault()
      openFile(link.dataset.fileUrl)
    })
  }

  /* render outline toggle */
  const outlineLabel = new Ele<HTMLElement>('span')
  outlineLabel.textContent = localize('outline')
  const outlineCount = new Ele<HTMLElement>('span', {
    className: className.OUTLINE_COUNT,
  })
  const outlineToggle = new Ele<HTMLElement>(
    'button',
    {
      className: className.OUTLINE_TOGGLE,
      type: 'button',
      title: localize('outline_toggle'),
      'aria-controls': OUTLINE_ID,
    },
    [
      createIcon('chevron', className.OUTLINE_CHEVRON),
      outlineLabel,
      outlineCount,
    ],
  )
  outlineToggle.on('click', () => {
    configData.outlineExpanded = !configData.outlineExpanded
    applyOutlineExpanded()
    void storage.set('outlineExpanded', configData.outlineExpanded)
  })
  mdSide.append([outlineToggle, mdOutline])
  const sideResizer = new Ele<HTMLElement>('div', {
    className: className.SIDE_RESIZER,
    role: 'separator',
    tabindex: '0',
    title: localize('side_resize_title'),
    'aria-label': localize('side_resize'),
    'aria-orientation': 'vertical',
  })
  mdSide.append(sideResizer)
  setupSideWidthResize(sideResizer.ele, configData.sideWidth, width => {
    configData.sideWidth = width
    void storage.set('sideWidth', width)
  })
  let idCache: { [content: string]: number } = Object.create(null)
  let headElements: HTMLElement[] = []
  let sideLiElements: HTMLElement[] = []
  let df: Ele<DocumentFragment> = null
  let targetIndex: number = null
  mdSide.on('mouseenter', () => {
    isSideHover = true
  })
  mdSide.on('mouseleave', () => {
    isSideHover = false
  })

  renderSide()
  applyOutlineExpanded()
  document.addEventListener('scroll', throttle(onScroll, 100))

  /* render raw toggle button */
  const rawToggleBtn = new Ele<HTMLElement>(
    'button',
    {
      className: [className.MD_BUTTON, className.CODE_TOGGLE_BTN],
      title: localize('title_toggle-raw'),
    },
    svg(codeIcon),
  )
  rawToggleBtn.on('click', () => {
    lifecycle.toggleRaw([mdBody, mdSide])
  })
  rawToggleBtn.toggle(Boolean(viewedFileURL) || !directoryPage)

  /* render side expand button */
  const sideExpandBtn = new Ele<HTMLElement>(
    'button',
    {
      className: [className.MD_BUTTON, className.SIDE_EXPAND_BTN],
      title: localize('title_expand-side'),
    },
    svg(sideIcon),
  )
  sideExpandBtn.on('click', () => {
    chrome.runtime.sendMessage({
      action: 'storage',
      data: {
        key: 'hiddenSide',
        value: !configData.hiddenSide,
      },
    })
  })
  function onToggleSide() {
    if (window.innerWidth <= 960) {
      const value = document.body.classList.toggle(className.SIDE_EXPANDED)
      mdBody.off('click', foldSide, true)
      window.removeEventListener('resize', foldSide)
      document.removeEventListener('keydown', foldSide)
      if (value) {
        setTimeout(() => {
          mdBody.on('click', foldSide, { capture: true, once: true })
          window.addEventListener('resize', foldSide, { once: true })
          document.addEventListener('keydown', foldSide, { once: true })
        }, 0)
      }
    } else {
      configData.hiddenSide = document.body.classList.toggle(
        className.SIDE_COLLAPSED,
      )
    }
  }
  function foldSide(e: UIEvent) {
    if (e.type === 'keydown' && (e as KeyboardEvent).code !== 'Escape') {
      return
    }
    document.body.classList.remove(className.SIDE_EXPANDED)
    mdBody.off('click', foldSide, true)
    window.removeEventListener('resize', foldSide)
    document.removeEventListener('keydown', foldSide)
    e.stopPropagation()
    e.preventDefault()
    return false
  }
  /* render go top button */
  const goTopBtn = new Ele<HTMLElement>(
    'button',
    {
      className: [className.MD_BUTTON, className.GO_TOP_BTN],
      title: localize('title_go-top'),
    },
    svg(goTopIcon),
  )
  goTopBtn.hide()
  goTopBtn.on('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }))

  const buttonWrap = new Ele<HTMLElement>(
    'div',
    { className: className.BUTTON_WRAP_ELE },
    [sideExpandBtn, rawToggleBtn, goTopBtn],
  )

  /* mount elements */
  lifecycle.mount([buttonWrap, mdBody, mdSide])
  if (viewedFileURL) {
    void showFile(viewedFileURL, history.state?.scrollY).then(reveal)
  } else {
    updateAnchorPosition()
    reveal()
  }

  if (directoryPage) {
    window.addEventListener('popstate', (e: PopStateEvent) => {
      const url = getViewedFile()
      // Only the fragment changed, which the browser handles.
      if (
        url === viewedFileURL ||
        (url && viewedFileURL && isSameLocalURL(url, viewedFileURL))
      ) {
        return
      }
      void showFile(url, e.state?.scrollY)
    })
    // Lets a reload come back to the same place in the file.
    window.addEventListener('pagehide', saveScroll)
  }

  darkMediaQuery.addEventListener('change', (e: MediaQueryListEvent) => {
    if (configData.pageTheme === 'auto') {
      renderContentByTheme(
        e.matches ? 'light' : 'dark',
        e.matches ? 'dark' : 'light',
      )
    }
  })

  /* auto refresh */
  if (configData.refresh) {
    polling()
  }

  function polling() {
    void (async function watch() {
      clearTimeout(pollingTimer)
      const url = viewedFileURL
      const res = await readShownFile()
      // Unless another file is shown by now
      if (res !== undefined && url === viewedFileURL) {
        if ((mdRaw === undefined || mdRaw === null) && !directoryPage) {
          if (res) {
            window.location.reload()
            return
          }
        } else if (mdRaw !== res) {
          mdRaw = res
          contentRender(res)
          renderSide()
          /* update raw content */
          setTimeout(() => {
            if (rawContainer) rawContainer.textContent = res
          }, 0)
        }
      }
      if (configData.refresh) pollingTimer = setTimeout(watch, 500)
    })()
  }

  // The shown file's text, or undefined when there is none to watch
  function readShownFile(): Promise<string | undefined> {
    if (!directoryPage) {
      return new Promise(resolve =>
        chrome.runtime.sendMessage({ action: 'fetch' }, resolve),
      )
    }
    if (!viewedFileURL || isMedia(fileType.kind)) {
      return Promise.resolve(undefined)
    }
    return fetchLocalText(viewedFileURL, localize).catch(() => undefined)
  }

  // The file shown, or none on a folder page that shows no file
  function setFile(url?: string) {
    viewedFileURL = url
    fileURL = url ?? window.location.href
    fileName = getDirectoryName(fileURL)
    fileType = directoryPage && !url ? undefined : getFileType(fileName)
    delimiter = 'auto'
  }

  function getViewedFile(): string | undefined {
    const url = getViewedFileURL(window.location.href)
    const type = url && getFileType(url)
    return type && type.kind !== 'native' ? url : undefined
  }

  function getFolderIndex(): string {
    return `# 📁 ${escapeMarkdown(
      getDirectoryName(window.location.href),
    )}\n\n${localize('folder_pick_file')}`
  }

  // A file under this folder page opens in place: the side panel stays as it
  // is, and nothing flashes as on a reload. Another file opens on the folder
  // page of the tree, or of its own folder, from where the next ones open in
  // place.
  function openFile(url: string) {
    const target = new URL(url)
    const { hash } = target
    target.search = ''
    target.hash = ''
    const type = getFileType(target.pathname)
    if (!type || type.kind === 'native') {
      window.location.href = url
      return
    }
    // The History API keeps a file: page on its path.
    if (!directoryPage || !target.href.startsWith(pageFolderURL)) {
      const folderURL = target.href.startsWith(rootURL) ? rootURL : undefined
      window.location.href = getViewerURL(target.href, folderURL) + hash
      return
    }
    const pageURL = getViewerURL(target.href, pageFolderURL) + hash
    if (viewedFileURL && isSameLocalURL(target.href, viewedFileURL)) {
      if (pageURL !== window.location.href) {
        history.pushState(null, '', pageURL)
      }
      scrollToHash()
      return
    }
    saveScroll()
    history.pushState(null, '', pageURL)
    void showFile(target.href)
  }

  // Shows a file of this folder page, or the folder itself without one.
  async function showFile(url: string | undefined, scrollY?: number) {
    const current = ++showing
    const type = url && getFileType(url)
    let text = ''
    let error: Error | undefined
    if (type && !isMedia(type.kind)) {
      try {
        text = await fetchLocalText(url, localize)
      } catch (e) {
        error = e
      }
      if (current !== showing) return
    }
    setFile(url)
    // Also drops the last file's media; see mdRenderer.
    mdContent.ele.replaceChildren()
    if (error) {
      mdRaw = null
      renderStatus(
        mdContent.ele,
        `${localize('viewer_failed')}: ${error.message || error}`,
        true,
      )
      document.title = fileName
    } else {
      mdRaw = url ? text : getFolderIndex()
      contentRender(mdRaw)
    }
    rawContainer.textContent = mdRaw ?? ''
    rawToggleBtn.toggle(Boolean(url))
    renderSide()
    folderView?.setCurrentURL(fileURL)
    scrollToHash(scrollY)
  }

  function saveScroll() {
    history.replaceState({ ...history.state, scrollY: window.scrollY }, '')
  }

  function scrollToHash(scrollY = 0) {
    if (findHashTarget()) {
      updateAnchorPosition()
    } else {
      window.scrollTo(0, scrollY)
    }
  }

  function applyOutlineExpanded() {
    const expanded = configData.outlineExpanded
    mdSide.classList.toggle(className.OUTLINE_COLLAPSED, !expanded)
    outlineToggle.ele.setAttribute('aria-expanded', String(expanded))
    if (expanded) {
      sideLiElements[targetIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }

  function renderSide() {
    idCache = Object.create(null)
    headElements = getHeads(mdContent)
    df = new Ele<DocumentFragment>('#document-fragment')
    sideLiElements = headElements.reduce(handleHeadItem, [])
    targetIndex = null
    if (!headElements.length) {
      const empty = new Ele<HTMLElement>('li', {
        className: className.OUTLINE_EMPTY,
      })
      empty.textContent = localize('outline_empty')
      df.append(empty)
    }
    outlineCount.textContent = headElements.length
      ? String(headElements.length)
      : ''
    mdOutline.innerHTML = null
    mdOutline.append(df)
    setTimeout(onScroll, 0)
  }

  function handleHeadItem(
    eleList: HTMLElement[],
    head: HTMLElement,
  ): HTMLElement[] {
    const content = String(head.textContent).trim()
    const encodeContent = getDecodeContent(content)

    head.setAttribute('id', encodeContent)
    head.dataset.title = content

    const headAnchor = new Ele<HTMLElement>('a', {
      className: className.HEAD_ANCHOR,
      href: `#${encodeContent}`,
    })
    headAnchor.textContent = '#'
    head.insertBefore(headAnchor.ele, head.firstChild)

    const link = new Ele<HTMLElement>('a', {
      title: content,
      href: `#${encodeContent}`,
    })
    link.textContent = content
    const li = new Ele<HTMLElement>('li', {
      className: `${className.MD_SIDE}-${head.tagName.toLowerCase()}`,
    })
    eleList.push(li.ele)
    li.append(link)
    df.append(li.ele)

    return eleList
  }

  function getDecodeContent(content: string): string {
    return (function unique(key: string): string {
      if (key in idCache) {
        return unique(`${key}-${idCache[key]++}`)
      } else {
        idCache[key] = 1
        return key
      }
    })(slugify(content))
  }

  function onScroll() {
    const documentScrollTop = document.documentElement.scrollTop
    goTopBtn.toggle(documentScrollTop >= 640)

    headElements.some((_, index) => {
      let sectionHeight = -20
      const item = headElements[index + 1]
      if (item) {
        sectionHeight += item.offsetTop
      }

      const hit = sectionHeight <= 0 || sectionHeight > documentScrollTop

      if (hit && (targetIndex !== index || reloading)) {
        let target = sideLiElements[targetIndex]
        target && target.classList.remove(className.MD_SIDE_ACTIVE)

        target = sideLiElements[(targetIndex = index)]
        if (target) {
          target.classList.add(className.MD_SIDE_ACTIVE)
          if (!isSideHover && target.scrollIntoView) {
            target.scrollIntoView({ block: 'nearest' })
          }
        }
      }
      return hit
    })
  }

  function renderContentByTheme(theme: Theme, prevTheme: Theme) {
    if (configData.mdPlugins.includes('Mermaid')) {
      if (theme === 'auto' || prevTheme === 'auto') {
        const themeScheme = getMediaQueryTheme()
        if (theme !== themeScheme && prevTheme !== themeScheme) {
          contentRender(mdRaw)
          renderSide()
        }
      } else {
        contentRender(mdRaw)
        renderSide()
      }
    }
  }

  function findHashTarget(): HTMLElement | undefined {
    const hash = decodeHash(window.location.hash)
    if (!hash) return
    return (
      headElements.find(head => head.getAttribute('id') === hash) ??
      headElements.find(
        head =>
          legacySlug(head.dataset.title ?? '') ===
          window.location.hash.slice(1),
      )
    )
  }

  function updateAnchorPosition() {
    const target = findHashTarget()
    if (!target) return

    const scrollToTarget = () => window.scrollTo(0, target.offsetTop)
    setTimeout(scrollToTarget)

    // Diagrams render asynchronously and grow the content above the target, so
    // keep it pinned until the user scrolls or the page settles.
    const observer = new ResizeObserver(scrollToTarget)
    observer.observe(mdContent.ele)
    const events = ['wheel', 'touchstart', 'keydown', 'mousedown']
    const stop = () => {
      observer.disconnect()
      events.forEach(e => window.removeEventListener(e, stop))
    }
    events.forEach(e => window.addEventListener(e, stop, { passive: true }))
    setTimeout(stop, 10000)
  }
}

const OUTLINE_ID = 'md-reader-outline'

// Until then the page hides what the browser shows of the raw file or folder
// listing; see md-reader-ready in index.less.
function reveal() {
  document.documentElement.classList.add(className.READY)
}

function createRawContainer(): HTMLElement {
  const pre = document.createElement('pre')
  // As the browser shows a text file
  pre.style.whiteSpace = 'pre-wrap'
  pre.style.overflowWrap = 'break-word'
  return pre
}

function isMedia(kind?: FileKind): kind is 'image' | 'video' | 'audio' {
  return kind === 'image' || kind === 'video' || kind === 'audio'
}

// A click that opens the link elsewhere, such as in a new tab
function isModifiedClick(e: MouseEvent): boolean {
  return e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey
}

function toCodeFence(code: string, language: string): string {
  // The fence must be longer than any backtick run inside the code.
  const longestRun = Math.max(
    0,
    ...Array.from(code.matchAll(/`+/g), match => match[0].length),
  )
  const fence = '`'.repeat(Math.max(3, longestRun + 1))
  return `${fence}${language}\n${code.replace(/\n$/, '')}\n${fence}\n`
}

function escapeMarkdown(value: string): string {
  return value.replace(/([\\`*_{}\[\]()<>#+\-.!|])/g, '\\$1')
}

const DEFAULT_SIDE_WIDTH = 260
const MIN_SIDE_WIDTH = 180
const MAX_SIDE_WIDTH = 720
// Leave at least this much of the viewport to the content column.
const MIN_CONTENT_WIDTH = 320

function setupSideWidthResize(
  resizer: HTMLElement,
  initialWidth: number,
  onChange: (width: number) => void,
) {
  // The saved width; the applied one is clamped to the current viewport.
  let width = clampSideWidth(initialWidth, Infinity)
  let dragging = false

  const render = () => {
    const applied = clampSideWidth(width)
    document.body.style.setProperty('--md-side-width', `${applied}px`)
    resizer.setAttribute('aria-valuenow', String(applied))
  }
  const applyWidth = (value: number) => {
    width = clampSideWidth(value)
    render()
  }

  const finishResize = () => {
    if (!dragging) return
    dragging = false
    document.body.classList.remove(className.SIDE_WIDTH_RESIZING)
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', finishResize)
    document.removeEventListener('pointercancel', finishResize)
    onChange(width)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (dragging) applyWidth(event.clientX)
  }

  resizer.addEventListener('pointerdown', (event: PointerEvent) => {
    if (event.button !== 0) return
    event.preventDefault()
    dragging = true
    document.body.classList.add(className.SIDE_WIDTH_RESIZING)
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', finishResize)
    document.addEventListener('pointercancel', finishResize)
  })
  resizer.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    applyWidth(width + (event.key === 'ArrowLeft' ? -16 : 16))
    onChange(width)
  })
  resizer.addEventListener('dblclick', () => {
    applyWidth(DEFAULT_SIDE_WIDTH)
    onChange(width)
  })
  window.addEventListener('resize', render)

  resizer.setAttribute('aria-valuemin', String(MIN_SIDE_WIDTH))
  resizer.setAttribute('aria-valuemax', String(MAX_SIDE_WIDTH))
  render()
}

function clampSideWidth(
  value: number,
  viewportWidth: number = window.innerWidth,
): number {
  if (!Number.isFinite(value)) return DEFAULT_SIDE_WIDTH
  const max = Math.max(
    MIN_SIDE_WIDTH,
    Math.min(MAX_SIDE_WIDTH, viewportWidth - MIN_CONTENT_WIDTH),
  )
  return Math.round(Math.min(Math.max(value, MIN_SIDE_WIDTH), max))
}

const DEFAULT_FOLDER_PANE_RATIO = 0.42
const MIN_FOLDER_PANE_RATIO = 0.15
const MAX_FOLDER_PANE_RATIO = 0.8
const MIN_PANE_HEIGHT = 96

function setupFolderPaneResize(
  side: HTMLElement,
  folder: HTMLElement,
  resizer: HTMLElement,
  initialRatio: number,
  onChange: (ratio: number) => void,
) {
  let ratio = clampFolderPaneRatio(initialRatio)
  let dragging = false

  const applyRatio = (value: number) => {
    ratio = clampFolderPaneRatio(value)
    folder.style.flexBasis = `${ratio * 100}%`
    resizer.setAttribute('aria-valuenow', String(Math.round(ratio * 100)))
  }

  const getLayout = () => {
    const style = getComputedStyle(side)
    const paddingTop = Number.parseFloat(style.paddingTop) || 0
    const paddingBottom = Number.parseFloat(style.paddingBottom) || 0
    const availableHeight = Math.max(
      1,
      side.clientHeight - paddingTop - paddingBottom - resizer.offsetHeight,
    )
    const minHeight = Math.min(MIN_PANE_HEIGHT, availableHeight / 2)
    return {
      availableHeight,
      minHeight,
      top: side.getBoundingClientRect().top + paddingTop,
    }
  }

  const applyHeight = (height: number) => {
    const { availableHeight, minHeight } = getLayout()
    const nextHeight = Math.min(
      Math.max(height, minHeight),
      availableHeight - minHeight,
    )
    ratio = clampFolderPaneRatio(nextHeight / availableHeight)
    folder.style.flexBasis = `${nextHeight}px`
    resizer.setAttribute('aria-valuenow', String(Math.round(ratio * 100)))
  }

  const finishResize = () => {
    if (!dragging) return
    dragging = false
    document.body.classList.remove(className.SIDE_RESIZING)
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', finishResize)
    document.removeEventListener('pointercancel', finishResize)
    applyRatio(ratio)
    onChange(ratio)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return
    applyHeight(event.clientY - getLayout().top)
  }

  resizer.addEventListener('pointerdown', (event: PointerEvent) => {
    if (event.button !== 0) return
    event.preventDefault()
    dragging = true
    document.body.classList.add(className.SIDE_RESIZING)
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', finishResize)
    document.addEventListener('pointercancel', finishResize)
  })
  resizer.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    const delta = event.key === 'ArrowUp' ? -24 : 24
    applyHeight(folder.getBoundingClientRect().height + delta)
    applyRatio(ratio)
    onChange(ratio)
  })
  resizer.addEventListener('dblclick', () => {
    applyRatio(DEFAULT_FOLDER_PANE_RATIO)
    onChange(ratio)
  })

  resizer.setAttribute(
    'aria-valuemin',
    String(Math.round(MIN_FOLDER_PANE_RATIO * 100)),
  )
  resizer.setAttribute(
    'aria-valuemax',
    String(Math.round(MAX_FOLDER_PANE_RATIO * 100)),
  )
  applyRatio(ratio)
}

function clampFolderPaneRatio(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_FOLDER_PANE_RATIO
  return Math.min(Math.max(value, MIN_FOLDER_PANE_RATIO), MAX_FOLDER_PANE_RATIO)
}

storage.get().then(main)
