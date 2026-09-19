import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRectangleAd, faMusic, faLock, faVolumeHigh } from '@fortawesome/free-solid-svg-icons'
import { AD_SIZES, GRID, fontStack, snap } from '@/lib/blocks'
import { CurrencyMark } from '@/components/brand/Currency'
import type { Block, Page } from '@/lib/blocks'
import { RefImage } from '@/components/create/RefImage'
import { cn } from '@/lib/cn'

/** The eight things you can grab to change a block's size. */
const HANDLES = [
  { at: 'nw', style: 'left-0 top-0 cursor-nwse-resize' },
  { at: 'n', style: 'left-1/2 top-0 -translate-x-1/2 cursor-ns-resize' },
  { at: 'ne', style: 'right-0 top-0 cursor-nesw-resize' },
  { at: 'e', style: 'right-0 top-1/2 -translate-y-1/2 cursor-ew-resize' },
  { at: 'se', style: 'bottom-0 right-0 cursor-nwse-resize' },
  { at: 's', style: 'bottom-0 left-1/2 -translate-x-1/2 cursor-ns-resize' },
  { at: 'sw', style: 'bottom-0 left-0 cursor-nesw-resize' },
  { at: 'w', style: 'left-0 top-1/2 -translate-y-1/2 cursor-ew-resize' },
] as const

type Drag =
  | { kind: 'move'; id: string; fromX: number; fromY: number; startX: number; startY: number }
  | { kind: 'size'; id: string; at: string; box: Block; startX: number; startY: number }

/** What a block looks like while it is being arranged, before it is compiled. */
function Preview({ block }: { block: Block }) {
  const p = block.props

  switch (block.kind) {
    case 'heading':
      return (
        <p
          style={{ fontSize: Number(p.size), textAlign: p.align as 'left', color: String(p.colour || 'inherit') }}
          className="m-0 font-bold leading-tight"
        >
          {String(p.text)}
        </p>
      )

    case 'text':
      return (
        <p
          style={{ fontSize: Number(p.size), textAlign: p.align as 'left', color: String(p.colour || 'inherit') }}
          className="m-0 whitespace-pre-wrap leading-relaxed"
        >
          {String(p.text)}
        </p>
      )

    case 'image':
      return p.tag ? (
        <RefImage
          value={`kob://${String(p.tag).toUpperCase()}`}
          alt=""
          className="h-full w-full object-cover"
          style={{ borderRadius: Number(p.radius) }}
        />
      ) : (
        <Empty>Pick a picture</Empty>
      )

    case 'gallery': {
      const tags = (Array.isArray(p.tags) ? p.tags : []) as string[]
      if (!tags.length) return <Empty>Pick some pictures</Empty>
      return (
        <div
          className="grid h-full w-full gap-2"
          style={{ gridTemplateColumns: `repeat(${Number(p.columns) || 3}, 1fr)` }}
        >
          {tags.map((tag, i) => (
            <RefImage
              key={`${tag}-${i}`}
              value={`kob://${tag.toUpperCase()}`}
              alt=""
              className="h-full w-full object-cover"
              style={{ borderRadius: Number(p.radius) }}
            />
          ))}
        </div>
      )
    }

    case 'button':
    case 'donate':
      return (
        <span
          style={{
            background: String(p.colour),
            color: String(p.text ?? '#fff'),
            borderRadius: Number(p.radius ?? 12),
            fontSize: block.kind === 'button' ? Number(p.size) || 15 : undefined,
          }}
          className="grid h-full w-full place-items-center font-bold"
        >
          <span className="inline-flex items-center gap-2">
            {block.kind === 'donate' && p.icon !== false && <CurrencyMark />}
            {String(p.label)}
          </span>
        </span>
      )

    case 'quote':
      return (
        <blockquote
          style={{ fontSize: Number(p.size), color: String(p.colour || 'inherit'), borderColor: String(p.accent) }}
          className="m-0 h-full border-l-4 pl-4"
        >
          <p className="m-0 whitespace-pre-wrap leading-snug">{String(p.text)}</p>
          {!!p.who && <cite className="mt-2 block text-[.6em] not-italic opacity-70">{String(p.who)}</cite>}
        </blockquote>
      )

    case 'marquee':
      return (
        <span
          style={{ fontSize: Number(p.size), color: String(p.colour || 'inherit') }}
          className="flex h-full w-full items-center overflow-hidden whitespace-nowrap"
        >
          {String(p.text)}
        </span>
      )

    case 'links': {
      const items = (Array.isArray(p.items) ? p.items : []) as string[]
      if (!items.length) return <Empty>Add some links</Empty>
      return (
        <span className="flex h-full w-full flex-col" style={{ gap: Number(p.gap) || 8 }}>
          {items.map((line, i) => (
            <span
              key={`${line}-${i}`}
              style={{
                background: String(p.colour),
                color: String(p.text),
                borderRadius: Number(p.radius) || 10,
              }}
              className="flex flex-1 items-center truncate px-3.5 text-xs font-bold"
            >
              {(line.split('|')[0] || line).trim()}
            </span>
          ))}
        </span>
      )
    }

    case 'divider':
      return (
        <span
          style={{ background: String(p.colour), height: Number(p.thickness) }}
          className="block w-full"
        />
      )

    case 'video':
      return p.tag ? <Empty>{String(p.tag).toUpperCase()}</Empty> : <Empty>Pick a clip</Empty>

    case 'audio': {
      if (!p.tag) return <Empty>Pick a sound</Empty>
      if (p.mode === 'loop') {
        return (
          <span className="flex h-full w-full items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 text-xs font-bold">
            <FontAwesomeIcon icon={faVolumeHigh} />
            {String(p.title || 'Sound')}
          </span>
        )
      }
      return (
        <span className="flex h-full w-full items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-3">
          {p.skin === 'cover' && (
            <span className="h-14 w-14 shrink-0 rounded-lg bg-white/10" />
          )}
          <span
            style={{ background: String(p.colour) }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] text-white"
          >
            <FontAwesomeIcon icon={faMusic} />
          </span>
          <span className="min-w-0 flex-1">
            {p.skin !== 'mini' && (
              <span className="block truncate text-[11px] font-bold">
                {String(p.title || String(p.tag).toUpperCase())}
              </span>
            )}
            <span className="mt-1.5 block h-1.5 w-full rounded-full bg-white/15">
              <span
                style={{ background: String(p.colour) }}
                className="block h-full w-1/3 rounded-full"
              />
            </span>
          </span>
        </span>
      )
    }

    case 'ad':
      return (
        <span className="grid h-full w-full place-items-center rounded-lg border border-dashed border-white/30 text-[11px] font-bold uppercase tracking-wide text-white/50">
          <span className="inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faRectangleAd} />
            {AD_SIZES[String(p.size)]?.label ?? 'Ad'}
          </span>
        </span>
      )

    case 'box':
      return (
        <span
          style={{
            background: String(p.colour),
            border: `1px solid ${String(p.border)}`,
            borderRadius: Number(p.radius),
          }}
          className="block h-full w-full"
        />
      )

    default:
      return null
  }
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-full w-full place-items-center rounded-xl border border-dashed border-current text-[11px] opacity-50">
      {children}
    </span>
  )
}

/**
 * The page as a canvas: blocks sit where they were put, are dragged by their
 * middle and resized by their corners, and snap to a ten pixel grid so a page
 * lines up without anybody measuring anything.
 */
export function Canvas({
  page, selected, onSelect, onChange, zoom,
}: {
  page: Page
  selected: string | null
  onSelect: (id: string | null) => void
  onChange: (blocks: Block[]) => void
  zoom: number
}) {
  const surface = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<Drag | null>(null)

  useEffect(() => {
    if (!drag) return

    const move = (e: PointerEvent) => {
      const dx = (e.clientX - drag.startX) / zoom
      const dy = (e.clientY - drag.startY) / zoom

      onChange(page.blocks.map((block) => {
        if (block.id !== drag.id || block.locked) return block

        if (drag.kind === 'move') {
          return {
            ...block,
            x: Math.max(0, snap(drag.fromX + dx)),
            y: Math.max(0, snap(drag.fromY + dy)),
          }
        }

        const box = drag.box
        let { x, y, w, h } = box

        if (drag.at.includes('e')) w = Math.max(GRID * 2, snap(box.w + dx))
        if (drag.at.includes('s')) h = Math.max(GRID * 2, snap(box.h + dy))
        if (drag.at.includes('w')) {
          const next = Math.max(0, snap(box.x + dx))
          w = Math.max(GRID * 2, box.w + (box.x - next))
          x = next
        }
        if (drag.at.includes('n')) {
          const next = Math.max(0, snap(box.y + dy))
          h = Math.max(GRID * 2, box.h + (box.y - next))
          y = next
        }

        return { ...block, x, y, w, h }
      }))
    }

    const up = () => setDrag(null)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [drag, page.blocks, onChange, zoom])

  // Arrow keys nudge, because a mouse is not always the right tool.
  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => {
      if (!e.key.startsWith('Arrow')) return
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      e.preventDefault()
      const step = e.shiftKey ? GRID * 5 : GRID
      onChange(page.blocks.map((block) => (block.id === selected && !block.locked
        ? {
            ...block,
            x: Math.max(0, block.x + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0)),
            y: Math.max(0, block.y + (e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0)),
          }
        : block)))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, page.blocks, onChange])

  const tallest = page.blocks.reduce((low, block) => Math.max(low, block.y + block.h), 600)

  return (
    <div className="h-full overflow-auto bg-ink-raised/40 p-8 kob-scroll" onPointerDown={() => onSelect(null)}>
      <div
        ref={surface}
        style={{
          width: page.width,
          height: tallest + 120,
          background: page.background,
          color: page.text,
          fontFamily: fontStack(page.font) || undefined,
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
          backgroundSize: `${GRID * 4}px ${GRID * 4}px`,
        }}
        className="relative mx-auto shadow-pop"
      >
        {page.blocks.map((block) => (
          <div
            key={block.id}
            onPointerDown={(e) => {
              e.stopPropagation()
              onSelect(block.id)
              if (block.locked) return
              setDrag({
                kind: 'move',
                id: block.id,
                fromX: block.x,
                fromY: block.y,
                startX: e.clientX,
                startY: e.clientY,
              })
            }}
            style={{
              left: block.x,
              top: block.y,
              width: block.w,
              height: block.h,
              background: String(block.props.bg ?? ''),
              borderRadius: Number(block.props.radius) || undefined,
              border: Number(block.props.borderWidth)
                ? `${Number(block.props.borderWidth)}px solid ${String(block.props.border)}`
                : undefined,
              boxShadow: Number(block.props.shadow)
                ? `0 ${Math.round(Number(block.props.shadow) / 2)}px ${Number(block.props.shadow)}px rgba(0,0,0,.45)`
                : undefined,
              opacity: (Number(block.props.opacity ?? 100)) / 100,
              transform: Number(block.props.rotate) ? `rotate(${Number(block.props.rotate)}deg)` : undefined,
              padding: Number(block.props.padding) || undefined,
              fontFamily: fontStack(String(block.props.font ?? '')) || undefined,
            }}
            className={cn(
              'absolute',
              block.locked ? 'cursor-default' : 'cursor-move',
              selected === block.id
                ? 'outline outline-2 outline-offset-2 outline-brand-bright'
                : 'hover:outline hover:outline-1 hover:outline-offset-2 hover:outline-white/25',
            )}
          >
            <Preview block={block} />

            {selected === block.id && block.locked && (
              <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-ink-card text-[9px] text-white/70 ring-1 ring-ink-line">
                <FontAwesomeIcon icon={faLock} />
              </span>
            )}

            {selected === block.id && !block.locked && HANDLES.map((handle) => (
              <span
                key={handle.at}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  setDrag({
                    kind: 'size',
                    id: block.id,
                    at: handle.at,
                    box: block,
                    startX: e.clientX,
                    startY: e.clientY,
                  })
                }}
                className={cn(
                  'absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white bg-brand',
                  handle.style,
                )}
                style={{ margin: 0 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
