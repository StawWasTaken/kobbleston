import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRectangleAd, faArrowRight, faFlag } from '@fortawesome/free-solid-svg-icons'
import { ReportDialog } from '@/components/social/ReportDialog'
import { useAuth } from '@/hooks/useAuth'
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
  size = 'banner', className, quiet, fill,
}: {
  size?: AdSize
  className?: string
  /** Leave nothing behind when there is no ad, rather than inviting one. */
  quiet?: boolean
  /** Take the shape of whatever holds it, for a slot in a grid of cards. */
  fill?: boolean
}) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [ad, setAd] = useState<ShownAd | null>(null)
  const [reporting, setReporting] = useState(false)
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
  const frame = fill
    ? { width: '100%', height: '100%' }
    : { maxWidth: shape.w, aspectRatio: `${shape.w} / ${shape.h}` }

  if (ad && picture) {
    return (
      <aside className={cn('mx-auto w-full', fill && 'h-full', className)} aria-label="Advertisement">
        <div
          className={cn('relative mx-auto', fill && 'h-full')}
          style={fill ? undefined : { maxWidth: shape.w }}
        >
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

        {/* Anybody who is shown an ad can say something about it. */}
        {profile && (
          <button
            onClick={() => setReporting(true)}
            aria-label={`Report the ad ${ad.name}`}
            title="Report this ad"
            className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md bg-black/60 text-[10px] text-white/70 backdrop-blur transition-colors hover:text-white"
          >
            <FontAwesomeIcon icon={faFlag} />
          </button>
        )}

        <ReportDialog
          open={reporting}
          onClose={() => setReporting(false)}
          targetType="ad"
          targetId={ad.id}
          targetName={`the ad "${ad.name}"`}
        />
        </div>
      </aside>
    )
  }

  if (!asked || quiet) return null

  return (
    <aside className={cn('mx-auto w-full', className)} aria-label="Advertisement space">
      <Link
        to="/create/ads"
        style={{ ...frame, marginInline: 'auto' }}
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
