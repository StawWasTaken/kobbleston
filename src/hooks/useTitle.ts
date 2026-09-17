import { useEffect } from 'react'
import { asset } from '@/lib/asset'

const DEFAULT_TITLE = 'Kobbleston'
const DEFAULT_ICON = asset('/brand/favicon.png')

/**
 * What the browser tab says. Every page names itself, and the name goes back
 * to plain Kobbleston when you leave. Parts of the site that have a name of
 * their own pass it as the second argument, so a page inside Create reads
 * "My Uploads - Kobbleston Create" rather than stacking both names.
 */
export function useTitle(title?: string | null, site: string = DEFAULT_TITLE) {
  useEffect(() => {
    document.title = title ? `${title} - ${site}` : site
    return () => { document.title = DEFAULT_TITLE }
  }, [title, site])
}

/** A title that is already written in full, used where the pattern differs. */
export function useExactTitle(title?: string | null) {
  useEffect(() => {
    document.title = title || DEFAULT_TITLE
    return () => { document.title = DEFAULT_TITLE }
  }, [title])
}

/**
 * Inside a Space, the tab becomes that Space: its name and its emblem. A
 * Space without one keeps ours rather than showing nothing.
 */
export function useFavicon(url?: string | null) {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) return
    const previous = link.href
    link.href = url || DEFAULT_ICON
    return () => { link.href = previous }
  }, [url])
}

/**
 * The card this page would show if it were pasted somewhere else. The robots
 * that build those cards do not run scripts, so this is not what they read:
 * the build writes a file for every fixed address, and the og edge function
 * answers for the ones that depend on what they point at. This keeps the
 * document itself honest, which is what a browser, a saved link and anything
 * that does run scripts will go by.
 */
export function useSocialCard(card: {
  title?: string | null
  description?: string | null
  image?: string | null
}) {
  const { title, description, image } = card

  useEffect(() => {
    const set = (selector: string, attribute: 'content' | 'href', value: string) => {
      const node = document.head.querySelector<HTMLMetaElement>(selector)
      if (!node) return undefined
      const previous = node.getAttribute(attribute) ?? ''
      node.setAttribute(attribute, value)
      return () => node.setAttribute(attribute, previous)
    }

    const undo = [
      title && set('meta[property="og:title"]', 'content', title),
      title && set('meta[name="twitter:title"]', 'content', title),
      description && set('meta[name="description"]', 'content', description),
      description && set('meta[property="og:description"]', 'content', description),
      description && set('meta[name="twitter:description"]', 'content', description),
      image && set('meta[property="og:image"]', 'content', image),
      image && set('meta[name="twitter:image"]', 'content', image),
      set('meta[property="og:url"]', 'content', window.location.href),
      set('link[rel="canonical"]', 'href', window.location.href),
    ]

    return () => undo.forEach((step) => typeof step === 'function' && step())
  }, [title, description, image])
}
