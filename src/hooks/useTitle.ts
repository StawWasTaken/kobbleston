import { useEffect } from 'react'
import { asset } from '@/lib/asset'

const DEFAULT_TITLE = 'Kobbleston'
const DEFAULT_ICON = asset('/brand/favicon.png')

/**
 * What the browser tab says. Every page names itself, and the name goes back
 * to plain Kobbleston when you leave.
 */
export function useTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} - Kobbleston` : DEFAULT_TITLE
    return () => { document.title = DEFAULT_TITLE }
  }, [title])
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
