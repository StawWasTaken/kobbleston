import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Kobby } from '@/components/brand/Kobby'

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
    console.error('Kobbleston could not draw this page.', broke, info.componentStack)
  }

  render() {
    if (!this.state.broke) return this.props.children

    return (
      <div className="grid min-h-dvh place-items-center bg-ink p-6 text-white">
        <div className="max-w-md text-center">
          <Kobby mood="construction" size="md" />

          <h1 className="mt-4 font-display text-2xl font-extrabold">This page would not draw</h1>

          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Usually that means Kobbleston was updated while your tab was open, and the piece it
            asked for had already been replaced. Loading it again fetches the new one.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-onbrand transition-colors hover:bg-brand-bright"
            >
              Load it again
            </button>
            <a
              href="/"
              className="rounded-xl border border-ink-line bg-ink-card px-4 py-2.5 text-sm font-bold transition-colors hover:bg-ink-hover"
            >
              Go home
            </a>
          </div>

          {import.meta.env.DEV && (
            <pre className="mt-6 overflow-auto rounded-xl border border-ink-line bg-ink-card p-3 text-left text-[11px] text-white/50">
              {this.state.broke.message}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
