import { Tooltip } from '@/components/ui/Tooltip'
import { cn } from '@/lib/cn'

/**
 * The verified mark: an account Kobbleston vouches for, and the content it
 * publishes.
 *
 * Drawn here rather than taken from an icon set, so the tick has the same
 * flat geometry and blunt ends as the rest of the brand. Every verified tick
 * on the site comes from this one component.
 */
export function VerifiedMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={cn('inline-block h-[1em] w-[1em] align-[-0.125em]', className)}
    >
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path
        d="M6.9 12.3 L10.4 15.8 L17.1 8.7"
        fill="none"
        stroke="#fff"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Verified({
  label = 'Verified by Kobbleston',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <Tooltip label={label} side="top">
      <span className="inline-flex shrink-0 align-middle text-[#4d68ff]" aria-label={label}>
        <VerifiedMark className={className} />
      </span>
    </Tooltip>
  )
}
