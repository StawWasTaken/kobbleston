import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { cn } from '@/lib/cn'
import type { ConversationMember, Message } from '@/types/db'

/**
 * One message, with its sender's picture beside it. Your own can be changed
 * or taken back from the buttons that appear on hover.
 */
export function MessageRow({
  message, sender, mine, grouped, onEdit, onDelete,
}: {
  message: Message
  sender?: ConversationMember
  mine: boolean
  /** Follows another message from the same person, so it needs no picture. */
  grouped?: boolean
  onEdit: (body: string) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.body)
  const [busy, setBusy] = useState(false)

  if (message.is_removed) {
    return (
      <div className={cn('flex gap-2 px-1', mine && 'flex-row-reverse')}>
        <span className="w-6 shrink-0" />
        <p className="text-xs italic text-white/30">Message deleted</p>
      </div>
    )
  }

  const save = async () => {
    if (!draft.trim() || draft.trim() === message.body) {
      setEditing(false)
      return
    }
    setBusy(true)
    try {
      await onEdit(draft)
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={cn(
        'group flex items-end gap-2',
        mine ? 'flex-row-reverse' : 'flex-row',
        grouped ? 'mt-0.5' : 'mt-2',
      )}
    >
      {/* One picture per run of messages; the rest line up under it. */}
      {grouped ? (
        <span className="w-6 shrink-0" aria-hidden="true" />
      ) : (
        <Link
          to={`/u/${sender?.username ?? ''}`}
          className="shrink-0"
          aria-label={sender?.display_name ?? 'Profile'}
        >
          <Avatar src={sender?.avatar_url} name={sender?.display_name ?? 'K'} size="xs" />
        </Link>
      )}

      <div className={cn('flex min-w-0 max-w-[75%] flex-col', mine && 'items-end')}>
        {editing ? (
          <div className="flex w-full items-center gap-1">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save()
                if (e.key === 'Escape') { setDraft(message.body); setEditing(false) }
              }}
              autoFocus
              maxLength={2000}
              aria-label="Edit your message"
              className="h-8 min-w-0 flex-1 rounded-lg border border-brand-bright bg-ink-raised px-2.5 text-sm"
            />
            <button
              onClick={save}
              disabled={busy}
              aria-label="Save"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-space-bright hover:bg-ink-hover"
            >
              <FontAwesomeIcon icon={faCheck} className="text-xs" />
            </button>
            <button
              onClick={() => { setDraft(message.body); setEditing(false) }}
              aria-label="Cancel"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/40 hover:bg-ink-hover"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              'rounded-2xl px-3 py-1.5 text-sm leading-snug',
              mine ? 'bg-brand text-white' : 'bg-ink-hover text-white/90',
            )}
          >
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
            {message.edited_at && (
              <span className={cn('text-[10px]', mine ? 'text-white/55' : 'text-white/35')}>
                edited
              </span>
            )}
          </div>
        )}
      </div>

      {mine && !editing && (
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Tooltip label="Edit" side="top">
            <button
              onClick={() => setEditing(true)}
              aria-label="Edit this message"
              className="grid h-6 w-6 place-items-center rounded-md text-white/35 hover:bg-ink-hover hover:text-white"
            >
              <FontAwesomeIcon icon={faPen} className="text-[10px]" />
            </button>
          </Tooltip>
          <Tooltip label="Delete" side="top">
            <button
              onClick={onDelete}
              aria-label="Delete this message"
              className="grid h-6 w-6 place-items-center rounded-md text-white/35 hover:bg-ink-hover hover:text-white"
            >
              <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  )
}
