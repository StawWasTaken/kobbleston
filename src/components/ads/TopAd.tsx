import { useLocation } from 'react-router-dom'
import { AdBanner } from '@/components/ads/AdBanner'

/*
 * The one banner on the site, at the top of Discover.
 *
 * There used to be one of these under the bar on every page, which made it
 * read as part of the furniture: the same picture, in the same band, five
 * times over. Browsing is the one place a banner belongs, because looking at
 * things is what somebody is already doing there. Everywhere else has the
 * rail down the side instead.
 */
export function TopAd() {
  const { pathname } = useLocation()
  if (pathname !== '/discover') return null

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-5 empty:hidden sm:px-6">
      <AdBanner quiet />
    </div>
  )
}
