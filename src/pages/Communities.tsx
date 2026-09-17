import { useEffect, useState } from 'react'
import { faMagnifyingGlass, faPlus } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { CommunityCard } from '@/components/community/CommunityCard'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { GuestGate } from '@/components/ui/GuestGate'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { listCommunities } from '@/lib/api'
import { cn } from '@/lib/cn'
import { useTitle } from '@/hooks/useTitle'

export default function Communities() {
  useTitle('Communities')
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
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        )}
    </div>
  )
}
