import { cn } from '@/lib/cn'

/**
 * Kobby shows up for moments, not for decoration on every screen: empty
 * states, notifications, errors, the odd celebration.
 */
export const kobbyArt = {
  default: '/brand/kobby.png',
  notification: '/brand/kobby_notification.png',
  construction: '/brand/kobby_under_construction.png',
  crown: '/brand/kobby_crown.png',
  emptyBox: '/brand/kobby_empty_box.png',
  noResults: '/brand/kobby_no_results.png',
} as const

export type KobbyMood = keyof typeof kobbyArt

const sizes = { sm: 'h-20', md: 'h-32', lg: 'h-44', xl: 'h-56' }

export function Kobby({
  mood = 'default',
  size = 'md',
  bob = true,
  className,
}: {
  mood?: KobbyMood
  size?: keyof typeof sizes
  bob?: boolean
  className?: string
}) {
  return (
    <img
      src={kobbyArt[mood]}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className={cn('w-auto select-none object-contain', sizes[size], bob && 'animate-bob', className)}
    />
  )
}
