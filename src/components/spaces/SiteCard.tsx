import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faThumbsUp, faTag } from '@fortawesome/free-solid-svg-icons'
import { Avatar } from '@/components/ui/Avatar'
import { coverFor, fallbackFor, categoryLabels } from '@/components/spaces/SpaceCard'
import { useAssetRef } from '@/hooks/useSignedUrl'
import { formatCount } from '@/lib/format'
import { spaceLink, profileLink } from '@/lib/links'
import { avatarOf } from '@/lib/avatars'
import { cn } from '@/lib/cn'
import type { Space } from '@/types/db'

/**
 * A Space the way a directory of websites shows one: the page itself, big,
 * with the name under it, who made it, and how many people have been.
 *
 * The square tile is for a row inside a page. This is for looking through
 * what exists, where the picture is the point and there is room for it.
 */
export function SiteCard({ space, className }: { space: Space; className?: string }) {
  const owner = space.owner
  const picture = useAssetRef(coverFor(space)) ?? fallbackFor(space)
  const up = space.like_count ?? 0
  const down = space.dislike_count ?? 0
  const score = up + down ? Math.round((up / (up + down)) * 100) : null

  return (
    <article
      className={cn(
        'group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-ink-line bg-ink-card transition-colors hover:border-brand/70',
        className,
      )}
    >
      <Link to={spaceLink(space)} className="relative block aspect-[16/10] overflow-hidden bg-media">
        <img
          src={picture}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {!!space.emblem_url && (
          <span className="absolute bottom-2 left-2 h-9 w-9 overflow-hidden rounded-lg ring-2 ring-ink-card">
            <img src={space.emblem_url} alt="" className="h-full w-full object-cover" />
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        <Link
          to={spaceLink(space)}
          className="truncate font-display text-base font-extrabold text-link hover:underline"
        >
          {space.name}
        </Link>

        {owner && (
          <Link
            to={profileLink(owner)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-white"
          >
            <Avatar src={avatarOf(owner)} name={owner.display_name} size="xs" className="h-4 w-4" />
            <span className="truncate">@{owner.username}</span>
          </Link>
        )}

        {space.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-white/50">{space.description}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] font-bold text-muted">
          <span className="inline-flex items-center gap-1">
            <FontAwesomeIcon icon={faEye} />
            {formatCount(space.visit_count ?? 0)}
          </span>
          {score !== null && (
            <span className="inline-flex items-center gap-1">
              <FontAwesomeIcon icon={faThumbsUp} />
              {score}%
            </span>
          )}
          <span className="inline-flex items-center gap-1 truncate">
            <FontAwesomeIcon icon={faTag} />
            {categoryLabels[space.category]}
            {space.genre && space.genre !== 'other' ? `, ${space.genre}` : ''}
          </span>
        </div>
      </div>
    </article>
  )
}
