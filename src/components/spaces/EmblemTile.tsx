import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye } from '@fortawesome/free-solid-svg-icons'
import { useAssetRef } from '@/hooks/useSignedUrl'
import { fallbackFor } from '@/components/spaces/SpaceCard'
import { formatCount } from '@/lib/format'
import { spaceLink } from '@/lib/links'
import { cn } from '@/lib/cn'
import type { Space } from '@/types/db'

/**
 * A Space by its emblem: the badge, square, with the name under it.
 *
 * This is for a row of places somebody already knows, where the emblem is the
 * thing they recognise. Somewhere they have never been gets the picture of it
 * instead, because a badge means nothing yet.
 */
export function EmblemTile({ space, className }: { space: Space; className?: string }) {
  const picture = useAssetRef(space.emblem_url ?? space.cover_url ?? space.thumbnail_urls?.[0] ?? null)
    ?? fallbackFor(space)

  return (
    <Link
      to={spaceLink(space)}
      className={cn('group block w-32 shrink-0 sm:w-36', className)}
    >
      <span className="block aspect-square overflow-hidden rounded-2xl bg-media ring-1 ring-ink-line transition-[transform,box-shadow] duration-200 group-hover:-translate-y-0.5 group-hover:ring-brand/70">
        <img src={picture} alt="" loading="lazy" className="h-full w-full object-cover" />
      </span>
      <span className="mt-1.5 block truncate text-sm font-bold">{space.name}</span>
      <span className="flex items-center gap-1 text-[11px] font-bold text-muted">
        <FontAwesomeIcon icon={faEye} />
        {formatCount(space.visit_count ?? 0)}
      </span>
    </Link>
  )
}
