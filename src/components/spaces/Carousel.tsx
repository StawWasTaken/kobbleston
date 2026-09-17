import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { RefImage } from '@/components/create/RefImage'
import { cn } from '@/lib/cn'

/**
 * The pictures of a Space. Every image is stacked and only the current one is
 * opaque, so moving between them is a crossfade rather than a hard swap, and
 * the thumbnail strip fades out at its edges instead of being cut off.
 */
export function Carousel({ images, alt }: { images: string[]; alt: string }) {
  const [at, setAt] = useState(0)
  const many = images.length > 1

  const step = (by: number) => setAt((i) => (i + by + images.length) % images.length)

  return (
    <div>
      <div className="group relative aspect-[16/9] overflow-hidden rounded-xl border border-ink-line bg-media">
        {images.map((url, i) => (
          <span
            key={url}
            aria-hidden={i === at ? undefined : true}
            className={cn(
              'absolute inset-0 transition-opacity duration-500 ease-out',
              i === at ? 'opacity-100' : 'opacity-0',
            )}
          >
            <RefImage value={url} alt={i === at ? alt : ''} className="h-full w-full object-cover" />
          </span>
        ))}

        {many && (
          <>
            {([-1, 1] as const).map((by) => (
              <button
                key={by}
                onClick={() => step(by)}
                aria-label={by === -1 ? 'Previous picture' : 'Next picture'}
                className={cn(
                  'absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full',
                  'bg-black/55 text-white backdrop-blur-sm transition-all duration-200',
                  'hover:bg-black/80 focus-visible:opacity-100',
                  'opacity-0 group-hover:opacity-100',
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
                    'h-1.5 rounded-full transition-all duration-300',
                    i === at ? 'w-5 bg-white' : 'w-1.5 bg-white/45',
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {many && (
        <div
          className="mt-2.5 flex gap-2 overflow-x-auto pb-1 kob-scroll"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 14px, black calc(100% - 14px), transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 14px, black calc(100% - 14px), transparent)',
          }}
        >
          {images.map((url, i) => (
            <button
              key={url}
              onClick={() => setAt(i)}
              aria-label={`Picture ${i + 1}`}
              aria-pressed={i === at}
              className={cn(
                'relative h-16 w-28 shrink-0 overflow-hidden rounded-lg transition-all duration-200',
                i === at ? 'ring-2 ring-white' : 'opacity-55 hover:opacity-100',
              )}
            >
              <RefImage value={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
