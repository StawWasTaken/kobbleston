import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { touchPresence } from '@/lib/api'

/** Every minute, and whenever what somebody is doing changes. */
const EVERY = 60_000

/**
 * Saying that somebody is here.
 *
 * There has been a function for this since the beginning and nothing ever
 * called it, which is why presence never worked: "online" meant whatever the
 * last sign in happened to set. The page says so now, on a minute, while the
 * tab is actually being looked at, and says goodbye on the way out.
 */
export function usePresence(signedIn: boolean) {
  const { pathname } = useLocation()

  // Building a Space, or working in Create, is worth saying out loud.
  const doing = /\/build$|^\/create(\/|$)|^\/spaces\/new$/.test(pathname) ? 'building' : 'around'

  useEffect(() => {
    if (!signedIn) return

    const say = () => {
      if (document.visibilityState === 'hidden') return
      void touchPresence(true, doing).catch(() => {})
    }

    say()
    const timer = window.setInterval(say, EVERY)

    const onVisible = () => { if (document.visibilityState === 'visible') say() }
    const onLeaving = () => { void touchPresence(false).catch(() => {}) }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pagehide', onLeaving)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pagehide', onLeaving)
    }
  }, [signedIn, doing])
}
