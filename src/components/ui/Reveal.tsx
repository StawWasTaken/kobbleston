import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Grows a field into place the first time it becomes relevant, instead of
 * having the whole form sitting there from the start.
 */
export function Reveal({ when, children }: { when: boolean; children: ReactNode }) {
  const [rendered, setRendered] = useState(when)
  const [open, setOpen] = useState(false)
  const inner = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (when) {
      setRendered(true)
      const frame = requestAnimationFrame(() => setOpen(true))
      return () => cancelAnimationFrame(frame)
    }
    setOpen(false)
    const timer = window.setTimeout(() => setRendered(false), reduced ? 0 : 220)
    return () => window.clearTimeout(timer)
  }, [when, reduced])

  if (!rendered) return null

  return (
    <div
      className="overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-out"
      style={{
        maxHeight: open ? (inner.current?.scrollHeight ?? 400) + 12 : 0,
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0)' : 'translateY(-6px)',
      }}
    >
      <div ref={inner}>{children}</div>
    </div>
  )
}
