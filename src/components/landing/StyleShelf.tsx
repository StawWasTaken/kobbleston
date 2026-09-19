import { Skeleton } from '@/components/ui/States'
import { StyleLayer } from '@/components/style/StyleLayer'
import { Price } from '@/components/brand/Currency'
import { defaultAvatars } from '@/lib/avatars'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { asWorn } from '@/lib/api'
import type { StyleItem } from '@/lib/api'
import { cn } from '@/lib/cn'

/**
 * The shop, drifting downwards.
 *
 * Things to wear are a catalogue rather than a shelf, so they come down the
 * page in a grid the way a catalogue does, slowly enough to read. The grid is
 * laid out twice and moved by exactly one copy, so the loop has no seam, and
 * the top and bottom are faded with a mask rather than a painted gradient so
 * it sits on whatever is behind it.
 *
 * Each one is on a face, because a hat lying on its own tells nobody what it
 * looks like worn, and the faces are dealt round so it does not read as the
 * same picture over and over.
 */
export function StyleShelf({ items, loading }: { items: StyleItem[]; loading: boolean }) {
  const still = useReducedMotion()

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
        ))}
      </div>
    )
  }

  // Enough to fill the window twice over, however few there are.
  const run = items.length >= 8 ? items : Array.from(
    { length: Math.ceil(8 / Math.max(1, items.length)) },
    () => items,
  ).flat()

  const grid = (aria?: boolean) => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-hidden={aria || undefined}>
      {run.map((item, i) => (
        <Card key={`${aria ? 'again' : 'first'}-${item.id}-${i}`} item={item} face={i} />
      ))}
    </div>
  )

  if (still) {
    return <div className="max-h-[34rem] overflow-y-auto pr-1 kob-scroll">{grid()}</div>
  }

  return (
    <div
      className="group relative max-h-[34rem] overflow-hidden"
      style={{
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent, black 5rem, black calc(100% - 5rem), transparent)',
        maskImage:
          'linear-gradient(to bottom, transparent, black 5rem, black calc(100% - 5rem), transparent)',
      }}
    >
      <div
        className={cn(
          'flex flex-col gap-4 animate-ticker will-change-transform',
          'group-hover:[animation-play-state:paused]',
        )}
        style={{ animationDuration: `${Math.max(40, run.length * 6)}s` }}
      >
        {grid()}
        {grid(true)}
      </div>
    </div>
  )
}

function Card({ item, face }: { item: StyleItem; face: number }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-ink-card">
      <div className="grid aspect-square place-items-center bg-ink-raised p-6">
        <span className="relative block h-full w-full">
          <StyleLayer items={[asWorn(item)]} layer={0} />
          <span className="relative block h-full w-full overflow-hidden rounded-full border border-white/10">
            <img
              src={defaultAvatars[face % defaultAvatars.length]}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </span>
          <StyleLayer items={[asWorn(item)]} layer={1} />
        </span>
      </div>

      <div className="border-t border-white/10 p-3">
        <p className="truncate text-sm font-bold">{item.name}</p>
        <p className="truncate text-xs text-white/45">By @{item.creator_username}</p>
        <Price amount={item.price} className="mt-1 text-sm font-extrabold" />
      </div>
    </article>
  )
}
