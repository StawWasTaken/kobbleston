import { Children } from 'react'
import type { ReactNode } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'

/**
 * A row that drifts sideways for as long as it is on the page.
 *
 * The run is laid out twice, so moving it by exactly one run's width puts it
 * back where it started and the loop has no seam. The ends are faded with a
 * mask rather than a painted gradient, so the row sits on whatever colour is
 * behind it without a visible edge, and nothing appears to be sliced off.
 *
 * Somebody who has asked for less motion gets a row they can push instead.
 */
export function Marquee({
  children, seconds = 60, reverse, className,
}: {
  children: ReactNode
  seconds?: number
  reverse?: boolean
  className?: string
}) {
  const still = useReducedMotion()
  const items = Children.toArray(children)
  if (!items.length) return null

  // A short run would show the same thing twice on one screen, so it is
  // repeated until there is enough to fill the width and keep going.
  const run = items.length >= 6 ? items : Array.from(
    { length: Math.ceil(6 / items.length) },
    () => items,
  ).flat()

  const fade = {
    WebkitMaskImage:
      'linear-gradient(to right, transparent, black 7rem, black calc(100% - 7rem), transparent)',
    maskImage:
      'linear-gradient(to right, transparent, black 7rem, black calc(100% - 7rem), transparent)',
  }

  if (still) {
    return (
      <div className={cn('flex gap-5 overflow-x-auto px-6 pb-3 kob-scroll', className)}>
        {items}
      </div>
    )
  }

  return (
    <div className={cn('group overflow-hidden py-2', className)} style={fade}>
      <div
        className="flex w-max items-start gap-5 animate-drift will-change-transform group-hover:[animation-play-state:paused]"
        style={{
          animationDuration: `${seconds}s`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        {run}
        {run.map((item, index) => (
          <div key={`again-${index}`} aria-hidden="true" className="contents">{item}</div>
        ))}
      </div>
    </div>
  )
}
