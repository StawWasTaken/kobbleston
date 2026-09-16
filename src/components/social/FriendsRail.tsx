import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { Avatar } from '@/components/ui/Avatar'
import { StatusDot, presenceOf } from '@/components/ui/StatusDot'
import { Skeleton } from '@/components/ui/States'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { listFriendships } from '@/lib/api'

/** Friends across the top of the home page, online ones first. */
export function FriendsRail() {
  const { profile } = useAuth()
  const { data, loading } = useAsync(
    async () => (profile ? listFriendships(profile.id) : []),
    [profile?.id],
  )

  const friends = (data ?? [])
    .filter((edge) => edge.friendship.status === 'accepted')
    .map((edge) => edge.profile)
    .sort((a, b) => Number(b.is_online) - Number(a.is_online))

  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-xl font-extrabold sm:text-2xl">
        Friends {!loading && <span className="text-white/40">({friends.length})</span>}
      </h2>

      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 kob-scroll">
        <Link
          to="/friends"
          className="group flex w-20 shrink-0 flex-col items-center gap-2 text-center"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full border border-ink-line bg-ink-card text-xl text-white/50 transition-colors group-hover:bg-ink-hover group-hover:text-white">
            <FontAwesomeIcon icon={faPlus} />
          </span>
          <span className="truncate text-xs font-semibold text-white/70">Add Friends</span>
        </Link>

        {loading &&
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="flex w-20 shrink-0 flex-col items-center gap-2">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}

        {friends.map((friend) => (
          <Link
            key={friend.id}
            to={`/u/${friend.username}`}
            className="flex w-20 shrink-0 flex-col items-center gap-2 text-center"
          >
            <span className="relative">
              <Avatar src={friend.avatar_url} name={friend.display_name} size="lg" className="h-16 w-16" />
              <span className="absolute bottom-0.5 right-0.5">
                <StatusDot presence={presenceOf(friend)} size="lg" ring />
              </span>
            </span>
            <span className="w-full truncate text-xs font-semibold text-white/80">
              {friend.display_name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
