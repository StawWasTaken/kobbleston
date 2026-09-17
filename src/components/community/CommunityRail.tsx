import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/States'
import { GuestGate } from '@/components/ui/GuestGate'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { listMemberCommunities } from '@/lib/api'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'

/** A row in the rail: emblem, name, how many are in it. */
function RailRow({
  slug, name, icon, members, note, active,
}: {
  slug: string
  name: string
  icon: string | null
  members: number
  note?: string
  active: boolean
}) {
  return (
    <Link
      to={`/c/${slug}`}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-2 py-2 transition-colors',
        active ? 'bg-brand/20' : 'hover:bg-ink-hover',
      )}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-deep text-xs font-extrabold">
        {icon ? <img src={icon} alt="" className="h-full w-full object-cover" /> : name.slice(0, 2).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-[#9fadff]">{name}</span>
        <span className="block text-xs text-muted">
          {formatCount(members)} members{note && ` · ${note}`}
        </span>
      </span>
    </Link>
  )
}

/**
 * The Communities you are in, kept beside every Community page so you can move
 * between them without going back to the browse page first.
 */
export function CommunityRail() {
  const { profile } = useAuth()
  const active = useLocation().pathname.match(/^\/c\/([^/]+)/)?.[1] ?? ''
  const [term, setTerm] = useState('')

  const mine = useAsync(
    async () => (profile ? listMemberCommunities(profile.id) : []),
    [profile?.id],
  )

  const shown = (mine.data ?? []).filter((c) =>
    c.name.toLowerCase().includes(term.trim().toLowerCase()))

  return (
    <aside
      className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 flex-col border-r border-ink-line bg-ink-raised/40 lg:flex"
      aria-label="My Communities"
    >
      <div className="px-4 pb-3 pt-5">
        <Link to="/communities" className="font-display text-lg font-extrabold hover:text-[#9fadff]">
          Communities
        </Link>
      </div>

      <div className="px-3 pb-3">
        <Input
          icon={faMagnifyingGlass}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search My Communities"
          aria-label="Search My Communities"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 kob-scroll">
        {mine.loading && (
          <div className="space-y-2 p-1">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}
          </div>
        )}

        {!mine.loading && !mine.data?.length && (
          <p className="px-3 py-6 text-center text-sm text-muted">
            You have not joined any yet.
          </p>
        )}

        {shown.map((community) => (
          <RailRow
            key={community.id}
            slug={community.slug}
            name={community.name}
            icon={community.icon_url}
            members={community.member_count}
            note={community.role === 'member' ? undefined : community.role}
            active={community.slug === active}
          />
        ))}
      </div>

      <div className="border-t border-ink-line p-3">
        <GuestGate action="make a Community">
          <Button variant="subtle" block to="/communities/new" disabled={!profile}>
            Create Community
          </Button>
        </GuestGate>
      </div>
    </aside>
  )
}

/** Rail on the left, the page itself beside it. Wraps every Community route. */
export function CommunityShell() {
  return (
    <div className="flex items-start">
      <CommunityRail />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
