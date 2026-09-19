import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faShieldHalved, faChevronRight, faComments, faArrowRight,
} from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import {
  ActionTag, LevelMark, StandingBar, categoryOf, blockWord, day, levelLine, levelWord, stamp,
} from '@/components/social/standing'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useTitle } from '@/hooks/useTitle'
import { getStanding, listAppeals, listViolations } from '@/lib/api'
import { cn } from '@/lib/cn'

/*
 * Account status.
 *
 * Two things, in the order somebody in trouble wants them: how close this
 * account is to being closed, and what got it there. Everything else lives
 * one tap away on the decision's own page, because a list that explains each
 * row in full is a list nobody reads.
 *
 * The level is worked out on the server from the decisions still standing.
 * Nothing on this page is decorative: every line is a row.
 */
export default function Standing() {
  useTitle('Account status')
  const { profile } = useAuth()

  const standing = useAsync(async () => (profile ? getStanding() : null), [profile?.id])
  const decisions = useAsync(async () => (profile ? listViolations() : []), [profile?.id])
  const appeals = useAsync(async () => (profile ? listAppeals() : []), [profile?.id])

  const level = standing.data?.level ?? 'clear'
  const live = standing.data

  const appealFor = (id: number) => appeals.data?.find((one) => one.violation_id === id) ?? null

  return (
    <Page width="narrow" className="space-y-6">
      <PageHeader
        kicker="Your account"
        icon={faShieldHalved}
        title="Account status"
        lead="How this account stands with Kobblon, and every decision that got it there."
      />

      {/* ---------------------------------------------------------- the bar */}
      {standing.loading && <Skeleton className="h-40 rounded-2xl" />}
      {standing.error && <ErrorState message={standing.error} onRetry={standing.reload} />}

      {!!live && (
        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <LevelMark level={level} />
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
              {levelWord[level]}
            </h2>
          </div>

          <StandingBar level={level} className="mt-5" />

          <p className="mt-5 leading-relaxed text-white/70">{levelLine[level]}</p>

          {!!live.blocks.length && (
            <p className="mt-3 rounded-xl border border-ink-line bg-ink-raised px-4 py-3 text-sm leading-relaxed text-white/70">
              Switched off right now:{' '}
              <span className="font-bold text-white">
                {live.blocks.map((one) => blockWord[one] ?? one).join(', ')}
              </span>
              {live.until && ` until ${day(live.until)}`}.
            </p>
          )}
        </Card>
      )}

      {/* --------------------------------------------------- what got it there */}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-extrabold">Recent violations</h2>

        {decisions.loading && <Skeleton className="h-32 rounded-2xl" />}
        {decisions.error && <ErrorState message={decisions.error} onRetry={decisions.reload} />}

        {!decisions.loading && !decisions.data?.length && (
          <Card>
            <EmptyState
              mood="emptyBox"
              title="Nothing on record"
              body="No decision has ever been made about this account."
              action={<Button variant="subtle" to="/policies/guidelines">Read the house rules</Button>}
            />
          </Card>
        )}

        {!!decisions.data?.length && (
          <Card className="overflow-hidden p-0">
            <ul className="divide-y divide-ink-line">
              {decisions.data.map((one) => {
                const appeal = appealFor(one.id)
                return (
                  <li key={one.id}>
                    <Link
                      to={`/standing/${one.id}`}
                      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-ink-hover"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'font-bold',
                              one.is_void && 'text-white/60 line-through',
                            )}
                          >
                            {categoryOf(one)}
                          </span>
                          <ActionTag one={one} />
                        </span>
                        <span className="mt-0.5 block text-sm tabular-nums text-muted">
                          {stamp(one.created_at)}
                        </span>
                        {appeal && (
                          <span
                            className={cn(
                              'mt-0.5 block text-sm font-semibold',
                              appeal.status === 'upheld' ? 'text-space-bright'
                                : appeal.status === 'declined' ? 'text-muted'
                                : 'text-link',
                            )}
                          >
                            {appeal.status === 'upheld' ? 'Appeal upheld'
                              : appeal.status === 'declined' ? 'Appeal declined'
                              : 'Appeal being looked at'}
                          </span>
                        )}
                      </span>
                      <FontAwesomeIcon icon={faChevronRight} className="text-xs text-muted" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
      </section>

      <Card className="flex flex-wrap items-center gap-4 p-5">
        <FontAwesomeIcon icon={faComments} className="text-lg text-brand-bright" />
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-white/65">
          Appeals go on the decision itself. If something here does not match what you think
          happened, write to us instead.
        </p>
        <Link
          to="/support"
          className="flex items-center gap-2 text-sm font-bold text-link hover:underline"
        >
          Open a ticket
          <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
        </Link>
      </Card>
    </Page>
  )
}
