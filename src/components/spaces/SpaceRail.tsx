import { useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { SpaceCard } from './SpaceCard'
import { SpaceCardSkeleton } from '@/components/ui/States'
import type { Space } from '@/types/db'

/**
 * A row of Spaces that scrolls sideways, so a section can hold a lot without
 * pushing everything else off the screen.
 */
export function SpaceRail({
  title,
  spaces,
  loading,
  empty,
}: {
  title: string
  spaces: Space[] | null
  loading: boolean
  empty?: React.ReactNode
}) {
  const track = useRef<HTMLDivElement>(null)

  const nudge = (direction: 1 | -1) => {
    track.current?.scrollBy({ left: direction * (track.current.clientWidth * 0.8), behavior: 'smooth' })
  }

  if (!loading && !spaces?.length && !empty) return null

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="font-display text-xl font-extrabold sm:text-2xl">{title}</h2>
        <div className="ml-auto hidden gap-1 sm:flex">
          {([-1, 1] as const).map((direction) => (
            <button
              key={direction}
              onClick={() => nudge(direction)}
              aria-label={direction === -1 ? `Scroll ${title} left` : `Scroll ${title} right`}
              className="grid h-8 w-8 place-items-center rounded-lg border border-ink-line bg-ink-card text-white/60 transition-colors hover:bg-ink-hover hover:text-white"
            >
              <FontAwesomeIcon icon={direction === -1 ? faChevronLeft : faChevronRight} />
            </button>
          ))}
        </div>
      </div>

      {!loading && !spaces?.length ? (
        empty
      ) : (
        <div
          ref={track}
          className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 kob-scroll"
        >
          {loading
            ? [0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-60 shrink-0"><SpaceCardSkeleton /></div>
              ))
            : spaces!.map((space) => (
                <div key={space.id} className="w-60 shrink-0"><SpaceCard space={space} /></div>
              ))}
        </div>
      )}
    </section>
  )
}
