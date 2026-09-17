import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faComment, faFlag, faGear, faUserPlus, faClock, faUserCheck, faCircleCheck,
  faEllipsis, faLink, faUserGroup, faCubes, faEye, faAward,
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
import { GuestGate } from '@/components/ui/GuestGate'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useTitle } from '@/hooks/useTitle'
import {
  getProfileByUsername, getProfileOverview, isFollowing, listEarnedBadges, listFriendships,
  listMemberCommunities, listSpacesByOwner, sendFriendRequest, setFollowing, startConversation,
  usernameHistory, usernameById, listFollows,
} from '@/lib/api'
import { formatCount } from '@/lib/format'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { communityLink, profileLink } from '@/lib/links'
import { avatarOf } from '@/lib/avatars'

const tabs = ['About', 'Creations', 'People', 'Badges'] as const
type Tab = (typeof tabs)[number]

function Count({ label, value, onClick }: {
  label: string
  value: number
  onClick?: () => void
}) {
  const body = (
    <>
      <span className="font-display text-lg font-extrabold tabular-nums">{formatCount(value)}</span>
      <span className="block text-xs text-muted">{label}</span>
    </>
  )
  return onClick
    ? (
      <button
        onClick={onClick}
        className="rounded-lg px-4 py-1 text-center transition-colors hover:bg-ink-hover"
      >
        {body}
      </button>
    )
    : <span className="px-4 py-1 text-center">{body}</span>
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
  // Either form of address lands here: the numbered one, or the old
  // name-only one, which is answered and then swapped for the number.
  const { username: nameParam = '', id } = useParams()
  const navigate = useNavigate()

  const byId = useAsync(
    async () => (id ? usernameById(Number(id)) : null),
    [id],
  )
  const username = id ? byId.data ?? '' : nameParam
  const { profile: me } = useAuth()
  const { openConversation } = useChatDock()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('About')
  const [reporting, setReporting] = useState(false)
  const [following, setFollowingState] = useState(false)
  const [bioOpen, setBioOpen] = useState(false)
  const [side, setSide] = useState<'Friends' | 'Followers' | 'Following'>('Friends')

  const person = useAsync(
    async () => (username ? getProfileByUsername(username) : null),
    [username],
  )
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
  const follows = useAsync(
    async () => {
      if (!user || tab !== 'People' || side === 'Friends') return []
      return listFollows(user.id, side === 'Followers' ? 'followers' : 'following')
    },
    [user?.id, tab, side],
  )
  const relationship = useAsync(
    async () => {
      if (!me || !user || isMe) return null
      const edges = await listFriendships(me.id)
      return edges.find((e) => e.profile.id === user.id) ?? null
    },
    [me?.id, user?.id, isMe],
  )

  useTitle(user ? `${user.display_name} (@${user.username})` : 'Profile')

  useEffect(() => {
    if (!me || !user || isMe) return
    isFollowing(me.id, user.id).then(setFollowingState)
  }, [me, user, isMe])

  // Arriving by name sends you on to the address with the number in it.
  useEffect(() => {
    if (!id && user?.content_id) {
      navigate(profileLink(user), { replace: true })
    }
  }, [id, user?.content_id, navigate])

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
      const message = err instanceof Error ? err.message : 'That did not send.'
      toast(
        message.includes('row-level security')
          ? 'Guests cannot add friends. Make an account and you can.'
          : message.includes('duplicate')
            ? 'You already asked this person.'
            : message,
        'error',
      )
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
      <div className="relative h-32 overflow-hidden bg-brand-ink sm:h-40">
        <img
          src={asset('/brand/banner3.png')}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
      </div>

      {/* The avatar sits on the seam rather than under the banner: a quarter
          of it overlaps, the rest is on the page, and it is drawn on top. */}
      <Page className="relative z-10 -mt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Avatar
            src={avatarOf(user)}
            name={user.display_name}
            size="xl"
            className="h-28 w-28 rounded-2xl ring-4 ring-ink"
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
                  <GuestGate action="add friends">
                    <Button icon={faUserPlus} onClick={addFriend} disabled={!me}>Add Friend</Button>
                  </GuestGate>
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
            <Count
              label="Friends"
              value={stats.friend_count}
              onClick={() => { setTab('People'); setSide('Friends') }}
            />
            <Count
              label="Followers"
              value={stats.follower_count}
              onClick={() => { setTab('People'); setSide('Followers') }}
            />
            <Count
              label="Following"
              value={stats.following_count}
              onClick={() => { setTab('People'); setSide('Following') }}
            />
            <Count label="Badges" value={stats.badge_count} onClick={() => setTab('Badges')} />
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
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-start">
            <div className="min-w-0 space-y-8">
              <div>
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
                      to={profileLink(friend)}
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
                      to={communityLink(community)}
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

            </div>

            {/* The facts sit beside everything else rather than floating on
                their own beside an empty paragraph. */}
            <Card className="divide-y divide-ink-line lg:sticky lg:top-20">
              <Fact
                icon={faClock}
                label="Joined"
                value={new Date(user.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              />
              <Fact icon={faCubes} label="Spaces" value={formatCount(spaces.data?.length ?? 0)} />
              <Fact
                icon={faEye}
                label="Visits to their Spaces"
                value={formatCount(
                  (spaces.data ?? []).reduce((sum, space) => sum + (space.visit_count ?? 0), 0),
                )}
              />
              <Fact
                icon={faUserGroup}
                label="Communities"
                value={formatCount(communities.data?.length ?? 0)}
              />
            </Card>
          </div>
        )}


        {tab === 'People' && (
          <div className="mt-6 space-y-5">
            <div className="flex gap-1.5">
              {(['Friends', 'Followers', 'Following'] as const).map((name) => (
                <button
                  key={name}
                  onClick={() => setSide(name)}
                  aria-pressed={side === name}
                  className={cn(
                    'h-9 rounded-lg px-4 text-sm font-bold transition-colors',
                    side === name
                      ? 'bg-brand text-onbrand'
                      : 'bg-ink-card text-white/65 hover:bg-ink-hover hover:text-white',
                  )}
                >
                  {name}
                </button>
              ))}
            </div>

            {(side === 'Friends' ? friends.loading : follows.loading) && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
                {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            )}

            {(() => {
              const people = side === 'Friends' ? friends.data ?? [] : follows.data ?? []
              const busy = side === 'Friends' ? friends.loading : follows.loading
              if (busy) return null
              if (!people.length) {
                return (
                  <p className="text-sm text-muted">
                    {side === 'Friends'
                      ? 'No friends yet.'
                      : side === 'Followers'
                        ? 'Nobody is following them yet.'
                        : 'Not following anybody yet.'}
                  </p>
                )
              }
              return (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
                  {people.map((person) => (
                    <Link
                      key={person.id}
                      to={profileLink(person)}
                      className="rounded-xl p-2 text-center transition-colors hover:bg-ink-hover"
                    >
                      <Avatar
                        src={avatarOf(person)}
                        name={person.display_name}
                        size="lg"
                        className="mx-auto rounded-xl"
                      />
                      <p className="mt-1.5 truncate text-xs font-bold">{person.display_name}</p>
                      <p className="truncate text-[11px] text-muted">@{person.username}</p>
                    </Link>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {tab === 'Badges' && (
          <div className="mt-6">
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
