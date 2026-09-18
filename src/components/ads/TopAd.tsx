import { useLocation } from 'react-router-dom'
import { AdBanner } from '@/components/ads/AdBanner'

/*
 * The banner that sits under the topbar.
 *
 * It belongs to the page frame rather than to any one page, because that is
 * where it actually is: the first thing under the bar, the full width of the
 * content, the same place every time. Pages do not each get to decide where
 * theirs goes and end up with five different answers.
 *
 * Communities are left out on purpose. A banner across a community page reads
 * as part of the community rather than as an ad beside it, and it cuts the
 * page in half. Those pages keep a tall one down the side instead.
 */
const wanted = [
  /^\/home$/,
  /^\/discover$/,
  /^\/u\//,
  /^\/s\//,
  /^\/e\//,
  /^\/people$/,
  /^\/library$/,
]

export function TopAd() {
  const { pathname } = useLocation()
  if (!wanted.some((one) => one.test(pathname))) return null

  return (
    /* When there is no ad to show the strip disappears entirely, rather than
       leaving an empty band under the bar on every page. */
    <div className="border-b border-ink-line/60 bg-ink-raised/30 px-4 py-3 empty:hidden sm:px-6">
      <AdBanner quiet />
    </div>
  )
}
