import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheck, faComment, faEllipsis, faFilter, faInbox, faUserGroup, faUserMinus, faUserPlus,
  faUsers, faXmark, faHeart, faStar,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Menu } from '@/components/ui/Menu'
import { Avatar } from '@/components/ui/Avatar'
import { StatusDot, presenceOf } from '@/components/ui/StatusDot'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useChatDock } from '@/components/chat/ChatDock'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useTitle } from '@/hooks/useTitle'
import {
  getProfileByUsername, listFollows, listFriendships, removeFriendship, respondToFriendRequest,
  startConversation, usernameById,
} from '@/lib/api'
import { avatarOf } from '@/lib/avatars'
import { profileLink } from '@/lib/links'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Profile } from '@/types/db'
import { Verified, isVerified } from '@/components/brand/Verified'

const tabs = [
  { name: 'Friends', icon: faUserGroup },
  { name: 'Followers', icon: faStar },
  { name: 'Following', icon: faHeart },
  { name: 'Requests', icon: faInbox },
] as const
type Tab = (typeof tabs)[number]['name']

const presenceWord: Record<ReturnType<typeof presenceOf>, string> = {
  'in-space': 'In a Space',
  building: 'Building something',
  online: 'Online',
  offline: 'Offline',
}

/**
 * A person in one of your lists: the picture, whether they are about, and
 * what you can do with them, on a single line you can run your eye down.
 */
function PersonRow({
  person, note, actions, menu,
}: {
  person: Profile
  note?: string
  actions?: React.ReactNode
  menu?: React.ReactNode
}) {
  const presence = presenceOf(person)

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-ink-line bg-ink-card p-3 transition-colors hover:border-brand/60">
      <Link to={profileLink(person)} className="relative shrink-0">
        <Avatar src={avatarOf(person)} name={person.display_name} size="md" className="rounded-xl" />
        <span className="absolute -bottom-0.5 -right-0.5">
          <StatusDot presence={presence} ring />
        </span>
      </Link>

      <div className="min-w-0 flex-1">
        <Link to={profileLink(person)} className="flex items-center gap-1.5 hover:text-link">
          <span className="truncate text-sm font-bold">{person.display_name}</span>
          {isVerified(person) && <Verified className="text-[11px]" />}
        </Link>
        <p className="truncate text-xs text-muted">
          @{person.username}
          <span className={cn(presence === 'in-space' && 'text-space-bright')}>
            {' · '}{note ?? presenceWord[presence]}
          </span>
        </p>
      </div>

      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
      {menu}
    </li>
  )
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">{children}</ul>
}

function Loading() {
  return <List>{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[4.75rem] rounded-2xl" />)}</List>
}

/** A count that is a real number from a real list, never a guess. */
function Count({ icon, value, label, active, onClick }: {
  icon: IconDefinition
  value: number | null
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors',
        active
          ? 'border-brand-bright bg-brand/15'
          : 'border-ink-line bg-ink-card hover:bg-ink-hover',
      )}
    >
      <FontAwesomeIcon icon={icon} className="text-base" />
      <span className="min-w-0">
        <span className="block font-display text-xl font-extrabold tabular-nums leading-none">
          {value ?? '·'}
        </span>
        <span className="block text-xs text-muted">{label}</span>
      </span>
    </button>
  )
}

export default function Friends() {
  const { profile } = useAuth()
  const { openConversation } = useChatDock()
  const toast = useToast()

  /*
   * The same page, for anybody.
   *
   * Reached at /friends it is yours; reached from a profile it is theirs,
   * which is why the counts on a profile are links rather than lists opened
   * in place. Nobody else's requests are anybody's business, so that list is
   * only there when the page is your own.
   */
  const { id } = useParams()
  const [search] = useSearchParams()

  const viewed = useAsync(
    async () => {
      if (!id) return null
      const name = await usernameById(Number(id))
      return name ? getProfileByUsername(name) : null
    },
    [id],
  )

  const who = id ? viewed.data : profile
  const isMe = !id || who?.id === profile?.id

  const wanted = (search.get('list') ?? '').toLowerCase()
  const [tab, setTab] = useState<Tab>(
    wanted === 'followers' ? 'Followers' : wanted === 'following' ? 'Following' : 'Friends',
  )

  useTitle(
    !who ? 'Friends'
      : isMe ? 'My friends'
        : `${who.display_name}'s friends`,
  )
  const [term, setTerm] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setFilter(term.trim().toLowerCase()), 200)
    return () => window.clearTimeout(timer)
  }, [term])

  const { data, error, loading, reload } = useAsync(
    async () => (who ? listFriendships(who.id) : []),
    [who?.id],
  )
  // Both sides of following are asked for at once, so the counts on the page
  // are the lists themselves rather than a separate number to go stale.
  const following = useAsync(
    async () => (who ? listFollows(who.id, 'following') : []),
    [who?.id],
  )
  const followers = useAsync(
    async () => (who ? listFollows(who.id, 'followers') : []),
    [who?.id],
  )

  const edges = data ?? []
  const friends = edges
    .filter((e) => e.friendship.status === 'accepted')
    .sort((a, b) => Number(b.profile.is_online) - Number(a.profile.is_online))
  const incoming = edges.filter(
    (e) => e.friendship.status === 'pending' && e.friendship.addressee_id === who?.id,
  )
  const outgoing = edges.filter(
    (e) => e.friendship.status === 'pending' && e.friendship.requester_id === who?.id,
  )
  const online = friends.filter((f) => f.profile.is_online).length

  const matches = (person: Profile) =>
    !filter
    || person.display_name.toLowerCase().includes(filter)
    || person.username.toLowerCase().includes(filter)

  const shownFriends = friends.filter((f) => matches(f.profile))
  const shownFollowing = (following.data ?? []).filter(matches)
  const shownFollowers = (followers.data ?? []).filter(matches)

  const respond = async (id: string, accept: boolean) => {
    try {
      await respondToFriendRequest(id, accept)
      toast(accept ? 'You two are friends now.' : 'Request declined.', accept ? 'success' : 'info')
      reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    }
  }

  const chat = async (otherId: string) => {
    try {
      openConversation(await startConversation(otherId))
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not open that chat.', 'error')
    }
  }

  const drop = async (id: string, name: string) => {
    try {
      await removeFriendship(id)
      toast(`${name} is no longer a friend.`, 'info')
      reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    }
  }

  const waiting = incoming.length

  return (
    <Page className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {!isMe && who && (
            <Link to={profileLink(who)} className="shrink-0">
              <Avatar
                src={avatarOf(who)}
                name={who.display_name}
                size="lg"
                className="rounded-2xl"
              />
            </Link>
          )}
          <div>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
              {isMe ? 'My friends' : who ? `${who.display_name}'s friends` : 'Friends'}
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {friends.length
                ? `${friends.length} ${friends.length === 1 ? 'friend' : 'friends'}${isMe ? `, ${online} online` : ''}.`
                : isMe
                  ? 'Nobody yet. People is where you find somebody.'
                  : 'No friends yet.'}
            </p>
          </div>
        </div>

        {isMe
          ? <Button variant="subtle" icon={faUsers} to="/people">Find people</Button>
          : who && <Button variant="subtle" to={profileLink(who)}>Back to their profile</Button>}
      </header>

      {/* The numbers are the lists, and each one is the way in. Friends,
          then followers, then following, and requests only on your own. */}
      <div className={cn('grid gap-2.5 grid-cols-2', isMe ? 'sm:grid-cols-4' : 'sm:grid-cols-3')}>
        <Count
          icon={faUserGroup}
          value={loading ? null : friends.length}
          label="Friends"
          active={tab === 'Friends'}
          onClick={() => setTab('Friends')}
        />
        <Count
          icon={faStar}
          value={followers.loading ? null : followers.data?.length ?? 0}
          label="Followers"
          active={tab === 'Followers'}
          onClick={() => setTab('Followers')}
        />
        <Count
          icon={faHeart}
          value={following.loading ? null : following.data?.length ?? 0}
          label="Following"
          active={tab === 'Following'}
          onClick={() => setTab('Following')}
        />
        {isMe && (
          <Count
            icon={faInbox}
            value={loading ? null : waiting}
            label={waiting === 1 ? 'Request' : 'Requests'}
            active={tab === 'Requests'}
            onClick={() => setTab('Requests')}
          />
        )}
      </div>

      {tab !== 'Requests' && (
        <Input
          icon={faFilter}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={`Filter your ${tab.toLowerCase()}`}
          aria-label={`Filter your ${tab.toLowerCase()}`}
        />
      )}

      {error && <ErrorState message={error} onRetry={reload} />}

      {tab === 'Friends' && (
        <>
          {loading && <Loading />}

          {!loading && !shownFriends.length && (
            <Card>
              <EmptyState
                mood={filter ? 'noResults' : 'emptyBox'}
                title={filter ? 'None of your friends match' : 'No friends yet'}
                body={
                  filter
                    ? 'Try fewer letters.'
                    : 'People is everybody on Kobbleston. Send somebody a request and they turn up here.'
                }
                action={
                  filter
                    ? <Button variant="subtle" onClick={() => setTerm('')}>Clear the filter</Button>
                    : <Button icon={faUsers} to="/people">Find people</Button>
                }
              />
            </Card>
          )}

          {!!shownFriends.length && (
            <List>
              {shownFriends.map(({ friendship, profile: person }) => (
                <PersonRow
                  key={friendship.id}
                  person={person}
                  actions={isMe
                    ? <Button size="sm" icon={faComment} onClick={() => chat(person.id)}>Chat</Button>
                    : <Button size="sm" variant="subtle" to={profileLink(person)}>Profile</Button>}
                  menu={isMe ? (
                    <Menu
                      label={`Options for ${person.display_name}`}
                      trigger={
                        <span className="grid h-8 w-8 place-items-center rounded-lg text-white/45 transition-colors hover:bg-ink-hover hover:text-white">
                          <FontAwesomeIcon icon={faEllipsis} />
                        </span>
                      }
                      items={[
                        { label: 'Open profile', icon: faUserGroup, to: profileLink(person) },
                        {
                          label: 'Remove friend',
                          icon: faUserMinus,
                          danger: true,
                          onSelect: () => drop(friendship.id, person.display_name),
                        },
                      ]}
                    />
                  ) : undefined}
                />
              ))}
            </List>
          )}
        </>
      )}

      {tab === 'Requests' && isMe && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-muted">
              <FontAwesomeIcon icon={faInbox} />
              Waiting on you
            </h2>
            {loading && <Loading />}
            {!loading && !incoming.length && (
              <p className="text-sm text-muted">Nobody has asked.</p>
            )}
            {!!incoming.length && (
              <List>
                {incoming.map(({ friendship, profile: person }) => (
                  <PersonRow
                    key={friendship.id}
                    person={person}
                    note={`Asked ${timeAgo(friendship.created_at)}`}
                    actions={
                      <>
                        <Button size="sm" icon={faCheck} onClick={() => respond(friendship.id, true)}>
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={faXmark}
                          aria-label={`Decline ${person.display_name}`}
                          onClick={() => respond(friendship.id, false)}
                        />
                      </>
                    }
                  />
                ))}
              </List>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-muted">
              <FontAwesomeIcon icon={faUserPlus} />
              You asked
            </h2>
            {!outgoing.length ? (
              <p className="text-sm text-muted">You have not asked anybody.</p>
            ) : (
              <List>
                {outgoing.map(({ friendship, profile: person }) => (
                  <PersonRow
                    key={friendship.id}
                    person={person}
                    note={`Sent ${timeAgo(friendship.created_at)}`}
                    actions={
                      <Button
                        size="sm"
                        variant="subtle"
                        onClick={() => drop(friendship.id, person.display_name)}
                      >
                        Cancel
                      </Button>
                    }
                  />
                ))}
              </List>
            )}
          </section>
        </div>
      )}

      {(tab === 'Following' || tab === 'Followers') && (() => {
        const source = tab === 'Following' ? following : followers
        const shown = tab === 'Following' ? shownFollowing : shownFollowers

        return (
          <>
            {source.loading && <Loading />}
            {source.error && <ErrorState message={source.error} onRetry={source.reload} />}

            {!source.loading && !shown.length && (
              <Card>
                <EmptyState
                  mood={filter ? 'noResults' : 'emptyBox'}
                  title={
                    filter
                      ? 'Nobody here matches'
                      : tab === 'Following' ? 'Not following anybody' : 'No followers yet'
                  }
                  body={
                    filter
                      ? 'Try fewer letters.'
                      : tab === 'Following'
                        ? 'Following somebody puts their new Spaces in front of you.'
                        : 'Publish something and people will start following you.'
                  }
                  action={
                    filter
                      ? <Button variant="subtle" onClick={() => setTerm('')}>Clear the filter</Button>
                      : tab === 'Following'
                        ? <Button icon={faUsers} to="/people">Find people</Button>
                        : <Button to="/create/spaces">Make a Space</Button>
                  }
                />
              </Card>
            )}

            {!!shown.length && (
              <List>
                {shown.map((person) => (
                  <PersonRow
                    key={person.id}
                    person={person}
                    actions={isMe
                      ? (
                        <Button size="sm" variant="ghost" icon={faComment} onClick={() => chat(person.id)}>
                          Chat
                        </Button>
                      )
                      : <Button size="sm" variant="subtle" to={profileLink(person)}>Profile</Button>}
                  />
                ))}
              </List>
            )}
          </>
        )
      })()}
    </Page>
  )
}
