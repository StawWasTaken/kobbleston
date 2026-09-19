import { currency } from '@/lib/currency'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * The Brix mark: a two stud brick, drawn rather than fetched so it takes the
 * colour and the size of whatever it sits in, holds up at sixteen pixels and
 * flips with the theme.
 *
 * Every price on the site draws this rather than its own glyph, so the shape
 * changes here and nowhere else. `public/brand/brix.png` is the same mark as
 * a picture, for the places that cannot draw one.
 */
export function CurrencyMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 640"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn('inline-block h-[1em] w-[1em] align-[-0.125em]', className)}
    >
      <rect x="61" y="80" width="238" height="180" rx="55" />
      <rect x="341" y="80" width="238" height="180" rx="55" />
      <path d="M64 186h512a24 24 0 0 1 24 24v294a55 55 0 0 1-55 55H95a55 55 0 0 1-55-55V210a24 24 0 0 1 24-24Z" />
    </svg>
  )
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
