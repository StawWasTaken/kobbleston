import { Link } from 'react-router-dom'
import { Kube } from '@/components/brand/Kube'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatCount } from '@/lib/format'

/** Kubes are what Kobbleston runs on. Guests do not carry a balance. */
export function KubeBalance({ amount }: { amount: number }) {
  return (
    <Tooltip label="Your Kubes" side="bottom">
      <Link
        to="/settings"
        className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-onbrand transition-colors hover:bg-onbrand/15 sm:flex"
        aria-label={`${amount} Kubes`}
      >
        <Kube />
        {formatCount(amount)}
      </Link>
    </Tooltip>
  )
}
