import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRectangleAd, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { assetUrl, pickAd, recordAdClick } from '@/lib/api'
import type { AdSize, ShownAd } from '@/lib/api'
import { AD_SIZES } from '@/lib/blocks'
import { cn } from '@/lib/cn'

/**
 * One of Kobbleston's own ad slots.
 *
 * The same campaigns that run inside Spaces run here, in the same three
 * shapes, bought the same way. The difference is that nobody owns the page,
 * so nobody takes a share of what a view costs: asking for the ad is what
 * counts the view, which is why it is asked for once and never in a loop.
 *
 * When there is nothing to show, the slot says what it is rather than
 * pretending to be something else or leaving a hole in the page.
 */
export function AdBanner({
  size = 'banner', className, quiet,
}: {
  size?: AdSize
  className?: string
  /** Leave nothing behind when there is no ad, rather than inviting one. */
  quiet?: boolean
}) {
  const navigate = useNavigate()
  const [ad, setAd] = useState<ShownAd | null>(null)
  const [picture, setPicture] = useState<string | null>(null)
  const [asked, setAsked] = useState(false)

  useEffect(() => {
    let live = true

    pickAd(size)
      .then(async (found) => {
        if (!live) return
        setAsked(true)
        if (!found) return
        const url = await assetUrl(found.file_path, 3600).catch(() => null)
        if (!live || !url) return
        setAd(found)
        setPicture(url)
      })
      .catch(() => { if (live) setAsked(true) })

    return () => { live = false }
  }, [size])

  const shape = AD_SIZES[size]
  const frame = { maxWidth: shape.w, aspectRatio: `${shape.w} / ${shape.h}` }

  if (ad && picture) {
    return (
      <aside className={cn('w-full', className)} aria-label="Advertisement">
        <button
          onClick={async () => {
            await recordAdClick(ad.id).catch(() => {})
            if (/^https?:\/\//i.test(ad.target_path)) {
              window.open(ad.target_path, '_blank', 'noopener,noreferrer')
            } else {
              navigate(ad.target_path)
            }
          }}
          style={frame}
          className="group relative block w-full overflow-hidden rounded-xl border border-ink-line bg-ink-card"
        >
          <img
            src={picture}
            alt={ad.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white/80">
            Ad
          </span>
        </button>
      </aside>
    )
  }

  if (!asked || quiet) return null

  return (
    <aside className={cn('w-full', className)} aria-label="Advertisement space">
      <Link
        to="/create/ads"
        style={frame}
        className="group flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-line bg-ink-card/50 px-4 text-center transition-colors hover:border-brand/60 hover:bg-ink-hover"
      >
        <FontAwesomeIcon icon={faRectangleAd} className="text-base text-white/30" />
        <span className="text-xs font-bold text-white/60">This space is for an ad</span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-link">
          Put your work here
          <FontAwesomeIcon icon={faArrowRight} className="text-[9px] transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </aside>
  )
}
