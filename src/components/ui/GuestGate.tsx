import { cloneElement } from 'react'
import type { ReactElement } from 'react'
import { Tooltip } from './Tooltip'
import { useAuth } from '@/hooks/useAuth'

/**
 * Wraps something a guest cannot do. The control stays visible but says why
 * it is unavailable, rather than vanishing and leaving a hole in the page.
 */
export function GuestGate({
  action,
  side = 'top',
  children,
}: {
  action: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  children: ReactElement<{ disabled?: boolean }>
}) {
  const { profile } = useAuth()
  if (!profile?.is_guest) return children

  return (
    <Tooltip label={`Guests cannot ${action}. Make an account and you can.`} side={side}>
      <span className="inline-flex">{cloneElement(children, { disabled: true })}</span>
    </Tooltip>
  )
}
