import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

/**
 * The wordmark and logomark ship as black artwork, so on the dark interface
 * they get the light treatment rather than a recoloured copy of the file.
 */
export function Wordmark({ className, to = '/' }: { className?: string; to?: string | null }) {
  const img = (
    <img
      src="/brand/wordmark.png"
      alt="Kobbleston"
      className={cn('kob-mark-light h-5 w-auto select-none sm:h-6', className)}
    />
  )
  return to ? (
    <Link to={to} className="inline-flex items-center" aria-label="Kobbleston home">
      {img}
    </Link>
  ) : (
    img
  )
}

export function Logomark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logomark.png"
      alt=""
      aria-hidden="true"
      className={cn('kob-mark-light h-7 w-auto select-none', className)}
    />
  )
}
