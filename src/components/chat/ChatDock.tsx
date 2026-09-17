import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown, faChevronUp, faXmark, faPaperPlane, faMagnifyingGlass, faPenToSquare,
  faGear, faArrowLeft, faUserGroup,
} from '@fortawesome/free-solid-svg-icons'
import { Avatar } from '@/components/ui/Avatar'
import { StatusDot, PresenceLabel, presenceOf } from '@/components/ui/StatusDot'
import { Skeleton } from '@/components/ui/States'
import { Tooltip } from '@/components/ui/Tooltip'
import { NewGroupDialog } from './NewGroupDialog'
import { MessageRow } from './MessageRow'
import { SafetyNote } from './SafetyNote'
import { TimeSeparator } from './TimeSeparator'
import { ReportDialog } from '@/components/social/ReportDialog'
import { useAuth } from '@/hooks/useAuth'
import {
  chatRoster, conversationName, deleteMessage, editMessage, listMessages,
  markConversationRead, sendMessage, startConversation,
} from '@/lib/api'
import { blockPerson } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Conversation, Message } from '@/types/db'
import { avatarOf } from '@/lib/avatars'
import { profileLink } from '@/lib/links'

type ChatValue = { openConversation: (id: string) => void }
const ChatContext = createContext<ChatValue>({ openConversation: () => {} })

/** Lets any page pop a conversation open in the dock. */
export const useChatDock = () => useContext(ChatContext)

const MAX_OPEN = 3
const LIST_STATE = 'kobbleston.chat.listOpen'

/** The dock remembers whether it was left open, per device. */
function useRemembered(key: string, fallback: boolean) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored === null ? fallback : stored === 'true'
    } catch {
      return fallback
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, String(value))
    } catch {
      // Blocked storage just means it does not persist.
    }
  }, [key, value])

  return [value, setValue] as const
}

function Window({
  conversation, onClose, onOpened,
}: {
  conversation: Conversation
  onClose: () => void
  onOpened: (conversationId: string) => void
}) {
  const { profile } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [details, setDetails] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [reporting, setReporting] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)

  const name = conversationName(conversation)
  const solo = conversation.members.length === 1 ? conversation.members[0] : null

  // A row for a friend nobody has messaged yet carries no real conversation
  // until the first message opens one.
  const pending = conversation.id.startsWith('friend:')

  const onBlock = async (targetId: string) => {
    try {
      await blockPerson(targetId)
      onClose()
    } catch {
      setError('That did not work.')
    }
  }

  useEffect(() => {
    if (pending) {
      setLoading(false)
      return
    }
    let active = true
    listMessages(conversation.id)
      .then((rows) => active && setMessages(rows))
      .finally(() => active && setLoading(false))
    if (profile) markConversationRead(conversation.id, profile.id)
    return () => { active = false }
  }, [conversation.id, profile, pending])

  useEffect(() => {
    if (pending) return
    const channel = supabase
      .channel(`dock:${conversation.id}`)
      .on('postgres_changes',
        {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const incoming = payload.new as Message
          setMessages((all) => (all.some((m) => m.id === incoming.id) ? all : [...all, incoming]))
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversation.id, pending])

  useEffect(() => {
    if (!collapsed && !details) bottom.current?.scrollIntoView({ block: 'end' })
  }, [messages, collapsed, details])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body || !profile) return
    setDraft('')
    setError(null)
    try {
      const target = pending
        ? await startConversation(conversation.id.replace('friend:', ''))
        : conversation.id
      await sendMessage(target, profile.id, body)
      if (pending) onOpened(target)
    } catch (err) {
      setDraft(body)
      setError(err instanceof Error ? err.message : 'That did not send.')
    }
  }

  return (
    <section
      className={cn(
        'pointer-events-auto flex w-72 flex-col overflow-hidden rounded-t-xl border border-b-0 border-ink-line bg-ink-card shadow-pop',
        collapsed ? 'h-11' : 'h-96',
      )}
      aria-label={`Chat with ${name}`}
    >
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-ink-line px-2">
        {details ? (
          <>
            <button
              onClick={() => setDetails(false)}
              aria-label="Back to the conversation"
              className="grid h-7 w-7 place-items-center rounded-md text-white/45 transition-colors hover:bg-ink-hover hover:text-white"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <h3 className="flex-1 truncate text-sm font-bold">Chat Details</h3>
          </>
        ) : (
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-ink-hover"
            aria-expanded={!collapsed}
          >
            <span className="relative shrink-0">
              {solo ? (
                <>
                  <Avatar src={avatarOf(solo)} name={solo.display_name} size="xs" />
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <StatusDot presence={presenceOf(solo)} size="sm" ring />
                  </span>
                </>
              ) : (
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-deep text-[10px] text-white">
                  <FontAwesomeIcon icon={faUserGroup} />
                </span>
              )}
            </span>
            <span className="truncate text-sm font-bold">{name}</span>
          </button>
        )}

        {!details && (
          <Tooltip label="Chat details" side="top">
            <button
              onClick={() => { setDetails(true); setCollapsed(false) }}
              aria-label="Chat details"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/45 transition-colors hover:bg-ink-hover hover:text-white"
            >
              <FontAwesomeIcon icon={faGear} />
            </button>
          </Tooltip>
        )}
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/45 transition-colors hover:bg-ink-hover hover:text-white"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </header>

      {!collapsed && details && (
        <div className="flex-1 overflow-y-auto p-3 kob-scroll">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Members</p>
          <ul className="space-y-1">
            {conversation.members.map((member) => (
              <li key={member.id}>
                <Link
                  to={profileLink(member)}
                  className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-ink-hover"
                >
                  <Avatar src={avatarOf(member)} name={member.display_name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{member.display_name}</span>
                    <PresenceLabel presence={presenceOf(member)} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!collapsed && !details && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3 kob-scroll">
            {loading && (
              <div className="space-y-2">
                {[0, 1].map((i) => <Skeleton key={i} className="h-8 w-2/3" />)}
              </div>
            )}

            {/* Stays at the top of the history rather than only showing when
                the conversation is empty. */}
            {!loading && solo && (
              <SafetyNote
                className="mb-1"
                person={solo}
                onBlock={() => onBlock(solo.id)}
                onReport={() => setReporting(true)}
              />
            )}

            {!loading && !messages.length && !solo && (
              <p className="py-6 text-center text-xs text-muted">Say something to the group.</p>
            )}

            {messages.map((m, i) => {
              const before = messages[i - 1]
              const apart = before
                ? new Date(m.created_at).getTime() - new Date(before.created_at).getTime()
                : Infinity
              // A quarter of an hour of silence is worth marking.
              const gap = apart > 15 * 60_000
              const grouped = Boolean(
                before && before.sender_id === m.sender_id && !gap && apart < 5 * 60_000,
              )

              return (
                <div key={m.id}>
                  {gap && <TimeSeparator at={m.created_at} />}
                  <MessageRow
                    message={m}
                    mine={m.sender_id === profile?.id}
                    grouped={grouped}
                    sender={
                      m.sender_id === profile?.id
                        ? {
                            id: profile.id,
                            username: profile.username,
                            display_name: profile.display_name,
                            avatar_url: profile.avatar_url,
                            is_guest: profile.is_guest,
                            is_online: profile.is_online,
                            in_space_id: profile.in_space_id,
                          }
                        : conversation.members.find((member) => member.id === m.sender_id)
                    }
                    onEdit={async (body) => {
                      await editMessage(m.id, body)
                      setMessages((all) =>
                        all.map((x) =>
                          x.id === m.id ? { ...x, body, edited_at: new Date().toISOString() } : x))
                    }}
                    onDelete={async () => {
                      await deleteMessage(m.id)
                      setMessages((all) =>
                        all.map((x) => (x.id === m.id ? { ...x, is_removed: true } : x)))
                    }}
                  />
                </div>
              )
            })}
            <div ref={bottom} />
          </div>

          <form onSubmit={submit} className="shrink-0 border-t border-ink-line p-2">
            {error && <p className="px-1 pb-1.5 text-xs text-red-400">{error}</p>}
            <div className="flex items-center gap-1.5">
              <label className="sr-only" htmlFor={`draft-${conversation.id}`}>Message</label>
              <input
                id={`draft-${conversation.id}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={2000}
                placeholder="Send a message"
                className="h-9 min-w-0 flex-1 rounded-full border border-ink-line bg-ink-raised px-3.5 text-sm placeholder:text-white/30 focus:border-brand-bright"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-bright disabled:opacity-40"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
              </button>
            </div>
          </form>
        </>
      )}

      {solo && (
        <ReportDialog
          open={reporting}
          onClose={() => setReporting(false)}
          targetType="profile"
          targetId={solo.id}
          targetName={solo.display_name}
        />
      )}
    </section>
  )
}

function List({
  conversations, loading, onOpen, onNewGroup,
}: {
  conversations: Conversation[]
  loading: boolean
  onOpen: (id: string) => void
  onNewGroup: () => void
}) {
  // Open the first time somebody sees it, and however they left it after that.
  const [open, setOpen] = useRemembered(LIST_STATE, true)
  const [term, setTerm] = useState('')

  const shown = conversations.filter((c) =>
    conversationName(c).toLowerCase().includes(term.trim().toLowerCase()))

  return (
    <section
      className={cn(
        'pointer-events-auto flex w-72 flex-col overflow-hidden rounded-t-xl border border-b-0 border-ink-line bg-ink-card shadow-pop',
        open ? 'h-96' : 'h-11',
      )}
      aria-label="Chat"
    >
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-ink-line px-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 text-left text-sm font-extrabold"
          aria-expanded={open}
        >
          Chat
        </button>

        <Tooltip label="New chat group" side="top">
          <button
            onClick={onNewGroup}
            aria-label="New chat group"
            className="grid h-7 w-7 place-items-center rounded-md text-white/45 transition-colors hover:bg-ink-hover hover:text-white"
          >
            <FontAwesomeIcon icon={faPenToSquare} />
          </button>
        </Tooltip>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Minimise chat' : 'Open chat'}
          className="grid h-7 w-7 place-items-center rounded-md text-white/45 transition-colors hover:bg-ink-hover hover:text-white"
        >
          <FontAwesomeIcon icon={open ? faChevronDown : faChevronUp} />
        </button>
      </header>

      {open && (
        <>
          <div className="relative shrink-0 p-2">
            <label className="sr-only" htmlFor="chat-filter">Search for friends</label>
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xs text-white/35"
            />
            <input
              id="chat-filter"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search for friends"
              className="h-9 w-full rounded-full border border-ink-line bg-ink-raised pl-8 pr-3 text-sm placeholder:text-white/30 focus:border-brand-bright"
            />
          </div>

          <div className="flex-1 overflow-y-auto kob-scroll">
            {loading && (
              <div className="space-y-2 p-2">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}
              </div>
            )}

            {!loading && !conversations.length && (
              <p className="px-4 py-6 text-center text-xs text-muted">
                No chats yet. You can message people once you are friends.
              </p>
            )}

            {shown.map((c) => {
              const solo = c.members.length === 1 ? c.members[0] : null
              return (
                <button
                  key={c.id}
                  onClick={() => onOpen(c.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-ink-hover"
                >
                  <span className="relative shrink-0">
                    {solo ? (
                      <>
                        <Avatar src={avatarOf(solo)} name={solo.display_name} size="sm" />
                        <span className="absolute -bottom-0.5 -right-0.5">
                          <StatusDot presence={presenceOf(solo)} size="sm" ring />
                        </span>
                      </>
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-deep text-xs text-white">
                        <FontAwesomeIcon icon={faUserGroup} />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{conversationName(c)}</span>
                    <span className="block truncate text-xs text-muted">
                      {c.last_message ?? 'No messages yet'}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[11px] text-muted">{timeAgo(c.last_message_at)}</span>
                    {c.unread_count > 0 && (
                      <span className="mt-1 inline-grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                        {c.unread_count > 9 ? '9+' : c.unread_count}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

export function ChatDock({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [openIds, setOpenIds] = useState<string[]>([])
  const [making, setMaking] = useState(false)

  const load = useCallback(async () => {
    if (!profile) {
      setConversations([])
      setLoading(false)
      return
    }
    try {
      setConversations(await chatRoster())
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!profile) return
    const channel = supabase
      .channel('dock-conversations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [profile, load])

  const openConversation = useCallback((id: string) => {
    setOpenIds((all) => (all.includes(id) ? all : [id, ...all].slice(0, MAX_OPEN)))
    load()
  }, [load])

  const value = useMemo(() => ({ openConversation }), [openConversation])

  return (
    <ChatContext.Provider value={value}>
      {children}

      {profile && !profile.is_guest && (
        <div className="pointer-events-none fixed bottom-0 right-0 z-40 hidden items-end gap-2 px-6 md:flex">
          {making && (
            <NewGroupDialog
              onClose={() => setMaking(false)}
              onCreated={(id) => {
                setMaking(false)
                load().then(() => openConversation(id))
              }}
            />
          )}

          {openIds.map((id) => {
            const conversation = conversations.find((c) => c.id === id)
            if (!conversation) return null
            return (
              <Window
                key={id}
                conversation={conversation}
                onClose={() => setOpenIds((all) => all.filter((open) => open !== id))}
                onOpened={(real) => {
                  setOpenIds((all) => all.map((open) => (open === id ? real : open)))
                  load()
                }}
              />
            )
          })}

          <List
            conversations={conversations}
            loading={loading}
            onOpen={openConversation}
            onNewGroup={() => setMaking(true)}
          />
        </div>
      )}
    </ChatContext.Provider>
  )
}
