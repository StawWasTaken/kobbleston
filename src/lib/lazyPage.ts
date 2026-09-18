import { lazy } from 'react'
import type { ComponentType } from 'react'

/*
 * Loading a page, when the page might not be there any more.
 *
 * The site is one document that fetches the rest of itself in pieces, and
 * every piece is named after its contents. Publish a new version and the old
 * names stop existing. A browser holding the old index, which happens because
 * it was cached or because the tab has been open a while, then asks for a
 * piece that is gone, the import is rejected, React re-throws it while
 * rendering, and what somebody gets is a blank page.
 *
 * So: try again once, in case it was only the network, and then reload, which
 * fetches the current index and with it the current names. The reload is done
 * once per session and recorded, because a reload loop is worse than an
 * error message.
 */
const RELOADED = 'kobbleston:reloaded-for-a-missing-piece'

const wait = (ms: number) => new Promise((done) => { window.setTimeout(done, ms) })

export function lazyPage<T extends ComponentType<unknown>>(
  load: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await load()
    } catch (first) {
      await wait(400)

      try {
        return await load()
      } catch (second) {
        if (!sessionStorage.getItem(RELOADED)) {
          sessionStorage.setItem(RELOADED, String(Date.now()))
          window.location.reload()
          // The reload is on its way; hold rather than flashing an error.
          await wait(10_000)
        }
        throw second instanceof Error ? second : new Error(String(first))
      }
    }
  })
}

/**
 * Vite says so itself when a piece it was told to preload cannot be had. Same
 * answer: get the current index, once.
 */
export function watchForMissingPieces() {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    if (sessionStorage.getItem(RELOADED)) return
    sessionStorage.setItem(RELOADED, String(Date.now()))
    window.location.reload()
  })

  // A page that loads properly means the trouble has passed, so the next
  // failure is allowed its own reload rather than going straight to an error.
  window.addEventListener('load', () => {
    window.setTimeout(() => sessionStorage.removeItem(RELOADED), 5_000)
  })
}
