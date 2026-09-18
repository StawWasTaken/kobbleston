import { Avatar } from '@/components/ui/Avatar'
import { StatusDot, presenceOf } from '@/components/ui/StatusDot'
import type { Presence } from '@/components/ui/StatusDot'
import { avatarOf } from '@/lib/avatars'
import { cn } from '@/lib/cn'

type Somebody = {
  display_name: string
  avatar_url?: string | null
  is_online?: boolean
  in_space_id?: string | null
  activity?: string | null
  last_seen_at?: string | null
}

const sizes = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
  '2xl': 'h-24 w-24',
  '3xl': 'h-32 w-32',
}

const dots: Record<keyof typeof sizes, 'sm' | 'md' | 'lg' | 'xl'> = {
  xs: 'sm', sm: 'sm', md: 'md', lg: 'md', xl: 'lg', '2xl': 'lg', '3xl': 'xl',
}

/**
 * Somebody's picture with the dot on it, which is the only way either should
 * ever appear.
 *
 * The dot sits on the edge of the picture, half on and half off, the way it
 * does everywhere people already know it from. A round picture needs it
 * pushed in towards the corner, because the corner of a circle is empty; a
 * square one takes it on the corner itself. It is the same dot, in the same
 * place, at every size and on every page.
 */
export function PersonAvatar({
  person, size = 'md', square, className, ring = 'ring-ink',
}: {
  person: Somebody | null | undefined
  size?: keyof typeof sizes
  /** Square pictures are used where a tile reads better than a circle. */
  square?: boolean
  className?: string
  /** What the dot is cut out of: whatever the picture sits on. */
  ring?: string
}) {
  const presence: Presence = presenceOf(person)

  return (
    <span className={cn('relative inline-block shrink-0', sizes[size], className)}>
      <Avatar
        src={avatarOf(person ?? undefined)}
        name={person?.display_name ?? '?'}
        size="md"
        className={cn('h-full w-full', square ? 'rounded-xl' : 'rounded-full')}
      />
      <StatusDot
        presence={presence}
        size={dots[size]}
        className={cn(
          // Over whatever else is on the picture, and never see through.
          'absolute z-10',
          square
            ? '-bottom-0.5 -right-0.5'
            : 'bottom-[7%] right-[7%] translate-x-[18%] translate-y-[18%]',
          'ring-[3px]',
          ring,
        )}
      />
    </span>
  )
}
