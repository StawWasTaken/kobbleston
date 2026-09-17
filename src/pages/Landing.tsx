import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers, faShapes, faLayerGroup, faArrowRight, faDoorOpen, faEye, faUserAstronaut, faBolt,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Button } from '@/components/ui/Button'
import { SpaceCardSkeleton, Skeleton } from '@/components/ui/States'
import { Wordmark } from '@/components/brand/Wordmark'
import { Signature } from '@/components/brand/Signature'
import { Kobby } from '@/components/brand/Kobby'
import { PixelField } from '@/components/brand/PixelField'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { CommunityCard } from '@/components/community/CommunityCard'
import { AssetTile } from '@/components/create/AssetTile'
import { SignupForm } from '@/components/auth/SignupForm'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useForceDark } from '@/hooks/useTheme'
import { getPlatformStats, listAssets, listCommunities, listSpaces } from '@/lib/api'
import { formatCount } from '@/lib/format'

/** Every part of the page is numbered, the way the terms and the rules are. */
function Mark({
  number, title, note, to, action,
}: {
  number: string
  title: string
  note: string
  to?: string
  action?: string
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-x-5 gap-y-2">
      <div className="flex min-w-0 items-baseline gap-4">
        <span className="font-display text-3xl font-extrabold leading-none text-brand">
          {number}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{title}</h2>
          <p className="mt-1 text-sm text-white/50">{note}</p>
        </div>
      </div>

      {to && action && (
        <Link
          to={to}
          className="ml-auto inline-flex items-center gap-2 text-sm font-bold text-link hover:underline"
        >
          {action}
          <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
        </Link>
      )}
    </div>
  )
}

/** The glass panel everything on this page sits in. */
function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8 ${className ?? ''}`}
    >
      {children}
    </section>
  )
}

function Pillar({
  icon, title, body, to, action,
}: {
  icon: IconDefinition
  title: string
  body: string
  to: string
  action: string
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-2xl border border-white/10 bg-ink-card/70 p-5 transition-colors hover:border-brand/60"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-base text-white">
        <FontAwesomeIcon icon={icon} />
      </span>
      <h3 className="mt-4 font-display text-xl font-extrabold">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">{body}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-link">
        {action}
        <FontAwesomeIcon
          icon={faArrowRight}
          className="text-xs transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  )
}

/** A real number from the platform, or nothing in its place. */
function Stat({ icon, value, label }: { icon: IconDefinition; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-card/70 px-4 py-3 backdrop-blur-sm">
      <FontAwesomeIcon icon={icon} className="text-base text-brand-bright" />
      <span className="min-w-0">
        <span className="block font-display text-xl font-extrabold tabular-nums leading-none">
          {value}
        </span>
        <span className="block text-xs text-white/50">{label}</span>
      </span>
    </div>
  )
}

function Step({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-card/70 p-5">
      <span className="font-display text-4xl font-extrabold leading-none text-brand">{number}</span>
      <h3 className="mt-3 font-display text-lg font-extrabold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-white/55">{body}</p>
    </div>
  )
}

export default function Landing() {
  // The front page is written for one look, the same as the way in and the
  // pages that speak for Kobbleston.
  useForceDark()
  const navigate = useNavigate()
  const { signInAsGuest } = useAuth()
  const [guestPending, setGuestPending] = useState(false)
  const [guestError, setGuestError] = useState<string | null>(null)

  const enterAsGuest = async () => {
    setGuestPending(true)
    setGuestError(null)
    try {
      await signInAsGuest()
      navigate('/home')
    } catch {
      setGuestError('Guest mode is not switched on for this site yet.')
    } finally {
      setGuestPending(false)
    }
  }

  const stats = useAsync(getPlatformStats, [])
  const spaces = useAsync(() => listSpaces({ sort: 'trending', limit: 8 }), [])
  const assets = useAsync(() => listAssets({ limit: 8 }), [])
  const communities = useAsync(() => listCommunities(''), [])

  const biggest = [...(communities.data ?? [])]
    .sort((a, b) => b.member_count - a.member_count)
    .slice(0, 4)

  return (
    <div className="relative overflow-hidden bg-ink text-white">
      <PixelField className="opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(90rem_50rem_at_15%_-10%,rgba(27,52,232,0.45),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/85 to-ink" />

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-8">
        {/* --------------------------------------------------------- hero */}
        <section className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_24rem] lg:gap-16">
          <div>
            <Wordmark to={null} className="h-8 sm:h-10" />

            {/* Sized so the first line holds together rather than breaking
                after "Make" on a middling screen. */}
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[0.88] sm:text-6xl xl:text-7xl">
              <span className="block whitespace-nowrap">Make Something</span>
              <span className="block whitespace-nowrap text-brand-bright">Nobody Else Has</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/60">
              A Space is your corner of the internet. Build it out of whatever you like,
              open the door, and see who walks in.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" to="/signup">Make an account</Button>
              <Button size="lg" variant="subtle" icon={faDoorOpen} to="/discover">
                Look around
              </Button>
              <Button size="lg" variant="ghost" loading={guestPending} onClick={enterAsGuest}>
                Play as guest
              </Button>
            </div>
            {guestError && <p className="mt-2 text-sm text-danger">{guestError}</p>}

            <p className="mt-4 text-xs text-white/40">Free, and for people aged 15 and over.</p>
          </div>

          <div className="relative w-full justify-self-center lg:justify-self-end">
            <Kobby
              mood="default"
              size="sm"
              bob={false}
              className="pointer-events-none absolute -left-6 -top-11 hidden h-20 -rotate-6 sm:block"
            />
            <div className="rounded-3xl border border-white/10 bg-ink-card/90 p-6 shadow-pop backdrop-blur-xl sm:p-7">
              <h2 className="mb-4 font-display text-xl font-extrabold">Sign Up</h2>
              <SignupForm onSent={() => navigate('/signup')} />
            </div>
          </div>
        </section>

        {/* Real numbers, or none: nothing on this page is decoration. */}
        {stats.loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[4.25rem] rounded-2xl" />)}
          </div>
        )}
        {!stats.loading && stats.data && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              icon={faLayerGroup}
              value={formatCount(stats.data.published_spaces)}
              label={stats.data.published_spaces === 1 ? 'Space published' : 'Spaces published'}
            />
            <Stat icon={faEye} value={formatCount(stats.data.total_visits)} label="Visits" />
            <Stat
              icon={faUserAstronaut}
              value={formatCount(stats.data.total_accounts)}
              label="People here"
            />
            <Stat icon={faBolt} value={formatCount(stats.data.people_online)} label="Online now" />
          </div>
        )}

        <div className="mt-10 space-y-4">
          {/* ------------------------------------------------- what this is */}
          <Panel>
            <Mark
              number="01"
              title="What this is"
              note="Three parts, and they are all built."
            />
            <div className="grid gap-4 md:grid-cols-3">
              <Pillar
                icon={faLayerGroup}
                title="Spaces"
                body="Somebody's own page, built the way they wanted it. Walk in, look around, leave a mark, come back when they change it."
                to="/discover"
                action="Find a Space"
              />
              <Pillar
                icon={faShapes}
                title="Kobbleston Create"
                body="Images, sounds, video and fonts, made by people here. Get what you need, use it by its number, and sell what you make."
                to="/create/marketplace"
                action="Open the marketplace"
              />
              <Pillar
                icon={faUsers}
                title="Communities"
                body="Fan clubs, build teams and hobby corners, each with its own wall, its own ranks, its own events and its own Spaces."
                to="/communities"
                action="Browse Communities"
              />
            </div>
          </Panel>

          {/* ------------------------------------------------- live Spaces */}
          <Panel>
            <Mark
              number="02"
              title="Being visited now"
              note="The Spaces people are walking into today."
              to="/discover"
              action="See all"
            />

            {spaces.loading && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => <SpaceCardSkeleton key={i} />)}
              </div>
            )}

            {!spaces.loading && !spaces.data?.length && (
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-ink-card/70 p-5">
                <Kobby mood="construction" size="sm" bob={false} />
                <p className="text-sm text-white/55">
                  Nobody has published a Space yet. Yours would be the first one here.
                </p>
              </div>
            )}

            {!!spaces.data?.length && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {spaces.data.map((space) => <SpaceCard key={space.id} space={space} />)}
              </div>
            )}
          </Panel>

          {/* ----------------------------------------------------- create */}
          <Panel>
            <Mark
              number="03"
              title="Made by people here"
              note="Uploaded by somebody, checked, and put up for others to build with."
              to="/create/marketplace"
              action="Open Create"
            />

            {assets.loading && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-xl bg-white/[0.06]" />
                ))}
              </div>
            )}

            {!assets.loading && !assets.data?.length && (
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-ink-card/70 p-5">
                <Kobby mood="emptyBox" size="sm" bob={false} />
                <p className="text-sm text-white/55">
                  The marketplace is empty. Upload the first image, sound or font.
                </p>
              </div>
            )}

            {!!assets.data?.length && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {assets.data.map((item) => <AssetTile key={item.id} item={item} />)}
              </div>
            )}
          </Panel>

          {/* ------------------------------------------------- communities */}
          {!!biggest.length && (
            <Panel>
              <Mark
                number="04"
                title="Communities to join"
                note="The busiest ones on Kobbleston right now."
                to="/communities"
                action="See all"
              />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {biggest.map((community) => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>
            </Panel>
          )}

          {/* ---------------------------------------------- getting started */}
          <Panel>
            <Mark
              number={biggest.length ? '05' : '04'}
              title="Getting started"
              note="Three steps, and none of them cost anything."
            />
            <div className="grid gap-4 md:grid-cols-3">
              <Step
                number="01"
                title="Make an account"
                body="A username, a birthday and a password. You get a picture if you cannot be bothered to pick one."
              />
              <Step
                number="02"
                title="Build your Space"
                body="Start from nothing or from somebody else's work on the marketplace. Content is used by its number, so it stays credited to whoever made it."
              />
              <Step
                number="03"
                title="Open the door"
                body="Publish it, share the link, and watch who comes in. Join a Community and build with other people while you are at it."
              />
            </div>
          </Panel>

          {/* ---------------------------------------------------- the note */}
          <Panel className="text-center">
            <Kobby mood="crown" size="md" className="mx-auto" bob={false} />
            <h2 className="mt-6 font-display text-3xl font-extrabold sm:text-4xl">
              Empowering Creativity
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-white/60">
              We are dedicated to building a platform where creators and innovators can bring
              ideas to life with total freedom, supported by intuitive tools and vibrant
              community spaces.
            </p>
            <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-white/60">
              Our goal is to foster an inspiring environment where imagination and connection
              can thrive without limits.
            </p>

            <p className="mt-10 text-sm text-white/45">Signed,</p>
            <Signature className="mx-auto mt-1 w-fit" />
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/40">
              CEO of Kobbleston
            </p>
          </Panel>
        </div>

        {/* --------------------------------------------------------- close */}
        <section className="mt-14 text-center">
          <h2 className="font-display text-4xl font-extrabold leading-[0.9] sm:text-6xl">
            Make Something
            <span className="block text-brand-bright">Nobody Else Has</span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-white/55">
            Free, takes five minutes, and nobody is going to build it for you.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" to="/signup">Sign Up</Button>
            <Button size="lg" variant="subtle" to="/login">Log In</Button>
          </div>
        </section>
      </div>
    </div>
  )
}
