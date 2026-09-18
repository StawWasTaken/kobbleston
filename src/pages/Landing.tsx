import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers, faShapes, faLayerGroup, faArrowRight, faShieldHalved, faEye, faUserAstronaut, faBolt,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Button } from '@/components/ui/Button'
import { SpaceCardSkeleton, Skeleton } from '@/components/ui/States'
import { Wordmark } from '@/components/brand/Wordmark'
import { Signature } from '@/components/brand/Signature'
import { Kobby } from '@/components/brand/Kobby'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { AssetTile } from '@/components/create/AssetTile'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useForceDark } from '@/hooks/useTheme'
import { getPlatformStats, listAssets, listCommunities, listSpaces } from '@/lib/api'
import { asset } from '@/lib/asset'
import { communityLink } from '@/lib/links'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ parts */

/**
 * A band of the page: a big illustrated mark, a heading with one word in the
 * brand colour, a paragraph and a way through, with whatever it is talking
 * about shown beside it.
 */
function Band({
  icon, kicker, title, accent, body, to, action, children, flip, tone = 'plain',
}: {
  icon: IconDefinition
  kicker: string
  title: string
  accent: string
  body: string
  to: string
  action: string
  children?: React.ReactNode
  flip?: boolean
  tone?: 'plain' | 'raised'
}) {
  return (
    <section className={cn('border-b border-white/5', tone === 'raised' && 'bg-white/[0.02]')}>
      <div
        className={cn(
          'mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-8 sm:py-24 lg:gap-16',
          !!children && 'lg:grid-cols-[22rem_1fr]',
        )}
      >
        <div className={cn(flip && 'lg:order-2')}>
          <span className="grid h-16 w-16 place-items-center rounded-2xl border-b-4 border-brand-ink bg-brand text-2xl text-onbrand shadow-pop">
            <FontAwesomeIcon icon={icon} />
          </span>

          <p className="mt-6 text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/35">
            {kicker}
          </p>
          <h2 className="mt-2 font-display text-4xl font-extrabold leading-[0.95] sm:text-5xl">
            {title}{' '}
            <span className="text-brand-bright">{accent}</span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/55">{body}</p>

          <Link
            to={to}
            className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-link hover:underline"
          >
            {action}
            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
          </Link>
        </div>

        {children && <div className={cn('min-w-0', flip && 'lg:order-1')}>{children}</div>}
      </div>
    </section>
  )
}

function Stat({ icon, value, label }: { icon: IconDefinition; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <FontAwesomeIcon icon={icon} className="text-base text-white/50" />
      <span className="min-w-0">
        <span className="block font-display text-2xl font-extrabold tabular-nums leading-none">
          {value}
        </span>
        <span className="block text-xs text-white/45">{label}</span>
      </span>
    </div>
  )
}

/* ----------------------------------------------------------------- the page */

export default function Landing() {
  // The front page is written for one look, the same as the way in.
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
  const spaces = useAsync(() => listSpaces({ sort: 'trending', limit: 6 }), [])
  const assets = useAsync(() => listAssets({ limit: 8 }), [])
  const communities = useAsync(() => listCommunities(''), [])

  const biggest = [...(communities.data ?? [])]
    .sort((a, b) => b.member_count - a.member_count)
    .slice(0, 6)

  return (
    <div className="bg-ink text-white">
      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden border-b-[6px] border-brand-ink">
        <img
          src={asset('/brand/banner3.png')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-deep/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-ink via-brand-ink/85 to-brand-ink/35" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand-ink/90 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-8 sm:py-32">
          <Wordmark to={null} className="h-9 sm:h-12" />

          <h1 className="mt-8 font-display text-5xl font-extrabold leading-[0.86] sm:text-8xl">
            <span className="block">Make Something</span>
            <span className="block text-white/95">Nobody Else Has</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            Kobbleston is a place to build your own corner of the internet, fill it with whatever
            you want, and let people walk in.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" to="/signup">Make an account</Button>
            <Button size="lg" variant="subtle" to="/discover">Look around</Button>
            <button
              onClick={enterAsGuest}
              disabled={guestPending}
              className="text-sm font-bold text-white/70 underline-offset-4 hover:text-white hover:underline disabled:opacity-60"
            >
              {guestPending ? 'One moment' : 'Or play as a guest'}
            </button>
          </div>
          {guestError && <p className="mt-2 text-sm text-danger">{guestError}</p>}

          <p className="mt-4 text-xs text-white/45">Free, and for people aged 15 and over.</p>
        </div>
      </section>

      {/* ----------------------------------------------------------- counts */}
      <section className="border-b border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          {stats.loading && (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
            </div>
          )}
          {!stats.loading && stats.data && (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
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
        </div>
      </section>

      {/* ------------------------------------------------------------ bands */}
      <Band
        icon={faLayerGroup}
        kicker="Spaces"
        title="Somewhere"
        accent="To Go"
        body="Every Space is somebody's own page, built the way they wanted it. Walk in, look around, leave a mark, and come back when they have changed it."
        to="/discover"
        action="Find a Space"
      >
        {spaces.loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <SpaceCardSkeleton key={i} />)}
          </div>
        )}

        {!spaces.loading && !spaces.data?.length && (
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-ink-card p-5">
            <Kobby mood="construction" size="sm" bob={false} />
            <p className="text-sm text-white/55">
              Nobody has published a Space yet. Yours would be the first one here.
            </p>
          </div>
        )}

        {!!spaces.data?.length && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {spaces.data.map((space) => <SpaceCard key={space.id} space={space} />)}
          </div>
        )}
      </Band>

      <Band
        flip
        tone="raised"
        icon={faShapes}
        kicker="Kobbleston Create"
        title="Built From"
        accent="Real Work"
        body="Images, sounds, video and fonts, made by people here and checked before anyone sees them. Get what you need, use it by its number, and sell what you make for Kubes."
        to="/create/marketplace"
        action="Open the marketplace"
      >
        {assets.loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-white/[0.06]" />
            ))}
          </div>
        )}

        {!assets.loading && !assets.data?.length && (
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-ink-card p-5">
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
      </Band>

      <Band
        icon={faUsers}
        kicker="Communities"
        title="People To"
        accent="Build With"
        body="Fan clubs, build teams and hobby corners, each with its own wall, its own ranks, its own events, its own funds and its own Spaces."
        to="/communities"
        action="Browse Communities"
      >
        {!biggest.length ? (
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-ink-card p-5">
            <Kobby mood="emptyBox" size="sm" bob={false} />
            <p className="text-sm text-white/55">
              No Communities yet. Start the first one and people can join it.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {biggest.map((group) => (
              <Link key={group.id} to={communityLink(group)} className="group min-w-0 text-center">
                <span className="block aspect-square overflow-hidden rounded-2xl bg-media ring-1 ring-white/10 transition-transform duration-200 group-hover:-translate-y-1 group-hover:ring-brand/70">
                  {group.icon_url ? (
                    <img src={group.icon_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center font-display text-2xl font-extrabold text-white/70">
                      {group.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="mt-2 block truncate text-xs font-bold group-hover:text-link">
                  {group.name}
                </span>
                <span className="block text-[11px] text-white/40">
                  {formatCount(group.member_count)} members
                </span>
              </Link>
            ))}
          </div>
        )}
      </Band>

      {/* ----------------------------------------------------------- safety */}
      <section className="border-b border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-8">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border-b-4 border-brand-ink bg-brand text-2xl text-onbrand shadow-pop">
            <FontAwesomeIcon icon={faShieldHalved} />
          </span>

          <h2 className="mt-6 font-display text-3xl font-extrabold sm:text-4xl">
            Built to be <span className="text-brand-bright">worth trusting</span>
          </h2>
          <p className="mt-4 leading-relaxed text-white/60">
            Kobbleston is for people aged 15 and over. Uploads are screened when they arrive and a
            person looks at anything the check is unsure about. Every Space runs shut off from the
            rest of the site, so what somebody builds cannot reach anybody else&rsquo;s account.
          </p>
          <p className="mt-3 leading-relaxed text-white/60">
            Nothing on this page is invented. The numbers above are the platform&rsquo;s own, and
            when there is nothing to show, it says so.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-bold">
            <Link to="/guidelines" className="text-link hover:underline">Community Guidelines</Link>
            <Link to="/terms" className="text-link hover:underline">Terms of Service</Link>
          </div>

          <p className="mt-12 text-sm text-white/45">Signed,</p>
          <Signature className="mx-auto mt-1 w-fit" />
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/40">
            CEO of Kobbleston
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------ close */}
      <section className="relative overflow-hidden border-t-[6px] border-brand-ink">
        <img
          src={asset('/brand/topbar.png')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-ink/70" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-8 sm:py-24">
          <h2 className="font-display text-4xl font-extrabold leading-[0.9] sm:text-6xl">
            <span className="block">Make Something</span>
            <span className="block">Nobody Else Has</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-white/70">
            Free, takes five minutes, and nobody is going to build it for you.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" to="/signup">Sign Up</Button>
            <Button size="lg" variant="subtle" to="/login">Log In</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
