import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { formatCount } from '@/lib/format'
import type { Community } from '@/types/db'
import { communityLink } from '@/lib/links'

/** One Community in a grid: emblem, name, how many are in it. */
export function CommunityCard({ community }: { community: Community }) {
  const { name, icon_url: icon } = community
  return (
    <Link
      to={communityLink(community)}
      className="flex items-center gap-3 rounded-xl border border-ink-line bg-ink-card p-3 transition-colors hover:border-brand/60"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-deep font-display text-base font-extrabold">
        {icon ? <img src={icon} alt="" className="h-full w-full object-cover" /> : name.slice(0, 2).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-bold">{name}</span>
          {community.is_verified && (
            <FontAwesomeIcon icon={faCircleCheck} className="shrink-0 text-xs text-[#4d68ff]" />
          )}
        </span>
        <span className="block text-xs text-muted">{formatCount(community.member_count)} members</span>
      </span>
    </Link>
  )
}
