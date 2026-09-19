import { Menu } from '@/components/ui/Menu'
import { CurrencyMark } from '@/components/brand/Currency'
import { currency } from '@/lib/currency'
import { formatCount } from '@/lib/format'
import { faReceipt, faGift, faStore } from '@fortawesome/free-solid-svg-icons'

/**
 * What you have, and what you can do about it.
 *
 * Pressing the number used to drop you in settings, which is where the
 * balance happened to live rather than where somebody looking at their money
 * wants to be. It opens the three things instead: where it went, how to get
 * more, and where to spend it.
 */
export function CurrencyBalance({ amount }: { amount: number }) {
  return (
    <Menu
      label={`Your ${currency.plural}`}
      align="right"
      trigger={
        <span
          className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-onbrand transition-colors hover:bg-onbrand/15 sm:flex"
          aria-label={currency.amount(amount)}
        >
          <CurrencyMark />
          {formatCount(amount)}
        </span>
      }
      items={[
        { label: 'My transactions', icon: faReceipt, to: '/brix' },
        { label: 'Redeem a code', icon: faGift, to: '/brix/codes' },
        { label: `Spend ${currency.plural}`, icon: faStore, to: '/style' },
      ]}
    />
  )
}
