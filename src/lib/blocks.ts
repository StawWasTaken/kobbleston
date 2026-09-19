import {
  faPlay, faPause, faVolumeHigh, faVolumeXmark,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

/**
 * What a Space is made of.
 *
 * A page is a list of blocks placed on a grid: each one knows where it sits,
 * how big it is, and the things about it that can be changed. The whole
 * document is kept as `page.json` inside the Space's own files and compiled
 * from there into the markup and the stylesheet that actually get served.
 * The blocks are always the source, so nothing about a page is hidden in
 * generated markup, and nothing anybody types ever becomes code.
 */

export const PAGE_WIDTH = 960
export const GRID = 10

export type BlockKind =
  | 'heading' | 'text' | 'quote' | 'marquee' | 'links'
  | 'image' | 'gallery' | 'button' | 'divider'
  | 'video' | 'audio' | 'ad' | 'donate' | 'box'

export type Block = {
  id: string
  kind: BlockKind
  x: number
  y: number
  w: number
  h: number
  /** Left alone by the canvas, so a finished part of a page stays finished. */
  locked?: boolean
  props: Record<string, string | number | boolean | string[]>
}

export type Page = {
  version: 1
  background: string
  /** A picture behind everything, by its number from Create. */
  backdrop?: string
  backdropFit?: 'cover' | 'tile' | 'fixed'
  text: string
  /** A built in name, or the number of a font somebody owns. */
  font: string
  width: number
  blocks: Block[]
}

/* ----------------------------------------------------------------- fonts */

export const BUILT_IN_FONTS: Record<string, string> = {
  sans: 'system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, "Courier New", monospace',
  display: '"bd-gravel-variable", system-ui, sans-serif',
}

export const BUILT_IN_FONT_LABELS: Record<string, string> = {
  sans: 'Plain',
  serif: 'Serif',
  mono: 'Typewriter',
  display: 'Kobbleston',
}

/** The name a font of somebody's own goes by inside a built page. */
const familyFor = (reference: string) => `kobfont-${reference.replace(/[^A-Za-z0-9]/g, '')}`

/** A font choice, turned into something a stylesheet can use. */
export function fontStack(choice: string | undefined | null): string {
  const value = String(choice ?? '').trim()
  if (!value) return ''
  if (BUILT_IN_FONTS[value]) return BUILT_IN_FONTS[value]
  const reference = asReference(value)
  return reference ? `"${familyFor(reference.replace('kob://', ''))}", system-ui, sans-serif` : ''
}

/** Every font of somebody's own that a page leans on, page and blocks alike. */
export function fontsUsed(page: Page): string[] {
  const found = new Set<string>()
  const add = (choice: unknown) => {
    const value = String(choice ?? '').trim()
    if (!value || BUILT_IN_FONTS[value]) return
    const reference = asReference(value)
    if (reference) found.add(reference.replace('kob://', ''))
  }
  add(page.font)
  for (const block of page.blocks) add(block.props.font)
  return [...found]
}

/* ---------------------------------------------------------------- blocks */

/** What every block can be dressed with, whatever kind it is. */
const SHARED_STYLE: Block['props'] = {
  bg: '#00000000',
  border: '#00000000',
  borderWidth: 0,
  radius: 0,
  shadow: 0,
  opacity: 100,
  rotate: 0,
  padding: 0,
}

/** A new block of each kind: its size, and what it says before anybody edits it. */
export const BLOCK_DEFAULTS: Record<BlockKind, { w: number; h: number; props: Block['props']; label: string }> = {
  heading: {
    w: 560, h: 80, label: 'Heading',
    props: { text: 'A heading', size: 44, align: 'left', colour: '', font: '', weight: 800, lineHeight: 115, spacing: 0, italic: false },
  },
  text: {
    w: 460, h: 120, label: 'Text',
    props: { text: 'Say something here.', size: 16, align: 'left', colour: '', font: '', weight: 400, lineHeight: 160, spacing: 0, italic: false },
  },
  quote: {
    w: 520, h: 140, label: 'Quote',
    props: { text: 'Something worth repeating.', who: '', size: 22, colour: '', font: '', accent: '#1B34E8' },
  },
  marquee: {
    w: 720, h: 60, label: 'Marquee',
    props: { text: 'This bit never stops moving.', size: 22, colour: '', font: '', speed: 18, direction: 'left' },
  },
  links: {
    w: 320, h: 220, label: 'Links',
    props: { items: [], colour: '#1B34E8', text: '#ffffff', radius: 10, gap: 8, font: '' },
  },
  image: {
    w: 360, h: 240, label: 'Image',
    props: { tag: '', alt: '', fit: 'cover', radius: 12, href: '' },
  },
  gallery: {
    w: 640, h: 260, label: 'Gallery',
    props: { tags: [], columns: 3, radius: 12, gap: 10 },
  },
  button: {
    w: 220, h: 56, label: 'Button',
    props: { label: 'Press me', href: '/', colour: '#1B34E8', text: '#ffffff', radius: 12, size: 15, font: '' },
  },
  divider: { w: 560, h: 12, label: 'Divider', props: { colour: '#ffffff33', thickness: 2 } },
  video: {
    w: 520, h: 300, label: 'Video',
    props: { tag: '', loop: false, muted: true, radius: 12 },
  },
  audio: {
    w: 360, h: 96, label: 'Sound',
    props: {
      tag: '', title: '', by: '', cover: '',
      // How it behaves: a player somebody presses, or a sound that simply runs.
      mode: 'player',
      // Which player: the full one, the small one, or the one with a cover.
      skin: 'full',
      loop: false,
      colour: '#1B34E8',
    },
  },
  ad: { w: 728, h: 90, label: 'Ad slot', props: { size: 'banner' } },
  donate: {
    w: 260, h: 72, label: 'Donate',
    props: { label: 'Give Brix', amount: 10, colour: '#1CAE71', text: '#ffffff', radius: 12, icon: true },
  },
  box: { w: 320, h: 200, label: 'Box', props: { colour: '#ffffff12', radius: 16, border: '#ffffff22' } },
}

/**
 * The sizes an ad slot can be.
 *
 * The box is still here because pages built with one keep working, but it is
 * not sold any more: nowhere on the site had a good place for it, and a shape
 * with nowhere to go is a shape nobody should be paying for.
 */
export const AD_SIZES: Record<string, { w: number; h: number; label: string }> = {
  banner: { w: 728, h: 90, label: 'Banner, 728 by 90' },
  tall: { w: 160, h: 600, label: 'Tall, 160 by 600' },
  box: { w: 300, h: 250, label: 'Box, 300 by 250' },
}

/** The shapes a campaign can actually buy. */
export const BUYABLE_AD_SIZES = ['banner', 'tall'] as const

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
    props: { ...SHARED_STYLE, ...base.props },
  }
}

export const snap = (value: number) => Math.round(value / GRID) * GRID

/** A stored page, with anything a newer version added filled in. */
export function readPage(raw: string | undefined | null): Page | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Page
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.blocks)) return null
    return {
      ...emptyPage(),
      ...parsed,
      blocks: parsed.blocks.map((block) => ({
        ...block,
        props: { ...SHARED_STYLE, ...BLOCK_DEFAULTS[block.kind]?.props, ...block.props },
      })),
    }
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

/** A number typed by hand, tidied into the reference form. */
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

/** A colour, or nothing at all, so a half typed one never breaks a rule. */
const asColour = (value: unknown) => {
  const raw = String(value ?? '').trim()
  return /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw) ? raw : ''
}

const asNumber = (value: unknown, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

/**
 * An icon drawn straight from Font Awesome's own outlines, so a built page
 * carries the same marks as the rest of Kobbleston without asking anybody's
 * server for them.
 */
function icon(definition: IconDefinition, className = '') {
  const [width, height, , , path] = definition.icon
  const shapes = (Array.isArray(path) ? path : [path])
    .map((one) => `<path d="${one}"/>`)
    .join('')
  return `<svg class="${className}" viewBox="0 0 ${width} ${height}" fill="currentColor" `
    + `width="1em" height="1em" aria-hidden="true" focusable="false">${shapes}</svg>`
}

/** The Brix mark, the same shape it is everywhere else on the site. */
const MARK = `<svg class="kob-brix" viewBox="0 0 640 640" fill="currentColor" width="1em" height="1em" aria-hidden="true" focusable="false">`
  + `<rect x="61" y="80" width="238" height="180" rx="55"/>`
  + `<rect x="341" y="80" width="238" height="180" rx="55"/>`
  + `<path d="M64 186h512a24 24 0 0 1 24 24v294a55 55 0 0 1-55 55H95a55 55 0 0 1-55-55V210a24 24 0 0 1 24-24Z"/>`
  + `</svg>`

/**
 * The player a Space uses is the one Create uses: the same shape, the same
 * controls, the same behaviour. It is drawn here and driven by the one small
 * script the frame allows, because a page cannot bring a script of its own.
 */
function playerMarkup(block: Block, source: string) {
  const p = block.props
  const cover = asReference(p.cover)
  const mini = p.skin === 'mini'

  const face = p.skin === 'cover'
    ? `<span class="kob-face">${cover ? `<img src="${cover}" alt="" />` : ''}</span>`
    : ''

  const words = mini ? '' : `<span class="kob-said">`
    + `<span class="kob-said-title">${escape(p.title || 'Untitled')}</span>`
    + (p.by ? `<span class="kob-said-by">${escape(p.by)}</span>` : '')
    + `</span>`

  return `<div class="kob-player${mini ? ' is-mini' : ''}${p.skin === 'cover' ? ' is-cover' : ''}" data-kob-player>`
    + `<audio data-kob-media src="${source}" preload="metadata"${p.loop ? ' loop' : ''}></audio>`
    + face
    + `<div class="kob-player-body">`
    + words
    + `<div class="kob-controls">`
    + `<button type="button" class="kob-play" data-kob-play aria-label="Play">`
    + icon(faPlay, 'kob-i-play') + icon(faPause, 'kob-i-pause')
    + `</button>`
    + `<span class="kob-clock" data-kob-at>0:00</span>`
    + `<span class="kob-bar" data-kob-seek role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">`
    + `<span class="kob-bar-track"></span><span class="kob-bar-fill" data-kob-fill></span>`
    + `<span class="kob-bar-knob" data-kob-knob></span></span>`
    + `<span class="kob-clock kob-clock-end" data-kob-length>0:00</span>`
    + `<button type="button" class="kob-mute" data-kob-mute aria-label="Mute">`
    + icon(faVolumeHigh, 'kob-i-loud') + icon(faVolumeXmark, 'kob-i-quiet')
    + `</button>`
    + `</div></div></div>`
}

function blockMarkup(block: Block): string {
  const p = block.props

  switch (block.kind) {
    case 'heading':
      return `<h2 class="kob-h">${escape(p.text)}</h2>`

    case 'text':
      return `<p class="kob-p">${escape(p.text).replace(/\n/g, '<br />')}</p>`

    case 'quote':
      return `<blockquote class="kob-quote"><p>${escape(p.text).replace(/\n/g, '<br />')}</p>`
        + (p.who ? `<cite>${escape(p.who)}</cite>` : '')
        + `</blockquote>`

    case 'marquee':
      // Two copies, so the words run round without a gap or a jump.
      return `<div class="kob-marquee"><div class="kob-marquee-run">`
        + `<span>${escape(p.text)}</span><span aria-hidden="true">${escape(p.text)}</span>`
        + `</div></div>`

    case 'links': {
      const items = (Array.isArray(p.items) ? p.items : []) as string[]
      if (!items.length) return `<span class="kob-empty">No links yet</span>`
      return `<nav class="kob-links">${items
        .map((line) => {
          const [label, where] = line.split('|')
          return `<a href="${escape(asHref(where ?? label))}">${escape((label ?? '').trim() || where)}</a>`
        })
        .join('')}</nav>`
    }

    case 'image': {
      const reference = asReference(p.tag)
      if (!reference) return `<span class="kob-empty">No picture chosen</span>`
      const picture = `<img class="kob-img" src="${reference}" alt="${escape(p.alt)}" />`
      return p.href ? `<a class="kob-img-link" href="${escape(asHref(p.href))}">${picture}</a>` : picture
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
      if (!reference) return `<span class="kob-empty">No sound chosen</span>`

      // A sound that simply runs has nothing to press. It is still muted until
      // somebody touches the page, because a browser will not have it any
      // other way, and because nobody should be shouted at by a web page.
      if (p.mode === 'loop') {
        return `<div class="kob-ambient" data-kob-ambient>`
          + `<audio data-kob-media src="${reference}" preload="auto" loop></audio>`
          + `<button type="button" class="kob-ambient-btn" data-kob-play aria-label="Sound on or off">`
          + icon(faVolumeXmark, 'kob-i-play') + icon(faVolumeHigh, 'kob-i-pause')
          + `<span>${escape(p.title || 'Sound')}</span>`
          + `</button></div>`
      }

      return playerMarkup(block, reference)
    }

    case 'ad':
      // Filled in when the page is drawn, because picking an ad and counting
      // the view is the platform's job, not the Space's.
      return `<div class="kob-ad" data-kob-ad="${escape(p.size)}"></div>`

    case 'donate':
      return `<button class="kob-donate" data-kob-donate="${escape(Math.round(asNumber(p.amount, 10)))}">`
        + (p.icon === false ? '' : MARK)
        + `<span>${escape(p.label)}</span></button>`

    case 'box':
      return ''

    default:
      return ''
  }
}

/** The dressing every block shares, written as inline rules. */
function sharedStyle(block: Block): string[] {
  const p = block.props
  const rules: string[] = []

  const bg = asColour(p.bg)
  if (bg && !bg.endsWith('00000000')) rules.push(`background:${bg}`)

  const width = asNumber(p.borderWidth)
  const border = asColour(p.border)
  if (width > 0 && border) rules.push(`border:${width}px solid ${border}`)

  const radius = asNumber(p.radius)
  if (radius > 0) rules.push(`border-radius:${radius}px`)

  const shadow = asNumber(p.shadow)
  if (shadow > 0) rules.push(`box-shadow:0 ${Math.round(shadow / 2)}px ${shadow}px rgba(0,0,0,.45)`)

  const opacity = asNumber(p.opacity, 100)
  if (opacity < 100) rules.push(`opacity:${Math.max(0, opacity) / 100}`)

  const rotate = asNumber(p.rotate)
  if (rotate) rules.push(`transform:rotate(${rotate}deg)`)

  const padding = asNumber(p.padding)
  if (padding > 0) rules.push(`padding:${padding}px`)

  return rules
}

function blockStyle(block: Block): string {
  const p = block.props
  const rules: string[] = [
    `left:${block.x}px`,
    `top:${block.y}px`,
    `width:${block.w}px`,
    `height:${block.h}px`,
    ...sharedStyle(block),
  ]

  const family = fontStack(String(p.font ?? ""))
  if (family) rules.push(`font-family:${family}`)

  if (block.kind === 'box') {
    rules.push(`background:${asColour(p.colour) || 'transparent'}`)
    rules.push(`border:1px solid ${asColour(p.border) || 'transparent'}`)
    rules.push(`border-radius:${asNumber(p.radius)}px`)
  }
  if (block.kind === 'heading' || block.kind === 'text') {
    rules.push(
      `font-size:${asNumber(p.size, 16)}px`,
      `text-align:${p.align === 'center' || p.align === 'right' ? p.align : 'left'}`,
      `font-weight:${asNumber(p.weight, 400)}`,
      `line-height:${asNumber(p.lineHeight, 150) / 100}`,
      `letter-spacing:${asNumber(p.spacing) / 100}em`,
    )
    if (p.italic) rules.push('font-style:italic')
    if (asColour(p.colour)) rules.push(`color:${asColour(p.colour)}`)
  }
  if (block.kind === 'quote') {
    rules.push(`font-size:${asNumber(p.size, 22)}px`, `--kob-accent:${asColour(p.accent) || '#1B34E8'}`)
    if (asColour(p.colour)) rules.push(`color:${asColour(p.colour)}`)
  }
  if (block.kind === 'marquee') {
    rules.push(
      `font-size:${asNumber(p.size, 22)}px`,
      `--kob-run:${Math.max(3, asNumber(p.speed, 18))}s`,
      `--kob-way:${p.direction === 'right' ? 'reverse' : 'normal'}`,
    )
    if (asColour(p.colour)) rules.push(`color:${asColour(p.colour)}`)
  }
  if (block.kind === 'links') {
    rules.push(
      `--kob-btn-bg:${asColour(p.colour) || '#1B34E8'}`,
      `--kob-btn-fg:${asColour(p.text) || '#ffffff'}`,
      `--kob-btn-radius:${asNumber(p.radius, 10)}px`,
      `--kob-gap:${asNumber(p.gap, 8)}px`,
    )
  }
  if (block.kind === 'image') {
    rules.push(`border-radius:${asNumber(p.radius, 12)}px`, 'overflow:hidden')
    rules.push(`--kob-fit:${p.fit === 'contain' ? 'contain' : 'cover'}`)
  }
  if (block.kind === 'video') {
    rules.push(`border-radius:${asNumber(p.radius, 12)}px`, 'overflow:hidden')
  }
  if (block.kind === 'button') {
    rules.push(
      `--kob-btn-bg:${asColour(p.colour) || '#1B34E8'}`,
      `--kob-btn-fg:${asColour(p.text) || '#ffffff'}`,
      `--kob-btn-radius:${asNumber(p.radius, 12)}px`,
      `font-size:${asNumber(p.size, 15)}px`,
    )
  }
  if (block.kind === 'divider') {
    rules.push(`--kob-hr:${asColour(p.colour) || '#ffffff33'}`, `--kob-hr-size:${asNumber(p.thickness, 2)}px`)
  }
  if (block.kind === 'donate') {
    rules.push(
      `--kob-btn-bg:${asColour(p.colour) || '#1CAE71'}`,
      `--kob-btn-fg:${asColour(p.text) || '#ffffff'}`,
      `--kob-btn-radius:${asNumber(p.radius, 12)}px`,
    )
  }
  if (block.kind === 'audio') {
    rules.push(`--kob-btn-bg:${asColour(p.colour) || '#1B34E8'}`)
  }
  if (block.kind === 'gallery') {
    rules.push(
      `--kob-cols:${Math.max(1, asNumber(p.columns, 3))}`,
      `--kob-radius:${asNumber(p.radius, 12)}px`,
      `--kob-gap:${asNumber(p.gap, 10)}px`,
    )
  }

  return rules.join(';')
}

/** The stylesheet every built page shares. */
function pageStyles(page: Page) {
  const tallest = page.blocks.reduce((low, block) => Math.max(low, block.y + block.h), 400)

  const faces = fontsUsed(page)
    .map((reference) => `@font-face {
  font-family: "${familyFor(reference)}";
  src: url("kob://${reference}");
  font-display: swap;
}`)
    .join('\n\n')

  const backdrop = asReference(page.backdrop)
  const behind = backdrop
    ? `
  background-image: url("${backdrop}");
  background-size: ${page.backdropFit === 'tile' ? 'auto' : 'cover'};
  background-repeat: ${page.backdropFit === 'tile' ? 'repeat' : 'no-repeat'};
  background-position: center;
  background-attachment: ${page.backdropFit === 'fixed' ? 'fixed' : 'scroll'};`
    : ''

  return `${faces}${faces ? '\n\n' : ''}:root { --kob-fg: ${page.text}; }

* { box-sizing: border-box; }

body {
  margin: 0;
  background: ${page.background};
  color: ${page.text};
  font-family: ${fontStack(page.font) || BUILT_IN_FONTS.sans};${behind}
}

.kob-page {
  position: relative;
  width: ${page.width}px;
  min-height: ${tallest + 80}px;
  margin: 0 auto;
}

.kob-block { position: absolute; }

.kob-h, .kob-p { margin: 0; }

.kob-quote { margin: 0; height: 100%; padding-left: 18px; border-left: 4px solid var(--kob-accent, #1B34E8); }
.kob-quote p { margin: 0; line-height: 1.45; }
.kob-quote cite { display: block; margin-top: 8px; font-size: .6em; font-style: normal; opacity: .7; }

.kob-marquee { overflow: hidden; width: 100%; height: 100%; display: flex; align-items: center; }
.kob-marquee-run {
  display: flex;
  gap: 2em;
  white-space: nowrap;
  animation: kob-slide var(--kob-run, 18s) linear infinite var(--kob-way, normal);
}
@keyframes kob-slide { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .kob-marquee-run { animation: none; } }

.kob-links { display: flex; flex-direction: column; gap: var(--kob-gap, 8px); height: 100%; }
.kob-links a {
  display: flex; align-items: center; padding: 0 14px; min-height: 40px; flex: 1;
  text-decoration: none; font-weight: 700;
  background: var(--kob-btn-bg, #1B34E8); color: var(--kob-btn-fg, #fff);
  border-radius: var(--kob-btn-radius, 10px);
}
.kob-links a:hover { filter: brightness(1.12); }

.kob-img, .kob-video { width: 100%; height: 100%; object-fit: var(--kob-fit, cover); display: block; border-radius: inherit; }
.kob-img-link { display: block; width: 100%; height: 100%; border-radius: inherit; }

.kob-grid {
  display: grid;
  grid-template-columns: repeat(var(--kob-cols, 3), 1fr);
  gap: var(--kob-gap, 10px);
  width: 100%;
  height: 100%;
}
.kob-grid img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--kob-radius, 12px); }

.kob-btn, .kob-donate {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5em;
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
.kob-btn:hover, .kob-donate:hover { filter: brightness(1.12); }
.kob-brix { flex: none; }

.kob-hr {
  border: 0;
  width: 100%;
  height: var(--kob-hr-size, 2px);
  background: var(--kob-hr, #ffffff33);
  margin: 0;
}

/* The player, the same one Create uses. */
.kob-player {
  display: flex; align-items: center; gap: 12px;
  width: 100%; height: 100%; padding: 10px 12px;
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 14px;
  background: rgba(255,255,255,.05);
}
.kob-player-body { min-width: 0; flex: 1; }
.kob-face { flex: none; width: 64px; height: 64px; border-radius: 10px; overflow: hidden; background: rgba(255,255,255,.08); }
.kob-face img { width: 100%; height: 100%; object-fit: cover; display: block; }
.kob-said { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
.kob-said-title { font-size: 13px; font-weight: 700; }
.kob-said-by { font-size: 11px; opacity: .6; }
.kob-controls { display: flex; align-items: center; gap: 10px; }
.kob-play, .kob-mute {
  display: grid; place-items: center; flex: none; border: 0; cursor: pointer; color: inherit;
  background: transparent; padding: 0;
}
.kob-play {
  width: 36px; height: 36px; border-radius: 999px;
  background: var(--kob-btn-bg, #1B34E8); color: #fff; font-size: 13px;
}
.kob-mute { width: 28px; height: 28px; font-size: 13px; opacity: .7; }
.kob-mute:hover { opacity: 1; }
.kob-i-pause, .kob-i-quiet { display: none; }
[data-playing] .kob-i-play, [data-quiet] .kob-i-loud { display: none; }
[data-playing] .kob-i-pause, [data-quiet] .kob-i-quiet { display: inline-block; }
.kob-clock { font-size: 11px; opacity: .7; font-variant-numeric: tabular-nums; flex: none; min-width: 32px; }
.kob-clock-end { text-align: right; }
.kob-bar { position: relative; flex: 1; height: 18px; cursor: pointer; touch-action: none; }
.kob-bar-track, .kob-bar-fill {
  position: absolute; left: 0; top: 50%; height: 5px; transform: translateY(-50%); border-radius: 999px;
}
.kob-bar-track { right: 0; background: rgba(255,255,255,.18); }
.kob-bar-fill { width: 0; background: var(--kob-btn-bg, #1B34E8); }
.kob-bar-knob {
  position: absolute; left: 0; top: 50%; width: 12px; height: 12px; margin-left: -6px;
  transform: translateY(-50%); border-radius: 999px; background: #fff; opacity: 0; transition: opacity .12s;
}
.kob-bar:hover .kob-bar-knob, .kob-bar:focus-visible .kob-bar-knob { opacity: 1; }
.kob-player.is-mini { padding: 6px 10px; }
.kob-player.is-mini .kob-play { width: 30px; height: 30px; font-size: 11px; }

.kob-ambient { width: 100%; height: 100%; display: flex; align-items: center; }
.kob-ambient-btn {
  display: inline-flex; align-items: center; gap: .5em; height: 100%; width: 100%;
  border: 1px solid rgba(255,255,255,.16); border-radius: 12px;
  background: rgba(255,255,255,.05); color: inherit; font: inherit; font-weight: 700; cursor: pointer;
  padding: 0 14px;
}

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
    transform: none !important;
  }
  .kob-img, .kob-video { height: auto; }
  .kob-ad { height: auto; aspect-ratio: 8 / 1; }
  .kob-links a { flex: none; }
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
