/**
 * What a Space is made of when it is built with blocks rather than files.
 *
 * A page is a list of blocks placed on a grid: each one knows where it sits,
 * how big it is, and the few things about it that can be changed. The whole
 * document is kept as `page.json` inside the Space's own files, and compiled
 * from there into the markup and styles that actually get served. Two
 * consequences worth stating: the blocks are always the source, so nothing is
 * lost by reading the generated markup, and somebody who would rather write
 * the files themselves can take them over and the blocks stop owning them.
 */

export const PAGE_WIDTH = 960
export const GRID = 10

export type BlockKind =
  | 'heading' | 'text' | 'image' | 'gallery' | 'button' | 'divider'
  | 'video' | 'audio' | 'ad' | 'donate' | 'box'

export type Block = {
  id: string
  kind: BlockKind
  x: number
  y: number
  w: number
  h: number
  props: Record<string, string | number | boolean | string[]>
}

export type Page = {
  version: 1
  background: string
  text: string
  font: 'sans' | 'serif' | 'mono' | 'display'
  width: number
  blocks: Block[]
}

export const FONTS: Record<Page['font'], string> = {
  sans: 'system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, "Courier New", monospace',
  display: '"bd-gravel-variable", system-ui, sans-serif',
}

/** A new block of each kind: its size, and what it says before anybody edits it. */
export const BLOCK_DEFAULTS: Record<BlockKind, { w: number; h: number; props: Block['props']; label: string }> = {
  heading: { w: 560, h: 80, label: 'Heading', props: { text: 'A heading', size: 44, align: 'left', colour: '' } },
  text: { w: 460, h: 120, label: 'Text', props: { text: 'Say something here.', size: 16, align: 'left', colour: '' } },
  image: { w: 360, h: 240, label: 'Image', props: { tag: '', alt: '', fit: 'cover', radius: 12 } },
  gallery: { w: 640, h: 260, label: 'Gallery', props: { tags: [], columns: 3, radius: 12 } },
  button: { w: 220, h: 56, label: 'Button', props: { label: 'Press me', href: '/', colour: '#1B34E8', text: '#ffffff', radius: 12 } },
  divider: { w: 560, h: 12, label: 'Divider', props: { colour: '#ffffff33', thickness: 2 } },
  video: { w: 520, h: 300, label: 'Video', props: { tag: '', loop: false, muted: true } },
  audio: { w: 360, h: 80, label: 'Sound', props: { tag: '', title: '' } },
  ad: { w: 728, h: 90, label: 'Ad slot', props: { size: 'banner' } },
  donate: { w: 260, h: 72, label: 'Donate', props: { label: 'Give Kubes', amount: 10, colour: '#1CAE71' } },
  box: { w: 320, h: 200, label: 'Box', props: { colour: '#ffffff12', radius: 16, border: '#ffffff22' } },
}

/** The sizes an ad slot can be, in the shapes advertisers actually buy. */
export const AD_SIZES: Record<string, { w: number; h: number; label: string }> = {
  banner: { w: 728, h: 90, label: 'Banner, 728 by 90' },
  box: { w: 300, h: 250, label: 'Box, 300 by 250' },
  tall: { w: 160, h: 600, label: 'Tall, 160 by 600' },
}

export const emptyPage = (): Page => ({
  version: 1,
  background: '#101012',
  text: '#f4f4f6',
  font: 'sans',
  width: PAGE_WIDTH,
  blocks: [],
})

export const newBlock = (kind: BlockKind, at: { x: number; y: number }): Block => {
  const base = BLOCK_DEFAULTS[kind]
  return {
    id: `${kind}-${Math.random().toString(36).slice(2, 9)}`,
    kind,
    x: at.x,
    y: at.y,
    w: kind === 'ad' ? AD_SIZES.banner.w : base.w,
    h: kind === 'ad' ? AD_SIZES.banner.h : base.h,
    props: { ...base.props },
  }
}

export const snap = (value: number) => Math.round(value / GRID) * GRID

export function readPage(raw: string | undefined | null): Page | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Page
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.blocks)) return null
    return { ...emptyPage(), ...parsed }
  } catch {
    return null
  }
}

/* ------------------------------------------------------------- compiling */

const escape = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** A content number typed by hand, tidied into the reference form. */
export const asReference = (tag: unknown) => {
  const clean = String(tag ?? '').trim().toUpperCase().replace(/^KOB:\/\//, '')
  return /^[A-Z]{3}-\d+$/.test(clean) ? `kob://${clean}` : ''
}

/** An address inside Kobbleston, or an ordinary link somewhere else. */
const asHref = (value: unknown) => {
  const raw = String(value ?? '').trim()
  if (!raw) return '#'
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) return raw
  return `/${raw}`
}

function blockMarkup(block: Block): string {
  const p = block.props

  switch (block.kind) {
    case 'heading':
      return `<h2 class="kob-h">${escape(p.text)}</h2>`

    case 'text':
      return `<p class="kob-p">${escape(p.text).replace(/\n/g, '<br />')}</p>`

    case 'image': {
      const reference = asReference(p.tag)
      return reference
        ? `<img class="kob-img" src="${reference}" alt="${escape(p.alt)}" />`
        : `<span class="kob-empty">No picture chosen</span>`
    }

    case 'gallery': {
      const tags = Array.isArray(p.tags) ? p.tags : []
      const pictures = tags.map(asReference).filter(Boolean)
      if (!pictures.length) return `<span class="kob-empty">No pictures chosen</span>`
      return `<div class="kob-grid">${pictures
        .map((reference) => `<img src="${reference}" alt="" />`)
        .join('')}</div>`
    }

    case 'button':
      return `<a class="kob-btn" href="${escape(asHref(p.href))}">${escape(p.label)}</a>`

    case 'divider':
      return `<hr class="kob-hr" />`

    case 'video': {
      const reference = asReference(p.tag)
      return reference
        ? `<video class="kob-video" src="${reference}" controls${p.loop ? ' loop' : ''}${p.muted ? ' muted' : ''} playsinline></video>`
        : `<span class="kob-empty">No clip chosen</span>`
    }

    case 'audio': {
      const reference = asReference(p.tag)
      return reference
        ? `<div class="kob-audio"><span>${escape(p.title)}</span><audio src="${reference}" controls></audio></div>`
        : `<span class="kob-empty">No sound chosen</span>`
    }

    case 'ad':
      // Filled in when the page is drawn, because picking an ad and counting
      // the view is the platform's job, not the Space's.
      return `<div class="kob-ad" data-kob-ad="${escape(p.size)}"></div>`

    case 'donate':
      return `<button class="kob-donate" data-kob-donate="${escape(p.amount)}">${escape(p.label)}</button>`

    case 'box':
      return ''

    default:
      return ''
  }
}

function blockStyle(block: Block): string {
  const p = block.props
  const rules: string[] = [
    `left:${block.x}px`,
    `top:${block.y}px`,
    `width:${block.w}px`,
    `height:${block.h}px`,
  ]

  if (block.kind === 'box') {
    rules.push(`background:${p.colour}`, `border:1px solid ${p.border}`, `border-radius:${p.radius}px`)
  }
  if (block.kind === 'heading' || block.kind === 'text') {
    rules.push(`font-size:${p.size}px`, `text-align:${p.align}`)
    if (p.colour) rules.push(`color:${p.colour}`)
  }
  if (block.kind === 'image') {
    rules.push(`border-radius:${p.radius}px`, `overflow:hidden`)
  }
  if (block.kind === 'button') {
    rules.push(`--kob-btn-bg:${p.colour}`, `--kob-btn-fg:${p.text}`, `--kob-btn-radius:${p.radius}px`)
  }
  if (block.kind === 'divider') {
    rules.push(`--kob-hr:${p.colour}`, `--kob-hr-size:${p.thickness}px`)
  }
  if (block.kind === 'donate') {
    rules.push(`--kob-btn-bg:${p.colour}`)
  }
  if (block.kind === 'gallery') {
    rules.push(`--kob-cols:${p.columns}`, `--kob-radius:${p.radius}px`)
  }

  return rules.join(';')
}

/** The stylesheet every built page shares. */
function pageStyles(page: Page) {
  const tallest = page.blocks.reduce((low, block) => Math.max(low, block.y + block.h), 400)

  return `:root {
  --kob-fg: ${page.text};
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: ${page.background};
  color: ${page.text};
  font-family: ${FONTS[page.font]};
}

.kob-page {
  position: relative;
  width: ${page.width}px;
  min-height: ${tallest + 80}px;
  margin: 0 auto;
}

.kob-block { position: absolute; }

.kob-h, .kob-p { margin: 0; line-height: 1.25; }
.kob-p { line-height: 1.6; }

.kob-img, .kob-video { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: inherit; }

.kob-grid {
  display: grid;
  grid-template-columns: repeat(var(--kob-cols, 3), 1fr);
  gap: 10px;
  width: 100%;
  height: 100%;
}
.kob-grid img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--kob-radius, 12px); }

.kob-btn, .kob-donate {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border: 0;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  text-decoration: none;
  background: var(--kob-btn-bg, #1B34E8);
  color: var(--kob-btn-fg, #fff);
  border-radius: var(--kob-btn-radius, 12px);
}

.kob-hr {
  border: 0;
  width: 100%;
  height: var(--kob-hr-size, 2px);
  background: var(--kob-hr, #ffffff33);
  margin: 0;
}

.kob-audio { display: flex; flex-direction: column; gap: 6px; width: 100%; }
.kob-audio audio { width: 100%; }

.kob-ad { width: 100%; height: 100%; overflow: hidden; border-radius: 8px; }
.kob-ad img { width: 100%; height: 100%; object-fit: cover; display: block; }

.kob-empty {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border: 1px dashed currentColor;
  border-radius: 12px;
  opacity: 0.45;
  font-size: 13px;
}

/* On a narrow screen the page stops being a canvas and becomes a column, in
   the order things were placed down the page. */
@media (max-width: ${page.width}px) {
  .kob-page { width: 100%; min-height: 0; padding: 16px; }
  .kob-block {
    position: static;
    width: 100% !important;
    height: auto !important;
    min-height: 40px;
    margin: 0 0 18px;
  }
  .kob-img, .kob-video { height: auto; }
  .kob-ad { height: auto; aspect-ratio: 8 / 1; }
}
`
}

/** Blocks in, the two files a Space is served as out. */
export function compilePage(page: Page): { html: string; css: string } {
  const ordered = [...page.blocks].sort((a, b) => a.y - b.y || a.x - b.x)

  const html = `<link rel="stylesheet" href="style.css" />

<div class="kob-page">
${ordered
  .map((block) => `  <div class="kob-block kob-${block.kind}" style="${blockStyle(block)}">${blockMarkup(block)}</div>`)
  .join('\n')}
</div>
`

  return { html, css: pageStyles(page) }
}
