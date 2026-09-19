import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { asset } from '@/lib/asset'

/**
 * The wordmark is white artwork for the dark interface, flipped in light
 * mode. The logomark is brand blue and reads on either.
 */
export function Wordmark({ className, to = '/' }: { className?: string; to?: string | null }) {
  const img = (
    <img
      src={asset(('/brand/wordmark.png'))}
      alt="Kobblon"
      className={cn('kob-wordmark h-5 w-auto select-none sm:h-6', className)}
    />
  )
  return to ? (
    <Link to={to} className="inline-flex items-center" aria-label="Kobblon home">
      {img}
    </Link>
  ) : (
    img
  )
}

export function Logomark({ className }: { className?: string }) {
  return (
    <img
      src={asset(('/brand/logomark.png'))}
      alt=""
      aria-hidden="true"
      className={cn('h-7 w-auto select-none', className)}
    />
  )
}
