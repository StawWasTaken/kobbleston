import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useExactTitle, useFavicon } from '@/hooks/useTitle'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDoorClosed, faExpand } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Kobby } from '@/components/brand/Kobby'
import { SpaceChat } from './SpaceChat'
import { SiteFrame } from './SiteFrame'
import { Skeleton } from '@/components/ui/States'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { listSpaceFiles } from '@/lib/api'
import type { Space } from '@/types/db'

/**
 * What you get after entering: the Space itself, with its chat docked inside
 * rather than sitting on the page you came from.
 *
 * The page is the owner's own files, drawn in a frame that can do nothing but
 * draw them: no same origin, so it cannot reach this page, its storage or
 * anybody's session. A Space with nothing in it says so rather than pretending.
 */
export function SpaceViewer({ space, onLeave }: { space: Space; onLeave: () => void }) {
  const { profile } = useAuth()
  const site = useAsync(() => listSpaceFiles(space.id, 'live'), [space.id])
  const isOwner = profile?.id === space.owner_id
  // Inside a Space the tab belongs to that Space: its name, and its emblem
  // as the icon. A Space without one keeps ours.
  useExactTitle(space.name)
  useFavicon(space.emblem_url)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b-2 border-brand-ink/40 bg-chrome px-3">
        {space.emblem_url && (
          <img
            src={space.emblem_url}
            alt=""
            className="h-8 w-8 shrink-0 rounded-lg object-cover"
          />
        )}
        <p className="min-w-0 flex-1 truncate font-display text-sm font-extrabold">{space.name}</p>

        <button
          onClick={() => document.documentElement.requestFullscreen?.()}
          aria-label="Fullscreen"
          className="grid h-8 w-8 place-items-center rounded-lg text-onbrand/70 transition-colors hover:bg-onbrand/15 hover:text-onbrand"
        >
          <FontAwesomeIcon icon={faExpand} />
        </button>
        <Button size="sm" variant="subtle" icon={faDoorClosed} onClick={onLeave}>Leave</Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {site.loading && (
          <div className="flex-1 p-6">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        )}

        {!site.loading && !site.data?.length && (
          <div className="grid flex-1 place-items-center p-6">
            <div className="max-w-md text-center">
              <Kobby mood="construction" size="lg" className="mx-auto" />
              <h2 className="mt-5 font-display text-2xl font-extrabold">Nothing built here yet</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {isOwner
                  ? 'This Space is empty. Build a page for it and publish, and this is where it will be.'
                  : `${space.name} has not put anything here yet.`}
              </p>
              {isOwner && (
                <Link
                  to={`/spaces/${space.id}/build`}
                  className="mt-5 inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-bold text-onbrand"
                >
                  Build it
                </Link>
              )}
            </div>
          </div>
        )}

        {!!site.data?.length && (
          <div className="min-h-0 flex-1">
            <SiteFrame files={site.data} title={space.name} spaceId={space.id} />
          </div>
        )}

        <aside className="w-full shrink-0 border-t border-ink-line p-3 lg:w-80 lg:border-l lg:border-t-0">
          <SpaceChat space={space} />
        </aside>
      </div>
    </div>
  )
}
