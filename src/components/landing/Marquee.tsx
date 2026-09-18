import { Children } from 'react'
import type { ReactNode } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'

/**
 * A row that drifts sideways on its own, for showing work on the front page
 * without asking anybody to press anything. It holds still while the pointer
 * is on it, and never moves at all for somebody who has asked for less
 * motion: then it is an ordinary row you can push with your finger.
 */
export function Marquee({
  children, seconds = 48, reverse, className,
}: {
  children: ReactNode
  seconds?: number
  reverse?: boolean
  className?: string
}) {
  const still = useReducedMotion()
  const items = Children.toArray(children)

  if (still) {
    return (
      <div className={cn('flex gap-5 overflow-x-auto pb-2 kob-scroll', className)}>
        {items}
      </div>
    )
  }

  return (
    <div className={cn('group relative overflow-hidden', className)}>
      {/* The ends fade out, so things arrive and leave rather than appearing. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink to-transparent"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink to-transparent"
      />

      <div
        className="flex w-max gap-5 animate-drift group-hover:[animation-play-state:paused]"
        style={{
          animationDuration: `${seconds}s`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        {items}
        {/* The same run again, so the loop has nothing to jump over. */}
        {items.map((item, index) => (
          <div key={`again-${index}`} aria-hidden="true" className="contents">{item}</div>
        ))}
      </div>
    </div>
  )
}
