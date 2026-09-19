import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Kobby } from '@/components/brand/Kobby'
import { PixelField } from '@/components/brand/PixelField'

/**
 * Something for a broken page to be, other than nothing.
 *
 * Anything thrown while rendering used to take the whole document with it and
 * leave an empty dark rectangle, which tells nobody anything and offers
 * nobody a way out. This catches it and says so, with the two things worth
 * trying.
 */
export class Boundary extends Component<{ children: ReactNode }, { broke: Error | null }> {
  state: { broke: Error | null } = { broke: null }

  static getDerivedStateFromError(broke: Error) {
    return { broke }
  }

  componentDidCatch(broke: Error, info: ErrorInfo) {
    // Left where somebody looking into it will find it, rather than sent
    // anywhere: this is a page that failed, not an event to collect.
    console.error('Kobblon could not draw this page.', broke, info.componentStack)
  }

  render() {
    if (!this.state.broke) return this.props.children

    /*
     * The same page the site shows when an address leads nowhere, because
     * this is the same kind of moment: something is not there and you need a
     * way onwards. Plain links rather than the Button component, since
     * whatever broke may well have been the router.
     */
    return (
      <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-ink px-4 py-16 text-white">
        <PixelField className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/50 to-ink" />

        <div className="relative flex flex-col items-center text-center">
          <Kobby mood="construction" size="lg" />
          <p className="mt-6 font-display text-6xl font-extrabold text-[#7f92ff]">Oops</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold">This page would not draw</h1>
          <p className="mt-2 max-w-sm text-white/65">
            Usually Kobblon was updated while your tab was open, and the piece this page
            asked for had already been replaced. Loading it again fetches the new one.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-bold text-onbrand transition-colors hover:bg-brand-bright"
            >
              Load it again
            </button>
            <a
              href="/home"
              className="inline-flex h-10 items-center rounded-xl border border-ink-line bg-ink-card px-4 text-sm font-bold transition-colors hover:bg-ink-hover"
            >
              Go home
            </a>
            <a
              href="/discover"
              className="inline-flex h-10 items-center rounded-xl border border-ink-line bg-ink-card px-4 text-sm font-bold transition-colors hover:bg-ink-hover"
            >
              Discover Spaces
            </a>
          </div>

          {import.meta.env.DEV && (
            <pre className="mt-6 max-w-md overflow-auto rounded-xl border border-ink-line bg-ink-card p-3 text-left text-[11px] text-white/50">
              {this.state.broke.message}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
