import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faThumbsUp, faPenRuler, faUser } from '@fortawesome/free-solid-svg-icons'
import { Badge } from '@/components/ui/Badge'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Space, SpaceCategory } from '@/types/db'
import { asset } from '@/lib/asset'
import { useAssetRef } from '@/hooks/useSignedUrl'
import { spaceLink } from '@/lib/links'
import { Tooltip } from '@/components/ui/Tooltip'

export const categoryLabels: Record<SpaceCategory, string> = {
  personal: 'Personal',
  community: 'Community',
  interactive: 'Interactive',
  experiment: 'Experiment',
  story: 'Story',
  fan: 'Fan project',
}

/** Covers are optional; the brand art stands in so a row never has holes. */
const fallbackCovers = [asset('/brand/banner.png'), asset('/brand/banner2.png'), asset('/brand/banner3.png')]

export function coverFor(space: Space) {
  return space.emblem_url ?? space.cover_url ?? null
}

/** Something to show while nothing else is there, so a row has no holes. */
export function fallbackFor(space: Space) {
  const seed = space.id.charCodeAt(0) + space.id.charCodeAt(space.id.length - 1)
  return fallbackCovers[seed % fallbackCovers.length]
}

/** The share of ratings that are positive, or null when nobody has voted. */
function ratio(space: Space) {
  const up = space.like_count ?? 0
  const down = space.dislike_count ?? 0
  if (up + down === 0) return null
  return Math.round((up / (up + down)) * 100)
}

/**
 * A Space as a tile: the picture does the work, the name sits under it and
 * one honest line of numbers goes beneath that. No description, no card
 * chrome, so a row of them reads as a row rather than a stack of panels.
 */
export function SpaceCard({ space, className }: { space: Space; className?: string }) {
  const owner = space.owner
  const href = owner ? spaceLink(space) : '#'
  const score = ratio(space)
  // A picture may be stored as a reference to Create content rather than a
  // link, so it is resolved before it can be shown.
  const picture = useAssetRef(coverFor(space)) ?? fallbackFor(space)

  return (
    <article className={cn('group relative min-w-0', className)}>
      <Tooltip
        label={owner ? `${space.name} by ${owner.display_name}` : space.name}
        side="top"
      >
      <Link
        to={href}
        className="relative block aspect-square overflow-hidden rounded-xl bg-brand-ink ring-1 ring-ink-line transition-[transform,box-shadow] duration-200 group-hover:-translate-y-0.5 group-hover:ring-brand/70"
      >
        <img
          src={picture}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        {!space.is_published && (
          <span className="absolute left-2 top-2">
            <Badge tone="warm" icon={faPenRuler}>Draft</Badge>
          </span>
        )}
      </Link>
      </Tooltip>

      <h3 className="mt-2 truncate text-sm font-bold">
        <Link to={href} className="outline-none hover:text-link">{space.name}</Link>
      </h3>

      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
        {score === null ? (
          <span className="truncate">{owner ? `By ${owner.display_name}` : 'New'}</span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <FontAwesomeIcon icon={faThumbsUp} />
            {score}%
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1">
          <FontAwesomeIcon icon={faUser} />
          {formatCount(space.visit_count)}
        </span>
      </p>
    </article>
  )
}
