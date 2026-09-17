import { Link, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { PresenceLabel, presenceOf } from '@/components/ui/StatusDot'
import { EmptyState, ErrorState, Skeleton, SpaceCardSkeleton } from '@/components/ui/States'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { AssetTile } from '@/components/create/AssetTile'
import { CommunityCard } from '@/components/community/CommunityCard'
import { searchScopes } from '@/components/layout/SearchBar'
import { useAsync } from '@/hooks/useAsync'
import { listAssets, listCommunities, listSpaces, searchProfiles } from '@/lib/api'
import { cn } from '@/lib/cn'
import { avatarOf } from '@/lib/avatars'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const term = params.get('q') ?? ''
  const tab = params.get('tab') ?? 'spaces'

  const spaces = useAsync(
    async () => (tab === 'spaces' && term ? listSpaces({ search: term, limit: 30 }) : []),
    [tab, term],
  )
  const people = useAsync(
    // No exclusion here: searching People shows everyone, you included.
    async () => (tab === 'people' && term ? searchProfiles(term, undefined, 30) : []),
    [tab, term],
  )
  const assets = useAsync(
    async () => (tab === 'create' && term ? listAssets({ search: term, limit: 36 }) : []),
    [tab, term],
  )

  const communities = useAsync(
    async () => (tab === 'communities' && term ? listCommunities(term) : []),
    [tab, term],
  )

  const current = tab === 'people' ? people
    : tab === 'create' ? assets
      : tab === 'communities' ? communities
        : spaces
  const nothing = !current.loading && !current.error && current.data?.length === 0

  return (
    <Page>
      <header className="mb-5">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
          Results for <span className="text-[#8fa0ff]">{term || 'nothing'}</span>
        </h1>
      </header>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 kob-scroll" role="tablist">
        {searchScopes.map((scope) => (
          <button
            key={scope.tab}
            role="tab"
            aria-selected={tab === scope.tab}
            onClick={() => setParams({ q: term, tab: scope.tab }, { replace: true })}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3.5 text-sm font-bold transition-colors',
              tab === scope.tab
                ? 'border-brand-bright bg-brand text-white'
                : 'border-ink-line bg-ink-card text-white/60 hover:bg-ink-hover hover:text-white',
            )}
          >
            <FontAwesomeIcon icon={scope.icon} />
            {scope.label}
          </button>
        ))}
      </div>

      {current.error && <ErrorState message={current.error} onRetry={current.reload} />}

      {nothing && (
        <Card>
          <EmptyState
            mood="noResults"
            title="Kobby couldn&rsquo;t find anything"
            body={`Nothing in ${searchScopes.find((s) => s.tab === tab)?.label} matches "${term}".`}
          />
        </Card>
      )}

      {tab === 'spaces' && (
        <>
          {spaces.loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <SpaceCardSkeleton key={i} />)}
            </div>
          )}
          {!!spaces.data?.length && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {spaces.data.map((space) => <SpaceCard key={space.id} space={space} />)}
            </div>
          )}
        </>
      )}

      {tab === 'people' && (
        <>
          {people.loading && (
            <Card className="space-y-2 p-4">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}
            </Card>
          )}
          {!!people.data?.length && (
            <Card className="overflow-hidden">
              <ul>
                {people.data.map((person) => (
                  <li
                    key={person.id}
                    className="flex items-center gap-3 border-b border-ink-line/70 px-4 py-3 last:border-0"
                  >
                    <Link to={`/u/${person.username}`} className="shrink-0">
                      <Avatar src={avatarOf(person)} name={person.display_name} size="md" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/u/${person.username}`}
                        className="block truncate font-bold hover:underline"
                      >
                        {person.display_name}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span className="truncate">@{person.username}</span>
                        <PresenceLabel presence={presenceOf(person)} />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="subtle"
                      to={`/u/${person.username}`}
                      icon={faUserPlus}
                    >
                      View
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {tab === 'communities' && (
        <>
          {communities.loading && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[4.5rem]" />)}
            </div>
          )}
          {!!communities.data?.length && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {communities.data.map((community) => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'create' && (
        <>
          {assets.loading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
              {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="aspect-[4/5]" />)}
            </div>
          )}
          {!!assets.data?.length && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
              {assets.data.map((item) => <AssetTile key={item.id} item={item} />)}
            </div>
          )}
        </>
      )}
    </Page>
  )
}
