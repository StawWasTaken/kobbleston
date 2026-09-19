import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faScaleBalanced, faCircleCheck, faTriangleExclamation, faBan, faLock,
  faGavel, faComments, faCircleXmark, faClockRotateLeft, faArrowRight,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Link } from 'react-router-dom'
import { Page } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useTitle } from '@/hooks/useTitle'
import { fileAppeal, listAppeals, listViolations, getStanding } from '@/lib/api'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Appeal, StandingLevel, Violation, ViolationAction } from '@/types/db'

/*
 * Where you stand.
 *
 * Moderation used to be able to remove things and nothing else: no record an
 * account could read, and nowhere to argue. This page is the other half. It
 * shows every decision that has been made about the account, in the words the
 * account is allowed to read, with the one appeal each decision gets.
 *
 * Nothing here is decorative. Every line is a row, and the level at the top is
 * worked out on the server from the decisions that are still standing.
 */

const levelLook: Record<StandingLevel, { icon: IconDefinition; ring: string; text: string }> = {
  clear: { icon: faCircleCheck, ring: 'border-space/40 bg-space/10', text: 'text-space-bright' },
  warned: {
    icon: faTriangleExclamation,
    ring: 'border-amber-400/40 bg-amber-400/10',
    text: 'text-amber-300',
  },
  limited: { icon: faLock, ring: 'border-amber-400/40 bg-amber-400/10', text: 'text-amber-300' },
  suspended: { icon: faBan, ring: 'border-danger/40 bg-danger/10', text: 'text-danger' },
  terminated: { icon: faCircleXmark, ring: 'border-danger/40 bg-danger/10', text: 'text-danger' },
}

const levelWord: Record<StandingLevel, string> = {
  clear: 'Good standing',
  warned: 'Warned',
  limited: 'Limited',
  suspended: 'Suspended',
  terminated: 'Closed',
}

const actionWord: Record<ViolationAction, string> = {
  warning: 'Warning',
  content_removed: 'Taken down',
  feature_block: 'Switched off',
  suspension: 'Suspended',
  termination: 'Account closed',
}

const actionLook: Record<ViolationAction, string> = {
  warning: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  content_removed: 'border-white/15 bg-white/[0.06] text-white/70',
  feature_block: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  suspension: 'border-danger/40 bg-danger/10 text-danger',
  termination: 'border-danger/40 bg-danger/10 text-danger',
}

const ruleWord: Record<string, string> = {
  harassment: 'Harassment',
  spam: 'Spam',
  sexual: 'Sexual content',
  violence: 'Violence',
  impersonation: 'Impersonation',
  illegal: 'Something illegal',
  hate: 'Hate',
  cheating: 'Cheating the system',
  copyright: 'Somebody else’s work',
  age: 'Age',
  other: 'Something else',
}

/** What a feature block stops, said the way somebody would say it. */
const blockWord: Record<string, string> = {
  post: 'posting',
  comment: 'commenting',
  upload: 'uploading',
  sell: 'selling',
  chat: 'chat',
  publish: 'publishing Spaces',
  trade: 'buying and selling',
}

const appealStatusLook: Record<Appeal['status'], string> = {
  open: 'border-brand-bright/50 bg-brand/20 text-white',
  upheld: 'border-space/40 bg-space/10 text-space-bright',
  declined: 'border-white/15 bg-white/[0.06] text-white/60',
}

const appealStatusWord: Record<Appeal['status'], string> = {
  open: 'Being looked at',
  upheld: 'Upheld',
  declined: 'Declined',
}

function when(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function Standing() {
  useTitle('Your standing')
  const { profile } = useAuth()
  const toast = useToast()

  const standing = useAsync(async () => (profile ? getStanding() : null), [profile?.id])
  const decisions = useAsync(async () => (profile ? listViolations() : []), [profile?.id])
  const appeals = useAsync(async () => (profile ? listAppeals() : []), [profile?.id])

  const [appealing, setAppealing] = useState<Violation | null>(null)
  const [words, setWords] = useState('')
  const [sending, setSending] = useState(false)

  const appealFor = (violation: Violation) =>
    appeals.data?.find((one) => one.violation_id === violation.id) ?? null

  const send = async () => {
    if (!appealing) return
    setSending(true)
    try {
      await fileAppeal(appealing.id, words.trim())
      toast('Sent. Somebody who was not part of the decision will look at it.', 'success')
      setAppealing(null)
      setWords('')
      appeals.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not send.', 'error')
    } finally {
      setSending(false)
    }
  }

  const level = standing.data?.level ?? 'clear'
  const look = levelLook[level]

  return (
    <Page width="narrow" className="space-y-6">
      <PageHeader
        kicker="Your account"
        icon={faScaleBalanced}
        title="Where you stand"
        lead="Every decision Kobblon has made about this account, what it switched off, and how to have one looked at again."
        actions={
          <>
            <Button variant="subtle" to="/policies/moderation">How decisions are made</Button>
            <Button variant="ghost" to="/support">Write to us</Button>
          </>
        }
      />

      {/* ------------------------------------------------------ the verdict */}
      {standing.loading && <Skeleton className="h-36 rounded-2xl" />}
      {standing.error && <ErrorState message={standing.error} onRetry={standing.reload} />}

      {!!standing.data && (
        <Card className={cn('border p-6 sm:p-7', look.ring)}>
          <div className="flex flex-wrap items-start gap-5">
            <span
              className={cn(
                'grid h-14 w-14 shrink-0 place-items-center rounded-2xl border text-2xl',
                look.ring, look.text,
              )}
            >
              <FontAwesomeIcon icon={look.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('font-display text-2xl font-extrabold', look.text)}>
                {levelWord[level]}
              </p>
              <p className="mt-1 leading-relaxed text-white/70">{standing.data.headline}</p>

              {!!standing.data.blocks.length && (
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  Switched off right now:{' '}
                  <span className="font-bold text-white">
                    {standing.data.blocks.map((one) => blockWord[one] ?? one).join(', ')}
                  </span>
                  {standing.data.until && ` until ${when(standing.data.until)}`}.
                </p>
              )}

              {level === 'clear' && (
                <p className="mt-3 text-sm leading-relaxed text-white/50">
                  Nothing is switched off and nothing is on record. This page will say so
                  plainly if that ever changes.
                </p>
              )}
            </div>

            <div className="flex gap-6 sm:flex-col sm:gap-2">
              <span>
                <span className="block font-display text-2xl font-extrabold tabular-nums">
                  {standing.data.warning_count}
                </span>
                <span className="text-xs font-bold uppercase tracking-wide text-muted">
                  Warnings
                </span>
              </span>
              <span>
                <span className="block font-display text-2xl font-extrabold tabular-nums">
                  {standing.data.live_count}
                </span>
                <span className="text-xs font-bold uppercase tracking-wide text-muted">
                  Standing
                </span>
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* ----------------------------------------------------- the decisions */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
          <FontAwesomeIcon icon={faClockRotateLeft} className="text-base text-muted" />
          Decisions
        </h2>

        {decisions.loading && <Skeleton className="h-28 rounded-2xl" />}
        {decisions.error && <ErrorState message={decisions.error} onRetry={decisions.reload} />}

        {!decisions.loading && !decisions.data?.length && (
          <Card>
            <EmptyState
              mood="emptyBox"
              title="Nothing on record"
              body="No decision has ever been made about this account. Keep it that way and this page stays boring."
              action={<Button variant="subtle" to="/guidelines">Read the house rules</Button>}
            />
          </Card>
        )}

        {decisions.data?.map((one) => {
          const appeal = appealFor(one)
          const over = !!one.expires_at && new Date(one.expires_at) < new Date()
          return (
            <Card
              key={one.id}
              className={cn('p-5 sm:p-6', (one.is_void || over) && 'opacity-70')}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide',
                    one.is_void
                      ? 'border-space/40 bg-space/10 text-space-bright'
                      : actionLook[one.action],
                  )}
                >
                  {one.is_void ? 'Voided' : actionWord[one.action]}
                </span>
                <span className="text-sm font-bold text-white/70">
                  {ruleWord[one.rule] ?? one.rule}
                </span>
                <span className="ml-auto text-xs text-muted">{timeAgo(one.created_at)}</span>
              </div>

              <p className="mt-3 leading-relaxed text-white/75">{one.reason}</p>

              {!!one.blocks.length && !one.is_void && (
                <p className="mt-2 text-sm text-muted">
                  Stopped {one.blocks.map((b) => blockWord[b] ?? b).join(', ')}
                  {one.expires_at
                    ? over ? ', and has since ended.' : ` until ${when(one.expires_at)}.`
                    : '.'}
                </p>
              )}

              {one.is_void && one.void_reason && (
                <p className="mt-2 text-sm leading-relaxed text-space-bright">
                  This was taken back: {one.void_reason}
                </p>
              )}

              {/* ------------------------------------------------- the appeal */}
              {appeal ? (
                <div className="mt-4 rounded-2xl border border-ink-line bg-ink-raised p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <FontAwesomeIcon icon={faGavel} className="text-xs text-muted" />
                    <span className="text-sm font-bold">Your appeal</span>
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide',
                        appealStatusLook[appeal.status],
                      )}
                    >
                      {appealStatusWord[appeal.status]}
                    </span>
                    <span className="ml-auto text-xs text-muted">{timeAgo(appeal.created_at)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/60">
                    {appeal.body}
                  </p>
                  {appeal.decision_note && (
                    <p className="mt-3 border-t border-ink-line pt-3 text-sm leading-relaxed text-white/75">
                      <span className="font-bold">What we said back: </span>
                      {appeal.decision_note}
                    </p>
                  )}
                </div>
              ) : !one.is_void && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    variant="subtle"
                    icon={faGavel}
                    onClick={() => { setAppealing(one); setWords('') }}
                  >
                    Appeal this
                  </Button>
                  <span className="text-xs text-muted">
                    One appeal each, read by somebody who was not part of the decision.
                  </span>
                </div>
              )}
            </Card>
          )
        })}
      </section>

      {/* ----------------------------------------------------------- the out */}
      <Card className="flex flex-wrap items-center gap-4 p-5">
        <FontAwesomeIcon icon={faComments} className="text-lg text-brand-bright" />
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-white/65">
          If something here does not match what you think happened, write to us. A ticket goes
          to a person and the reply lands in your inbox.
        </p>
        <Link
          to="/support"
          className="flex items-center gap-2 text-sm font-bold text-link hover:underline"
        >
          Open a ticket
          <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
        </Link>
      </Card>

      {/* --------------------------------------------------------- appealing */}
      <Dialog
        open={!!appealing}
        onClose={() => setAppealing(null)}
        title="Appeal this decision"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted">
            Say what you think was missed. This goes to somebody who was not part of the
            decision, and you get one appeal for each decision, so put everything in it.
          </p>

          {appealing && (
            <div className="rounded-xl border border-ink-line bg-ink-raised p-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
                {actionWord[appealing.action]} · {ruleWord[appealing.rule] ?? appealing.rule}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/70">{appealing.reason}</p>
            </div>
          )}

          <textarea
            value={words}
            onChange={(e) => setWords(e.target.value)}
            rows={6}
            maxLength={2000}
            placeholder="What happened, from your side."
            aria-label="Your appeal"
            className="w-full resize-y rounded-xl border border-ink-line bg-ink-raised p-3 text-sm leading-relaxed outline-none transition-colors placeholder:text-white/30 focus:border-brand-bright"
          />
          <p className="text-xs text-muted">
            {words.trim().length < 20
              ? `At least ${20 - words.trim().length} more characters.`
              : `${2000 - words.length} left.`}
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAppealing(null)}>Cancel</Button>
            <Button onClick={send} loading={sending} disabled={words.trim().length < 20}>
              Send appeal
            </Button>
          </div>
        </div>
      </Dialog>
    </Page>
  )
}
