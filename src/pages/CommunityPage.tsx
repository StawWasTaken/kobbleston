import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBullhorn, faCalendarDay } from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton, SpaceCardSkeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { ReportDialog } from '@/components/social/ReportDialog'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { CommunityHeader } from '@/components/community/CommunityHeader'
import { CommunityWall } from '@/components/community/CommunityWall'
import { CommunityMembers } from '@/components/community/CommunityMembers'
import { AffiliateGrid } from '@/components/community/AffiliateGrid'
import { EventCard } from '@/components/community/EventCard'
import { AssetTile } from '@/components/create/AssetTile'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useTitle } from '@/hooks/useTitle'
import {
  communitySlugById, getCommunity, getCommunityOverview, joinCommunity, leaveCommunity,
  listCommunityAssets, listCommunityEvents, listCommunityPosts, listCommunitySpaces, listRelations,
  setEventAttendance,
} from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { timeAgo } from '@/lib/format'
import { communityLink } from '@/lib/links'

const tabs = ['About', 'Events', 'Members', 'Affiliates'] as const
type Tab = (typeof tabs)[number]

export default function CommunityPage() {
  const { slug: slugParam = '', id } = useParams()
  const navigate = useNavigate()

  const byId = useAsync(async () => (id ? communitySlugById(Number(id)) : null), [id])
  const slug = id ? byId.data ?? '' : slugParam
  const { profile } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('About')
  const [pending, setPending] = useState(false)
  const [reporting, setReporting] = useState(false)

  const community = useAsync(async () => (slug ? getCommunity(slug) : null), [slug])
  const group = community.data

  const rights = useAsync(
    async () => (group ? getCommunityOverview(group.id) : null),
    [group?.id, profile?.id],
  )
  const owner = useAsync(
    async () => {
      if (!group) return null
      const { data } = await supabase.from('profiles').select('username')
        .eq('id', group.owner_id).maybeSingle()
      return (data as { username: string } | null)?.username ?? null
    },
    [group?.owner_id],
  )
  const spaces = useAsync(async () => (group ? listCommunitySpaces(group.id) : []), [group?.id])
  const announcements = useAsync(
    async () => (group ? (await listCommunityPosts(group.id)).filter((p) => p.is_announcement) : []),
    [group?.id],
  )
  const events = useAsync(
    async () => (group ? listCommunityEvents(group.id) : []),
    [group?.id],
  )
  const store = useAsync(
    async () => (group ? listCommunityAssets(group.id) : []),
    [group?.id],
  )
  const allies = useAsync(async () => (group ? listRelations(group.id, 'ally') : []), [group?.id])
  const enemies = useAsync(async () => (group ? listRelations(group.id, 'enemy') : []), [group?.id])

  useTitle(group?.name ?? 'Community')

  // A name-only community link answers, then swaps itself for the numbered one.
  useEffect(() => {
    if (!id && group?.content_id) navigate(communityLink(group), { replace: true })
  }, [id, group?.content_id, navigate])

  const join = async () => {
    if (!group) return
    setPending(true)
    try {
      const result = await joinCommunity(group.id)
      toast(result === 'joined' ? 'You are in.' : 'Asked to join. They will let you know.', 'success')
      community.reload()
      rights.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    } finally {
      setPending(false)
    }
  }

  const leave = async () => {
    if (!group || !profile) return
    try {
      await leaveCommunity(group.id, profile.id)
      toast('You left the Community.', 'info')
      community.reload()
      rights.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    }
  }

  if (community.loading) {
    return <Page className="space-y-4"><Skeleton className="h-56 w-full" /></Page>
  }

  if (community.error) {
    return <Page><ErrorState message={community.error} onRetry={community.reload} /></Page>
  }

  if (!group) {
    return (
      <Page>
        <Card>
          <EmptyState
            mood="noResults"
            title="No community here"
            body={`There is no community at "${slug}".`}
            action={<Button to="/communities">All communities</Button>}
          />
        </Card>
      </Page>
    )
  }

  return (
    <>
      <CommunityHeader
        group={group}
        rights={rights.data}
        ownerName={owner.data ?? undefined}
        pending={pending}
        onJoin={join}
        onLeave={leave}
        onReport={() => setReporting(true)}
      />

      <Page className="max-w-5xl pt-6">
        <div
          className="flex justify-center overflow-x-auto border-b border-ink-line kob-scroll"
          role="tablist"
        >
          {tabs.map((name) => (
            <button
              key={name}
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={cn(
                'shrink-0 border-b-2 px-6 py-3 text-sm font-bold transition-colors sm:px-10',
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
            {!!announcements.data?.length && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold">
                  <FontAwesomeIcon icon={faBullhorn} className="text-base text-white/40" />
                  Announcements
                </h2>
                <div className="space-y-3">
                  {announcements.data.map((post) => (
                    <article
                      key={post.id}
                      className="relative overflow-hidden rounded-2xl border border-brand/35 bg-brand/10 p-5"
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/20 blur-2xl"
                      />
                      <div className="relative flex gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-sm text-white">
                          <FontAwesomeIcon icon={faBullhorn} />
                        </span>
                        <div className="min-w-0">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">
                            {post.body}
                          </p>
                          <p className="mt-2 text-xs text-muted">
                            {post.author?.display_name ?? 'The Community'} ·{' '}
                            {timeAgo(post.created_at)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* What is on, kept short here with the rest under its own tab. */}
            {!!events.data?.filter((e) => !e.is_cancelled).length && (
              <section>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
                    <FontAwesomeIcon icon={faCalendarDay} className="text-base text-white/40" />
                    Events
                  </h2>
                  <button
                    onClick={() => setTab('Events')}
                    className="ml-auto text-xs font-bold text-link hover:underline"
                  >
                    See all
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {events.data.filter((e) => !e.is_cancelled).slice(0, 3).map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onJoin={async (going) => {
                        try {
                          await setEventAttendance(event.id, going)
                          events.reload()
                        } catch (err) {
                          toast(err instanceof Error ? err.message : 'That did not work.', 'error')
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-3 font-display text-xl font-extrabold">Spaces</h2>
              {spaces.loading && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {[0, 1, 2].map((i) => <SpaceCardSkeleton key={i} />)}
                </div>
              )}
              {!spaces.loading && !spaces.data?.length && (
                <p className="text-sm text-muted">No Spaces linked to this Community yet.</p>
              )}
              {!!spaces.data?.length && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {spaces.data.map((space) => <SpaceCard key={space.id} space={space} />)}
                </div>
              )}
            </section>
            {!!store.data?.length && (
              <section>
                <h2 className="mb-3 font-display text-xl font-extrabold">
                  Made by {group.name}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {store.data.map((item) => <AssetTile key={item.id} item={item} />)}
                </div>
              </section>
            )}

            <CommunityWall communityId={group.id} rights={rights.data} />
          </div>
        )}

        {tab === 'Events' && (
          <div className="mt-6 space-y-6">
            {events.loading && <Skeleton className="h-40" />}

            {!events.loading && !events.data?.length && (
              <Card>
                <EmptyState
                  mood="emptyBox"
                  title="Nothing on yet"
                  body={
                    rights.data?.can_manage_community
                      ? 'Put something in the calendar and members will see it here.'
                      : `${group.name} has not announced anything.`
                  }
                  action={
                    rights.data?.can_manage_community
                      ? <Button to={`/c/${group.slug}/configure`}>Make an event</Button>
                      : undefined
                  }
                />
              </Card>
            )}

            {!!events.data?.length && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {events.data.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onJoin={async (going) => {
                      try {
                        await setEventAttendance(event.id, going)
                        events.reload()
                      } catch (err) {
                        toast(err instanceof Error ? err.message : 'That did not work.', 'error')
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Members' && (
          <div className="mt-6">
            <CommunityMembers
              communityId={group.id}
              ownerId={group.owner_id}
              rights={rights.data}
              onChanged={() => { community.reload(); rights.reload() }}
            />
          </div>
        )}

        {tab === 'Affiliates' && (
          <div className="mt-6 space-y-8">
            <AffiliateGrid
              title="Allies"
              relations={allies.data}
              loading={allies.loading}
              empty="No allies yet."
            />
            <AffiliateGrid
              title="Enemies"
              relations={enemies.data}
              loading={enemies.loading}
              empty="Nobody has been declared an enemy."
            />
          </div>
        )}
      </Page>

      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        targetType="profile"
        targetId={group.owner_id}
        targetName={group.name}
      />
    </>
  )
}
