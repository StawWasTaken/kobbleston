import { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDoorClosed, faExpand } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Kobby } from '@/components/brand/Kobby'
import { SpaceChat } from './SpaceChat'
import type { Space } from '@/types/db'

/**
 * What you get after entering: the Space itself, with its chat docked inside
 * rather than sitting on the page you came from.
 *
 * The page a Space holds is not built yet, so this says so plainly instead of
 * faking a website. The editor that fills it is planned in docs/editor.md.
 */
export function SpaceViewer({ space, onLeave }: { space: Space; onLeave: () => void }) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b-2 border-brand-ink bg-brand-deep px-3">
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
          className="grid h-8 w-8 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/15 hover:text-white"
        >
          <FontAwesomeIcon icon={faExpand} />
        </button>
        <Button size="sm" variant="subtle" icon={faDoorClosed} onClick={onLeave}>Leave</Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="grid flex-1 place-items-center p-6">
          <div className="max-w-md text-center">
            <Kobby mood="construction" size="lg" className="mx-auto" />
            <h2 className="mt-5 font-display text-2xl font-extrabold">Nothing built here yet</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              This is where the page {space.name} holds will load once its owner builds one.
              The editor is still being made.
            </p>
          </div>
        </div>

        <aside className="w-full shrink-0 border-t border-ink-line p-3 lg:w-80 lg:border-l lg:border-t-0">
          <SpaceChat space={space} />
        </aside>
      </div>
    </div>
  )
}
