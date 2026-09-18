import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faThumbsUp, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { useAssetRef } from '@/hooks/useSignedUrl'
import { coverFor, fallbackFor } from '@/components/spaces/SpaceCard'
import { spaceLink } from '@/lib/links'
import { formatCount } from '@/lib/format'
import { Verified, isVerified } from '@/components/brand/Verified'
import { Skeleton } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import type { Space } from '@/types/db'

/**
 * A Space on the front page is a poster, not a tile in a grid: the cover
 * fills the frame, the name sits on top of it, and the numbers under it are
 * the real ones. The first one is given the room it deserves and the rest
 * stand beside it, stepped down the page rather than lined up in a row.
 */
function Poster({ space, tall }: { space: Space; tall?: boolean }) {
  const picture = useAssetRef(coverFor(space)) ?? fallbackFor(space)
  const owner = space.owner

  return (
    <Link
      to={spaceLink(space)}
      className={cn(
        'group relative block overflow-hidden rounded-[1.75rem] border border-white/10 bg-media',
        'transition-transform duration-300 hover:-translate-y-1.5',
        tall ? 'aspect-[4/3] sm:aspect-[4/5]' : 'aspect-[16/10]',
      )}
    >
      <img
        src={picture}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />

      <span className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <span className={cn('block font-display font-extrabold leading-tight', tall ? 'text-3xl' : 'text-xl')}>
          {space.name}
        </span>

        {owner && (
          <span className="mt-1 flex items-center gap-1.5 text-sm text-white/65">
            by {owner.display_name}
            {isVerified(owner) && <Verified className="text-[11px]" />}
          </span>
        )}

        <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-white/55">
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faEye} />
            {formatCount(space.visit_count)}
          </span>
          {space.like_count > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={faThumbsUp} />
              {formatCount(space.like_count)}
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5 text-space-bright opacity-0 transition-opacity group-hover:opacity-100">
            Enter
            <FontAwesomeIcon icon={faArrowRight} />
          </span>
        </span>
      </span>
    </Link>
  )
}

export function SpaceStage({ spaces, loading }: { spaces: Space[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Skeleton className="aspect-[5/6] rounded-[1.75rem]" />
        <div className="grid gap-6">
          <Skeleton className="aspect-[16/10] rounded-[1.75rem]" />
          <Skeleton className="aspect-[16/10] rounded-[1.75rem]" />
        </div>
      </div>
    )
  }

  /*
   * How it is laid out depends on how much there is. One Space on its own
   * gets a wide frame rather than a tower; two sit side by side; three or
   * more get the stage, with the first given the room and the rest stepped
   * down beside it.
   */
  if (spaces.length === 1) {
    return (
      <div className="mx-auto max-w-3xl">
        <Poster space={spaces[0]} />
      </div>
    )
  }

  if (spaces.length === 2) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
        {spaces.map((space) => <Poster key={space.id} space={space} />)}
      </div>
    )
  }

  const [lead, ...rest] = spaces

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
      <Poster space={lead} tall />

      <div className="grid content-center gap-6 lg:gap-8 lg:pt-10">
        {rest.slice(0, 2).map((space) => <Poster key={space.id} space={space} />)}
      </div>
    </div>
  )
}
