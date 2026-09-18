import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage, faMusic, faVideo, faFont, faCube } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Marquee } from '@/components/landing/Marquee'
import { Kube } from '@/components/brand/Kube'
import { Verified, isVerified } from '@/components/brand/Verified'
import { Skeleton } from '@/components/ui/States'
import { useSignedUrl } from '@/hooks/useSignedUrl'
import { contentTag } from '@/components/create/AssetTile'
import { cn } from '@/lib/cn'
import type { AssetKind, MarketAsset } from '@/types/db'

const look: Record<AssetKind, { icon: IconDefinition; word: string; wash: string }> = {
  image: { icon: faImage, word: 'Image', wash: 'from-brand/45' },
  audio: { icon: faMusic, word: 'Sound', wash: 'from-space/40' },
  video: { icon: faVideo, word: 'Video', wash: 'from-fuchsia-500/35' },
  font: { icon: faFont, word: 'Font', wash: 'from-amber-400/35' },
  model: { icon: faCube, word: 'Model', wash: 'from-cyan-400/35' },
}

/*
 * A sound has no picture, so instead of a grey square with a note in it,
 * each one gets a shape of its own drawn from its number: the same piece
 * always looks the same, and two pieces never look alike.
 */
function Bars({ seed }: { seed: number }) {
  const heights = Array.from({ length: 22 }, (_, i) => {
    const wave = Math.sin((seed % 97) + i * 0.7) + Math.sin(i * 0.31 + (seed % 13))
    return 18 + Math.round(Math.abs(wave) * 33)
  })

  return (
    <span aria-hidden="true" className="flex h-24 items-end gap-1">
      {heights.map((height, i) => (
        <span
          key={i}
          style={{ height: `${height}%` }}
          className="w-full rounded-full bg-white/70"
        />
      ))}
    </span>
  )
}

/** One piece of work, sized to be looked at rather than counted. */
function Piece({ item }: { item: MarketAsset }) {
  const preview = useSignedUrl(item.thumbnail_path ?? (item.kind === 'image' ? item.file_path : null))
  const tag = contentTag(item.kind, item.content_id)
  const kind = look[item.kind]

  return (
    <Link
      to={tag ? `/create/${tag}` : '/create/marketplace'}
      className="group block w-[17rem] shrink-0 sm:w-[19rem]"
    >
      <span
        className={cn(
          'relative flex aspect-[4/3] items-end overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br to-ink-card p-5',
          kind.wash,
          'transition-transform duration-300 group-hover:-translate-y-1.5',
        )}
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            loading="lazy"
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          />
        ) : (
          <Bars seed={item.content_id ?? item.name.length} />
        )}

        <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide backdrop-blur">
          <FontAwesomeIcon icon={kind.icon} />
          {kind.word}
        </span>

        {tag && (
          <span className="absolute right-5 top-5 rounded-full bg-ink/70 px-3 py-1 font-display text-[11px] font-extrabold tabular-nums backdrop-blur">
            {tag}
          </span>
        )}
      </span>

      <span className="mt-4 flex items-baseline gap-3">
        <span className="min-w-0 flex-1 truncate font-display text-lg font-extrabold group-hover:text-link">
          {item.name}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-extrabold tabular-nums">
          {item.price ? <><Kube />{item.price}</> : <span className="text-space-bright">Free</span>}
        </span>
      </span>

      <span className="mt-0.5 flex items-center gap-1.5 text-sm text-white/45">
        {item.creator_display_name}
        {isVerified({ is_admin: item.creator_is_admin }) && <Verified className="text-[10px]" />}
      </span>
    </Link>
  )
}

export function CreatorShelf({ items, loading }: { items: MarketAsset[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex gap-5 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[16rem] w-[17rem] shrink-0 rounded-[1.5rem]" />
        ))}
      </div>
    )
  }

  const half = Math.ceil(items.length / 2)

  return (
    <div className="space-y-6">
      <Marquee seconds={60}>
        {items.slice(0, half).map((item) => <Piece key={item.id} item={item} />)}
      </Marquee>
      {items.length > half && (
        <Marquee seconds={72} reverse>
          {items.slice(half).map((item) => <Piece key={item.id} item={item} />)}
        </Marquee>
      )}
    </div>
  )
}
