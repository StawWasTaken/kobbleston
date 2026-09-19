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
