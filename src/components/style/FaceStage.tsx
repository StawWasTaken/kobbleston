import { Avatar } from '@/components/ui/Avatar'
import { StyleLayer } from '@/components/style/StyleLayer'
import { cn } from '@/lib/cn'
import type { WornStyle } from '@/types/db'

/**
 * A face with things on it.
 *
 * Anything worn behind goes under the picture, the picture is clipped round,
 * and anything worn in front sits over the lot without that shape cutting it
 * off. Everywhere a styled face appears comes through here, so a hat sits the
 * same on a card, on a profile and on the shop's own stage.
 */
export function FaceStage({
  src, name, items, className, square,
}: {
  src?: string | null
  name: string
  items?: WornStyle[] | null
  className?: string
  square?: boolean
}) {
  return (
    <span className={cn('relative block aspect-square', className)}>
      <StyleLayer items={items} layer={0} />
      <span className="relative block h-full w-full">
        <Avatar
          src={src}
          name={name}
          size="md"
          className={cn('h-full w-full', square ? 'rounded-2xl' : 'rounded-full')}
        />
      </span>
      <StyleLayer items={items} layer={1} />
    </span>
  )
}
