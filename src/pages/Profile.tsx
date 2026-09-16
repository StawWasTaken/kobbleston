import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  faCalendarDays, faComment, faFlag, faGear, faUserCheck, faUserPlus, faClock,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { PresenceLabel, presenceOf } from '@/components/ui/StatusDot'
import { EmptyState, ErrorState, SpaceCardSkeleton, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { ReportDialog } from '@/components/social/ReportDialog'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import {
  getProfileByUsername, listFriendships, listSpacesByOwner, sendFriendRequest, startConversation,
} from '@/lib/api'
import { formatCount } from '@/lib/format'
import { asset } from '@/lib/asset'

export default function Profile() {
  const { username = '' } = useParams()
  const { profile: me } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [reporting, setReporting] = useState(false)

  const person = useAsync(() => getProfileByUsername(username), [username])
  const isMe = me?.id === person.data?.id

  const spaces = useAsync(
    async () => (person.data ? listSpacesByOwner(person.data.id, isMe) : []),
    [person.data?.id, isMe],
  )

  const relationship = useAsync(
    async () => {
      if (!me || !person.data || isMe) return null
      const edges = await listFriendships(me.id)
      return edges.find((e) => e.profile.id === person.data!.id) ?? null
    },
    [me?.id, person.data?.id, isMe],
  )

  const addFriend = async () => {
    if (!me || !person.data) return
    try {
      await sendFriendRequest(me.id, person.data.id)
      toast('Friend request sent.', 'success')
      relationship.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not send.', 'error')
    }
  }

  const message = async () => {
    if (!person.data) return
    try {
      navigate(`/chat/${await startConversation(person.data.id)}`)
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

  if (!person.data) {
    return (
      <Page>
        <Card>
          <EmptyState
            mood="noResults"
            title="Nobody here"
            body={`There's no @${username} on Kobbleston.`}
            action={<Button to="/discover">Discover Spaces</Button>}
          />
        </Card>
      </Page>
    )
  }

  const user = person.data
  const edge = relationship.data
  const visits = (spaces.data ?? []).reduce((total, s) => total + s.visit_count, 0)

  return (
    <>
      <div className="relative h-36 overflow-hidden bg-brand-ink sm:h-48">
        <img src={asset(('/brand/banner3.png'))} alt="" aria-hidden="true" className="h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
      </div>

      <Page className="-mt-14 sm:-mt-16">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <Avatar
            src={user.avatar_url}
            name={user.display_name}
            size="xl"
            className="ring-4 ring-ink"
          />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{user.display_name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span>@{user.username}</span>
              <PresenceLabel presence={presenceOf(user)} />
              <span className="inline-flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCalendarDays} />
                Joined {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isMe ? (
              <Button variant="subtle" icon={faGear} to="/settings">Edit profile</Button>
            ) : (
              <>
                {edge?.friendship.status === 'accepted' ? (
                  <Button icon={faComment} onClick={message}>Message</Button>
                ) : edge?.friendship.status === 'pending' ? (
                  <Button variant="subtle" icon={faClock} disabled>Request pending</Button>
                ) : (
                  <Button icon={faUserPlus} onClick={addFriend} disabled={!me}>Add friend</Button>
                )}
                {edge?.friendship.status === 'accepted' && (
                  <Button variant="subtle" icon={faUserCheck} disabled>Friends</Button>
                )}
                {me && (
                  <Button
                    variant="ghost"
                    icon={faFlag}
                    aria-label={`Report ${user.display_name}`}
                    onClick={() => setReporting(true)}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {user.bio && <p className="mt-5 max-w-2xl leading-relaxed text-white/70">{user.bio}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { label: 'Spaces', value: (spaces.data ?? []).filter((s) => s.is_published).length },
            { label: 'Visits', value: visits },
            { label: 'Likes', value: (spaces.data ?? []).reduce((t, s) => t + s.like_count, 0) },
          ].map((stat) => (
            <Card key={stat.label} className="px-4 py-3">
              <p className="font-display text-xl font-extrabold tabular-nums">{formatCount(stat.value)}</p>
              <p className="text-xs uppercase tracking-wide text-muted">{stat.label}</p>
            </Card>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-extrabold">
            {isMe ? 'Your Spaces' : `Spaces by ${user.display_name}`}
          </h2>

          {spaces.loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    : `${user.display_name} hasn't published anything yet.`
                }
                action={isMe ? <Button to="/spaces/new">Make a Space</Button> : undefined}
              />
            </Card>
          )}

          {!!spaces.data?.length && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {spaces.data.map((space) => <SpaceCard key={space.id} space={space} />)}
            </div>
          )}
        </section>
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
