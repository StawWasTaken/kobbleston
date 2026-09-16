import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAward, faLock } from '@fortawesome/free-solid-svg-icons'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { SpaceBadge } from '@/types/db'

export function BadgeTile({
  badge, earned, className,
}: {
  badge: Pick<SpaceBadge, 'name' | 'description' | 'icon_url' | 'awarded_count'>
  earned?: boolean
  className?: string
}) {
  return (
    <article
      className={cn(
        'flex w-full flex-col items-center rounded-xl border border-ink-line bg-ink-card p-3 text-center',
        !earned && 'opacity-70',
        className,
      )}
    >
      <span
        className={cn(
          'grid h-16 w-16 place-items-center overflow-hidden rounded-xl',
          earned ? 'bg-brand text-white' : 'bg-ink-hover text-white/35',
        )}
      >
        {badge.icon_url ? (
          <img src={badge.icon_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <FontAwesomeIcon icon={earned ? faAward : faLock} className="text-xl" />
        )}
      </span>
      <h3 className="mt-2.5 w-full truncate text-sm font-bold">{badge.name}</h3>
      {badge.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted">{badge.description}</p>
      )}
      <p className="mt-2 text-[11px] text-white/35">
        {formatCount(badge.awarded_count)} earned
      </p>
    </article>
  )
}
