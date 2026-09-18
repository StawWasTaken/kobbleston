import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHeading, faAlignLeft, faImage, faImages, faLink, faMinus, faVideo, faMusic,
  faRectangleAd, faHandHoldingHeart, faSquare, faLayerGroup, faEye, faEyeSlash,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { BLOCK_DEFAULTS } from '@/lib/blocks'
import type { Block, BlockKind } from '@/lib/blocks'
import { cn } from '@/lib/cn'

const icons: Record<BlockKind, IconDefinition> = {
  heading: faHeading,
  text: faAlignLeft,
  image: faImage,
  gallery: faImages,
  button: faLink,
  divider: faMinus,
  video: faVideo,
  audio: faMusic,
  ad: faRectangleAd,
  donate: faHandHoldingHeart,
  box: faSquare,
}

const order: BlockKind[] = [
  'heading', 'text', 'image', 'gallery', 'button', 'box', 'divider',
  'video', 'audio', 'ad', 'donate',
]

/**
 * What you can put on a page, and what is already on it. Two lists in one
 * rail, the way a studio keeps its parts and its explorer together.
 */
export function Toolbox({
  blocks, selected, onInsert, onSelect,
}: {
  blocks: Block[]
  selected: string | null
  onInsert: (kind: BlockKind) => void
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex h-full flex-col">
      <p className="px-4 pb-2 pt-3 text-[11px] font-extrabold uppercase tracking-wide text-muted">
        Blocks
      </p>

      <div className="grid grid-cols-2 gap-1.5 px-3">
        {order.map((kind) => (
          <button
            key={kind}
            onClick={() => onInsert(kind)}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-ink-line bg-ink-card px-2 py-3 text-[11px] font-bold transition-colors hover:border-brand/60 hover:bg-ink-hover"
          >
            <FontAwesomeIcon icon={icons[kind]} className="text-base" />
            {BLOCK_DEFAULTS[kind].label}
          </button>
        ))}
      </div>

      <p className="flex items-center gap-2 px-4 pb-2 pt-5 text-[11px] font-extrabold uppercase tracking-wide text-muted">
        <FontAwesomeIcon icon={faLayerGroup} />
        On this page
      </p>

      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 kob-scroll">
        {!blocks.length && (
          <li className="px-2 py-3 text-xs text-muted">Nothing here yet. Add a block.</li>
        )}

        {[...blocks].reverse().map((block) => (
          <li key={block.id}>
            <button
              onClick={() => onSelect(block.id)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors',
                selected === block.id
                  ? 'bg-brand text-onbrand'
                  : 'text-white/60 hover:bg-ink-hover hover:text-white',
              )}
            >
              <FontAwesomeIcon icon={icons[block.kind]} className="text-[11px]" />
              <span className="min-w-0 flex-1 truncate">
                {BLOCK_DEFAULTS[block.kind].label}
                {block.kind === 'heading' || block.kind === 'text'
                  ? ` · ${String(block.props.text).slice(0, 18)}`
                  : ''}
              </span>
              <FontAwesomeIcon
                icon={selected === block.id ? faEye : faEyeSlash}
                className="text-[10px] opacity-40"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
