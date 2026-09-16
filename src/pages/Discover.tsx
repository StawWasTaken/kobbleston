import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { EmptyState, ErrorState, SpaceCardSkeleton } from '@/components/ui/States'
import { SpaceCard, categoryLabels } from '@/components/spaces/SpaceCard'
import { useAsync } from '@/hooks/useAsync'
import { listSpaces } from '@/lib/api'
import type { SpaceSort } from '@/lib/api'
import type { SpaceCategory } from '@/types/db'
import { cn } from '@/lib/cn'

const sorts: { value: SpaceSort; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'new', label: 'New' },
  { value: 'popular', label: 'Most liked' },
]

const categories: (SpaceCategory | 'all')[] =
  ['all', 'personal', 'community', 'interactive', 'experiment', 'story', 'fan']

function Chip({
  active, children, onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-9 shrink-0 rounded-xl border px-3.5 text-sm font-semibold transition-colors',
        active
          ? 'border-brand-bright bg-brand text-white'
          : 'border-ink-line bg-ink-card text-white/65 hover:bg-ink-hover hover:text-white',
      )}
    >
      {children}
    </button>
  )
}

export default function Discover() {
  const [params, setParams] = useSearchParams()
  const [term, setTerm] = useState(params.get('q') ?? '')
  const [debounced, setDebounced] = useState(term)
  const [sort, setSort] = useState<SpaceSort>('trending')
  const [category, setCategory] = useState<SpaceCategory | 'all'>('all')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(term)
      setParams(term ? { q: term } : {}, { replace: true })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [term, setParams])

  const { data, error, loading, reload } = useAsync(
    () => listSpaces({ sort, category, search: debounced, limit: 30 }),
    [sort, category, debounced],
  )

  return (
    <Page>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Discover</h1>
        <p className="mt-1.5 text-muted">What people are building right now.</p>
      </header>

      <div className="sticky top-14 z-20 -mx-4 mb-6 space-y-3 bg-ink/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Input
          icon={faMagnifyingGlass}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search Spaces by name"
          aria-label="Search Spaces"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 kob-scroll">
          {sorts.map((s) => (
            <Chip key={s.value} active={sort === s.value} onClick={() => setSort(s.value)}>
              {s.label}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 bg-ink-line" />
          {categories.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c === 'all' ? 'Everything' : categoryLabels[c]}
            </Chip>
          ))}
        </div>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <SpaceCardSkeleton key={i} />)}
        </div>
      )}

      {error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && data?.length === 0 && (
        <Card>
          <EmptyState
            mood="noResults"
            title={debounced ? 'Kobby couldn’t find anything' : 'Nothing published yet'}
            body={
              debounced
                ? `No Space matches "${debounced}". Try a shorter word, or look at everything.`
                : 'Be the first person to publish something here.'
            }
          />
        </Card>
      )}

      {!!data?.length && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((space) => <SpaceCard key={space.id} space={space} />)}
        </div>
      )}
    </Page>
  )
}
