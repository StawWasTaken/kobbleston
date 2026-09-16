import { Link } from 'react-router-dom'
import { faPlus, faCompass, faUserGroup } from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { StatusDot, presenceOf } from '@/components/ui/StatusDot'
import { EmptyState, ErrorState, SpaceCardSkeleton, Skeleton } from '@/components/ui/States'
import { PixelField } from '@/components/brand/PixelField'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { ActivityFeed } from '@/components/social/ActivityFeed'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { listFriendships, listSpaces, listSpacesByOwner } from '@/lib/api'
import { asset } from '@/lib/asset'

function FriendRail() {
  const { profile } = useAuth()
  const { data, loading } = useAsync(
    async () => (profile ? listFriendships(profile.id) : []),
    [profile?.id],
  )

  const friends = (data ?? []).filter((edge) => edge.friendship.status === 'accepted')
  const sorted = [...friends].sort((a, a2) => Number(a2.profile.is_online) - Number(a.profile.is_online))

  if (loading) {
    return <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-11" />)}</div>
  }

  if (!sorted.length) {
    return (
      <EmptyState
        title="No friends yet"
        body="Find people by their @name and add them."
        action={<Button size="sm" variant="subtle" to="/friends" icon={faUserGroup}>Find people</Button>}
      />
    )
  }

  return (
    <ul className="p-2">
      {sorted.slice(0, 8).map(({ profile: friend }) => (
        <li key={friend.id}>
          <Link
            to={`/u/${friend.username}`}
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-ink-hover"
          >
            <span className="relative">
              <Avatar src={friend.avatar_url} name={friend.display_name} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5">
                <StatusDot presence={presenceOf(friend)} size="sm" ring />
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{friend.display_name}</span>
              <span className="block truncate text-xs text-muted">
                {friend.in_space_id ? 'In a Space' : friend.is_online ? 'Online' : 'Offline'}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function Home() {
  const { profile } = useAuth()
  const trending = useAsync(() => listSpaces({ sort: 'trending', limit: 6 }), [])
  const fresh = useAsync(() => listSpaces({ sort: 'new', limit: 3 }), [])
  const mine = useAsync(
    async () => (profile ? listSpacesByOwner(profile.id, true) : []),
    [profile?.id],
  )

  return (
    <>
      {/* ------------------------------------------------------ welcome */}
      <section className="relative overflow-hidden border-b border-ink-line">
        <PixelField className="opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <h1 className="font-display text-4xl font-extrabold leading-none sm:text-6xl">
            Welcome back{profile ? ',' : ''}
            {profile && <span className="block text-[#7f92ff]">{profile.display_name}</span>}
          </h1>
          <p className="mt-4 max-w-md text-white/65">
            Something to build, somewhere to go, someone to show it to.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button to="/create" icon={faPlus}>Make a Space</Button>
            <Button variant="subtle" to="/discover" icon={faCompass}>Discover</Button>
          </div>
        </div>
      </section>

      <Page className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="min-w-0 space-y-10">
          {/* ------------------------------------------------- my spaces */}
          <section>
            <SectionHeading
              title="Your Spaces"
              subtitle="Everything you've made, drafts included."
              action={<Button size="sm" variant="subtle" to="/create" icon={faPlus}>New</Button>}
            />
            {mine.loading && (
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1].map((i) => <SpaceCardSkeleton key={i} />)}
              </div>
            )}
            {mine.error && <ErrorState message={mine.error} onRetry={mine.reload} />}
            {!mine.loading && !mine.error && mine.data?.length === 0 && (
              <Card>
                <EmptyState
                  mood="emptyBox"
                  title="You haven't made anything yet"
                  body="A Space can be a page about your cat. That is a completely valid use of this website."
                  action={<Button to="/create" icon={faPlus}>Make your first Space</Button>}
                />
              </Card>
            )}
            {!!mine.data?.length && (
              <div className="grid gap-4 sm:grid-cols-2">
                {mine.data.slice(0, 4).map((space) => <SpaceCard key={space.id} space={space} />)}
              </div>
            )}
          </section>

          {/* -------------------------------------------------- trending */}
          <section>
            <SectionHeading
              title="Being visited right now"
              subtitle="The busiest Spaces on Kobbleston."
              action={<Button size="sm" variant="ghost" to="/discover">See all</Button>}
            />
            {trending.loading && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((i) => <SpaceCardSkeleton key={i} />)}
              </div>
            )}
            {trending.error && <ErrorState message={trending.error} onRetry={trending.reload} />}
            {!trending.loading && trending.data?.length === 0 && (
              <Card>
                <EmptyState
                  mood="construction"
                  title="Nothing published yet"
                  body="When people start publishing Spaces, the busy ones land here."
                />
              </Card>
            )}
            {!!trending.data?.length && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {trending.data.map((space) => <SpaceCard key={space.id} space={space} />)}
              </div>
            )}
          </section>

          {/* ------------------------------------------------------- new */}
          {!!fresh.data?.length && (
            <section>
              <SectionHeading title="Just published" subtitle="Still warm." />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {fresh.data.map((space) => <SpaceCard key={space.id} space={space} />)}
              </div>
            </section>
          )}
        </div>

        {/* ---------------------------------------------------- sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-line px-4 py-3.5">
              <h2 className="text-sm font-extrabold">Friends</h2>
              <Link to="/friends" className="text-xs font-semibold text-[#9fadff] hover:underline">All</Link>
            </div>
            <FriendRail />
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-ink-line px-4 py-3.5">
              <span className="h-2 w-2 animate-pulse-ring rounded-full bg-space text-space" />
              <h2 className="text-sm font-extrabold">Happening now</h2>
            </div>
            <ActivityFeed limit={8} />
          </Card>

          <Card className="relative overflow-hidden p-5">
            <img
              src={asset(('/brand/banner2.png'))}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
            <div className="relative">
              <h2 className="font-display text-lg font-extrabold">Pixels go brrr</h2>
              <p className="mt-1.5 text-sm text-white/65">
                Nobody is going to make the weird thing except you.
              </p>
              <Button size="sm" to="/create" className="mt-4" icon={faPlus}>Start one</Button>
            </div>
          </Card>
        </aside>
      </Page>
    </>
  )
}
