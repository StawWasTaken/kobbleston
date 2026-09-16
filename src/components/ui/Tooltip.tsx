import { cloneElement, useId, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

type Side = 'top' | 'bottom' | 'left' | 'right'

const OFFSET = 10

/**
 * Kobbleston's tooltip: a rounded bubble with a rounded arrow, drawn as one
 * SVG path so the arrow keeps the same corner softness as the bubble instead
 * of being a hard CSS triangle.
 *
 * It renders into the body so it is never clipped by a card or a scrolling
 * rail, and it answers hover and keyboard focus alike.
 */
export function Tooltip({
  label,
  side = 'top',
  children,
}: {
  label: ReactNode
  side?: Side
  children: ReactElement<{
    onMouseEnter?: (e: React.MouseEvent) => void
    onMouseLeave?: (e: React.MouseEvent) => void
    onFocus?: (e: React.FocusEvent) => void
    onBlur?: (e: React.FocusEvent) => void
    'aria-describedby'?: string
  }>
}) {
  const [box, setBox] = useState<DOMRect | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const id = useId()

  const show = (e: React.MouseEvent | React.FocusEvent) => {
    const target = e.currentTarget as HTMLElement
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setBox(target.getBoundingClientRect()), 120)
  }

  const hide = () => {
    window.clearTimeout(timer.current)
    setBox(null)
  }

  const trigger = cloneElement(children, {
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    'aria-describedby': box ? id : undefined,
  })

  const position = () => {
    if (!box) return {}
    if (side === 'top') return { left: box.left + box.width / 2, top: box.top - OFFSET }
    if (side === 'bottom') return { left: box.left + box.width / 2, top: box.bottom + OFFSET }
    if (side === 'left') return { left: box.left - OFFSET, top: box.top + box.height / 2 }
    return { left: box.right + OFFSET, top: box.top + box.height / 2 }
  }

  const translate: Record<Side, string> = {
    top: 'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0)',
    left: 'translate(-100%, -50%)',
    right: 'translate(0, -50%)',
  }

  return (
    <>
      {trigger}
      {box &&
        createPortal(
          <div
            role="tooltip"
            id={id}
            className="pointer-events-none fixed z-[80] animate-pop-in"
            style={{ ...position(), transform: translate[side] }}
          >
            <div className="relative">
              <div className="max-w-[16rem] rounded-xl border border-ink-line bg-ink-card px-3 py-1.5 text-center text-xs font-semibold leading-snug text-white shadow-pop">
                {label}
              </div>
              <Arrow side={side} />
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

/** The rounded nub. Its tip is a curve, not a point. */
function Arrow({ side }: { side: Side }) {
  const placement: Record<Side, string> = {
    top: 'left-1/2 top-full -translate-x-1/2 -translate-y-px',
    bottom: 'left-1/2 bottom-full -translate-x-1/2 translate-y-px rotate-180',
    left: 'top-1/2 left-full -translate-y-1/2 -translate-x-px -rotate-90',
    right: 'top-1/2 right-full -translate-y-1/2 translate-x-px rotate-90',
  }

  return (
    <svg
      viewBox="0 0 16 8"
      width="16"
      height="8"
      aria-hidden="true"
      className={cn('absolute', placement[side])}
    >
      <path
        d="M0 0 H16 C12.5 0 11 1.2 9.4 4.6 C8.8 5.9 7.2 5.9 6.6 4.6 C5 1.2 3.5 0 0 0 Z"
        className="fill-ink-card stroke-ink-line"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}
