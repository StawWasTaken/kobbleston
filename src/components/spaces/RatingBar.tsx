import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'

/** Likes against dislikes, with the ratio drawn underneath both. */
export function RatingBar({
  likes, dislikes, iLike, iDislike, disabled, onLike, onDislike,
}: {
  likes: number
  dislikes: number
  iLike: boolean
  iDislike: boolean
  disabled?: boolean
  onLike: () => void
  onDislike: () => void
}) {
  const total = likes + dislikes
  const share = total ? (likes / total) * 100 : 50

  return (
    <div>
      <div className="flex items-center justify-between gap-6">
        <button
          onClick={onLike}
          disabled={disabled}
          aria-pressed={iLike}
          className={cn(
            'flex flex-col items-center gap-1 text-xs font-bold transition-colors disabled:opacity-40',
            iLike ? 'text-space-bright' : 'text-white/60 hover:text-white',
          )}
        >
          <FontAwesomeIcon icon={faThumbsUp} className="text-base" />
          {formatCount(likes)}
        </button>

        <button
          onClick={onDislike}
          disabled={disabled}
          aria-pressed={iDislike}
          className={cn(
            'flex flex-col items-center gap-1 text-xs font-bold transition-colors disabled:opacity-40',
            iDislike ? 'text-red-400' : 'text-white/60 hover:text-white',
          )}
        >
          <FontAwesomeIcon icon={faThumbsDown} className="text-base" />
          {formatCount(dislikes)}
        </button>
      </div>

      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-red-500/60"
        role="img"
        aria-label={total ? `${Math.round(share)} percent liked` : 'No ratings yet'}
      >
        <div
          className="h-full rounded-full bg-space transition-[width] duration-300"
          style={{ width: `${total ? share : 0}%` }}
        />
      </div>
    </div>
  )
}
