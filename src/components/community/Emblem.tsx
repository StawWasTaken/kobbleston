import { cn } from '@/lib/cn'

/**
 * A Community's emblem.
 *
 * Whatever is behind it shows through where the picture is see through: an
 * emblem drawn with a transparent background was being sat on a blue square,
 * which is not what its maker drew. Only a Community without one gets a
 * filled tile, with its initials on it.
 */
export function Emblem({
  src, name, className, rounded = 'rounded-lg',
}: {
  src?: string | null
  name: string
  className?: string
  rounded?: string
}) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden font-display font-extrabold',
        rounded,
        src ? '' : 'bg-brand-deep',
        className,
      )}
    >
      {src
        ? <img src={src} alt="" className="h-full w-full object-cover" />
        : name.slice(0, 2).toUpperCase()}
    </span>
  )
}
