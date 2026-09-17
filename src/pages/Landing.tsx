import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers, faShapes, faLayerGroup, faArrowRight, faDoorOpen, faUpload, faPaintbrush,
  faEye, faUserAstronaut, faBolt,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Button } from '@/components/ui/Button'
import { SpaceCardSkeleton, Skeleton } from '@/components/ui/States'
import { Wordmark } from '@/components/brand/Wordmark'
import { Signature } from '@/components/brand/Signature'
import { Kobby } from '@/components/brand/Kobby'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { CommunityCard } from '@/components/community/CommunityCard'
import { AssetTile } from '@/components/create/AssetTile'
import { SignupForm } from '@/components/auth/SignupForm'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { getPlatformStats, listAssets, listCommunities, listSpaces } from '@/lib/api'
import { asset } from '@/lib/asset'
import { formatCount } from '@/lib/format'

/** A heading with its own way through to the part of the site it describes. */
function SectionHead({
  icon, title, note, to, action,
}: {
  icon: IconDefinition
  title: string
  note: string
  to: string
  action: string
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2.5 font-display text-2xl font-extrabold sm:text-3xl">
          <FontAwesomeIcon icon={icon} className="text-xl" />
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted">{note}</p>
      </div>
      <Link
        to={to}
        className="ml-auto inline-flex items-center gap-2 text-sm font-bold text-link hover:underline"
      >
        {action}
        <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
      </Link>
    </div>
  )
}

/** One of the three things Kobbleston is, said plainly. */
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
      className="group flex flex-col rounded-2xl border border-ink-line bg-ink-card p-5 transition-colors hover:border-brand/60"
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl border-b-[3px] border-brand-ink bg-brand text-lg text-onbrand">
        <FontAwesomeIcon icon={icon} />
      </span>
      <h3 className="mt-4 font-display text-xl font-extrabold">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{body}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-link">
        {action}
        <FontAwesomeIcon icon={faArrowRight} className="text-xs transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

/** A real number from the platform, or nothing at all. */
function Stat({ icon, value, label }: { icon: IconDefinition; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-line bg-ink-card px-4 py-3">
      <FontAwesomeIcon icon={icon} className="text-base text-link" />
      <span className="min-w-0">
        <span className="block font-display text-xl font-extrabold tabular-nums leading-none">
          {value}
        </span>
        <span className="block text-xs text-muted">{label}</span>
      </span>
    </div>
  )
}

function Step({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="relative rounded-2xl border border-ink-line bg-ink-card p-5">
      <span className="font-display text-4xl font-extrabold leading-none text-brand">{number}</span>
      <h3 className="mt-3 font-display text-lg font-extrabold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  )
}

export default function Landing() {
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
    <>
      {/* ----------------------------------------------------------- hero */}
      <section className="relative border-b-4 border-brand-ink">
        <img
          src={asset('/brand/banner3.png')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/40" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink to-transparent" />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_22rem]">
          <div className="self-center">
            <Wordmark to={null} className="h-8 sm:h-11" />

            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[0.9] sm:text-7xl">
              Make Something
              <span className="block text-brand-bright">Nobody Else Has</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/70">
              A Space is your corner of the internet. Build it out of whatever you like,
              open the door, and see who walks in.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" to="/signup">Make an account</Button>
              <Button size="lg" variant="subtle" icon={faDoorOpen} to="/discover">
                Look around
              </Button>
              <Button size="lg" variant="ghost" loading={guestPending} onClick={enterAsGuest}>
                Play as guest
              </Button>
            </div>
            {guestError && <p className="mt-2 text-sm text-danger">{guestError}</p>}

            <p className="mt-4 text-xs text-white/45">
              Free, and for people aged 15 and over.
            </p>
          </div>

          <div className="rounded-2xl border border-ink-line bg-ink-card p-5 shadow-pop">
            <h2 className="mb-4 font-display text-xl font-extrabold">Sign Up</h2>
            <SignupForm onSent={() => navigate('/signup')} />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ what is really here */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Real numbers or none: nothing here is decoration. */}
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

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Pillar
            icon={faLayerGroup}
            title="Spaces"
            body="Somebody's own page, built the way they wanted it. Walk in, look around, leave
              a mark, come back when they change it."
            to="/discover"
            action="Find a Space"
          />
          <Pillar
            icon={faShapes}
            title="Kobbleston Create"
            body="Images, sounds, video and fonts, made by people here. Get what you need, use
              it by its number, and sell what you make."
            to="/create/marketplace"
            action="Open the marketplace"
          />
          <Pillar
            icon={faUsers}
            title="Communities"
            body="Fan clubs, build teams and hobby corners, each with its own wall, its own
              ranks, its own events and its own Spaces."
            to="/communities"
            action="Browse Communities"
          />
        </div>
      </section>

      {/* ------------------------------------------------------ live Spaces */}
      <section className="border-y border-ink-line bg-ink-raised/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <SectionHead
            icon={faLayerGroup}
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
            <div className="flex items-center gap-4 rounded-2xl border border-ink-line bg-ink-card p-5">
              <Kobby mood="construction" size="sm" bob={false} />
              <p className="text-sm text-muted">
                Nobody has published a Space yet. Yours would be the first one here.
              </p>
            </div>
          )}

          {!!spaces.data?.length && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {spaces.data.map((space) => <SpaceCard key={space.id} space={space} />)}
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------- create */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHead
          icon={faShapes}
          title="Made by people here"
          note="Everything on the marketplace was uploaded by somebody, checked, and put up for others to build with."
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
          <div className="flex items-center gap-4 rounded-2xl border border-ink-line bg-ink-card p-5">
            <Kobby mood="emptyBox" size="sm" bob={false} />
            <p className="text-sm text-muted">
              The marketplace is empty. Upload the first image, sound or font.
            </p>
          </div>
        )}

        {!!assets.data?.length && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {assets.data.map((item) => <AssetTile key={item.id} item={item} />)}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------ communities */}
      {!!biggest.length && (
        <section className="border-y border-ink-line bg-ink-raised/40">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <SectionHead
              icon={faUsers}
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
          </div>
        </section>
      )}

      {/* --------------------------------------------------- how it goes */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Getting started</h2>
        <p className="mt-1 text-sm text-muted">Three steps, and none of them cost anything.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
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

        <div className="mt-5 flex flex-wrap gap-3">
          <Button size="lg" icon={faUpload} to="/signup">Make an account</Button>
          <Button size="lg" variant="subtle" icon={faPaintbrush} to="/create">See Create first</Button>
        </div>
      </section>

      {/* ------------------------------------------------------ signed note */}
      <section className="border-t border-ink-line">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <Kobby mood="crown" size="md" className="mx-auto" bob={false} />
          <h2 className="mt-6 font-display text-3xl font-extrabold sm:text-4xl">
            Empowering Creativity
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            We are dedicated to building a platform where creators and innovators can bring
            ideas to life with total freedom, supported by intuitive tools and vibrant
            community spaces.
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            Our goal is to foster an inspiring environment where imagination and connection
            can thrive without limits.
          </p>

          <p className="mt-10 text-sm text-muted">Signed,</p>
          <Signature className="mx-auto mt-1 w-fit" />
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">
            CEO of Kobbleston
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------------- cta */}
      <section className="relative border-b-4 border-brand-ink">
        <img
          src={asset('/brand/topbar.png')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-ink/45" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-4xl font-extrabold text-white sm:text-5xl">
            Make Something
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-white/75">
            Free, takes five minutes, and nobody is going to build it for you.
          </p>
          <p className="mt-5 font-display text-sm font-extrabold uppercase tracking-[0.18em] text-white/70">
            Make Something Nobody Else Has
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" to="/signup">Sign Up</Button>
            <Button size="lg" variant="subtle" to="/login">Log In</Button>
          </div>
        </div>
      </section>
    </>
  )
}
