import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { cn } from '@/lib/cn'

export type Tab<T extends string> = {
  value: T
  label: string
  icon?: IconDefinition
  /** A number beside the name, for a list whose size is worth knowing. */
  count?: number | null
}

/**
 * Two or three ways of looking at the same page, in a tray.
 *
 * Not the same thing as Choices: a tab changes what the page is, a choice
 * narrows what it shows. Keeping them apart keeps the site readable.
 */
export function Tabs<T extends string>({
  value, options, onChange, className, label,
}: {
  value: T
  options: Tab<T>[]
  onChange: (next: T) => void
  className?: string
  label?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('inline-flex shrink-0 gap-1 rounded-xl border border-ink-line bg-ink-card p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors',
              active ? 'bg-brand text-onbrand' : 'text-white/60 hover:bg-ink-hover hover:text-white',
            )}
          >
            {option.icon && <FontAwesomeIcon icon={option.icon} className="text-xs" />}
            {option.label}
            {typeof option.count === 'number' && (
              <span
                className={cn(
                  'rounded-md px-1.5 text-xs tabular-nums',
                  active ? 'bg-onbrand/20' : 'bg-ink-raised text-white/50',
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
