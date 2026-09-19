import { Kube } from '@/components/brand/Kube'
import { currency } from '@/lib/currency'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * The mark for whatever Kobbleston's currency is called this month.
 *
 * Every price on the site draws this rather than a particular glyph, so the
 * day the currency gets its own name and its own shape, the shape changes
 * here and nowhere else.
 */
export function CurrencyMark({ className }: { className?: string }) {
  return <Kube className={className} />
}

/** A price: the mark, then the number, then nothing else. */
export function Price({
  amount, free = 'Free', className, markClassName,
}: {
  amount: number
  /** What nothing costs. Some places say Free, some say Take it. */
  free?: string
  className?: string
  markClassName?: string
}) {
  if (!amount) return <span className={className}>{free}</span>

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      title={currency.amount(amount)}
    >
      <CurrencyMark className={markClassName ?? 'h-[0.9em] w-[0.9em]'} />
      {formatCount(amount)}
    </span>
  )
}
