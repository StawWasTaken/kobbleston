import { AdBanner } from '@/components/ads/AdBanner'
import type { AdHold } from '@/components/ads/AdBanner'

/*
 * One tall ad, down the right hand side, for the whole site.
 *
 * Every page used to decide where its own ad went, which meant the same
 * banner turned up in the same band at the top of five different pages and
 * read as part of the furniture rather than as an ad. A rail is honest about
 * what it is: it sits beside the page instead of across it, it is only there
 * when the screen is wide enough to spare the room, and there is one of it.
 *
 * Create keeps its own rail on the left and its own work in the middle, so
 * it is left alone.
 */
export function AdRail({ ad }: { ad: AdHold }) {
  if (!ad.ad) return null

  return (
    <aside
      className="fixed right-0 top-14 z-20 hidden h-[calc(100dvh-3.5rem)] w-[200px] items-start justify-center px-5 pt-6 xl:flex"
      aria-label="Advertisement"
    >
      <AdBanner size="tall" quiet supplied={ad} />
    </aside>
  )
}
