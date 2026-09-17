import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBan, faFlag } from '@fortawesome/free-solid-svg-icons'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/cn'
import type { ConversationMember } from '@/types/db'
import { avatarOf } from '@/lib/avatars'

/**
 * Opens every conversation and stays at the top of its history, so the
 * reminder is there the tenth time as well as the first.
 */
export function SafetyNote({
  person, onBlock, onReport, className,
}: {
  person: ConversationMember
  onBlock: () => void
  onReport: () => void
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border border-ink-line bg-ink-raised p-3', className)}>
      <Link to={`/u/${person.username}`} className="flex items-center gap-2">
        <Avatar src={avatarOf(person)} name={person.display_name} size="sm" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">{person.display_name}</span>
          <span className="block truncate text-xs text-muted">@{person.username}</span>
        </span>
      </Link>

      <p className="mt-2.5 text-xs leading-relaxed text-muted">
        Watch who you chat with. Keep personal details private, and block or report anytime.
      </p>

      <div className="mt-2.5 flex gap-2">
        <button
          onClick={onBlock}
          className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-line bg-ink-card text-xs font-bold text-white/70 transition-colors hover:bg-ink-hover hover:text-white"
        >
          <FontAwesomeIcon icon={faBan} className="text-[10px]" />
          Block
        </button>
        <button
          onClick={onReport}
          className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-line bg-ink-card text-xs font-bold text-white/70 transition-colors hover:bg-ink-hover hover:text-white"
        >
          <FontAwesomeIcon icon={faFlag} className="text-[10px]" />
          Report
        </button>
      </div>
    </div>
  )
}
