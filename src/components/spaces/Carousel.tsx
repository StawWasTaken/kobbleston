import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/cn'

/** The pictures of a Space, with arrows sitting over them. */
export function Carousel({ images, alt }: { images: string[]; alt: string }) {
  const [at, setAt] = useState(0)
  const many = images.length > 1

  const step = (by: number) => setAt((i) => (i + by + images.length) % images.length)

  return (
    <div>
      <div className="group relative overflow-hidden rounded-xl border border-ink-line bg-brand-ink">
        <img src={images[at]} alt={alt} className="aspect-[16/9] w-full object-cover" />

        {many && (
          <>
            {([-1, 1] as const).map((by) => (
              <button
                key={by}
                onClick={() => step(by)}
                aria-label={by === -1 ? 'Previous picture' : 'Next picture'}
                className={cn(
                  'absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full',
                  'bg-black/60 text-white opacity-0 transition-opacity',
                  'hover:bg-black/80 focus-visible:opacity-100 group-hover:opacity-100',
                  by === -1 ? 'left-3' : 'right-3',
                )}
              >
                <FontAwesomeIcon icon={by === -1 ? faChevronLeft : faChevronRight} />
              </button>
            ))}

            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {images.map((url, i) => (
                <span
                  key={url}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === at ? 'w-5 bg-white' : 'w-1.5 bg-white/45',
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {many && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 kob-scroll">
          {images.map((url, i) => (
            <button
              key={url}
              onClick={() => setAt(i)}
              aria-label={`Picture ${i + 1}`}
              aria-pressed={i === at}
              className={cn(
                'h-14 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                i === at ? 'border-brand-bright' : 'border-transparent hover:border-white/25',
              )}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
