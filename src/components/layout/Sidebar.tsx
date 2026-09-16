import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { Logomark } from '@/components/brand/Wordmark'
import { Avatar } from '@/components/ui/Avatar'
import { StatusDot, presenceOf } from '@/components/ui/StatusDot'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import { primaryNav, secondaryNav } from './nav'
import type { NavItem } from './nav'

function Item({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
          isActive
            ? 'bg-white/15 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]'
            : 'text-white/65 hover:bg-white/10 hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'grid h-7 w-7 place-items-center rounded-lg text-[15px] transition-colors',
              isActive ? 'bg-brand text-white' : 'bg-white/5 text-white/70 group-hover:text-white',
            )}
          >
            <FontAwesomeIcon icon={item.icon} />
          </span>
          {item.label}
        </>
      )}
    </NavLink>
  )
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, signOut } = useAuth()

  return (
    <div className="flex h-full flex-col bg-brand-deep">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <Logomark className="h-6" />
        <span className="font-display text-sm font-extrabold uppercase tracking-[0.18em] text-white/80">
          Kobbleston
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 kob-scroll" aria-label="Main">
        {primaryNav.map((item) => (
          <Item key={item.to} item={item} onNavigate={onNavigate} />
        ))}
        <hr className="my-3 border-white/10" />
        {secondaryNav.map((item) => (
          <Item key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      {profile && (
        <div className="border-t border-white/10 p-3">
          <NavLink
            to={`/u/${profile.username}`}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/10"
          >
            <span className="relative">
              <Avatar src={profile.avatar_url} name={profile.display_name} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5">
                <StatusDot presence={presenceOf(profile)} size="sm" ring />
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{profile.display_name}</span>
              <span className="block truncate text-xs text-white/50">@{profile.username}</span>
            </span>
          </NavLink>
          <button
            onClick={signOut}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-white/55 transition-colors hover:bg-white/10 hover:text-white"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block" aria-label="Sidebar">
      <SidebarContent />
    </aside>
  )
}
