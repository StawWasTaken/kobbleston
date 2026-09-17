import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faHeart, faArrowRightToBracket, faPenRuler } from '@fortawesome/free-solid-svg-icons'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { formatCount, timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Space, SpaceCategory } from '@/types/db'
import { asset } from '@/lib/asset'
import { avatarOf } from '@/lib/avatars'

export const categoryLabels: Record<SpaceCategory, string> = {
  personal: 'Personal',
  community: 'Community',
  interactive: 'Interactive',
  experiment: 'Experiment',
  story: 'Story',
  fan: 'Fan project',
}

/** Covers are optional; the brand art stands in so the grid never has holes. */
const fallbackCovers = [asset('/brand/banner.png'), asset('/brand/banner2.png'), asset('/brand/banner3.png')]

export function coverFor(space: Space) {
  if (space.cover_url) return space.cover_url
  const seed = space.id.charCodeAt(0) + space.id.charCodeAt(space.id.length - 1)
  return fallbackCovers[seed % fallbackCovers.length]
}

export function SpaceCard({ space, className }: { space: Space; className?: string }) {
  const owner = space.owner
  const href = owner ? `/u/${owner.username}/${space.slug}` : '#'

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-ink-line bg-ink-card shadow-card transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-brand/60',
        className,
      )}
    >
      <Link to={href} className="relative block aspect-[16/9] overflow-hidden bg-brand-ink">
        <img
          src={coverFor(space)}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-card to-transparent" />
        <span className="absolute left-3 top-3">
          <Badge tone="brand">{categoryLabels[space.category]}</Badge>
        </span>
        {!space.is_published && (
          <span className="absolute right-3 top-3">
            <Badge tone="warm" icon={faPenRuler}>Draft</Badge>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate text-base font-extrabold">
          <Link to={href} className="outline-none after:absolute after:inset-0 after:content-['']">
            {space.name}
          </Link>
        </h3>

        {owner && (
          <Link
            to={`/u/${owner.username}`}
            className="relative z-10 mt-1.5 inline-flex w-fit items-center gap-2 text-xs text-muted transition-colors hover:text-white"
          >
            <Avatar src={avatarOf(owner)} name={owner.display_name} size="xs" />
            <span className="truncate">{owner.display_name}</span>
          </Link>
        )}

        {space.description && (
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-white/60">{space.description}</p>
        )}

        <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faEye} /> {formatCount(space.visit_count)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faHeart} /> {formatCount(space.like_count)}
          </span>
          <span className="ml-auto truncate">{timeAgo(space.updated_at)}</span>
        </div>
      </div>

      <div className="relative z-10 border-t border-ink-line px-4 py-3">
        <Link
          to={href}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-space-bright/40 bg-space text-sm font-semibold text-white transition-colors hover:bg-space-bright"
        >
          <FontAwesomeIcon icon={faArrowRightToBracket} />
          Enter
        </Link>
      </div>
    </article>
  )
}
