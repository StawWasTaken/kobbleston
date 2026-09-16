import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown, faChevronUp, faXmark, faPaperPlane, faMagnifyingGlass, faPenToSquare,
} from '@fortawesome/free-solid-svg-icons'
import { Avatar } from '@/components/ui/Avatar'
import { StatusDot, presenceOf } from '@/components/ui/StatusDot'
import { Skeleton } from '@/components/ui/States'
import { useAuth } from '@/hooks/useAuth'
import { listConversations, listMessages, markConversationRead, sendMessage } from '@/lib/api'
import type { ConversationSummary } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Message } from '@/types/db'

type ChatValue = { openConversation: (id: string) => void }
const ChatContext = createContext<ChatValue>({ openConversation: () => {} })

/** Lets any page pop a conversation open in the dock. */
export const useChatDock = () => useContext(ChatContext)

const MAX_OPEN = 3

function Window({
  conversation, onClose,
}: {
  conversation: ConversationSummary
  onClose: () => void
}) {
  const { profile } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    listMessages(conversation.id)
      .then((rows) => active && setMessages(rows))
      .finally(() => active && setLoading(false))
    if (profile) markConversationRead(conversation.id, profile.id)
    return () => { active = false }
  }, [conversation.id, profile])

  useEffect(() => {
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
  }, [conversation.id])

  useEffect(() => {
    if (!collapsed) bottom.current?.scrollIntoView({ block: 'end' })
  }, [messages, collapsed])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body || !profile) return
    setDraft('')
    try {
      await sendMessage(conversation.id, profile.id, body)
    } catch {
      setDraft(body)
    }
  }

  return (
    <section
      className={cn(
        'pointer-events-auto flex w-72 flex-col overflow-hidden rounded-t-xl border border-b-0 border-ink-line bg-ink-card shadow-pop',
        collapsed ? 'h-11' : 'h-96',
      )}
      aria-label={`Chat with ${conversation.other.display_name}`}
    >
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-ink-line px-2">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-ink-hover"
          aria-expanded={!collapsed}
        >
          <span className="relative shrink-0">
            <Avatar src={conversation.other.avatar_url} name={conversation.other.display_name} size="xs" />
            <span className="absolute -bottom-0.5 -right-0.5">
              <StatusDot presence={presenceOf(conversation.other)} size="sm" ring />
            </span>
          </span>
          <span className="truncate text-sm font-bold">{conversation.other.display_name}</span>
        </button>

        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand' : 'Collapse'}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/45 transition-colors hover:bg-ink-hover hover:text-white"
        >
          <FontAwesomeIcon icon={collapsed ? faChevronUp : faChevronDown} />
        </button>
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/45 transition-colors hover:bg-ink-hover hover:text-white"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </header>

      {!collapsed && (
        <>
          <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3 kob-scroll">
            {loading && [0, 1].map((i) => <Skeleton key={i} className="h-8 w-2/3" />)}

            {!loading && !messages.length && (
              <p className="py-6 text-center text-xs text-muted">
                Say something to {conversation.other.display_name}.
              </p>
            )}

            {messages.map((m) => {
              const mine = m.sender_id === profile?.id
              return (
                <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3 py-1.5 text-sm leading-snug',
                      mine ? 'bg-brand text-white' : 'bg-ink-hover text-white/90',
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  </div>
                </div>
              )
            })}
            <div ref={bottom} />
          </div>

          <form onSubmit={submit} className="flex shrink-0 items-center gap-1.5 border-t border-ink-line p-2">
            <label className="sr-only" htmlFor={`draft-${conversation.id}`}>Message</label>
            <input
              id={`draft-${conversation.id}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={2000}
              placeholder="Send a message"
              className="h-9 min-w-0 flex-1 rounded-lg border border-ink-line bg-ink-raised px-3 text-sm placeholder:text-white/30 focus:border-brand-bright"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand text-white transition-colors hover:bg-brand-bright disabled:opacity-40"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
            </button>
          </form>
        </>
      )}
    </section>
  )
}

function List({
  conversations, loading, onOpen,
}: {
  conversations: ConversationSummary[]
  loading: boolean
  onOpen: (id: string) => void
}) {
  const [collapsed, setCollapsed] = useState(true)
  const [term, setTerm] = useState('')

  const shown = conversations.filter((c) =>
    c.other.display_name.toLowerCase().includes(term.trim().toLowerCase()),
  )

  return (
    <section
      className={cn(
        'pointer-events-auto flex w-72 flex-col overflow-hidden rounded-t-xl border border-b-0 border-ink-line bg-ink-card shadow-pop',
        collapsed ? 'h-11' : 'h-96',
      )}
      aria-label="Chat"
    >
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-ink-line px-3">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex-1 text-left text-sm font-extrabold"
          aria-expanded={!collapsed}
        >
          Chat
        </button>
        <Link
          to="/friends"
          aria-label="Start a new chat"
          className="grid h-7 w-7 place-items-center rounded-md text-white/45 transition-colors hover:bg-ink-hover hover:text-white"
        >
          <FontAwesomeIcon icon={faPenToSquare} />
        </Link>
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand chat' : 'Collapse chat'}
          className="grid h-7 w-7 place-items-center rounded-md text-white/45 transition-colors hover:bg-ink-hover hover:text-white"
        >
          <FontAwesomeIcon icon={collapsed ? faChevronUp : faChevronDown} />
        </button>
      </header>

      {!collapsed && (
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
              className="h-9 w-full rounded-lg border border-ink-line bg-ink-raised pl-8 pr-3 text-sm placeholder:text-white/30 focus:border-brand-bright"
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

            {shown.map((c) => (
              <button
                key={c.id}
                onClick={() => onOpen(c.id)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-ink-hover"
              >
                <span className="relative shrink-0">
                  <Avatar src={c.other.avatar_url} name={c.other.display_name} size="sm" />
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <StatusDot presence={presenceOf(c.other)} size="sm" ring />
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{c.other.display_name}</span>
                  <span className="block truncate text-xs text-muted">
                    {c.lastMessage ?? 'No messages yet'}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-muted">{timeAgo(c.last_message_at)}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export function ChatDock({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [openIds, setOpenIds] = useState<string[]>([])

  const load = useCallback(async () => {
    if (!profile) {
      setConversations([])
      setLoading(false)
      return
    }
    try {
      setConversations(await listConversations(profile.id))
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => { load() }, [load])

  // A message in any conversation reorders the list, so the dock stays current.
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

      {profile && (
        <div className="pointer-events-none fixed bottom-0 right-0 z-40 hidden items-end gap-2 px-3 md:flex">
          {openIds.map((id) => {
            const conversation = conversations.find((c) => c.id === id)
            if (!conversation) return null
            return (
              <Window
                key={id}
                conversation={conversation}
                onClose={() => setOpenIds((all) => all.filter((open) => open !== id))}
              />
            )
          })}

          <List conversations={conversations} loading={loading} onOpen={openConversation} />
        </div>
      )}
    </ChatContext.Provider>
  )
}
