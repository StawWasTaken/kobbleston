import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from '@/components/ui/Tooltip'
import { cn } from '@/lib/cn'

/**
 * The verified mark: an account Kobbleston vouches for, and the content it
 * publishes.
 *
 * Every verified tick on the site comes from here, so the art is one change
 * in one place. It is Font Awesome's for now; a Kobbleston checkmark drops
 * straight in by replacing the body of Mark below.
 */
function Mark({ className }: { className?: string }) {
  return <FontAwesomeIcon icon={faCircleCheck} className={className} />
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
        <Mark className={cn('text-[0.9em]', className)} />
      </span>
    </Tooltip>
  )
}
