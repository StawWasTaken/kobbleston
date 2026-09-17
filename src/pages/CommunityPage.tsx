import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBullhorn } from '@fortawesome/free-solid-svg-icons'
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
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useTitle } from '@/hooks/useTitle'
import {
  communitySlugById, getCommunity, getCommunityOverview, joinCommunity, leaveCommunity,
  listCommunityPosts, listCommunitySpaces, listRelations,
} from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { communityLink } from '@/lib/links'

const tabs = ['About', 'Members', 'Affiliates'] as const
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

      <Page className="pt-6">
        <div className="flex overflow-x-auto border-b border-ink-line kob-scroll" role="tablist">
          {tabs.map((name) => (
            <button
              key={name}
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={cn(
                'shrink-0 border-b-2 px-6 py-3 text-sm font-bold transition-colors sm:px-12',
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
