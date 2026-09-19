import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHeadset, faPlus, faScaleBalanced, faScroll, faArrowRight, faCircleInfo,
} from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Choices } from '@/components/ui/Choices'
import { Dialog } from '@/components/ui/Dialog'
import { GuestGate } from '@/components/ui/GuestGate'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useTitle } from '@/hooks/useTitle'
import { listTickets, openTicket } from '@/lib/api'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Ticket, TicketTopic } from '@/types/db'

/*
 * Writing to Kobblon.
 *
 * A ticket is a row and a reply is a row, so nothing said here disappears
 * into an address nobody reads. The reply also lands in the inbox, because a
 * person who wrote in about their account should not have to remember to come
 * back and check.
 */

export const topics: { value: TicketTopic; label: string; note: string }[] = [
  { value: 'account', label: 'My account', note: 'Signing in, names, email, deleting it.' },
  { value: 'money', label: 'Money', note: 'A balance, a purchase, a movement that looks wrong.' },
  { value: 'safety', label: 'Safety', note: 'Somebody is a problem, or something needs looking at.' },
  { value: 'bug', label: 'Something is broken', note: 'It does not work the way it should.' },
  { value: 'creator', label: 'Creator', note: 'Uploads, selling, verification, your work elsewhere.' },
  { value: 'privacy', label: 'Privacy', note: 'What is held about you, and getting it removed.' },
  { value: 'other', label: 'Something else', note: 'Anything the list above does not cover.' },
]

export const statusLook: Record<Ticket['status'], { word: string; look: string }> = {
  open: { word: 'Waiting on us', look: 'border-brand-bright/50 bg-brand/20 text-white' },
  answered: { word: 'Replied', look: 'border-space/40 bg-space/10 text-space-bright' },
  closed: { word: 'Closed', look: 'border-white/15 bg-white/[0.06] text-white/55' },
}

export default function Support() {
  useTitle('Support')
  const { profile } = useAuth()
  const toast = useToast()

  const tickets = useAsync(async () => (profile ? listTickets() : []), [profile?.id])

  const [writing, setWriting] = useState(false)
  const [topic, setTopic] = useState<TicketTopic>('account')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const ready = subject.trim().length >= 3 && body.trim().length >= 10

  const send = async () => {
    setSending(true)
    try {
      await openTicket(topic, subject.trim(), body.trim())
      toast('Sent. The reply lands here and in your inbox.', 'success')
      setWriting(false)
      setSubject('')
      setBody('')
      tickets.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not send.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <Page width="narrow" className="space-y-6">
      <PageHeader
        kicker="Help"
        icon={faHeadset}
        title="Support"
        lead="Write to a person at Kobblon. Everything you send and everything we say back stays on this page."
        actions={
          <GuestGate action="write to support">
            <Button icon={faPlus} onClick={() => setWriting(true)} disabled={!profile}>
              New ticket
            </Button>
          </GuestGate>
        }
      />

      {/* The two things most people are actually looking for. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/standing"
          className="flex items-start gap-4 rounded-2xl border border-ink-line bg-ink-card p-5 transition-colors hover:bg-ink-hover"
        >
          <FontAwesomeIcon icon={faScaleBalanced} className="mt-1 text-lg text-brand-bright" />
          <span className="min-w-0">
            <span className="block font-bold">Where you stand</span>
            <span className="mt-0.5 block text-sm leading-relaxed text-muted">
              A decision against your account is appealed there, not here.
            </span>
          </span>
        </Link>
        <Link
          to="/policies"
          className="flex items-start gap-4 rounded-2xl border border-ink-line bg-ink-card p-5 transition-colors hover:bg-ink-hover"
        >
          <FontAwesomeIcon icon={faScroll} className="mt-1 text-lg text-brand-bright" />
          <span className="min-w-0">
            <span className="block font-bold">The rules</span>
            <span className="mt-0.5 block text-sm leading-relaxed text-muted">
              Every policy, split by subject, each with the day it last changed.
            </span>
          </span>
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-extrabold">Your tickets</h2>

        {tickets.loading && <Skeleton className="h-24 rounded-2xl" />}
        {tickets.error && <ErrorState message={tickets.error} onRetry={tickets.reload} />}

        {!tickets.loading && !tickets.data?.length && (
          <Card>
            <EmptyState
              mood="emptyBox"
              title="Nothing open"
              body="You have not written to us. If something is wrong, say so and a person reads it."
              action={
                <GuestGate action="write to support">
                  <Button icon={faPlus} onClick={() => setWriting(true)} disabled={!profile}>
                    Write to us
                  </Button>
                </GuestGate>
              }
            />
          </Card>
        )}

        {tickets.data?.map((ticket) => {
          const look = statusLook[ticket.status]
          return (
            <Link key={ticket.id} to={`/support/${ticket.id}`} className="block">
              <Card className="flex flex-wrap items-center gap-3 p-5 transition-colors hover:bg-ink-hover">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted">
                      {topics.find((one) => one.value === ticket.topic)?.label ?? ticket.topic}
                    </span>
                    <span className="text-xs text-muted">·</span>
                    <span className="text-xs text-muted">
                      Last moved {timeAgo(ticket.updated_at)}
                    </span>
                  </span>
                  <span className="mt-1 block truncate font-bold">{ticket.subject}</span>
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide',
                    look.look,
                  )}
                >
                  {look.word}
                </span>
                <FontAwesomeIcon icon={faArrowRight} className="text-xs text-muted" />
              </Card>
            </Link>
          )
        })}
      </section>

      <p className="flex items-start gap-3 rounded-2xl border border-ink-line bg-ink-card p-5 text-sm leading-relaxed text-muted">
        <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
        Kobblon will never ask you for your password, and never asks for it here. Anybody who
        does is not us, whatever the message looks like.
      </p>

      {/* ---------------------------------------------------------- writing */}
      <Dialog open={writing} onClose={() => setWriting(false)} title="Write to us">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted">
              What it is about
            </p>
            <Choices
              size="sm"
              label="What the ticket is about"
              value={topic}
              options={topics.map((one) => ({ value: one.value, label: one.label }))}
              onChange={setTopic}
            />
            <p className="mt-2 text-sm text-muted">
              {topics.find((one) => one.value === topic)?.note}
            </p>
          </div>

          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={140}
            placeholder="In one line"
          />

          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted">
              What happened
            </p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              maxLength={4000}
              placeholder="What you did, what you expected, and what happened instead."
              aria-label="What happened"
              className="w-full resize-y rounded-xl border border-ink-line bg-ink-raised p-3 text-sm leading-relaxed outline-none transition-colors placeholder:text-white/30 focus:border-brand-bright"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setWriting(false)}>Cancel</Button>
            <Button onClick={send} loading={sending} disabled={!ready}>Send</Button>
          </div>
        </div>
      </Dialog>
    </Page>
  )
}
