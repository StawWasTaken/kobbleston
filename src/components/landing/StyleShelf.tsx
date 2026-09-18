import { Marquee } from '@/components/landing/Marquee'
import { Skeleton } from '@/components/ui/States'
import { StyleLayer } from '@/components/style/StyleLayer'
import { Kube } from '@/components/brand/Kube'
import { defaultAvatars } from '@/lib/avatars'
import { asWorn } from '@/lib/api'
import type { StyleItem } from '@/lib/api'
import { formatCount } from '@/lib/format'

/**
 * Things to wear, drifting past on a face.
 *
 * A hat lying on its own tells nobody anything, so each one is shown on one
 * of the Kobbleston faces, exactly where whoever made it put it. The faces
 * are dealt round so the shelf does not read as the same picture eight
 * times.
 */
export function StyleShelf({ items, loading }: { items: StyleItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex gap-5 overflow-hidden px-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[15rem] w-[13rem] shrink-0 rounded-[1.5rem]" />
        ))}
      </div>
    )
  }

  return (
    <Marquee seconds={72}>
      {items.map((item, i) => (
        <article
          key={item.id}
          className="w-[13rem] shrink-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-ink-card"
        >
          <div className="grid aspect-square place-items-center bg-ink-raised p-7">
            <span className="relative block h-full w-full">
              <StyleLayer items={[asWorn(item)]} layer={0} />
              <span className="relative block h-full w-full overflow-hidden rounded-full border border-white/10">
                <img
                  src={defaultAvatars[i % defaultAvatars.length]}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </span>
              <StyleLayer items={[asWorn(item)]} layer={1} />
            </span>
          </div>

          <div className="border-t border-white/10 p-3.5">
            <p className="truncate text-sm font-bold">{item.name}</p>
            <p className="truncate text-xs text-white/45">By @{item.creator_username}</p>
            <p className="mt-1.5 flex items-center gap-1 text-sm font-extrabold">
              {item.price > 0 ? (
                <>
                  <Kube className="h-3.5 w-3.5" />
                  {formatCount(item.price)}
                </>
              ) : 'Free'}
            </p>
          </div>
        </article>
      ))}
    </Marquee>
  )
}
