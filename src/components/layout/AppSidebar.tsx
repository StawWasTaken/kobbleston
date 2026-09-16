import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Avatar } from '@/components/ui/Avatar'
import { StatusDot, presenceOf } from '@/components/ui/StatusDot'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { sideNav } from './nav'

/** Pending friend requests waiting on an answer from this person. */
function useFriendRequestCount() {
  const { profile } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!profile) return
    let active = true

    const load = async () => {
      const { count: n } = await supabase
        .from('friendships')
        .select('id', { count: 'exact', head: true })
        .eq('addressee_id', profile.id)
        .eq('status', 'pending')
      if (active) setCount(n ?? 0)
    }
    load()

    const channel = supabase
      .channel(`friendships:${profile.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${profile.id}` },
        load)
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [profile])

  return count
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { profile } = useAuth()
  const requests = useFriendRequestCount()

  return (
    <div className="flex h-full flex-col bg-brand-deep">
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 kob-scroll" aria-label="Main">
        {sideNav.map((item) => {
          // Profile only makes sense once we know whose it is.
          const to = item.to === '/profile'
            ? (profile ? `/u/${profile.username}` : '/login')
            : item.to
          const badge = item.badge === 'friends' ? requests : 0

          return (
            <NavLink
              key={item.to}
              to={to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <FontAwesomeIcon icon={item.icon} className="w-5 text-[15px]" />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1.5 text-[11px] font-extrabold text-brand-deep">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {profile && (
        <NavLink
          to={`/u/${profile.username}`}
          onClick={onNavigate}
          className="flex items-center gap-3 border-t border-white/10 p-3 transition-colors hover:bg-white/10"
        >
          <span className="relative">
            <Avatar src={profile.avatar_url} name={profile.display_name} size="sm" />
            <span className="absolute -bottom-0.5 -right-0.5">
              <StatusDot presence={presenceOf(profile)} size="sm" ring />
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-white">{profile.display_name}</span>
            <span className="block truncate text-xs text-white/50">@{profile.username}</span>
          </span>
        </NavLink>
      )}
    </div>
  )
}

export function AppSidebar() {
  return (
    <aside className="fixed bottom-0 left-0 top-14 z-30 hidden w-56 lg:block" aria-label="Sidebar">
      <SidebarContent />
    </aside>
  )
}
