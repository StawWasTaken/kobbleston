import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCube } from '@fortawesome/free-solid-svg-icons'
import { formatCount } from '@/lib/format'

/** Kubes are what Kobbleston runs on. Guests do not carry a balance. */
export function PixelBalance({ amount }: { amount: number }) {
  return (
    <Link
      to="/settings#pixels"
      className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-white transition-colors hover:bg-white/15 sm:flex"
      aria-label={`${amount} Kubes`}
    >
      <FontAwesomeIcon icon={faCube} className="text-link" />
      {formatCount(amount)}
    </Link>
  )
}
