import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTrash, faCopy, faArrowUp, faArrowDown, faLock, faLockOpen,
  faAlignLeft, faAlignCenter, faAlignRight, faItalic,
  faObjectGroup, faChevronDown,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ColourPicker } from '@/components/ui/ColourPicker'
import { AssetField } from '@/components/builder/AssetField'
import { FontField } from '@/components/builder/FontField'
import { AD_SIZES, BLOCK_DEFAULTS, BUYABLE_AD_SIZES } from '@/lib/blocks'
import { currency } from '@/lib/currency'
import type { Block, Page } from '@/lib/blocks'
import { cn } from '@/lib/cn'

function Row({ label, children, note }: { label: string; children: React.ReactNode; note?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
      {note && <span className="mt-1 block text-[11px] text-muted">{note}</span>}
    </label>
  )
}

/** A number you can drag as well as type, the way a studio does it. */
function Slider({
  value, onChange, min = 0, max = 100, step = 1, suffix = '',
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
}) {
  return (
    <span className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-[#1B34E8]"
      />
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
        className="h-8 w-16 shrink-0 rounded-lg border border-ink-line bg-ink-raised px-2 text-xs font-bold tabular-nums focus:border-brand-bright focus:outline-none"
      />
      {suffix && <span className="shrink-0 text-[11px] text-muted">{suffix}</span>}
    </span>
  )
}

function Number_({ value, onChange, min = 0, max = 4000 }: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
      className="h-9 w-full rounded-lg border border-ink-line bg-ink-raised px-3 text-sm font-semibold tabular-nums focus:border-brand-bright focus:outline-none"
    />
  )
}

/** A row of choices where only one can be on. */
function Choice<T extends string>({
  value, onChange, options,
}: {
  value: T
  onChange: (next: T) => void
  options: { value: T; label: string; icon?: IconDefinition }[]
}) {
  return (
    <div className="grid gap-1 rounded-xl border border-ink-line p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-bold transition-colors',
            value === option.value ? 'bg-brand text-onbrand' : 'text-white/55 hover:text-white',
          )}
        >
          {option.icon && <FontAwesomeIcon icon={option.icon} />}
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** A part of the panel that can be folded away, because there is a lot here. */
function Fold({
  title, children, open: initial = false,
}: {
  title: string
  children: React.ReactNode
  open?: boolean
}) {
  const [open, setOpen] = useState(initial)
  return (
    <div className="border-t border-ink-line pt-3">
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        className="flex w-full items-center justify-between text-[11px] font-extrabold uppercase tracking-wide text-muted hover:text-white"
      >
        {title}
        <FontAwesomeIcon icon={faChevronDown} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-3 space-y-4">{children}</div>}
    </div>
  )
}

/**
 * Everything about the selected block, and about the page when nothing is
 * selected. One panel, the way a studio does it, rather than a dialog for
 * every change.
 */
export function Inspector({
  page, block, onPage, onBlock, onRemove, onDuplicate, onLayer,
}: {
  page: Page
  block: Block | null
  onPage: (next: Page) => void
  onBlock: (next: Block) => void
  onRemove: () => void
  onDuplicate: () => void
  onLayer: (direction: 1 | -1) => void
}) {
  const set = (key: string, value: unknown) => {
    if (!block) return
    onBlock({ ...block, props: { ...block.props, [key]: value as never } })
  }

  /* ------------------------------------------------------------ the page */
  if (!block) {
    return (
      <div className="space-y-4 p-4">
        <p className="font-display text-sm font-extrabold">The page</p>

        <Row label="Background"><ColourPicker value={page.background} onChange={(v) => onPage({ ...page, background: v })} /></Row>
        <Row label="Text colour"><ColourPicker value={page.text} onChange={(v) => onPage({ ...page, text: v })} /></Row>

        <FontField label="Font" value={page.font} onChange={(v) => onPage({ ...page, font: v })} />

        <Row label="Page width">
          <Slider value={page.width} min={480} max={1600} step={10} suffix="px" onChange={(v) => onPage({ ...page, width: v })} />
        </Row>

        <Fold title="Picture behind everything">
          <AssetField
            label="Backdrop"
            kind="image"
            value={String(page.backdrop ?? '')}
            onChange={(tag) => onPage({ ...page, backdrop: tag })}
          />
          <Row label="How it sits">
            <Choice
              value={page.backdropFit ?? 'cover'}
              onChange={(v) => onPage({ ...page, backdropFit: v })}
              options={[
                { value: 'cover', label: 'Fill' },
                { value: 'tile', label: 'Tile' },
                { value: 'fixed', label: 'Held' },
              ]}
            />
          </Row>
          {!!page.backdrop && (
            <Button size="sm" variant="ghost" onClick={() => onPage({ ...page, backdrop: '' })}>
              Take it off
            </Button>
          )}
        </Fold>

        <p className="pt-2 text-xs leading-relaxed text-muted">
          Pick a block on the page to change it. On a screen narrower than the page, everything
          becomes one column, in the order things sit down the page.
        </p>
      </div>
    )
  }

  const p = block.props
  const centre = () => onBlock({ ...block, x: Math.round((page.width - block.w) / 2) })

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-1">
        <p className="min-w-0 flex-1 truncate font-display text-sm font-extrabold">
          {BLOCK_DEFAULTS[block.kind].label}
        </p>
        {([
          { icon: faArrowUp, label: 'Bring forward', act: () => onLayer(1) },
          { icon: faArrowDown, label: 'Send back', act: () => onLayer(-1) },
          { icon: block.locked ? faLock : faLockOpen, label: block.locked ? 'Unlock' : 'Lock', act: () => onBlock({ ...block, locked: !block.locked }) },
          { icon: faCopy, label: 'Duplicate', act: onDuplicate },
        ] as const).map((one) => (
          <button
            key={one.label}
            onClick={one.act}
            aria-label={one.label}
            className="grid h-7 w-7 place-items-center rounded-lg text-white/45 hover:bg-ink-hover hover:text-white"
          >
            <FontAwesomeIcon icon={one.icon} className="text-xs" />
          </button>
        ))}
        <button
          onClick={onRemove}
          aria-label="Delete"
          className="grid h-7 w-7 place-items-center rounded-lg text-white/45 hover:bg-ink-hover hover:text-danger"
        >
          <FontAwesomeIcon icon={faTrash} className="text-xs" />
        </button>
      </div>

      {/* ------------------------------------------------------ per kind */}
      {block.kind === 'heading' && (
        <Row label="Words"><Input value={String(p.text)} onChange={(e) => set('text', e.target.value)} /></Row>
      )}

      {block.kind === 'text' && (
        <Row label="Words">
          <Textarea value={String(p.text)} onChange={(e) => set('text', e.target.value)} className="min-h-[7rem]" />
        </Row>
      )}

      {(block.kind === 'heading' || block.kind === 'text') && (
        <>
          <Row label="Size">
            <Slider value={Number(p.size)} min={8} max={160} suffix="px" onChange={(v) => set('size', v)} />
          </Row>
          <Row label="Line up">
            <Choice
              value={String(p.align) as 'left'}
              onChange={(v) => set('align', v)}
              options={[
                { value: 'left', label: '', icon: faAlignLeft },
                { value: 'center', label: '', icon: faAlignCenter },
                { value: 'right', label: '', icon: faAlignRight },
              ]}
            />
          </Row>
          <Row label="Colour"><ColourPicker value={String(p.colour || page.text)} onChange={(v) => set('colour', v)} /></Row>
          <FontField label="Font" value={String(p.font ?? '')} onChange={(v) => set('font', v)} inherit />

          <Fold title="Finer points">
            <Row label="Weight">
              <Slider value={Number(p.weight) || 400} min={100} max={900} step={100} onChange={(v) => set('weight', v)} />
            </Row>
            <Row label="Line height">
              <Slider value={Number(p.lineHeight) || 150} min={80} max={280} step={5} suffix="%" onChange={(v) => set('lineHeight', v)} />
            </Row>
            <Row label="Letter spacing">
              <Slider value={Number(p.spacing) || 0} min={-10} max={60} onChange={(v) => set('spacing', v)} />
            </Row>
            <Choice
              value={p.italic ? 'on' : 'off'}
              onChange={(v) => set('italic', v === 'on')}
              options={[{ value: 'off', label: 'Upright' }, { value: 'on', label: 'Slanted', icon: faItalic }]}
            />
          </Fold>
        </>
      )}

      {block.kind === 'quote' && (
        <>
          <Row label="The quote">
            <Textarea value={String(p.text)} onChange={(e) => set('text', e.target.value)} className="min-h-[5rem]" />
          </Row>
          <Row label="Who said it"><Input value={String(p.who)} onChange={(e) => set('who', e.target.value)} /></Row>
          <Row label="Size"><Slider value={Number(p.size)} min={12} max={80} suffix="px" onChange={(v) => set('size', v)} /></Row>
          <Row label="Colour"><ColourPicker value={String(p.colour || page.text)} onChange={(v) => set('colour', v)} /></Row>
          <Row label="The line beside it"><ColourPicker value={String(p.accent)} onChange={(v) => set('accent', v)} /></Row>
          <FontField label="Font" value={String(p.font ?? '')} onChange={(v) => set('font', v)} inherit />
        </>
      )}

      {block.kind === 'marquee' && (
        <>
          <Row label="Words"><Input value={String(p.text)} onChange={(e) => set('text', e.target.value)} /></Row>
          <Row label="Size"><Slider value={Number(p.size)} min={10} max={90} suffix="px" onChange={(v) => set('size', v)} /></Row>
          <Row label="Which way">
            <Choice
              value={String(p.direction) as 'left'}
              onChange={(v) => set('direction', v)}
              options={[{ value: 'left', label: 'Leftwards' }, { value: 'right', label: 'Rightwards' }]}
            />
          </Row>
          <Row
            label="How long one run takes"
            note="Somebody who has asked their machine for less movement gets it standing still."
          >
            <Slider value={Number(p.speed)} min={3} max={90} suffix="s" onChange={(v) => set('speed', v)} />
          </Row>
          <Row label="Colour"><ColourPicker value={String(p.colour || page.text)} onChange={(v) => set('colour', v)} /></Row>
          <FontField label="Font" value={String(p.font ?? '')} onChange={(v) => set('font', v)} inherit />
        </>
      )}

      {block.kind === 'links' && (
        <>
          <Row
            label="One per line"
            note="What it says, then a vertical bar, then where it goes: Discover|/discover"
          >
            <Textarea
              value={(Array.isArray(p.items) ? p.items : []).join('\n')}
              onChange={(e) => set('items', e.target.value.split('\n').map((line) => line.trim()).filter(Boolean))}
              className="min-h-[7rem] font-mono text-xs"
              placeholder={'Discover|/discover\nMy other Space|/s/1042/loud'}
            />
          </Row>
          <Row label="Colour"><ColourPicker value={String(p.colour)} onChange={(v) => set('colour', v)} /></Row>
          <Row label="Words"><ColourPicker value={String(p.text)} onChange={(v) => set('text', v)} /></Row>
          <Row label="Rounded corners"><Slider value={Number(p.radius)} max={40} suffix="px" onChange={(v) => set('radius', v)} /></Row>
          <Row label="Space between"><Slider value={Number(p.gap)} max={40} suffix="px" onChange={(v) => set('gap', v)} /></Row>
        </>
      )}

      {block.kind === 'image' && (
        <>
          <AssetField label="Decal" kind="image" value={String(p.tag)} onChange={(tag) => set('tag', tag)} />
          <Row label="Description for screen readers">
            <Input value={String(p.alt)} onChange={(e) => set('alt', e.target.value)} />
          </Row>
          <Row label="How it fills the box">
            <Choice
              value={String(p.fit) as 'cover'}
              onChange={(v) => set('fit', v)}
              options={[{ value: 'cover', label: 'Fill' }, { value: 'contain', label: 'Whole' }]}
            />
          </Row>
          <Row label="Rounded corners"><Slider value={Number(p.radius)} max={80} suffix="px" onChange={(v) => set('radius', v)} /></Row>
          <Row label="Goes to" note="Leave this empty and it is simply a picture.">
            <Input value={String(p.href)} onChange={(e) => set('href', e.target.value)} placeholder="/discover" />
          </Row>
        </>
      )}

      {block.kind === 'gallery' && (
        <>
          <Row label="Decals, one number per line">
            <Textarea
              value={(Array.isArray(p.tags) ? p.tags : []).join('\n')}
              onChange={(e) => set('tags', e.target.value.split('\n').map((t) => t.trim()).filter(Boolean))}
              className="min-h-[6rem] font-mono text-xs"
              placeholder={'IMG-1042\nIMG-1043'}
            />
          </Row>
          <AssetField
            label="Add one by uploading"
            kind="image"
            value=""
            onChange={(tag) => set('tags', [...(Array.isArray(p.tags) ? p.tags : []), tag])}
          />
          <Row label="Columns"><Slider value={Number(p.columns)} min={1} max={8} onChange={(v) => set('columns', v)} /></Row>
          <Row label="Space between"><Slider value={Number(p.gap)} max={40} suffix="px" onChange={(v) => set('gap', v)} /></Row>
          <Row label="Rounded corners"><Slider value={Number(p.radius)} max={80} suffix="px" onChange={(v) => set('radius', v)} /></Row>
        </>
      )}

      {block.kind === 'button' && (
        <>
          <Row label="Label"><Input value={String(p.label)} onChange={(e) => set('label', e.target.value)} /></Row>
          <Row label="Goes to">
            <Input value={String(p.href)} onChange={(e) => set('href', e.target.value)} placeholder="/discover or https://…" />
          </Row>
          <Row label="Colour"><ColourPicker value={String(p.colour)} onChange={(v) => set('colour', v)} /></Row>
          <Row label="Label colour"><ColourPicker value={String(p.text)} onChange={(v) => set('text', v)} /></Row>
          <Row label="Label size"><Slider value={Number(p.size)} min={10} max={48} suffix="px" onChange={(v) => set('size', v)} /></Row>
          <Row label="Rounded corners"><Slider value={Number(p.radius)} max={40} suffix="px" onChange={(v) => set('radius', v)} /></Row>
          <FontField label="Font" value={String(p.font ?? '')} onChange={(v) => set('font', v)} inherit />
        </>
      )}

      {block.kind === 'divider' && (
        <>
          <Row label="Colour"><ColourPicker value={String(p.colour)} onChange={(v) => set('colour', v)} /></Row>
          <Row label="Thickness"><Slider value={Number(p.thickness)} min={1} max={40} suffix="px" onChange={(v) => set('thickness', v)} /></Row>
        </>
      )}

      {block.kind === 'video' && (
        <>
          <AssetField label="Clip" kind="video" value={String(p.tag)} onChange={(tag) => set('tag', tag)} />
          <Row label="How it behaves">
            <Choice
              value={p.loop ? 'loop' : 'once'}
              onChange={(v) => set('loop', v === 'loop')}
              options={[{ value: 'once', label: 'Plays once' }, { value: 'loop', label: 'Goes round' }]}
            />
          </Row>
          <Row label="Sound">
            <Choice
              value={p.muted ? 'off' : 'on'}
              onChange={(v) => set('muted', v === 'off')}
              options={[{ value: 'off', label: 'Starts quiet' }, { value: 'on', label: 'Starts loud' }]}
            />
          </Row>
          <Row label="Rounded corners"><Slider value={Number(p.radius)} max={60} suffix="px" onChange={(v) => set('radius', v)} /></Row>
        </>
      )}

      {block.kind === 'audio' && (
        <>
          <AssetField label="Sound" kind="audio" value={String(p.tag)} onChange={(tag) => set('tag', tag)} />

          <Row
            label="What it is"
            note={
              p.mode === 'loop'
                ? 'A sound that runs by itself, with one small control to turn it off. Nothing plays until somebody has touched the page.'
                : 'A player, the same one Create uses.'
            }
          >
            <Choice
              value={String(p.mode) as 'player'}
              onChange={(v) => set('mode', v)}
              options={[{ value: 'player', label: 'A player' }, { value: 'loop', label: 'Plays and loops' }]}
            />
          </Row>

          {p.mode !== 'loop' && (
            <>
              <Row label="Which player">
                <Choice
                  value={String(p.skin) as 'full'}
                  onChange={(v) => {
                    set('skin', v)
                    if (v === 'mini') onBlock({ ...block, h: 56, props: { ...block.props, skin: v } })
                    if (v === 'cover') onBlock({ ...block, h: 96, props: { ...block.props, skin: v } })
                  }}
                  options={[
                    { value: 'full', label: 'Full' },
                    { value: 'mini', label: 'Small' },
                    { value: 'cover', label: 'With a cover' },
                  ]}
                />
              </Row>

              <Row label="What to call it"><Input value={String(p.title)} onChange={(e) => set('title', e.target.value)} /></Row>
              <Row label="Who it is by"><Input value={String(p.by)} onChange={(e) => set('by', e.target.value)} /></Row>

              {p.skin === 'cover' && (
                <AssetField label="Cover" kind="image" value={String(p.cover)} onChange={(tag) => set('cover', tag)} />
              )}

              <Row label="When it finishes">
                <Choice
                  value={p.loop ? 'again' : 'stop'}
                  onChange={(v) => set('loop', v === 'again')}
                  options={[{ value: 'stop', label: 'It stops' }, { value: 'again', label: 'It goes again' }]}
                />
              </Row>
            </>
          )}

          {p.mode === 'loop' && (
            <Row label="What to call it"><Input value={String(p.title)} onChange={(e) => set('title', e.target.value)} /></Row>
          )}

          <Row label="Colour"><ColourPicker value={String(p.colour)} onChange={(v) => set('colour', v)} /></Row>
        </>
      )}

      {block.kind === 'ad' && (
        <>
          <Row label="Size">
            <Select
              label="Ad size"
              value={String(p.size)}
              onChange={(v) => {
                const size = AD_SIZES[v]
                if (size) onBlock({ ...block, w: size.w, h: size.h, props: { ...block.props, size: v } })
                else set('size', v)
              }}
              options={BUYABLE_AD_SIZES.map((value) => ({ value, label: AD_SIZES[value].label }))}
            />
          </Row>
          <p className="text-xs leading-relaxed text-muted">
            An ad somebody has paid for goes here. You keep 15% of what each view costs, paid in
            {currency.plural} as it adds up. Your own ads are never shown in your own Space.
          </p>
        </>
      )}

      {block.kind === 'donate' && (
        <>
          <Row label="Label"><Input value={String(p.label)} onChange={(e) => set('label', e.target.value)} /></Row>
          <Row label={`How many ${currency.plural}`}>
            <Slider value={Number(p.amount)} min={1} max={1000} onChange={(v) => set('amount', v)} />
          </Row>
          <Row label="Colour"><ColourPicker value={String(p.colour)} onChange={(v) => set('colour', v)} /></Row>
          <Row label="Label colour"><ColourPicker value={String(p.text)} onChange={(v) => set('text', v)} /></Row>
          <Row label={`The ${currency.name}`}>
            <Choice
              value={p.icon === false ? 'off' : 'on'}
              onChange={(v) => set('icon', v === 'on')}
              options={[{ value: 'on', label: 'Shown' }, { value: 'off', label: 'Hidden' }]}
            />
          </Row>
          <p className="text-xs leading-relaxed text-muted">
            Visitors are asked to confirm before anything leaves their account, and nothing is
            promised in return.
          </p>
        </>
      )}

      {block.kind === 'box' && (
        <>
          <Row label="Fill"><ColourPicker value={String(p.colour)} onChange={(v) => set('colour', v)} /></Row>
          <Row label="Edge"><ColourPicker value={String(p.border)} onChange={(v) => set('border', v)} /></Row>
          <Row label="Rounded corners"><Slider value={Number(p.radius)} max={80} suffix="px" onChange={(v) => set('radius', v)} /></Row>
        </>
      )}

      {/* ---------------------------------------------------------- look */}
      <Fold title="Look">
        <Row label="Behind it"><ColourPicker value={String(p.bg ?? '#00000000')} onChange={(v) => set('bg', v)} /></Row>
        <Row label="Edge"><ColourPicker value={String(p.border ?? '#00000000')} onChange={(v) => set('border', v)} /></Row>
        <Row label="Edge thickness"><Slider value={Number(p.borderWidth) || 0} max={20} suffix="px" onChange={(v) => set('borderWidth', v)} /></Row>
        <Row label="Rounded corners"><Slider value={Number(p.radius) || 0} max={80} suffix="px" onChange={(v) => set('radius', v)} /></Row>
        <Row label="Shadow"><Slider value={Number(p.shadow) || 0} max={60} onChange={(v) => set('shadow', v)} /></Row>
        <Row label="How solid"><Slider value={Number(p.opacity ?? 100)} max={100} suffix="%" onChange={(v) => set('opacity', v)} /></Row>
        <Row label="Turned"><Slider value={Number(p.rotate) || 0} min={-180} max={180} suffix="°" onChange={(v) => set('rotate', v)} /></Row>
        <Row label="Room inside"><Slider value={Number(p.padding) || 0} max={80} suffix="px" onChange={(v) => set('padding', v)} /></Row>
      </Fold>

      {/* ------------------------------------------------------ position */}
      <Fold title="Where it sits" open>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Across"><Number_ value={block.x} onChange={(v) => onBlock({ ...block, x: v })} /></Row>
          <Row label="Down"><Number_ value={block.y} max={8000} onChange={(v) => onBlock({ ...block, y: v })} /></Row>
          <Row label="Width"><Number_ value={block.w} min={20} max={2000} onChange={(v) => onBlock({ ...block, w: v })} /></Row>
          <Row label="Height"><Number_ value={block.h} min={10} max={2000} onChange={(v) => onBlock({ ...block, h: v })} /></Row>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <Button size="sm" variant="subtle" onClick={() => onBlock({ ...block, x: 0 })}>Left</Button>
          <Button size="sm" variant="subtle" icon={faObjectGroup} onClick={centre}>Centre</Button>
          <Button size="sm" variant="subtle" onClick={() => onBlock({ ...block, x: page.width - block.w })}>Right</Button>
        </div>

        <Button
          size="sm"
          variant="subtle"
          block
          onClick={() => onBlock({ ...block, x: 0, w: page.width })}
        >
          As wide as the page
        </Button>
      </Fold>

      <Button variant="ghost" block icon={faTrash} onClick={onRemove}>Delete this block</Button>
    </div>
  )
}
