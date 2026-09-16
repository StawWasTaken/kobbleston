import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRightToBracket, faDoorClosed, faFlag, faStar, faThumbsUp, faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { StatusDot, presenceOf } from '@/components/ui/StatusDot'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { Kobby } from '@/components/brand/Kobby'
import { ReportDialog } from '@/components/social/ReportDialog'
import { BadgeTile } from '@/components/spaces/BadgeGrid'
import { BadgeManager } from '@/components/spaces/BadgeManager'
import { SpaceChat } from '@/components/spaces/SpaceChat'
import { ChatSettings } from '@/components/spaces/ChatSettings'
import { categoryLabels, coverFor } from '@/components/spaces/SpaceCard'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import {
  enterSpace, getSpace, hasLiked, isFavorite, leaveSpace, listSpaceBadges, setFavorite, setLiked,
} from '@/lib/api'
import { formatCount, timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'

const tabs = ['About', 'Chat', 'Badges'] as const
type Tab = (typeof tabs)[number]

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-base font-extrabold tabular-nums">{value}</p>
    </div>
  )
}

export default function SpacePage() {
  const { username = '', slug = '' } = useParams()
  const { profile } = useAuth()
  const toast = useToast()

  const { data: space, error, loading, reload } = useAsync(() => getSpace(username, slug), [username, slug])
  const badges = useAsync(
    async () => (space ? listSpaceBadges(space.id) : []),
    [space?.id],
  )

  const [tab, setTab] = useState<Tab>('About')
  const [inside, setInside] = useState(false)
  const [entering, setEntering] = useState(false)
  const [visits, setVisits] = useState<number | null>(null)
  const [liked, setLikedState] = useState(false)
  const [likes, setLikes] = useState(0)
  const [favorited, setFavoritedState] = useState(false)
  const [favorites, setFavorites] = useState(0)
  const [reporting, setReporting] = useState(false)

  useEffect(() => {
    if (!space) return
    setLikes(space.like_count)
    setFavorites(space.favorite_count)
  }, [space])

  useEffect(() => {
    if (!space || !profile) return
    hasLiked(space.id, profile.id).then(setLikedState)
    isFavorite(space.id, profile.id).then(setFavoritedState)
  }, [space, profile])

  useEffect(() => {
    if (!inside) return
    const onUnload = () => leaveSpace()
    window.addEventListener('pagehide', onUnload)
    return () => {
      window.removeEventListener('pagehide', onUnload)
      leaveSpace()
    }
  }, [inside])

  const onEnter = async () => {
    if (!space) return
    setEntering(true)
    try {
      const result = await enterSpace(space.id)
      setVisits(result.visits)
      setInside(true)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not enter this Space.', 'error')
    } finally {
      setEntering(false)
    }
  }

  const onLike = async () => {
    if (!space || !profile) return
    const next = !liked
    setLikedState(next)
    setLikes((n) => n + (next ? 1 : -1))
    try {
      await setLiked(space.id, profile.id, next)
    } catch {
      setLikedState(!next)
      setLikes((n) => n + (next ? -1 : 1))
      toast('That like did not save.', 'error')
    }
  }

  const onFavorite = async () => {
    if (!space || !profile) return
    const next = !favorited
    setFavoritedState(next)
    setFavorites((n) => n + (next ? 1 : -1))
    try {
      await setFavorite(space.id, profile.id, next)
    } catch {
      setFavoritedState(!next)
      setFavorites((n) => n + (next ? -1 : 1))
      toast('That did not save.', 'error')
    }
  }

  if (loading) {
    return (
      <Page className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="aspect-[16/9] w-full" />
        <div className="space-y-3">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Page>
    )
  }

  if (error) return <Page><ErrorState message={error} onRetry={reload} /></Page>

  if (!space) {
    return (
      <Page>
        <Card>
          <EmptyState
            mood="noResults"
            title="No Space here"
            body={`@${username} does not have a Space called "${slug}", or it is not published yet.`}
            action={<Button to="/discover">Discover Spaces</Button>}
          />
        </Card>
      </Page>
    )
  }

  const owner = space.owner
  const isOwner = profile?.id === space.owner_id

  return (
    <>
      <Page>
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="overflow-hidden rounded-xl border border-ink-line bg-brand-ink">
            <img src={coverFor(space)} alt="" className="aspect-[16/9] w-full object-cover" />
          </div>

          <div className="flex flex-col">
            <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              {space.name}
            </h1>

            {owner && (
              <Link
                to={`/u/${owner.username}`}
                className="mt-2 inline-flex w-fit items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
              >
                <span className="relative">
                  <Avatar src={owner.avatar_url} name={owner.display_name} size="xs" />
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <StatusDot presence={presenceOf(owner)} size="sm" ring />
                  </span>
                </span>
                <span>By <span className="font-bold text-white">{owner.display_name}</span></span>
                {owner.is_admin && (
                  <FontAwesomeIcon icon={faCircleCheck} className="text-[#4d68ff]" title="Verified" />
                )}
              </Link>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="brand">{categoryLabels[space.category]}</Badge>
              {!space.is_published && <Badge tone="warm">Draft, only you can see this</Badge>}
              {inside && <Badge tone="space">You are inside</Badge>}
            </div>

            <div className="mt-auto pt-6">
              {inside ? (
                <Button variant="subtle" size="lg" block icon={faDoorClosed} onClick={() => {
                  leaveSpace()
                  setInside(false)
                }}>
                  Leave Space
                </Button>
              ) : (
                <Button
                  variant="enter"
                  size="lg"
                  block
                  icon={faArrowRightToBracket}
                  loading={entering}
                  onClick={onEnter}
                  disabled={!profile}
                >
                  {entering ? 'Entering' : 'Enter Space'}
                </Button>
              )}

              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  onClick={onFavorite}
                  disabled={!profile}
                  aria-pressed={favorited}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border border-ink-line py-2 text-xs font-bold transition-colors disabled:opacity-50',
                    favorited ? 'bg-brand text-white' : 'bg-ink-card text-white/60 hover:bg-ink-hover',
                  )}
                >
                  <FontAwesomeIcon icon={faStar} />
                  {formatCount(favorites)}
                </button>

                <button
                  onClick={onLike}
                  disabled={!profile}
                  aria-pressed={liked}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border border-ink-line py-2 text-xs font-bold transition-colors disabled:opacity-50',
                    liked ? 'bg-brand text-white' : 'bg-ink-card text-white/60 hover:bg-ink-hover',
                  )}
                >
                  <FontAwesomeIcon icon={faThumbsUp} />
                  {formatCount(likes)}
                </button>

                <button
                  onClick={() => setReporting(true)}
                  disabled={!profile || isOwner}
                  className="flex flex-col items-center gap-1 rounded-lg border border-ink-line bg-ink-card py-2 text-xs font-bold text-white/60 transition-colors hover:bg-ink-hover disabled:opacity-40"
                >
                  <FontAwesomeIcon icon={faFlag} />
                  Report
                </button>
              </div>

              {!profile && (
                <p className="mt-3 text-center text-sm text-muted">
                  <Link to="/login" className="font-bold text-[#9fadff] hover:underline">Log in</Link>
                  {' '}or{' '}
                  <Link to="/" className="font-bold text-[#9fadff] hover:underline">play as a guest</Link>
                  {' '}to enter.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------ tabs */}
        <div className="mt-8 flex border-b border-ink-line" role="tablist">
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
          <div className="mt-6">
            <h2 className="font-display text-xl font-extrabold">Description</h2>
            <p className="mt-2 max-w-3xl whitespace-pre-wrap leading-relaxed text-white/70">
              {space.description || 'The person who made this has not described it yet.'}
            </p>

            <Card className="mt-6 grid grid-cols-2 divide-ink-line sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
              <Stat label="Visits" value={formatCount(visits ?? space.visit_count)} />
              <Stat label="Favorites" value={formatCount(favorites)} />
              <Stat label="Likes" value={formatCount(likes)} />
              <Stat label="Updates" value={formatCount(space.update_count)} />
              <Stat label="Created" value={new Date(space.created_at).toLocaleDateString()} />
              <Stat label="Updated" value={timeAgo(space.updated_at)} />
            </Card>

            <Card className="mt-6">
              {inside ? (
                <EmptyState
                  mood="construction"
                  title="You are inside, and it is empty"
                  body={`${owner?.display_name ?? 'The owner'} has not built anything into this Space yet. The Kobbleston editor is still being made.`}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:text-left">
                  <Kobby mood="construction" size="sm" bob={false} />
                  <div>
                    <h3 className="text-base font-extrabold">Spaces open up when you enter them</h3>
                    <p className="mt-1 text-sm text-muted">
                      Entering counts a visit for the person who made it and shows your friends where you are.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === 'Chat' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            <SpaceChat space={space} />
            {isOwner && <ChatSettings space={space} onSaved={reload} />}
          </div>
        )}

        {tab === 'Badges' && (
          <div className="mt-6 space-y-6">
            {isOwner && (
              <BadgeManager
                spaceId={space.id}
                badges={badges.data ?? []}
                onChanged={badges.reload}
              />
            )}

            {badges.loading && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[4/5]" />)}
              </div>
            )}

            {!badges.loading && !badges.data?.filter((b) => b.is_enabled).length && !isOwner && (
              <Card>
                <EmptyState
                  mood="emptyBox"
                  title="No badges here"
                  body="This Space does not hand any out yet."
                />
              </Card>
            )}

            {!!badges.data?.length && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {badges.data
                  .filter((badge) => badge.is_enabled || isOwner)
                  .map((badge) => <BadgeTile key={badge.id} badge={badge} />)}
              </div>
            )}
          </div>
        )}
      </Page>

      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        targetType="space"
        targetId={space.id}
        targetName={space.name}
      />
    </>
  )
}
