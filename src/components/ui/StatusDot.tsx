import { cn } from '@/lib/cn'

/**
 * Presence has two meanings on Kobbleston and they never share a colour:
 * blue means the person is on the platform, green means they are inside a
 * Space right now.
 */
export type Presence = 'online' | 'in-space' | 'offline'

const tone: Record<Presence, string> = {
  online: 'bg-brand text-brand',
  'in-space': 'bg-space text-space',
  offline: 'bg-white/25 text-transparent',
}

const label: Record<Presence, string> = {
  online: 'Online',
  'in-space': 'In a Space',
  offline: 'Offline',
}

const sizes = { sm: 'h-2 w-2', md: 'h-2.5 w-2.5', lg: 'h-3.5 w-3.5' }

export function presenceOf(p?: { is_online?: boolean; in_space_id?: string | null } | null): Presence {
  if (!p?.is_online) return 'offline'
  return p.in_space_id ? 'in-space' : 'online'
}

export function StatusDot({
  presence,
  size = 'md',
  ring,
  className,
}: {
  presence: Presence
  size?: keyof typeof sizes
  ring?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-block rounded-full',
        tone[presence],
        sizes[size],
        ring && 'ring-2 ring-ink-card',
        presence !== 'offline' && 'animate-pulse-ring',
        className,
      )}
      role="img"
      aria-label={label[presence]}
      title={label[presence]}
    />
  )
}

export function PresenceLabel({ presence }: { presence: Presence }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <StatusDot presence={presence} size="sm" />
      {label[presence]}
    </span>
  )
}
