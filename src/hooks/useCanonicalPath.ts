import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Keeps the address in step with what it points at.
 *
 * Links carry a number and a name, and the name is whatever the thing was
 * called when the link was written. Once the page knows the current name it
 * rewrites the address to match, replacing the entry rather than adding one,
 * so the back button still goes where it went before and copying the address
 * copies the right one.
 *
 * Pass nothing while the page is still holding the last thing it showed.
 * Walking from one Community to the next reuses the page, and for a moment
 * the address says the new one while the data is still the old one: writing
 * that address would send you straight back where you came from.
 */
export function useCanonicalPath(canonical?: string | null) {
  const { pathname, search, hash } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!canonical) return

    const here = decodeURIComponent(pathname).replace(/\/+$/, '')
    const there = decodeURIComponent(canonical).replace(/\/+$/, '')
    if (here === there) return

    navigate(`${canonical}${search}${hash}`, { replace: true })
  }, [canonical, pathname, search, hash, navigate])
}
