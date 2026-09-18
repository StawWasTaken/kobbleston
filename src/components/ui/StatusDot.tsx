import { cn } from '@/lib/cn'

/**
 * Presence, in four states that never share a colour.
 *
 * Blue: on Kobbleston. Green: inside a Space, which is the colour Spaces
 * always get. Orange: building or making something, which is worth knowing
 * about somebody. Grey: not here.
 *
 * Anybody who has not said anything for a few minutes is treated as gone,
 * whatever their flag says, so a browser closed mid-sentence does not leave
 * somebody lit up for ever.
 */
export type Presence = 'online' | 'in-space' | 'building' | 'offline'

const tone: Record<Presence, string> = {
  online: 'bg-brand-bright',
  'in-space': 'bg-space',
  building: 'bg-[#FFB020]',
  offline: 'bg-white/30',
}

const label: Record<Presence, string> = {
  online: 'Online',
  'in-space': 'In a Space',
  building: 'Building',
  offline: 'Offline',
}

const sizes = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3.5 w-3.5',
  xl: 'h-5 w-5',
}

/** How long somebody can be quiet before they count as gone. */
const GONE_AFTER = 3 * 60 * 1000

export function presenceOf(p?: {
  is_online?: boolean
  in_space_id?: string | null
  activity?: string | null
  last_seen_at?: string | null
} | null): Presence {
  if (!p?.is_online) return 'offline'

  // The flag is only worth believing while it is fresh.
  if (p.last_seen_at && Date.now() - new Date(p.last_seen_at).getTime() > GONE_AFTER) {
    return 'offline'
  }

  if (p.in_space_id) return 'in-space'
  if (p.activity === 'building') return 'building'
  return 'online'
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
        // The ring is the page behind it, so the dot reads as sitting on the
        // edge of a picture rather than floating over it.
        ring && 'ring-[3px] ring-ink',
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
