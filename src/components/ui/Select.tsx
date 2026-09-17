import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretDown, faCheck } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/cn'

export type SelectOption = { value: string; label: string; note?: string }

/**
 * Our own dropdown rather than a native select, so it looks the same on every
 * machine. Keyboard behaviour matches what people expect from a listbox:
 * arrows move, Enter picks, Escape closes.
 */
export function Select({
  value, options, onChange, label, className, disabled, align = 'left',
}: {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  label: string
  className?: string
  disabled?: boolean
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)

  const current = options.find((o) => o.value === value) ?? null

  useEffect(() => {
    if (!open) return
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open, options, value])

  useEffect(() => {
    if (!open) return
    list.current?.querySelectorAll('[role="option"]')[active]
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const pick = (next: string) => {
    setOpen(false)
    if (next !== value) onChange(next)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault(); setOpen(true); return
    }
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % options.length) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + options.length) % options.length) }
    if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1) }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(options[active].value) }
  }

  return (
    <div ref={root} className={cn('relative', className)}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-lg border px-2.5 text-left text-sm font-semibold transition-colors disabled:opacity-40',
          open ? 'border-brand-bright bg-ink-hover' : 'border-ink-line bg-ink-raised hover:bg-ink-hover',
        )}
      >
        <span className="min-w-0 flex-1 truncate">{current?.label ?? 'Choose'}</span>
        <FontAwesomeIcon
          icon={faCaretDown}
          className={cn('shrink-0 text-xs text-white/45 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          ref={list}
          role="listbox"
          aria-label={label}
          className={cn(
            'absolute top-[calc(100%+6px)] z-50 max-h-64 min-w-full overflow-y-auto rounded-xl border border-ink-line bg-ink-card py-1 shadow-pop animate-pop-in kob-scroll',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setActive(index)}
              onClick={() => pick(option.value)}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-semibold transition-colors',
                index === active ? 'bg-ink-hover text-white' : 'text-white/75',
              )}
            >
              <FontAwesomeIcon
                icon={faCheck}
                className={cn('w-3 shrink-0 text-xs', option.value === value ? 'text-[#9fadff]' : 'opacity-0')}
              />
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.note && <span className="shrink-0 text-xs text-muted">{option.note}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
