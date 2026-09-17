import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faPlus, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { GuestGate } from '@/components/ui/GuestGate'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { listCommunities } from '@/lib/api'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'

function BrowseCard({
  slug, name, icon, members, verified,
}: {
  slug: string
  name: string
  icon: string | null
  members: number
  verified?: boolean
}) {
  return (
    <Link
      to={`/c/${slug}`}
      className="flex items-center gap-3 rounded-xl border border-ink-line bg-ink-card p-3 transition-colors hover:border-brand/60"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-deep font-display text-base font-extrabold">
        {icon ? <img src={icon} alt="" className="h-full w-full object-cover" /> : name.slice(0, 2).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-bold">{name}</span>
          {verified && <FontAwesomeIcon icon={faCircleCheck} className="shrink-0 text-xs text-[#4d68ff]" />}
        </span>
        <span className="block text-xs text-muted">{formatCount(members)} members</span>
      </span>
    </Link>
  )
}

export default function Communities() {
  const { profile } = useAuth()
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term), 250)
    return () => window.clearTimeout(timer)
  }, [term])

  const all = useAsync(() => listCommunities(debounced), [debounced])
  return (
    <div className="px-4 py-6 sm:px-6">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Search Communities</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted">
              Fan clubs, build teams, hobby corners. They have their own wall, their own
              ranks and their own Spaces.
            </p>
          </div>
          <GuestGate action="make a Community">
            <Button icon={faPlus} to="/communities/new" disabled={!profile} className="lg:hidden">
              New Community
            </Button>
          </GuestGate>
        </header>

        <Input
          icon={faMagnifyingGlass}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search"
          aria-label="Search communities"
          className="mb-5"
        />

        {all.loading && (
          <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-3')}>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[4.5rem]" />)}
          </div>
        )}

        {all.error && <ErrorState message={all.error} onRetry={all.reload} />}

        {!all.loading && !all.error && !all.data?.length && (
          <Card>
            <EmptyState
              mood={debounced ? 'noResults' : 'emptyBox'}
              title={debounced ? 'Kobby could not find anything' : 'No communities yet'}
              body={
                debounced
                  ? `Nothing matches "${debounced}".`
                  : 'Start the first one and people can join it.'
              }
            />
          </Card>
        )}

        {!!all.data?.length && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {all.data.map((community) => (
              <BrowseCard
                key={community.id}
                slug={community.slug}
                name={community.name}
                icon={community.icon_url}
                members={community.member_count}
                verified={community.is_verified}
              />
            ))}
          </div>
        )}
    </div>
  )
}
