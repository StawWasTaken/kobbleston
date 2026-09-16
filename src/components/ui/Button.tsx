import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'enter' | 'ghost' | 'subtle' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-bright active:bg-brand shadow-brand border border-brand-bright/40',
  enter:
    'bg-space text-white hover:bg-space-bright active:bg-space border border-space-bright/40 shadow-[0_8px_24px_-10px_rgba(28,174,113,0.7)]',
  ghost:
    'bg-transparent text-white/80 hover:bg-white/10 hover:text-white border border-transparent',
  subtle:
    'bg-white/[0.06] text-white hover:bg-white/[0.12] border border-white/10',
  danger:
    'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
}

const base =
  'inline-flex items-center justify-center font-semibold transition-[background-color,transform,box-shadow] duration-150 ' +
  'active:translate-y-px disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  icon?: IconDefinition
  iconRight?: IconDefinition
  loading?: boolean
  to?: string
  block?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, loading, to, block, className, children, ...props },
  ref,
) {
  const classes = cn(base, variants[variant], sizes[size], block && 'w-full', className)
  const inner = (
    <>
      {loading ? (
        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
      ) : (
        icon && <FontAwesomeIcon icon={icon} />
      )}
      {children}
      {iconRight && !loading && <FontAwesomeIcon icon={iconRight} />}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        {inner}
      </Link>
    )
  }

  return (
    <button ref={ref} className={classes} disabled={loading || props.disabled} {...props}>
      {inner}
    </button>
  )
})
