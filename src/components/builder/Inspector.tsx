import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faCopy, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { AssetField } from '@/components/builder/AssetField'
import { AD_SIZES, BLOCK_DEFAULTS } from '@/lib/blocks'
import type { Block, Page } from '@/lib/blocks'
import { cn } from '@/lib/cn'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </label>
  )
}

/** A colour, picked or typed, because both are how people work. */
function Colour({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <span className="flex items-center gap-2">
      <input
        type="color"
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#1b34e8'}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-ink-line bg-ink-raised"
        aria-label="Pick a colour"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#1B34E8"
        className="h-9 w-full rounded-lg border border-ink-line bg-ink-raised px-3 text-sm font-semibold focus:border-brand-bright focus:outline-none"
      />
    </span>
  )
}

function Number_({ value, onChange, min = 0, max = 400 }: {
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

  if (!block) {
    return (
      <div className="space-y-4 p-4">
        <p className="font-display text-sm font-extrabold">The page</p>

        <Row label="Background"><Colour value={page.background} onChange={(v) => onPage({ ...page, background: v })} /></Row>
        <Row label="Text colour"><Colour value={page.text} onChange={(v) => onPage({ ...page, text: v })} /></Row>

        <Row label="Font">
          <Select
            label="Font"
            value={page.font}
            onChange={(v) => onPage({ ...page, font: v as Page['font'] })}
            options={[
              { value: 'sans', label: 'Plain' },
              { value: 'serif', label: 'Serif' },
              { value: 'mono', label: 'Typewriter' },
              { value: 'display', label: 'Kobbleston' },
            ]}
          />
        </Row>

        <Row label="Page width">
          <Number_ value={page.width} min={480} max={1600} onChange={(v) => onPage({ ...page, width: v })} />
        </Row>

        <p className="pt-2 text-xs leading-relaxed text-muted">
          Pick a block on the page to change it. Everything narrower than the page width becomes
          one column, in the order things sit down the page.
        </p>
      </div>
    )
  }

  const p = block.props

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate font-display text-sm font-extrabold">
          {BLOCK_DEFAULTS[block.kind].label}
        </p>
        <button
          onClick={() => onLayer(1)}
          aria-label="Bring forward"
          className="grid h-7 w-7 place-items-center rounded-lg text-white/45 hover:bg-ink-hover hover:text-white"
        >
          <FontAwesomeIcon icon={faArrowUp} className="text-xs" />
        </button>
        <button
          onClick={() => onLayer(-1)}
          aria-label="Send back"
          className="grid h-7 w-7 place-items-center rounded-lg text-white/45 hover:bg-ink-hover hover:text-white"
        >
          <FontAwesomeIcon icon={faArrowDown} className="text-xs" />
        </button>
        <button
          onClick={onDuplicate}
          aria-label="Duplicate"
          className="grid h-7 w-7 place-items-center rounded-lg text-white/45 hover:bg-ink-hover hover:text-white"
        >
          <FontAwesomeIcon icon={faCopy} className="text-xs" />
        </button>
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
        <>
          <Row label="Words"><Input value={String(p.text)} onChange={(e) => set('text', e.target.value)} /></Row>
          <Row label="Size"><Number_ value={Number(p.size)} min={12} max={140} onChange={(v) => set('size', v)} /></Row>
        </>
      )}

      {block.kind === 'text' && (
        <>
          <Row label="Words">
            <Textarea value={String(p.text)} onChange={(e) => set('text', e.target.value)} className="min-h-[7rem]" />
          </Row>
          <Row label="Size"><Number_ value={Number(p.size)} min={10} max={60} onChange={(v) => set('size', v)} /></Row>
        </>
      )}

      {(block.kind === 'heading' || block.kind === 'text') && (
        <>
          <Row label="Line up">
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-ink-line p-1">
              {['left', 'center', 'right'].map((side) => (
                <button
                  key={side}
                  onClick={() => set('align', side)}
                  className={cn(
                    'rounded-lg py-1.5 text-xs font-bold capitalize transition-colors',
                    p.align === side ? 'bg-brand text-onbrand' : 'text-white/55 hover:text-white',
                  )}
                >
                  {side === 'center' ? 'centre' : side}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Colour"><Colour value={String(p.colour || page.text)} onChange={(v) => set('colour', v)} /></Row>
        </>
      )}

      {block.kind === 'image' && (
        <>
          <AssetField label="Picture" kind="image" value={String(p.tag)} onChange={(tag) => set('tag', tag)} />
          <Row label="Description for screen readers">
            <Input value={String(p.alt)} onChange={(e) => set('alt', e.target.value)} />
          </Row>
          <Row label="Rounded corners">
            <Number_ value={Number(p.radius)} max={80} onChange={(v) => set('radius', v)} />
          </Row>
        </>
      )}

      {block.kind === 'gallery' && (
        <>
          <Row label="Pictures, one number per line">
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
          <Row label="Columns"><Number_ value={Number(p.columns)} min={1} max={6} onChange={(v) => set('columns', v)} /></Row>
        </>
      )}

      {block.kind === 'button' && (
        <>
          <Row label="Label"><Input value={String(p.label)} onChange={(e) => set('label', e.target.value)} /></Row>
          <Row label="Goes to">
            <Input
              value={String(p.href)}
              onChange={(e) => set('href', e.target.value)}
              placeholder="/discover or https://…"
            />
          </Row>
          <Row label="Colour"><Colour value={String(p.colour)} onChange={(v) => set('colour', v)} /></Row>
          <Row label="Label colour"><Colour value={String(p.text)} onChange={(v) => set('text', v)} /></Row>
        </>
      )}

      {block.kind === 'divider' && (
        <>
          <Row label="Colour"><Colour value={String(p.colour)} onChange={(v) => set('colour', v)} /></Row>
          <Row label="Thickness"><Number_ value={Number(p.thickness)} min={1} max={40} onChange={(v) => set('thickness', v)} /></Row>
        </>
      )}

      {block.kind === 'video' && (
        <AssetField label="Clip" kind="video" value={String(p.tag)} onChange={(tag) => set('tag', tag)} />
      )}

      {block.kind === 'audio' && (
        <>
          <AssetField label="Sound" kind="audio" value={String(p.tag)} onChange={(tag) => set('tag', tag)} />
          <Row label="What to call it"><Input value={String(p.title)} onChange={(e) => set('title', e.target.value)} /></Row>
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
                set('size', v)
                if (size) onBlock({ ...block, w: size.w, h: size.h, props: { ...block.props, size: v } })
              }}
              options={Object.entries(AD_SIZES).map(([value, size]) => ({ value, label: size.label }))}
            />
          </Row>
          <p className="text-xs leading-relaxed text-muted">
            An ad somebody has paid for goes here. You keep 15% of what each view costs, paid in
            Kubes as it adds up. Your own ads are never shown in your own Space.
          </p>
        </>
      )}

      {block.kind === 'donate' && (
        <>
          <Row label="Label"><Input value={String(p.label)} onChange={(e) => set('label', e.target.value)} /></Row>
          <Row label="How many Kubes">
            <Number_ value={Number(p.amount)} min={1} max={10000} onChange={(v) => set('amount', v)} />
          </Row>
          <Row label="Colour"><Colour value={String(p.colour)} onChange={(v) => set('colour', v)} /></Row>
          <p className="text-xs leading-relaxed text-muted">
            Visitors are asked to confirm before anything leaves their account, and nothing is
            promised in return.
          </p>
        </>
      )}

      {block.kind === 'box' && (
        <>
          <Row label="Fill"><Colour value={String(p.colour)} onChange={(v) => set('colour', v)} /></Row>
          <Row label="Edge"><Colour value={String(p.border)} onChange={(v) => set('border', v)} /></Row>
          <Row label="Rounded corners">
            <Number_ value={Number(p.radius)} max={80} onChange={(v) => set('radius', v)} />
          </Row>
        </>
      )}

      {/* ------------------------------------------------------ position */}
      <div className="grid grid-cols-2 gap-3 border-t border-ink-line pt-4">
        <Row label="Across"><Number_ value={block.x} max={4000} onChange={(v) => onBlock({ ...block, x: v })} /></Row>
        <Row label="Down"><Number_ value={block.y} max={8000} onChange={(v) => onBlock({ ...block, y: v })} /></Row>
        <Row label="Width"><Number_ value={block.w} min={20} max={2000} onChange={(v) => onBlock({ ...block, w: v })} /></Row>
        <Row label="Height"><Number_ value={block.h} min={10} max={2000} onChange={(v) => onBlock({ ...block, h: v })} /></Row>
      </div>

      <Button variant="ghost" block icon={faTrash} onClick={onRemove}>Delete this block</Button>
    </div>
  )
}
