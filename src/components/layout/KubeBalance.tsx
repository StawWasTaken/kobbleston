import { Link } from 'react-router-dom'
import { CurrencyMark } from '@/components/brand/Currency'
import { Tooltip } from '@/components/ui/Tooltip'
import { currency } from '@/lib/currency'
import { formatCount } from '@/lib/format'

/** What Kobbleston runs on. Guests do not carry a balance. */
export function KubeBalance({ amount }: { amount: number }) {
  return (
    <Tooltip label={`Your ${currency.plural}`} side="bottom">
      <Link
        to="/settings"
        className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-onbrand transition-colors hover:bg-onbrand/15 sm:flex"
        aria-label={currency.amount(amount)}
      >
        <CurrencyMark />
        {formatCount(amount)}
      </Link>
    </Tooltip>
  )
}
