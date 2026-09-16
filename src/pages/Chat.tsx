import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faPaperPlane, faUserGroup } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { PresenceLabel, StatusDot, presenceOf } from '@/components/ui/StatusDot'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { listConversations, listMessages, markConversationRead, sendMessage } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { ConversationSummary } from '@/lib/api'
import type { Message } from '@/types/db'

function Thread({ conversation }: { conversation: ConversationSummary }) {
  const { profile } = useAuth()
  const toast = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    listMessages(conversation.id)
      .then((rows) => active && setMessages(rows))
      .finally(() => active && setLoading(false))
    if (profile) markConversationRead(conversation.id, profile.id)
    return () => {
      active = false
    }
  }, [conversation.id, profile])

  // Live messages come straight off the realtime channel for this thread.
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversation.id}`)
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
    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation.id])

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body || !profile) return
    setSending(true)
    try {
      await sendMessage(conversation.id, profile.id, body)
      setDraft('')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That message did not send.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-ink-line px-4 py-3">
        <Link
          to="/chat"
          className="grid h-9 w-9 place-items-center rounded-lg text-white/60 hover:bg-ink-hover hover:text-white lg:hidden"
          aria-label="Back to conversations"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </Link>
        <Link to={`/u/${conversation.other.username}`} className="relative">
          <Avatar src={conversation.other.avatar_url} name={conversation.other.display_name} size="sm" />
          <span className="absolute -bottom-0.5 -right-0.5">
            <StatusDot presence={presenceOf(conversation.other)} size="sm" ring />
          </span>
        </Link>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold">{conversation.other.display_name}</p>
          <PresenceLabel presence={presenceOf(conversation.other)} />
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4 kob-scroll">
        {loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-2/3" />)}

        {!loading && !messages.length && (
          <EmptyState
            title="Say something"
            body={`This is the start of your conversation with ${conversation.other.display_name}.`}
          />
        )}

        {messages.map((m, i) => {
          const mine = m.sender_id === profile?.id
          const grouped = i > 0 && messages[i - 1].sender_id === m.sender_id
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[78%] animate-pop-in rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                  mine ? 'bg-brand text-white' : 'bg-ink-hover text-white/90',
                  grouped && (mine ? 'rounded-tr-md' : 'rounded-tl-md'),
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn('mt-1 text-[10px]', mine ? 'text-white/60' : 'text-muted')}>
                  {timeAgo(m.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottom} />
      </div>

      <form onSubmit={submit} className="flex items-end gap-2 border-t border-ink-line p-3">
        <label htmlFor="chat-draft" className="sr-only">Message</label>
        <textarea
          id="chat-draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit(e)
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder={`Message ${conversation.other.display_name}`}
          className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-ink-line bg-ink-raised px-3.5 py-3 text-sm placeholder:text-white/30 focus:border-brand-bright"
        />
        <Button
          type="submit"
          icon={faPaperPlane}
          loading={sending}
          disabled={!draft.trim()}
          aria-label="Send message"
          className="h-11 w-11 px-0"
        />
      </form>
    </div>
  )
}

export default function Chat() {
  const { conversationId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useAsync(
    async () => (profile ? listConversations(profile.id) : []),
    [profile?.id],
  )

  const conversations = data ?? []
  const active = conversations.find((c) => c.id === conversationId) ?? null

  useEffect(() => {
    if (conversationId && !loading && data && !active) navigate('/chat', { replace: true })
  }, [conversationId, loading, data, active, navigate])

  return (
    <div className="mx-auto h-[calc(100dvh-3.5rem)] w-full max-w-6xl px-0 sm:px-6 sm:py-6">
      <div className="grid h-full overflow-hidden border-ink-line bg-ink-card sm:rounded-2xl sm:border sm:shadow-card lg:grid-cols-[19rem_1fr]">
        <div
          className={cn(
            'flex min-h-0 flex-col border-ink-line lg:border-r',
            active && 'hidden lg:flex',
          )}
        >
          <header className="flex items-center justify-between border-b border-ink-line px-4 py-3.5">
            <h1 className="text-sm font-extrabold">Chat</h1>
            <Link to="/friends" className="text-xs font-semibold text-[#9fadff] hover:underline">
              Friends
            </Link>
          </header>

          <div className="flex-1 overflow-y-auto kob-scroll">
            {loading && (
              <div className="space-y-2 p-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}
              </div>
            )}

            {error && <ErrorState message={error} onRetry={reload} />}

            {!loading && !error && !conversations.length && (
              <EmptyState
                title="No conversations"
                body="You can message people once you're friends with them."
                action={<Button size="sm" variant="subtle" to="/friends" icon={faUserGroup}>Find friends</Button>}
              />
            )}

            <ul>
              {conversations.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/chat/${c.id}`}
                    className={cn(
                      'flex items-center gap-3 border-b border-ink-line/70 px-4 py-3 transition-colors hover:bg-ink-hover',
                      c.id === conversationId && 'bg-ink-hover',
                    )}
                  >
                    <span className="relative shrink-0">
                      <Avatar src={c.other.avatar_url} name={c.other.display_name} size="md" />
                      <span className="absolute -bottom-0.5 -right-0.5">
                        <StatusDot presence={presenceOf(c.other)} size="sm" ring />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{c.other.display_name}</span>
                      <span className="block truncate text-xs text-muted">
                        {c.lastMessage ?? 'No messages yet'}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-muted">{timeAgo(c.last_message_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={cn('min-h-0', !active && 'hidden lg:block')}>
          {active ? (
            <Thread conversation={active} />
          ) : (
            <div className="grid h-full place-items-center">
              <EmptyState
                mood="notification"
                title="Pick a conversation"
                body="Your chats show up on the left."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
