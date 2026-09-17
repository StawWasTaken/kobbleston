import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck, faRightFromBracket, faUserPlus, faClock, faBullhorn,
} from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, ErrorState, Skeleton, SpaceCardSkeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { CommunityWall } from '@/components/community/CommunityWall'
import { CommunityMembers } from '@/components/community/CommunityMembers'
import { CommunityRanks } from '@/components/community/CommunityRanks'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import {
  getCommunity, getCommunityOverview, joinCommunity, leaveCommunity, listCommunityPosts,
  listCommunitySpaces,
} from '@/lib/api'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'

export default function CommunityPage() {
  const { slug = '' } = useParams()
  const { profile } = useAuth()
  const toast = useToast()
  const [pending, setPending] = useState(false)

  const community = useAsync(() => getCommunity(slug), [slug])
  const group = community.data

  const rights = useAsync(
    async () => (group ? getCommunityOverview(group.id) : null),
    [group?.id, profile?.id],
  )
  const spaces = useAsync(
    async () => (group ? listCommunitySpaces(group.id) : []),
    [group?.id],
  )
  const announcements = useAsync(
    async () => (group ? (await listCommunityPosts(group.id)).filter((p) => p.is_announcement) : []),
    [group?.id],
  )

  const isMember = Boolean(rights.data?.my_rank_id)
  const tabs = ['About', 'Wall', 'Members', ...(rights.data?.can_manage_ranks ? ['Ranks'] : [])]
  const [tab, setTab] = useState('About')

  const toggleMembership = async () => {
    if (!group || !profile) return
    setPending(true)
    try {
      if (isMember) {
        await leaveCommunity(group.id, profile.id)
        toast('You left the Community.', 'info')
      } else {
        const result = await joinCommunity(group.id)
        toast(result === 'joined' ? 'You are in.' : 'Asked to join. They will let you know.', 'success')
      }
      community.reload()
      rights.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    } finally {
      setPending(false)
    }
  }

  if (community.loading) {
    return <Page className="space-y-4"><Skeleton className="h-40 w-full" /></Page>
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
      {group.banner_url && (
        <div className="h-32 overflow-hidden bg-brand-ink sm:h-44">
          <img src={group.banner_url} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <Page className={cn(group.banner_url && '-mt-12')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <span className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-deep font-display text-2xl font-extrabold ring-4 ring-ink">
            {group.icon_url
              ? <img src={group.icon_url} alt="" className="h-full w-full object-cover" />
              : group.name.slice(0, 2).toUpperCase()}
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl font-extrabold sm:text-3xl">
              {group.name}
              {group.is_verified && (
                <FontAwesomeIcon icon={faCircleCheck} className="text-lg text-[#4d68ff]" title="Verified" />
              )}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {formatCount(group.member_count)} {group.member_count === 1 ? 'member' : 'members'}
              {group.join_policy === 'approval' && ' · approval needed'}
            </p>
            {rights.data?.my_rank_name && (
              <Badge tone="brand" className="mt-2">{rights.data.my_rank_name}</Badge>
            )}
          </div>

          {profile && group.owner_id !== profile.id && (
            rights.data?.is_banned ? (
              <Badge tone="warm">You are banned from this Community</Badge>
            ) : rights.data?.has_requested ? (
              <Button variant="subtle" icon={faClock} disabled>Waiting on approval</Button>
            ) : (
              <Button
                variant={isMember ? 'subtle' : 'primary'}
                icon={isMember ? faRightFromBracket : faUserPlus}
                loading={pending}
                onClick={toggleMembership}
              >
                {isMember ? 'Leave' : group.join_policy === 'approval' ? 'Ask to Join' : 'Join Community'}
              </Button>
            )
          )}
        </div>

        <div className="mt-6 flex overflow-x-auto border-b border-ink-line kob-scroll" role="tablist">
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
            {group.description && (
              <p className="max-w-3xl whitespace-pre-wrap leading-relaxed text-white/70">
                {group.description}
              </p>
            )}

            <section>
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold">
                <FontAwesomeIcon icon={faBullhorn} className="text-base text-white/40" />
                Announcements
              </h2>
              {!announcements.data?.length ? (
                <p className="text-sm text-muted">No announcements yet.</p>
              ) : (
                <div className="space-y-3">
                  {announcements.data.map((post) => (
                    <Card key={post.id} className="p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                        {post.body}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-extrabold">Spaces</h2>
              {spaces.loading && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2].map((i) => <SpaceCardSkeleton key={i} />)}
                </div>
              )}
              {!spaces.loading && !spaces.data?.length && (
                <p className="text-sm text-muted">
                  No Spaces linked to this Community yet.
                </p>
              )}
              {!!spaces.data?.length && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {spaces.data.map((space) => <SpaceCard key={space.id} space={space} />)}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === 'Wall' && (
          <div className="mt-6">
            <CommunityWall communityId={group.id} rights={rights.data} />
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

        {tab === 'Ranks' && (
          <div className="mt-6">
            <CommunityRanks communityId={group.id} />
          </div>
        )}

      </Page>
    </>
  )
}
