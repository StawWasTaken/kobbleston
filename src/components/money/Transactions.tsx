import { CurrencyMark } from '@/components/brand/Currency'
import { Skeleton } from '@/components/ui/States'
import { movementWords } from '@/lib/currency'
import { formatCount, timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'

export type Movement = {
  id: number | string
  amount: number
  kind: string
  note?: string | null
  created_at: string
}

/**
 * Where the currency went.
 *
 * One list for every place that shows movements, so a purchase reads the same
 * in settings as it does in a community's funds, and so a new kind of
 * movement, from the Catalog or from a game, only has to be given words in
 * one place.
 */
export function Transactions({
  rows, loading, empty = 'Nothing has moved yet.',
}: {
  rows?: Movement[] | null
  loading?: boolean
  empty?: string
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}
      </div>
    )
  }

  if (!rows?.length) {
    return <p className="px-5 py-6 text-center text-sm text-muted">{empty}</p>
  }

  return (
    <ul>
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex items-center gap-3 border-b border-ink-line/70 px-5 py-3 last:border-0"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {row.note || movementWords(row.kind)}
            </span>
            <span className="block text-xs text-muted">
              {row.note ? `${movementWords(row.kind)} · ` : ''}{timeAgo(row.created_at)}
            </span>
          </span>

          <span
            className={cn(
              'inline-flex items-center gap-1 font-display text-sm font-extrabold tabular-nums',
              row.amount > 0 ? 'text-space-bright' : 'text-white/60',
            )}
          >
            {row.amount > 0 ? '+' : '-'}
            <CurrencyMark className="h-[0.85em] w-[0.85em]" />
            {formatCount(Math.abs(row.amount))}
          </span>
        </li>
      ))}
    </ul>
  )
}
