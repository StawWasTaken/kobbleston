import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheck, faComment, faMagnifyingGlass, faUserMinus, faUserPlus, faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { StatusDot, presenceOf } from '@/components/ui/StatusDot'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { Tooltip } from '@/components/ui/Tooltip'
import { useToast } from '@/components/ui/Toast'
import { useChatDock } from '@/components/chat/ChatDock'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import {
  listFollows, listFriendships, removeFriendship, respondToFriendRequest, searchProfiles,
  sendFriendRequest, startConversation,
} from '@/lib/api'
import { avatarOf } from '@/lib/avatars'
import { cn } from '@/lib/cn'
import type { Profile } from '@/types/db'
import { profileLink } from '@/lib/links'

const tabs = ['Friends', 'Requests', 'Following', 'Followers'] as const
type Tab = (typeof tabs)[number]

/**
 * One person as a tile: the picture is the thing you recognise, the actions
 * sit under it. A page of these reads as people, not as a spreadsheet.
 */
function PersonTile({ person, actions }: { person: Profile; actions?: React.ReactNode }) {
  const presence = presenceOf(person)

  return (
    <article className="flex flex-col items-center rounded-2xl border border-ink-line bg-ink-card p-3 text-center transition-colors hover:border-brand/60">
      <Link to={profileLink(person)} className="relative">
        <Avatar src={avatarOf(person)} name={person.display_name} size="xl" className="rounded-2xl" />
        <span className="absolute bottom-0 right-0">
          <StatusDot presence={presence} ring />
        </span>
      </Link>

      <Link
        to={profileLink(person)}
        className="mt-2.5 w-full truncate text-sm font-bold hover:text-link"
      >
        {person.display_name}
      </Link>
      <span className="w-full truncate text-xs text-muted">@{person.username}</span>

      {actions && <div className="mt-3 flex w-full items-center justify-center gap-1.5">{actions}</div>}
    </article>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {children}
    </div>
  )
}

export default function Friends() {
  const { profile } = useAuth()
  const { openConversation } = useChatDock()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('Friends')
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  const [sent, setSent] = useState<string[]>([])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [term])

  const { data, error, loading, reload } = useAsync(
    async () => (profile ? listFriendships(profile.id) : []),
    [profile?.id],
  )
  const following = useAsync(
    async () => (profile && tab === 'Following' ? listFollows(profile.id, 'following') : []),
    [profile?.id, tab],
  )
  const followers = useAsync(
    async () => (profile && tab === 'Followers' ? listFollows(profile.id, 'followers') : []),
    [profile?.id, tab],
  )
  // Searching looks outward: the same box finds people you have not met.
  const found = useAsync(
    async () => (debounced ? searchProfiles(debounced, profile?.id, 24) : []),
    [debounced, profile?.id],
  )

  const edges = data ?? []
  const friends = edges.filter((e) => e.friendship.status === 'accepted')
  const incoming = edges.filter(
    (e) => e.friendship.status === 'pending' && e.friendship.addressee_id === profile?.id,
  )
  const outgoing = edges.filter(
    (e) => e.friendship.status === 'pending' && e.friendship.requester_id === profile?.id,
  )
  const known = new Set(edges.map((e) => e.profile.id))

  const shownFriends = friends.filter(({ profile: person }) =>
    !debounced
    || person.display_name.toLowerCase().includes(debounced.toLowerCase())
    || person.username.toLowerCase().includes(debounced.toLowerCase()))

  const respond = async (id: string, accept: boolean) => {
    try {
      await respondToFriendRequest(id, accept)
      toast(accept ? 'You two are friends now.' : 'Request declined.', accept ? 'success' : 'info')
      reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    }
  }

  const add = async (person: Profile) => {
    if (!profile) return
    try {
      await sendFriendRequest(profile.id, person.id)
      setSent((all) => [...all, person.id])
      toast(`Friend request sent to ${person.display_name}.`, 'success')
      reload()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'That did not send.'
      toast(message.includes('duplicate') ? 'You already asked this person.' : message, 'error')
    }
  }

  const message = async (otherId: string) => {
    try {
      openConversation(await startConversation(otherId))
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not open that chat.', 'error')
    }
  }

  const counts: Record<Tab, number | null> = {
    Friends: friends.length,
    Requests: incoming.length,
    Following: null,
    Followers: null,
  }

  return (
    <Page className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Friends</h1>
          <p className="mt-1.5 text-sm text-muted">
            {friends.length
              ? `${friends.length} ${friends.length === 1 ? 'person' : 'people'}, ${friends.filter((f) => f.profile.is_online).length} online.`
              : 'Nobody yet. Search for somebody to get started.'}
          </p>
        </div>
      </header>

      <Input
        icon={faMagnifyingGlass}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search your friends, or find somebody new"
        aria-label="Search people"
      />

      <div className="flex overflow-x-auto border-b border-ink-line kob-scroll" role="tablist">
        {tabs.map((name) => (
          <button
            key={name}
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={cn(
              'shrink-0 border-b-2 px-5 py-3 text-sm font-bold transition-colors sm:px-8',
              tab === name
                ? 'border-white text-white'
                : 'border-transparent text-white/50 hover:text-white',
            )}
          >
            {name}
            {!!counts[name] && <span className="ml-1.5 text-link">({counts[name]})</span>}
          </button>
        ))}
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}

      {tab === 'Friends' && (
        <>
          {loading && (
            <Grid>{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</Grid>
          )}

          {!loading && !shownFriends.length && (
            <Card>
              <EmptyState
                mood={debounced ? 'noResults' : 'emptyBox'}
                title={debounced ? 'None of your friends match' : 'No friends yet'}
                body={
                  debounced
                    ? 'Anyone new matching that is below.'
                    : 'Find somebody by name and send them a request.'
                }
              />
            </Card>
          )}

          {!!shownFriends.length && (
            <Grid>
              {shownFriends.map(({ friendship, profile: person }) => (
                <PersonTile
                  key={friendship.id}
                  person={person}
                  actions={
                    <>
                      <Button size="sm" icon={faComment} onClick={() => message(person.id)}>Chat</Button>
                      <Tooltip label={`Remove ${person.display_name}`} side="top">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={faUserMinus}
                          aria-label={`Remove ${person.display_name}`}
                          onClick={async () => { await removeFriendship(friendship.id); reload() }}
                        />
                      </Tooltip>
                    </>
                  }
                />
              ))}
            </Grid>
          )}
        </>
      )}

      {tab === 'Requests' && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-muted">
              Waiting on you
            </h2>
            {!incoming.length ? (
              <p className="text-sm text-muted">Nobody has asked.</p>
            ) : (
              <Grid>
                {incoming.map(({ friendship, profile: person }) => (
                  <PersonTile
                    key={friendship.id}
                    person={person}
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
              </Grid>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-muted">
              You asked
            </h2>
            {!outgoing.length ? (
              <p className="text-sm text-muted">You have not asked anybody.</p>
            ) : (
              <Grid>
                {outgoing.map(({ friendship, profile: person }) => (
                  <PersonTile
                    key={friendship.id}
                    person={person}
                    actions={
                      <Button
                        size="sm"
                        variant="subtle"
                        onClick={async () => { await removeFriendship(friendship.id); reload() }}
                      >
                        Cancel
                      </Button>
                    }
                  />
                ))}
              </Grid>
            )}
          </section>
        </div>
      )}

      {(tab === 'Following' || tab === 'Followers') && (() => {
        const source = tab === 'Following' ? following : followers
        return (
          <>
            {source.loading && (
              <Grid>{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</Grid>
            )}
            {!source.loading && !source.data?.length && (
              <Card>
                <EmptyState
                  mood="emptyBox"
                  title={tab === 'Following' ? 'Not following anybody' : 'No followers yet'}
                  body={
                    tab === 'Following'
                      ? 'Following somebody puts their new Spaces in front of you.'
                      : 'Publish something and people will start following you.'
                  }
                />
              </Card>
            )}
            {!!source.data?.length && (
              <Grid>
                {source.data.map((person) => <PersonTile key={person.id} person={person} />)}
              </Grid>
            )}
          </>
        )
      })()}

      {/* Searching always offers people you do not know yet, whatever tab you
          are on, so finding somebody never means going somewhere else. */}
      {!!debounced && !!found.data?.filter((p) => !known.has(p.id)).length && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-muted">
            <FontAwesomeIcon icon={faUserPlus} />
            People matching &ldquo;{debounced}&rdquo;
          </h2>
          <Grid>
            {found.data.filter((p) => !known.has(p.id)).map((person) => (
              <PersonTile
                key={person.id}
                person={person}
                actions={
                  <Button
                    size="sm"
                    variant={sent.includes(person.id) ? 'subtle' : 'primary'}
                    icon={sent.includes(person.id) ? faCheck : faUserPlus}
                    disabled={sent.includes(person.id)}
                    onClick={() => add(person)}
                  >
                    {sent.includes(person.id) ? 'Sent' : 'Add'}
                  </Button>
                }
              />
            ))}
          </Grid>
        </section>
      )}
    </Page>
  )
}
