import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRightToBracket, faDoorClosed, faEye, faFlag, faHeart, faPenToSquare,
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
import { categoryLabels, coverFor } from '@/components/spaces/SpaceCard'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { enterSpace, getSpace, hasLiked, leaveSpace, setLiked } from '@/lib/api'
import { formatCount, timeAgo } from '@/lib/format'

export default function SpacePage() {
  const { username = '', slug = '' } = useParams()
  const { profile } = useAuth()
  const toast = useToast()

  const { data: space, error, loading, reload } = useAsync(() => getSpace(username, slug), [username, slug])
  const [inside, setInside] = useState(false)
  const [entering, setEntering] = useState(false)
  const [visits, setVisits] = useState<number | null>(null)
  const [liked, setLikedState] = useState(false)
  const [likes, setLikes] = useState(0)
  const [reporting, setReporting] = useState(false)

  useEffect(() => {
    if (space) setLikes(space.like_count)
  }, [space])

  useEffect(() => {
    if (!space || !profile) return
    hasLiked(space.id, profile.id).then(setLikedState)
  }, [space, profile])

  // Leaving the page means leaving the Space, so presence does not go stale.
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

  const onLeave = async () => {
    await leaveSpace()
    setInside(false)
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

  if (loading) {
    return (
      <Page className="space-y-4">
        <Skeleton className="aspect-[21/9] w-full" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full" />
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
            body={`@${username} doesn't have a Space called "${slug}", or it isn't published yet.`}
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
      <div className="relative">
        <div className="relative aspect-[21/9] max-h-[22rem] w-full overflow-hidden bg-brand-ink">
          <img src={coverFor(space)} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        </div>

        <Page className="-mt-20 sm:-mt-24">
          <div className="grid gap-6 lg:grid-cols-[1fr_19rem] lg:items-start">
            <div className="min-w-0">
              <h1 className="font-display text-4xl font-extrabold leading-none sm:text-5xl">
                {space.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{categoryLabels[space.category]}</Badge>
                {!space.is_published && <Badge tone="warm">Draft, only you can see this</Badge>}
                {inside && <Badge tone="space">You&apos;re inside</Badge>}
              </div>

              {owner && (
                <Link
                  to={`/u/${owner.username}`}
                  className="mt-4 inline-flex items-center gap-2.5 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <span className="relative">
                    <Avatar src={owner.avatar_url} name={owner.display_name} size="sm" />
                    <span className="absolute -bottom-0.5 -right-0.5">
                      <StatusDot presence={presenceOf(owner)} size="sm" ring />
                    </span>
                  </span>
                  <span>
                    <span className="block font-semibold text-white">{owner.display_name}</span>
                    <span className="block text-xs text-muted">@{owner.username}</span>
                  </span>
                </Link>
              )}

              {space.description && (
                <p className="mt-5 max-w-2xl leading-relaxed text-white/70">{space.description}</p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-2">
                {inside ? (
                  <Button variant="subtle" size="lg" icon={faDoorClosed} onClick={onLeave}>
                    Leave Space
                  </Button>
                ) : (
                  <Button
                    variant="enter"
                    size="lg"
                    icon={faArrowRightToBracket}
                    loading={entering}
                    onClick={onEnter}
                    disabled={!profile}
                  >
                    {entering ? 'Entering…' : 'Enter Space'}
                  </Button>
                )}

                <Button
                  variant={liked ? 'primary' : 'subtle'}
                  size="lg"
                  icon={faHeart}
                  onClick={onLike}
                  disabled={!profile}
                  aria-pressed={liked}
                >
                  {formatCount(likes)}
                </Button>

                {isOwner && (
                  <Button variant="ghost" size="lg" icon={faPenToSquare} to="/library">
                    Manage
                  </Button>
                )}

                {!isOwner && profile && (
                  <Button variant="ghost" size="lg" icon={faFlag} onClick={() => setReporting(true)}>
                    Report
                  </Button>
                )}
              </div>

              {!profile && (
                <p className="mt-3 text-sm text-muted">
                  <Link to="/login" className="font-semibold text-[#9fadff] hover:underline">Log in</Link>
                  {' '}to enter this Space.
                </p>
              )}

              {/* The Space itself is not built yet, Workspace comes later,
                  so this says so plainly instead of faking a viewer. */}
              <Card className="mt-8">
                {inside ? (
                  <EmptyState
                    mood="construction"
                    title="You're inside, and it's empty"
                    body={`${owner?.display_name ?? 'The owner'} hasn't built anything into this Space yet. The Kobbleston editor is still being made.`}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:text-left">
                    <Kobby mood="construction" size="sm" />
                    <div>
                      <h2 className="text-base font-extrabold">Spaces open up when you enter them</h2>
                      <p className="mt-1 text-sm text-muted">
                        Entering counts a visit for the person who made it and shows your friends where you are.
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* ------------------------------------------------ side stats */}
            <aside className="space-y-4 lg:sticky lg:top-20">
              <Card className="divide-y divide-ink-line">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="inline-flex items-center gap-2 text-sm text-muted">
                    <FontAwesomeIcon icon={faEye} /> Visits
                  </span>
                  <span className="font-display text-lg font-extrabold tabular-nums">
                    {formatCount(visits ?? space.visit_count)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="inline-flex items-center gap-2 text-sm text-muted">
                    <FontAwesomeIcon icon={faHeart} /> Likes
                  </span>
                  <span className="font-display text-lg font-extrabold tabular-nums">{formatCount(likes)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="inline-flex items-center gap-2 text-sm text-muted">
                    <FontAwesomeIcon icon={faPenToSquare} /> Updates
                  </span>
                  <span className="font-display text-lg font-extrabold tabular-nums">
                    {formatCount(space.update_count)}
                  </span>
                </div>
                <div className="px-4 py-3.5 text-xs text-muted">
                  Last touched {timeAgo(space.updated_at)}
                  {space.published_at && <> · published {timeAgo(space.published_at)}</>}
                </div>
              </Card>
            </aside>
          </div>
        </Page>
      </div>

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
