import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/States'
import { SpaceRail } from '@/components/spaces/SpaceRail'
import { FriendsRail } from '@/components/social/FriendsRail'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { listMemberCommunities, listSpaces, listSpacesByOwner } from '@/lib/api'
import { Link } from 'react-router-dom'
import { formatCount } from '@/lib/format'
import { communityLink } from '@/lib/links'
import { useTitle } from '@/hooks/useTitle'
import { AdBanner } from '@/components/ads/AdBanner'

export default function Home() {
  useTitle('Home')
  const { profile } = useAuth()

  const mine = useAsync(
    async () => (profile ? listSpacesByOwner(profile.id, true) : []),
    [profile?.id],
  )
  const trending = useAsync(() => listSpaces({ sort: 'trending', limit: 15 }), [])
  const fresh = useAsync(() => listSpaces({ sort: 'new', limit: 15 }), [])
  const liked = useAsync(() => listSpaces({ sort: 'popular', limit: 15 }), [])
  const communities = useAsync(
    async () => (profile ? listMemberCommunities(profile.id) : []),
    [profile?.id],
  )

  return (
    <Page>
      <h1 className="mb-5 font-display text-2xl font-extrabold sm:text-3xl">
        {profile ? `Welcome back, ${profile.display_name}` : 'Home'}
      </h1>

      {profile && <FriendsRail />}

      <AdBanner className="mb-8" quiet />

      <SpaceRail
        title="Your Spaces"
        spaces={mine.data}
        loading={mine.loading}
        empty={
          <Card>
            <EmptyState
              mood="emptyBox"
              title="You haven&rsquo;t made anything yet"
              body="A Space can be a page about your cat. That is a completely valid use of this website."
              action={<Button to="/spaces/new" icon={faPlus}>Make your first Space</Button>}
            />
          </Card>
        }
      />

      {/* The lower half sits beside a tall one where there is room for it,
          inside the page rather than pinned to the window. */}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_160px] xl:items-start">
        <div className="min-w-0">
      <SpaceRail
        title="Being visited right now"
        spaces={trending.data}
        loading={trending.loading}
        empty={
          <Card>
            <EmptyState
              mood="construction"
              title="Nothing published yet"
              body="When people start publishing Spaces, the busy ones land here."
            />
          </Card>
        }
      />

      <SpaceRail title="Just published" spaces={fresh.data} loading={fresh.loading} />
      <SpaceRail title="Most liked" spaces={liked.data} loading={liked.loading} />
        </div>

        <AdBanner size="tall" quiet className="hidden xl:block xl:sticky xl:top-20" />
      </div>

      {!!communities.data?.length && (
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="font-display text-xl font-extrabold sm:text-2xl">Your Communities</h2>
            <Link to="/communities" className="ml-auto text-xs font-bold text-link hover:underline">
              See all
            </Link>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 kob-scroll">
            {communities.data.map((community) => (
              <Link
                key={community.id}
                to={communityLink(community)}
                className="flex w-44 shrink-0 items-center gap-3 rounded-xl border border-ink-line bg-ink-card p-3 transition-colors hover:border-brand/60"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-deep text-xs font-extrabold">
                  {community.icon_url
                    ? <img src={community.icon_url} alt="" className="h-full w-full object-cover" />
                    : community.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{community.name}</span>
                  <span className="block text-xs text-muted">
                    {formatCount(community.member_count)} members
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Page>
  )
}
