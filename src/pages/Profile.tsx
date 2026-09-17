import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faComment, faFlag, faGear, faUserPlus, faClock, faUserCheck, faCircleCheck, faAward,
  faEllipsis, faLink, faUserGroup, faCubes, faEye,
} from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { PresenceLabel, presenceOf } from '@/components/ui/StatusDot'
import { EmptyState, ErrorState, SpaceCardSkeleton, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { ReportDialog } from '@/components/social/ReportDialog'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { BadgeTile } from '@/components/spaces/BadgeGrid'
import { useChatDock } from '@/components/chat/ChatDock'
import { Menu } from '@/components/ui/Menu'
import { Tooltip } from '@/components/ui/Tooltip'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import {
  getProfileByUsername, getProfileOverview, isFollowing, listEarnedBadges, listFriendships,
  listMemberCommunities, listSpacesByOwner, sendFriendRequest, setFollowing, startConversation,
  usernameHistory,
} from '@/lib/api'
import { formatCount } from '@/lib/format'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { avatarOf } from '@/lib/avatars'

const tabs = ['About', 'Creations'] as const
type Tab = (typeof tabs)[number]

function Count({ label, value, to }: { label: string; value: number; to?: string }) {
  const body = (
    <>
      <span className="font-display text-lg font-extrabold tabular-nums">{formatCount(value)}</span>
      <span className="block text-xs text-muted">{label}</span>
    </>
  )
  return to
    ? <Link to={to} className="rounded-lg px-3 py-1 text-center transition-colors hover:bg-ink-hover">{body}</Link>
    : <span className="px-3 py-1 text-center">{body}</span>
}

/** A short line of real numbers about an account, nothing invented. */
function Fact({ icon, label, value }: { icon: typeof faEye; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5">
      <FontAwesomeIcon icon={icon} className="w-4 text-xs text-white/35" />
      <span className="flex-1 text-sm text-muted">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  )
}

export default function Profile() {
  const { username = '' } = useParams()
  const { profile: me } = useAuth()
  const { openConversation } = useChatDock()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('About')
  const [reporting, setReporting] = useState(false)
  const [following, setFollowingState] = useState(false)
  const [bioOpen, setBioOpen] = useState(false)

  const person = useAsync(() => getProfileByUsername(username), [username])
  const user = person.data
  const isMe = me?.id === user?.id

  const overview = useAsync(
    async () => (user ? getProfileOverview(user.id) : null),
    [user?.id],
  )
  const spaces = useAsync(
    async () => (user ? listSpacesByOwner(user.id, Boolean(isMe)) : []),
    [user?.id, isMe],
  )
  const badges = useAsync(
    async () => (user ? listEarnedBadges(user.id) : []),
    [user?.id],
  )
  const communities = useAsync(
    async () => (user ? listMemberCommunities(user.id) : []),
    [user?.id],
  )
  const names = useAsync(
    async () => (user ? usernameHistory(user.id) : []),
    [user?.id],
  )
  const friends = useAsync(
    async () => {
      if (!user) return []
      const edges = await listFriendships(user.id)
      return edges.filter((e) => e.friendship.status === 'accepted').map((e) => e.profile)
    },
    [user?.id],
  )
  const relationship = useAsync(
    async () => {
      if (!me || !user || isMe) return null
      const edges = await listFriendships(me.id)
      return edges.find((e) => e.profile.id === user.id) ?? null
    },
    [me?.id, user?.id, isMe],
  )

  useEffect(() => {
    if (!me || !user || isMe) return
    isFollowing(me.id, user.id).then(setFollowingState)
  }, [me, user, isMe])

  const toggleFollow = async () => {
    if (!me || !user) return
    const next = !following
    setFollowingState(next)
    try {
      await setFollowing(me.id, user.id, next)
      overview.reload()
    } catch {
      setFollowingState(!next)
      toast('That did not save.', 'error')
    }
  }

  const addFriend = async () => {
    if (!me || !user) return
    try {
      await sendFriendRequest(me.id, user.id)
      toast('Friend request sent.', 'success')
      relationship.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not send.', 'error')
    }
  }

  const message = async () => {
    if (!user) return
    try {
      openConversation(await startConversation(user.id))
    } catch (err) {
      toast(err instanceof Error ? err.message : 'You can only message friends.', 'error')
    }
  }

  if (person.loading) {
    return (
      <Page className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-8 w-48" />
      </Page>
    )
  }

  if (person.error) return <Page><ErrorState message={person.error} onRetry={person.reload} /></Page>

  if (!user) {
    return (
      <Page>
        <Card>
          <EmptyState
            mood="noResults"
            title="Nobody here"
            body={`There is no @${username} on Kobbleston.`}
            action={<Button to="/discover">Discover Spaces</Button>}
          />
        </Card>
      </Page>
    )
  }

  const edge = relationship.data
  const stats = overview.data

  return (
    <>
      <div className="relative h-36 overflow-hidden bg-brand-ink sm:h-44">
        <img
          src={asset('/brand/banner3.png')}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
      </div>

      <Page className="-mt-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Avatar
            src={avatarOf(user)}
            name={user.display_name}
            size="xl"
            className="rounded-2xl ring-4 ring-ink"
          />

          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold">
              {user.display_name}
              {user.is_admin && (
                <FontAwesomeIcon icon={faCircleCheck} className="text-xl text-[#4d68ff]" title="Verified" />
              )}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              {/* Old names sit behind the current one, so somebody who knew
                  them under an earlier name can still place them. */}
              {names.data?.length ? (
                <Tooltip
                  side="bottom"
                  label={`Was ${names.data.map((row) => `@${row.username}`).join(', ')}`}
                >
                  <span className="cursor-help border-b border-dotted border-white/30">
                    @{user.username}
                  </span>
                </Tooltip>
              ) : (
                <span>@{user.username}</span>
              )}
              <PresenceLabel presence={presenceOf(user)} />
              {user.is_guest && <Badge tone="neutral">Guest</Badge>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isMe ? (
              <Button variant="subtle" icon={faGear} to="/settings">Edit profile</Button>
            ) : (
              <>
                {edge?.friendship.status === 'accepted' ? (
                  <Button icon={faComment} onClick={message}>Chat</Button>
                ) : edge?.friendship.status === 'pending' ? (
                  <Button variant="subtle" icon={faClock} disabled>Request pending</Button>
                ) : (
                  <Button icon={faUserPlus} onClick={addFriend} disabled={!me}>Add Friend</Button>
                )}
                <Button
                  variant={following ? 'primary' : 'subtle'}
                  icon={faUserCheck}
                  onClick={toggleFollow}
                  disabled={!me}
                >
                  {following ? 'Following' : 'Follow'}
                </Button>
              </>
            )}

            <Menu
              label={`More about ${user.display_name}`}
              align="right"
              trigger={
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-ink-line bg-ink-card text-white/70 transition-colors hover:bg-ink-hover hover:text-white">
                  <FontAwesomeIcon icon={faEllipsis} />
                </span>
              }
              items={[
                {
                  label: 'Copy link',
                  icon: faLink,
                  onSelect: () => {
                    void navigator.clipboard?.writeText(window.location.href)
                    toast('Link copied.', 'success')
                  },
                },
                ...(me && !isMe
                  ? [{ label: 'Report abuse', icon: faFlag, danger: true, onSelect: () => setReporting(true) }]
                  : []),
              ]}
            />
          </div>
        </div>

        {/* The counts read as one strip, the way they do on the pages this
            borrows from, rather than as loose chips. */}
        {stats && (
          <div className="mt-5 flex flex-wrap items-center divide-x divide-ink-line rounded-xl border border-ink-line bg-ink-card py-2">
            <Count label="Friends" value={stats.friend_count} />
            <Count label="Followers" value={stats.follower_count} />
            <Count label="Following" value={stats.following_count} />
            <Count label="Badges" value={stats.badge_count} />
          </div>
        )}

        <div className="mt-6 flex border-b border-ink-line" role="tablist">
          {tabs.map((name) => (
            <button
              key={name}
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={cn(
                'flex-1 border-b-2 px-4 py-3 text-sm font-bold transition-colors sm:flex-none sm:px-10',
                tab === name
                  ? 'border-white text-white'
                  : 'border-transparent text-white/50 hover:text-white',
              )}
            >
              {name}
            </button>
          ))}
        </div>

        {tab === 'About' && (
          <div className="mt-6 space-y-8">
            <div className="grid gap-5 lg:grid-cols-[1fr_18rem] lg:items-start">
              <div className="min-w-0">
                {user.bio ? (
                  <>
                    <p
                      className={cn(
                        'max-w-2xl whitespace-pre-wrap leading-relaxed text-white/70',
                        !bioOpen && 'line-clamp-3',
                      )}
                    >
                      {user.bio}
                    </p>
                    {user.bio.length > 180 && (
                      <button
                        onClick={() => setBioOpen((v) => !v)}
                        className="mt-1 text-sm font-bold text-link hover:underline"
                      >
                        {bioOpen ? 'less' : 'more'}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted">
                    {isMe ? 'Say something about yourself in Settings.' : 'Nothing written yet.'}
                  </p>
                )}
              </div>

              <Card className="divide-y divide-ink-line">
                <Fact
                  icon={faClock}
                  label="Joined"
                  value={new Date(user.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                />
                <Fact
                  icon={faCubes}
                  label="Spaces"
                  value={formatCount(spaces.data?.length ?? 0)}
                />
                <Fact
                  icon={faEye}
                  label="Visits to their Spaces"
                  value={formatCount(
                    (spaces.data ?? []).reduce((sum, space) => sum + (space.visit_count ?? 0), 0),
                  )}
                />
              </Card>
            </div>

            <section>
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold">
                <FontAwesomeIcon icon={faUserGroup} className="text-base text-white/40" />
                Friends
                {!!friends.data?.length && (
                  <span className="text-base font-bold text-muted">({friends.data.length})</span>
                )}
              </h2>
              {friends.loading && (
                <div className="flex gap-3">
                  {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-24" />)}
                </div>
              )}
              {!friends.loading && !friends.data?.length && (
                <p className="text-sm text-muted">
                  {isMe ? 'Nobody yet. Add somebody from their profile.' : 'No friends yet.'}
                </p>
              )}
              {!!friends.data?.length && (
                <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 kob-scroll">
                  {friends.data.slice(0, 12).map((friend) => (
                    <Link
                      key={friend.id}
                      to={`/u/${friend.username}`}
                      className="w-24 shrink-0 rounded-xl p-2 text-center transition-colors hover:bg-ink-hover"
                    >
                      <Avatar
                        src={avatarOf(friend)}
                        name={friend.display_name}
                        size="lg"
                        className="mx-auto rounded-xl"
                      />
                      <p className="mt-1.5 truncate text-xs font-bold">{friend.display_name}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-extrabold">Communities</h2>
              {communities.loading && (
                <div className="flex gap-3">
                  {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-32" />)}
                </div>
              )}
              {!communities.loading && !communities.data?.length && (
                <p className="text-sm text-muted">Not in any yet.</p>
              )}
              {!!communities.data?.length && (
                <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 kob-scroll">
                  {communities.data.map((community) => (
                    <Link
                      key={community.id}
                      to={`/c/${community.slug}`}
                      className="w-36 shrink-0 rounded-xl border border-ink-line bg-ink-card p-3 text-center transition-colors hover:border-brand/60"
                    >
                      <span className="mx-auto grid h-12 w-12 place-items-center overflow-hidden rounded-lg bg-brand-deep font-display text-lg font-extrabold">
                        {community.icon_url
                          ? <img src={community.icon_url} alt="" className="h-full w-full object-cover" />
                          : community.name.slice(0, 2).toUpperCase()}
                      </span>
                      <p className="mt-2 truncate text-sm font-bold">{community.name}</p>
                      <p className="text-xs text-muted">
                        {formatCount(community.member_count)} members
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold">
                <FontAwesomeIcon icon={faAward} className="text-base text-white/40" />
                Badges
              </h2>
              {badges.loading && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[4/5]" />)}
                </div>
              )}
              {!badges.loading && !badges.data?.length && (
                <p className="text-sm text-muted">
                  {isMe ? 'Enter Spaces and earn some.' : 'None earned yet.'}
                </p>
              )}
              {!!badges.data?.length && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {badges.data.map((badge) => (
                    <Link key={badge.id} to={`/u/${badge.space_owner}/${badge.space_slug}`}>
                      <BadgeTile
                        badge={{ ...badge, awarded_count: 0 }}
                        earned
                        className="h-full transition-colors hover:border-brand/60"
                      />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === 'Creations' && (
          <div className="mt-6">
            {spaces.loading && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {[0, 1, 2].map((i) => <SpaceCardSkeleton key={i} />)}
              </div>
            )}
            {!spaces.loading && !spaces.data?.length && (
              <Card>
                <EmptyState
                  mood="emptyBox"
                  title={isMe ? 'Nothing made yet' : 'No Spaces yet'}
                  body={
                    isMe
                      ? 'Your Spaces will show up here once you make one.'
                      : `${user.display_name} has not published anything yet.`
                  }
                  action={isMe ? <Button to="/spaces/new">Make a Space</Button> : undefined}
                />
              </Card>
            )}
            {!!spaces.data?.length && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {spaces.data.map((space) => <SpaceCard key={space.id} space={space} />)}
              </div>
            )}
          </div>
        )}
      </Page>

      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        targetType="profile"
        targetId={user.id}
        targetName={user.display_name}
      />
    </>
  )
}
