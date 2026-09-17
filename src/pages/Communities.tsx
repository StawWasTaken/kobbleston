import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass, faXmark, faUsers, faSeedling,
} from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CommunityCard } from '@/components/community/CommunityCard'
import { Verified } from '@/components/brand/Verified'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useAsync } from '@/hooks/useAsync'
import { listCommunities } from '@/lib/api'
import { formatCount } from '@/lib/format'
import { communityLink } from '@/lib/links'
import type { Community } from '@/types/db'
import { useTitle } from '@/hooks/useTitle'
import { useNewCommunity } from '@/components/community/NewCommunityDialog'

export default function Communities() {
  useTitle('Communities')
  const openNew = useNewCommunity()
  const [params, setParams] = useSearchParams()
  const [term, setTerm] = useState(params.get('q') ?? '')
  const [debounced, setDebounced] = useState(term)
  const field = useRef<HTMLInputElement>(null)

  // The search lives in the address, so the bar at the top of the site can
  // hand a search over to this page and a result can be linked to.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(term)
      setParams(term ? { q: term } : {}, { replace: true })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [term, setParams])

  // /communities/new used to be a page of its own; it now lands here and
  // opens the popup, so a link somebody kept still does what they expect.
  useEffect(() => {
    if (params.get('new') === null) return
    openNew()
    setParams((now) => {
      const next = new URLSearchParams(now)
      next.delete('new')
      return next
    }, { replace: true })
  }, [params, openNew, setParams])

  const all = useAsync(() => listCommunities(debounced), [debounced])

  // With nothing typed, the page is something to browse: the biggest first,
  // then the newest, both from the same list so nothing is invented.
  const browsing = !debounced
  const sorted = all.data ?? []
  const biggest = [...sorted].sort((a, b) => b.member_count - a.member_count).slice(0, 6)
  const newest = [...sorted]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 12)

  return (
    <div className="px-4 py-6 sm:px-6">
        {/* The search leads, the way it does in Create. */}
        <section className="relative overflow-hidden rounded-3xl border border-ink-line bg-ink-card px-5 py-7 sm:px-8 sm:py-9">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand/20 blur-3xl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-space/10 blur-3xl"
          />

          <div className="relative">
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Communities</h1>
            <p className="mt-1.5 max-w-xl text-sm text-muted">
              Fan clubs, build teams, hobby corners. Each one has its own wall, its own ranks, its
              own events and its own Spaces.
            </p>

            <div className="mt-5">
              <div className="relative">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/35"
                />
                <input
                  ref={field}
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Search every Community"
                  aria-label="Search communities"
                  className="h-14 w-full rounded-2xl border border-ink-line bg-ink-raised pl-12 pr-12 text-base font-semibold shadow-card transition-colors placeholder:font-normal placeholder:text-white/30 focus:border-brand-bright focus:outline-none"
                />
                {term && (
                  <button
                    onClick={() => setTerm('')}
                    aria-label="Clear the search"
                    className="absolute right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-white/45 transition-colors hover:bg-ink-hover hover:text-white"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {all.loading && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        )}

        {all.error && <div className="mt-6"><ErrorState message={all.error} onRetry={all.reload} /></div>}

        {!all.loading && !all.error && !all.data?.length && (
          <Card className="mt-6">
            <EmptyState
              mood={debounced ? 'noResults' : 'emptyBox'}
              title={debounced ? 'Kobby could not find anything' : 'No communities yet'}
              body={
                debounced
                  ? `Nothing matches "${debounced}".`
                  : 'Start the first one and people can join it.'
              }
              action={
                debounced
                  ? <Button variant="subtle" onClick={() => setTerm('')}>Clear the search</Button>
                  : <Button onClick={openNew}>Make one</Button>
              }
            />
          </Card>
        )}

        {!browsing && !!all.data?.length && (
          <section className="mt-6">
            <p className="mb-3 text-sm text-muted">
              {formatCount(all.data.length)} {all.data.length === 1 ? 'result' : 'results'} for
              &ldquo;{debounced}&rdquo;
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {all.data.map((community) => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>
          </section>
        )}

        {browsing && !!biggest.length && (
          <>
            <section className="mt-8">
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold">
                <FontAwesomeIcon icon={faUsers} className="text-base" />
                The biggest
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {biggest.map((community) => (
                  <BigCommunityCard key={community.id} community={community} />
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold">
                <FontAwesomeIcon icon={faSeedling} className="text-base" />
                Just started
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {newest.map((community) => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>
            </section>
          </>
        )}
    </div>
  )
}

/** A Community with its cover behind it, for the rows that lead the page. */
function BigCommunityCard({ community }: { community: Community }) {
  return (
    <Link
      to={communityLink(community)}
      className="group relative block overflow-hidden rounded-2xl border border-ink-line bg-ink-card transition-colors hover:border-brand/60"
    >
      <div className="relative h-24 overflow-hidden bg-media">
        {community.banner_url && (
          <img
            src={community.banner_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-card via-ink-card/40 to-transparent" />
      </div>

      {/* The banner is positioned, so the row has to be too, otherwise the
          emblem hanging over it gets painted away. */}
      <div className="relative z-10 flex items-start gap-3 px-4 pb-4">
        <span className="-mt-7 grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-deep font-display text-base font-extrabold ring-4 ring-ink-card">
          {community.icon_url
            ? <img src={community.icon_url} alt="" className="h-full w-full object-cover" />
            : community.name.slice(0, 2).toUpperCase()}
        </span>

        <span className="min-w-0 flex-1 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-bold">{community.name}</span>
            {community.is_verified && <Verified className="text-xs" />}
          </span>
          <span className="block text-xs text-muted">
            {formatCount(community.member_count)} members
          </span>
          {community.description && (
            <span className="mt-1.5 line-clamp-2 block text-xs leading-relaxed text-white/55">
              {community.description}
            </span>
          )}
        </span>
      </div>
    </Link>
  )
}
