import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faComment, faFlag, faGear, faUserPlus, faClock, faUserCheck,
  faEllipsis, faLink, faCubes, faEye, faAward, faShapes, faUsers,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
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
import { AssetTile } from '@/components/create/AssetTile'
import { useChatDock } from '@/components/chat/ChatDock'
import { Menu } from '@/components/ui/Menu'
import { Tooltip } from '@/components/ui/Tooltip'
import { GuestGate } from '@/components/ui/GuestGate'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useTitle, useSocialCard } from '@/hooks/useTitle'
import {
  getProfileByUsername, getProfileOverview, isFollowing, listEarnedBadges, listFriendships,
  listMemberCommunities, listSpacesByOwner, sendFriendRequest, setFollowing, startConversation,
  usernameHistory, usernameById, listFollows, listAssetsByCreator,
} from '@/lib/api'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'
import { communityLink, profileLink } from '@/lib/links'
import { avatarOf } from '@/lib/avatars'
import { Verified } from '@/components/brand/Verified'

/** The colour somebody chose for their page, or the house one. */
const BRAND = '#1B34E8'
const accentOf = (colour?: string | null) =>
  (colour && /^#[0-9a-f]{6}$/i.test(colour) ? colour : BRAND)

/**
 * A heading with the person's own colour under it.
 *
 * Sections are how this page is read now: there are no tabs, because a
 * profile is not four filing cabinets, it is somebody's work with their name
 * on it.
 */
function Heading({ icon, children, aside }: {
  icon: IconDefinition
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <h2 className="relative flex items-center gap-2.5 font-display text-xl font-extrabold sm:text-2xl">
        <FontAwesomeIcon icon={icon} className="text-base opacity-70" />
        {children}
        <span
          aria-hidden="true"
          className="absolute -bottom-1.5 left-0 h-[3px] w-10 rounded-full"
          style={{ background: 'var(--me)' }}
        />
      </h2>
      {aside && <div className="ml-auto">{aside}</div>}
    </div>
  )
}

/** A number that earned its place, said in words rather than stacked in a wall. */
function Fact({ icon, children }: { icon: IconDefinition; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-white/60">
      <FontAwesomeIcon icon={icon} className="text-xs" style={{ color: 'var(--me)' }} />
      {children}
    </span>
  )
}

function Faces({ people }: { people: { id: string; username: string; display_name: string; avatar_url: string | null; content_id?: number | null }[] }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 kob-scroll">
      {people.map((person) => (
        <Link
          key={person.id}
          to={profileLink(person)}
          className="w-24 shrink-0 rounded-xl p-2 text-center transition-colors hover:bg-ink-hover"
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
}

export default function Profile() {
  const { username = '', id } = useParams()
  const { profile: me } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const { openConversation } = useChatDock()

  const [following, setFollowingState] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [side, setSide] = useState<'Friends' | 'Followers' | 'Following'>('Friends')

  const person = useAsync(
    async () => {
      const name = id ? await usernameById(Number(id)) : username
      return name ? getProfileByUsername(name) : null
    },
    [username, id],
  )
  const user = person.data
  const isMe = me?.id === user?.id
  const accent = accentOf(user?.accent_color)

  const overview = useAsync(async () => (user ? getProfileOverview(user.id) : null), [user?.id])
  const spaces = useAsync(
    async () => (user ? listSpacesByOwner(user.id, Boolean(isMe)) : []),
    [user?.id, isMe],
  )
  const made = useAsync(async () => (user ? listAssetsByCreator(user.id) : []), [user?.id])
  const badges = useAsync(async () => (user ? listEarnedBadges(user.id) : []), [user?.id])
  const communities = useAsync(async () => (user ? listMemberCommunities(user.id) : []), [user?.id])
  const names = useAsync(async () => (user ? usernameHistory(user.id) : []), [user?.id])

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
      if (!user || side === 'Friends') return []
      return listFollows(user.id, side === 'Followers' ? 'followers' : 'following')
    },
    [user?.id, side],
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
  useSocialCard({
    title: user ? `${user.display_name} (@${user.username}) - Kobbleston` : null,
    description: user?.bio ?? (user ? `${user.display_name} on Kobbleston.` : null),
    image: user?.avatar_url ?? null,
  })

  useEffect(() => {
    if (!me || !user || isMe) return
    isFollowing(me.id, user.id).then(setFollowingState)
  }, [me, user, isMe])

  // Arriving by name sends you on to the address with the number in it.
  useEffect(() => {
    if (!id && user?.content_id) navigate(profileLink(user), { replace: true })
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
        <Skeleton className="h-56 w-full rounded-3xl" />
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
  const visits = (spaces.data ?? []).reduce((sum, space) => sum + (space.visit_count ?? 0), 0)
  const people = side === 'Friends' ? friends.data ?? [] : follows.data ?? []
  const busy = side === 'Friends' ? friends.loading : follows.loading

  return (
    <Page
      className="space-y-10 pt-6"
      /* Every accent on the page comes from here, so somebody's colour runs
         through their whole page rather than being dabbed on in places. */
      style={{ '--me': accent } as React.CSSProperties}
    >
      {/* ------------------------------------------------------- the person */}
      <section className="relative overflow-hidden rounded-3xl border border-ink-line">
        {/* Their own face, out of focus, is the backdrop: no stock banner,
            nothing everybody shares. */}
        <div className="absolute inset-0" aria-hidden="true">
          {!!avatarOf(user) && (
            <img
              src={avatarOf(user) ?? undefined}
              alt=""
              className="h-full w-full scale-125 object-cover opacity-25 blur-3xl"
            />
          )}
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${accent}2e, transparent 55%)` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/40" />
        </div>

        <div className="relative z-10 flex flex-col gap-5 p-5 sm:flex-row sm:p-7">
          <Avatar
            src={avatarOf(user)}
            name={user.display_name}
            size="xl"
            className="h-28 w-28 shrink-0 rounded-2xl sm:h-32 sm:w-32"
            style={{ boxShadow: `0 0 0 3px ${accent}` } as React.CSSProperties}
          />

          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 font-display text-3xl font-extrabold sm:text-4xl">
              {user.display_name}
              {user.is_admin && <Verified className="text-xl" />}
              {user.is_guest && <Badge tone="neutral">Guest</Badge>}
            </h1>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
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
            </div>

            {user.bio ? (
              <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                {user.bio}
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted">
                {isMe ? 'Say something about yourself in Settings.' : 'Nothing written yet.'}
              </p>
            )}

            {/* Two numbers that mean something, in a sentence rather than a
                wall of counters. */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Fact icon={faCubes}>
                {formatCount(spaces.data?.length ?? 0)}{' '}
                {spaces.data?.length === 1 ? 'Space' : 'Spaces'}
              </Fact>
              {visits > 0 && (
                <Fact icon={faEye}>{formatCount(visits)} visits to them</Fact>
              )}
              <Fact icon={faClock}>
                Here since {new Date(user.created_at).toLocaleDateString('en-GB', {
                  month: 'long', year: 'numeric',
                })}
              </Fact>
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-2">
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
                  ? [{
                      label: 'Report',
                      icon: faFlag,
                      danger: true,
                      onSelect: () => setReporting(true),
                    }]
                  : []),
              ]}
            />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- the work */}
      <section>
        <Heading
          icon={faCubes}
          aside={isMe ? <Button size="sm" variant="subtle" to="/spaces/new">New Space</Button> : undefined}
        >
          {isMe ? 'What you have built' : `What ${user.display_name} has built`}
        </Heading>

        {spaces.loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
                  ? 'A Space can be a page about your cat. That is a completely valid use of this website.'
                  : `${user.display_name} has not published anything yet.`
              }
              action={isMe ? <Button to="/spaces/new">Make a Space</Button> : undefined}
            />
          </Card>
        )}

        {!!spaces.data?.length && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {spaces.data.map((space) => <SpaceCard key={space.id} space={space} />)}
          </div>
        )}
      </section>

      {!!made.data?.length && (
        <section>
          <Heading
            icon={faShapes}
            aside={
              <Link
                to={`/create/creator/${user.username}`}
                className="text-xs font-bold text-link hover:underline"
              >
                Everything they have made
              </Link>
            }
          >
            In the Marketplace
          </Heading>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {made.data.slice(0, 12).map((item) => <AssetTile key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {!!badges.data?.length && (
        <section>
          <Heading icon={faAward}>Badges</Heading>
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
        </section>
      )}

      {/* ------------------------------------------------------- the people */}
      {!!communities.data?.length && (
        <section>
          <Heading icon={faUsers}>Communities</Heading>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 kob-scroll">
            {communities.data.map((community) => (
              <Link
                key={community.id}
                to={communityLink(community)}
                className="w-40 shrink-0 rounded-2xl border border-ink-line bg-ink-card p-3 text-center transition-colors hover:border-brand/60"
              >
                <span className="mx-auto grid h-14 w-14 place-items-center overflow-hidden rounded-xl bg-brand-deep font-display text-lg font-extrabold">
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
        </section>
      )}

      <section>
        <Heading
          icon={faUsers}
          aside={
            <div className="flex gap-1.5">
              {(['Friends', 'Followers', 'Following'] as const).map((name) => {
                const count = name === 'Friends'
                  ? friends.data?.length ?? stats?.friend_count ?? 0
                  : name === 'Followers'
                    ? stats?.follower_count ?? 0
                    : stats?.following_count ?? 0

                return (
                  <button
                    key={name}
                    onClick={() => setSide(name)}
                    aria-pressed={side === name}
                    className={cn(
                      'h-8 rounded-lg px-3 text-xs font-bold transition-colors',
                      side === name
                        ? 'text-onbrand'
                        : 'bg-ink-card text-white/60 hover:bg-ink-hover hover:text-white',
                    )}
                    style={side === name ? { background: 'var(--me)' } : undefined}
                  >
                    {name} {formatCount(count)}
                  </button>
                )
              })}
            </div>
          }
        >
          People
        </Heading>

        {busy && (
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-24 rounded-xl" />)}
          </div>
        )}

        {!busy && !people.length && (
          <p className="text-sm text-muted">
            {side === 'Friends'
              ? isMe ? 'Nobody yet. Add somebody from their profile.' : 'No friends yet.'
              : side === 'Followers'
                ? 'Nobody is following them yet.'
                : 'Not following anybody yet.'}
          </p>
        )}

        {!busy && !!people.length && <Faces people={people} />}
      </section>

      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        targetType="profile"
        targetId={user.id}
        targetName={user.display_name}
      />
    </Page>
  )
}
