import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  faCheck, faComment, faMagnifyingGlass, faUserMinus, faUserPlus, faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { PresenceLabel, StatusDot, presenceOf } from '@/components/ui/StatusDot'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useChatDock } from '@/components/chat/ChatDock'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import {
  listFriendships, removeFriendship, respondToFriendRequest, searchProfiles,
  sendFriendRequest, startConversation,
} from '@/lib/api'
import type { Profile } from '@/types/db'
import { avatarOf } from '@/lib/avatars'

function PersonRow({
  person, children,
}: {
  person: Profile
  children?: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-3 border-b border-ink-line/70 px-4 py-3 last:border-0">
      <Link to={`/u/${person.username}`} className="relative shrink-0">
        <Avatar src={avatarOf(person)} name={person.display_name} size="md" />
        <span className="absolute -bottom-0.5 -right-0.5">
          <StatusDot presence={presenceOf(person)} size="sm" ring />
        </span>
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/u/${person.username}`} className="block truncate font-semibold hover:underline">
          {person.display_name}
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="truncate">@{person.username}</span>
          <PresenceLabel presence={presenceOf(person)} />
        </div>
      </div>
      <div className="flex shrink-0 gap-1.5">{children}</div>
    </li>
  )
}

function FindPeople({ onChanged }: { onChanged: () => void }) {
  const { profile } = useAuth()
  const toast = useToast()
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  const [sent, setSent] = useState<string[]>([])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term), 250)
    return () => window.clearTimeout(timer)
  }, [term])

  const { data, loading } = useAsync(
    () => searchProfiles(debounced, profile?.id),
    [debounced, profile?.id],
  )

  const add = async (person: Profile) => {
    if (!profile) return
    try {
      await sendFriendRequest(profile.id, person.id)
      setSent((all) => [...all, person.id])
      toast(`Friend request sent to ${person.display_name}.`, 'success')
      onChanged()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'That did not send.'
      toast(message.includes('duplicate') ? 'You already asked this person.' : message, 'error')
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-ink-line p-4">
        <Input
          icon={faMagnifyingGlass}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Find someone by @name"
          aria-label="Find people"
        />
      </div>

      {loading && debounced && (
        <div className="space-y-2 p-4">{[0, 1].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      )}

      {!debounced && (
        <p className="px-4 py-6 text-center text-sm text-muted">
          Type someone&apos;s name to find them.
        </p>
      )}

      {debounced && !loading && data?.length === 0 && (
        <EmptyState mood="noResults" title="Kobby couldn't find anyone" body={`Nobody matches "${debounced}".`} />
      )}

      {!!data?.length && (
        <ul>
          {data.map((person) => (
            <PersonRow key={person.id} person={person}>
              <Button
                size="sm"
                variant={sent.includes(person.id) ? 'subtle' : 'primary'}
                icon={sent.includes(person.id) ? faCheck : faUserPlus}
                disabled={sent.includes(person.id)}
                onClick={() => add(person)}
              >
                {sent.includes(person.id) ? 'Sent' : 'Add'}
              </Button>
            </PersonRow>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default function Friends() {
  const { profile } = useAuth()
  const { openConversation } = useChatDock()
  const toast = useToast()
  const { data, error, loading, reload } = useAsync(
    async () => (profile ? listFriendships(profile.id) : []),
    [profile?.id],
  )

  const edges = data ?? []
  const friends = edges.filter((e) => e.friendship.status === 'accepted')
  const incoming = edges.filter(
    (e) => e.friendship.status === 'pending' && e.friendship.addressee_id === profile?.id,
  )
  const outgoing = edges.filter(
    (e) => e.friendship.status === 'pending' && e.friendship.requester_id === profile?.id,
  )

  const respond = async (id: string, accept: boolean) => {
    try {
      await respondToFriendRequest(id, accept)
      toast(accept ? 'You two are friends now.' : 'Request declined.', accept ? 'success' : 'info')
      reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    }
  }

  const remove = async (id: string) => {
    try {
      await removeFriendship(id)
      reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    }
  }

  const message = async (otherId: string) => {
    try {
      openConversation(await startConversation(otherId))
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not open that chat.', 'error')
    }
  }

  return (
    <Page className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="min-w-0 space-y-8">
        <header>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Friends</h1>
          <p className="mt-1.5 text-muted">
            {friends.length
              ? `${friends.length} ${friends.length === 1 ? 'person' : 'people'}, ${friends.filter((f) => f.profile.is_online).length} online.`
              : 'Nobody yet.'}
          </p>
        </header>

        {error && <ErrorState message={error} onRetry={reload} />}

        {!!incoming.length && (
          <section>
            <SectionHeading title="Wants to be your friend" />
            <Card className="overflow-hidden">
              <ul>
                {incoming.map(({ friendship, profile: person }) => (
                  <PersonRow key={friendship.id} person={person}>
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
                  </PersonRow>
                ))}
              </ul>
            </Card>
          </section>
        )}

        <section>
          <SectionHeading title="Your friends" />
          {loading && (
            <Card className="space-y-2 p-4">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}
            </Card>
          )}
          {!loading && !friends.length && (
            <Card>
              <EmptyState
                title="No friends on Kobbleston yet"
                body="Search for someone on the right and send them a request. You can message people once you're friends."
              />
            </Card>
          )}
          {!!friends.length && (
            <Card className="overflow-hidden">
              <ul>
                {friends.map(({ friendship, profile: person }) => (
                  <PersonRow key={friendship.id} person={person}>
                    <Button
                      size="sm"
                      variant="subtle"
                      icon={faComment}
                      onClick={() => message(person.id)}
                    >
                      Message
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={faUserMinus}
                      aria-label={`Remove ${person.display_name}`}
                      onClick={() => remove(friendship.id)}
                    />
                  </PersonRow>
                ))}
              </ul>
            </Card>
          )}
        </section>

        {!!outgoing.length && (
          <section>
            <SectionHeading title="Waiting on them" />
            <Card className="overflow-hidden">
              <ul>
                {outgoing.map(({ friendship, profile: person }) => (
                  <PersonRow key={friendship.id} person={person}>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={faXmark}
                      onClick={() => remove(friendship.id)}
                    >
                      Cancel
                    </Button>
                  </PersonRow>
                ))}
              </ul>
            </Card>
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-20">
        <SectionHeading title="Find people" />
        <FindPeople onChanged={reload} />
      </aside>
    </Page>
  )
}
