import { Link } from 'react-router-dom'
import { Verified } from '@/components/brand/Verified'
import { Skeleton } from '@/components/ui/States'
import { communityLink } from '@/lib/links'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Community } from '@/types/db'

/**
 * Communities as emblems with room around them, stepped up and down so the
 * row reads as a shelf of badges rather than a table. The emblem is what
 * people recognise, so nothing sits on top of it.
 */
export function CommunityRow({
  communities, loading,
}: {
  communities: Community[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="flex flex-wrap gap-8">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-32 rounded-[2rem]" />)}
      </div>
    )
  }

  return (
    <ul className="flex flex-wrap items-start gap-x-8 gap-y-10 sm:gap-x-12">
      {communities.map((group, index) => (
        <li
          key={group.id}
          className={cn('w-28 sm:w-32', index % 2 === 1 && 'sm:translate-y-8')}
        >
          <Link to={communityLink(group)} className="group block text-center">
            <span className="relative block">
              <span
                aria-hidden="true"
                className="absolute -inset-2 rounded-[2rem] bg-brand/25 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
              />
              <span className={cn(
                  'relative block aspect-square overflow-hidden rounded-[1.75rem] border border-white/10',
                  'transition-transform duration-300 group-hover:-translate-y-1.5',
                  group.icon_url ? '' : 'bg-media',
                )}>
                {group.icon_url ? (
                  <img
                    src={group.icon_url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center font-display text-3xl font-extrabold text-white/70">
                    {group.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </span>
            </span>

            <span className="mt-3 flex items-center justify-center gap-1.5">
              <span className="truncate text-sm font-bold group-hover:text-link">{group.name}</span>
              {group.is_verified && <Verified className="text-[10px]" />}
            </span>
            <span className="block text-xs text-white/40">
              {formatCount(group.member_count)} members
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
