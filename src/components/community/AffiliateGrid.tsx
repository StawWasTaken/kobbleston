import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark, faEllipsis } from '@fortawesome/free-solid-svg-icons'
import { Menu } from '@/components/ui/Menu'
import { Skeleton } from '@/components/ui/States'
import { formatCount } from '@/lib/format'
import type { CommunityRelation } from '@/types/db'

export function AffiliateGrid({
  title, relations, loading, empty, onRemove, onAnswer,
}: {
  title?: string
  relations: CommunityRelation[] | null
  loading: boolean
  empty: string
  onRemove?: (otherId: string) => void
  onAnswer?: (otherId: string, accept: boolean) => void
}) {
  return (
    <section>
      {title && <h3 className="mb-3 font-display text-lg font-extrabold">{title}</h3>}

      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      )}

      {!loading && !relations?.length && <p className="text-sm text-muted">{empty}</p>}

      {!!relations?.length && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {relations.map((other) => (
            <article
              key={other.id}
              className="relative rounded-xl border border-ink-line bg-ink-card p-3 text-center transition-colors hover:border-brand/60"
            >
              {onRemove && (
                <span className="absolute right-1.5 top-1.5">
                  <Menu
                    label={`Options for ${other.name}`}
                    trigger={
                      <span className="grid h-6 w-6 place-items-center rounded-md text-white/35 hover:bg-ink-hover hover:text-white">
                        <FontAwesomeIcon icon={faEllipsis} className="text-xs" />
                      </span>
                    }
                    items={[{ label: 'Remove', onSelect: () => onRemove(other.id), danger: true }]}
                  />
                </span>
              )}

              <Link to={`/c/${other.slug}`} className="block">
                <span className="mx-auto grid h-14 w-14 place-items-center overflow-hidden rounded-xl bg-brand-deep font-display text-base font-extrabold">
                  {other.icon_url
                    ? <img src={other.icon_url} alt="" className="h-full w-full object-cover" />
                    : other.name.slice(0, 2).toUpperCase()}
                </span>
                <p className="mt-2 truncate text-sm font-bold">{other.name}</p>
                <p className="text-xs text-muted">{formatCount(other.member_count)} members</p>
              </Link>

              {onAnswer && other.incoming && (
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={() => onAnswer(other.id, true)}
                    className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded-lg bg-brand text-xs font-bold text-white hover:bg-brand-bright"
                  >
                    <FontAwesomeIcon icon={faCheck} className="text-[10px]" /> Accept
                  </button>
                  <button
                    onClick={() => onAnswer(other.id, false)}
                    aria-label={`Decline ${other.name}`}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-ink-line text-white/50 hover:bg-ink-hover hover:text-white"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                  </button>
                </div>
              )}

              {onAnswer && !other.incoming && (
                <p className="mt-2 text-[11px] font-semibold text-white/40">Waiting on them</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
