import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRightToBracket, faBolt, faPalette, faUsers, faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, SpaceCardSkeleton } from '@/components/ui/States'
import { Wordmark } from '@/components/brand/Wordmark'
import { PixelField } from '@/components/brand/PixelField'
import { Signature } from '@/components/brand/Signature'
import { Kobby } from '@/components/brand/Kobby'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { ActivityFeed } from '@/components/social/ActivityFeed'
import { PlatformStats } from '@/components/social/PlatformStats'
import { useAsync } from '@/hooks/useAsync'
import { listSpaces } from '@/lib/api'

const pitches: { icon: IconDefinition; title: string; body: string }[] = [
  {
    icon: faPalette,
    title: 'Make something',
    body: 'A page, a hangout, a fan shrine, a thing that plays a sound when you click it. No brief, no client.',
  },
  {
    icon: faUsers,
    title: 'Bring people in',
    body: 'Spaces are made to be entered. Add friends, see who is inside, talk while you look around.',
  },
  {
    icon: faBolt,
    title: 'Find the weird stuff',
    body: 'Discover is full of what people actually built today, not what an algorithm thinks you should buy.',
  },
]

export default function Landing() {
  const { data: spaces, loading, error, reload } = useAsync(
    () => listSpaces({ sort: 'trending', limit: 6 }),
    [],
  )

  return (
    <div className="min-h-dvh bg-ink">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Wordmark to={null} />
          <span className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-muted sm:block">
            Pixels go brrr
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" to="/login">Log in</Button>
            <Button size="sm" to="/signup">Join</Button>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-ink-line">
        <PixelField className="opacity-[0.55]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink/60 to-ink" />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/50 bg-brand/15 px-3 py-1 text-xs font-semibold text-[#9fadff]">
              <FontAwesomeIcon icon={faWandMagicSparkles} />
              An independent corner of the internet
            </span>

            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
              Make your own
              <span className="block text-[#7f92ff]">corner of the internet.</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
              Kobbleston is where people build Spaces — small, strange, personal pages — and then
              actually hang out in them. Build one in an afternoon. Show your friends.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" to="/signup" iconRight={faArrowRightToBracket}>
                Make an account
              </Button>
              <Button size="lg" variant="subtle" to="/discover">
                Look around first
              </Button>
            </div>
          </div>

          <Kobby
            size="xl"
            className="pointer-events-none absolute bottom-10 right-6 hidden opacity-90 xl:block"
          />
        </div>
      </section>

      {/* --------------------------------------------------------- stats */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="sr-only">Kobbleston right now</h2>
        <PlatformStats />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {pitches.map((p) => (
              <Card key={p.title} className="p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
                  <FontAwesomeIcon icon={p.icon} />
                </span>
                <h3 className="mt-4 text-lg font-extrabold">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{p.body}</p>
              </Card>
            ))}
          </div>

          <Card className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 border-b border-ink-line px-4 py-3.5">
              <span className="h-2 w-2 animate-pulse-ring rounded-full bg-space text-space" />
              <h3 className="text-sm font-extrabold">Happening now</h3>
            </div>
            <ActivityFeed limit={9} className="flex-1" />
          </Card>
        </div>
      </section>

      {/* -------------------------------------------------------- spaces */}
      <section className="border-y border-ink-line bg-ink-raised/50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">What people made</h2>
              <p className="mt-1 text-sm text-muted">The most visited Spaces on Kobbleston.</p>
            </div>
            <Button variant="subtle" size="sm" to="/discover">Discover</Button>
          </div>

          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => <SpaceCardSkeleton key={i} />)}
            </div>
          )}

          {error && <Card><ErrorState message={error} onRetry={reload} /></Card>}

          {!loading && !error && spaces?.length === 0 && (
            <Card>
              <EmptyState
                mood="construction"
                title="Nobody has published a Space yet"
                body="Kobbleston is brand new. The first Space here could be yours."
                action={<Button to="/signup">Make the first one</Button>}
              />
            </Card>
          )}

          {!loading && !!spaces?.length && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {spaces.map((space) => <SpaceCard key={space.id} space={space} />)}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------- founder */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <Card className="relative overflow-hidden">
          <img
            src="/brand/background.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-card via-ink-card/90 to-transparent" />

          <div className="relative max-w-xl p-6 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9fadff]">
              Kobbleston was built by Staw
            </p>
            <p className="mt-4 text-lg leading-relaxed text-white/80">
              I wanted somewhere that felt like the internet I grew up on — pages people made
              by hand, for no reason other than wanting to — but that didn&apos;t feel broken
              on a phone in the year we&apos;re actually in. So I started building it.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              It&apos;s one person and a mascot so far. If you make something here, I will
              genuinely go and look at it.
            </p>
            <Signature className="mt-6" />
            <p className="mt-2 font-display text-sm font-bold tracking-wide text-white/70">
              Staw — founder
            </p>
          </div>
        </Card>
      </section>

      {/* ----------------------------------------------------------- cta */}
      <section className="border-t border-ink-line">
        <div className="relative mx-auto max-w-6xl overflow-hidden px-4 py-16 text-center sm:px-6 sm:py-20">
          <PixelField className="opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
          <div className="relative">
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">Go on then.</h2>
            <p className="mx-auto mt-3 max-w-md text-white/65">
              Making a Space takes about five minutes and costs nothing.
            </p>
            <Button size="lg" to="/signup" className="mt-7">Join Kobbleston</Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <Wordmark to={null} className="h-4 opacity-70" />
          <span>Pixels go brrr</span>
          <span className="sm:ml-auto">Made by Staw · 15+</span>
          <Link to="/discover" className="hover:text-white">Discover</Link>
        </div>
      </footer>
    </div>
  )
}
