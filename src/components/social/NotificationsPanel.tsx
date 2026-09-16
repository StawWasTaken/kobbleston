import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserPlus, faUserCheck, faHeart, faComment, faCircleInfo, faDoorOpen,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { listNotifications, markNotificationsRead } from '@/lib/api'
import { timeAgo } from '@/lib/format'
import type { Notification } from '@/types/db'
import { asset } from '@/lib/asset'

const icons: Record<Notification['kind'], IconDefinition> = {
  friend_request: faUserPlus,
  friend_accepted: faUserCheck,
  space_like: faHeart,
  space_visit: faDoorOpen,
  message: faComment,
  system: faCircleInfo,
}

function describe(n: Notification) {
  const who = n.actor?.display_name ?? 'Someone'
  switch (n.kind) {
    case 'friend_request': return `${who} sent you a friend request`
    case 'friend_accepted': return `${who} accepted your friend request`
    case 'space_like': return `${who} liked ${n.space?.name ?? 'your Space'}`
    case 'space_visit': return `${who} visited ${n.space?.name ?? 'your Space'}`
    case 'message': return `${who} sent you a message`
    default: return n.body ?? 'Something happened'
  }
}

function linkFor(n: Notification) {
  if (n.kind === 'friend_request' || n.kind === 'friend_accepted') return '/friends'
  if (n.kind === 'message') return '/chat'
  if (n.space && n.actor) return `/u/${n.actor.username}/${n.space.slug}`
  return '/home'
}

export function NotificationsPanel({
  open,
  onClose,
  onReadAll,
}: {
  open: boolean
  onClose: () => void
  onReadAll: () => void
}) {
  const { profile } = useAuth()
  const { data, error, loading, reload } = useAsync(
    async () => (profile && open ? listNotifications(profile.id) : []),
    [profile?.id, open],
  )

  useEffect(() => {
    if (!open || !profile) return
    const timer = window.setTimeout(() => {
      markNotificationsRead(profile.id).then(onReadAll)
    }, 900)
    return () => window.clearTimeout(timer)
  }, [open, profile, onReadAll])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-2 top-[3.25rem] z-50 w-[min(94vw,23rem)] animate-pop-in overflow-hidden rounded-2xl border border-ink-line bg-ink-card shadow-pop sm:right-5">
        <div className="flex items-center gap-2 border-b border-ink-line px-4 py-3">
          <img src={asset(('/brand/kobby_notification.png'))} alt="" aria-hidden="true" className="h-7 w-auto" />
          <h2 className="text-sm font-extrabold">Notifications</h2>
        </div>

        <div className="max-h-[26rem] overflow-y-auto kob-scroll">
          {loading && (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          )}

          {error && <ErrorState message={error} onRetry={reload} />}

          {!loading && !error && data?.length === 0 && (
            <EmptyState
              mood="notification"
              title="Nothing new"
              body="When people add you, message you or like your Spaces, it shows up here."
            />
          )}

          {data?.map((n) => (
            <Link
              key={n.id}
              to={linkFor(n)}
              onClick={onClose}
              className="flex items-start gap-3 border-b border-ink-line/70 px-4 py-3 transition-colors last:border-0 hover:bg-ink-hover"
            >
              <span className="relative">
                <Avatar src={n.actor?.avatar_url} name={n.actor?.display_name ?? 'K'} size="sm" />
                <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-brand text-[9px] text-white ring-2 ring-ink-card">
                  <FontAwesomeIcon icon={icons[n.kind]} />
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-snug text-white/90">{describe(n)}</span>
                <span className="mt-0.5 block text-xs text-muted">{timeAgo(n.created_at)}</span>
              </span>
              {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
