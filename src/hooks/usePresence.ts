import { useEffect, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'
import { touchPresence } from '@/lib/api'

/*
 * What this tab is doing, kept where anything can read it.
 *
 * Your own dot should say what you are doing now, not what a row said when
 * some page last fetched it. The sidebar saying "building" while your profile
 * said "online" was two stale copies of the same fact.
 */
let doingNow: 'around' | 'building' = 'around'
let spaceNow: string | null = null
const watchers = new Set<() => void>()

function tellWatchers() {
  for (const tell of watchers) tell()
}

function setDoing(next: 'around' | 'building') {
  if (doingNow === next) return
  doingNow = next
  tellWatchers()
}

const listen = (tell: () => void) => {
  watchers.add(tell)
  return () => { watchers.delete(tell) }
}

export function useMyActivity() {
  return useSyncExternalStore(listen, () => doingNow, () => doingNow)
}

/*
 * The Space you are inside, as against the one your row happens to remember.
 *
 * The row is set when you enter and cleared when you leave, but a tab that
 * closes mid visit leaves it standing, and nothing refetches it while you walk
 * around the site. Reading it meant anybody who had ever entered a Space was
 * stuck showing In a Space for good, so walking into Create changed nothing.
 * The Space viewer says so itself while it is on screen, and that is the only
 * thing that can be out of date by no more than a moment.
 */
export function setMySpace(id: string | null) {
  if (spaceNow === id) return
  spaceNow = id
  tellWatchers()
}

export function useMySpace() {
  return useSyncExternalStore(listen, () => spaceNow, () => spaceNow)
}

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

  useEffect(() => { setDoing(doing) }, [doing])

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
