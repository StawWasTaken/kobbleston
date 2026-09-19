import { CurrencyMark } from '@/components/brand/Currency'
import { currency } from '@/lib/currency'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * How much somebody has, drawn the same way everywhere it is shown.
 *
 * There were four of these: the top bar, settings, the Style shop and the
 * community funds panel, each with its own size and its own idea of whether
 * the word goes beside the number.
 */
export function Balance({
  amount, size = 'md', className, label = true,
}: {
  amount: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Whether the word follows the number. A tight space says no. */
  label?: boolean
}) {
  return (
    <span
      className={cn('inline-flex items-baseline gap-2', className)}
      title={currency.amount(amount)}
    >
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-display font-extrabold tabular-nums',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-lg',
          size === 'lg' && 'text-3xl',
        )}
      >
        <CurrencyMark className={cn(size === 'lg' ? 'h-6 w-6' : 'h-[0.9em] w-[0.9em]')} />
        {formatCount(amount)}
      </span>
      {label && (
        <span className={cn('text-muted', size === 'lg' ? 'text-sm' : 'text-xs')}>
          {currency.plural}
        </span>
      )}
    </span>
  )
}
