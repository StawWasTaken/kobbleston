import { cn } from '@/lib/cn'

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-24 w-24 text-3xl',
}

export type AvatarSize = keyof typeof sizes

export function Avatar({
  src,
  name,
  size = 'md',
  className,
  style,
}: {
  src?: string | null
  name: string
  size?: AvatarSize
  className?: string
  style?: React.CSSProperties
}) {
  const initials = name.slice(0, 2).toUpperCase()
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-brand-deep font-bold uppercase text-white/90',
        sizes[size],
        className,
      )}
      style={style}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" /> : initials}
    </span>
  )
}
