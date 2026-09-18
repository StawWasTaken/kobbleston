import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { Skeleton } from '@/components/ui/States'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { listFriendships } from '@/lib/api'
import { profileLink } from '@/lib/links'
import { PersonAvatar } from '@/components/ui/PersonAvatar'

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
      <div className="mb-3 flex items-center gap-3">
        <h2 className="font-display text-xl font-extrabold sm:text-2xl">
          Friends {!loading && <span className="text-white/40">({friends.length})</span>}
        </h2>
        {!!friends.length && (
          <Link to="/friends" className="ml-auto text-xs font-bold text-link hover:underline">
            See all
          </Link>
        )}
      </div>

      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 kob-scroll">
        <Link
          to="/friends"
          className="group flex w-24 shrink-0 flex-col items-center gap-2 text-center"
        >
          <span className="grid h-20 w-20 place-items-center rounded-full border border-ink-line bg-ink-card text-2xl text-white/50 transition-colors group-hover:bg-ink-hover group-hover:text-white">
            <FontAwesomeIcon icon={faPlus} />
          </span>
          <span className="truncate text-xs font-semibold text-white/70">Add Friends</span>
        </Link>

        {loading &&
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="flex w-24 shrink-0 flex-col items-center gap-2">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}

        {friends.map((friend) => (
          <Link
            key={friend.id}
            to={profileLink(friend)}
            className="flex w-24 shrink-0 flex-col items-center gap-2 text-center"
          >
            <PersonAvatar person={friend} size="2xl" className="h-20 w-20" />
            <span className="w-full truncate text-sm font-semibold text-white/80">
              {friend.display_name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
