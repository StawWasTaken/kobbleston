import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export type MenuItem = {
  label: string
  icon?: IconDefinition
  to?: string
  onSelect?: () => void
  danger?: boolean
}

/** The menu behind a "..." button. */
export function Menu({
  label, trigger, items, align = 'right',
}: {
  label: string
  trigger: ReactNode
  items: MenuItem[]
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const itemClass =
    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-ink-hover'

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
      >
        {trigger}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-[calc(100%+6px)] z-50 w-56 animate-pop-in overflow-hidden rounded-xl border border-ink-line bg-ink-card py-1 shadow-pop`}
        >
          {items.map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`${itemClass} text-white/80 hover:text-white`}
              >
                {item.icon && <FontAwesomeIcon icon={item.icon} className="w-4 text-white/45" />}
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                role="menuitem"
                onClick={() => { setOpen(false); item.onSelect?.() }}
                className={`${itemClass} ${item.danger ? 'text-red-300' : 'text-white/80 hover:text-white'}`}
              >
                {item.icon && <FontAwesomeIcon icon={item.icon} className="w-4 text-white/45" />}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
