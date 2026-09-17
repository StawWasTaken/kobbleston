import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faBell } from '@fortawesome/free-solid-svg-icons'
import { Wordmark } from '@/components/brand/Wordmark'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { NotificationsPanel } from '@/components/social/NotificationsPanel'
import { SearchBar } from './SearchBar'
import { UserMenu } from './UserMenu'
import { PixelBalance } from './PixelBalance'
import { topNav } from './nav'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { avatarOf } from '@/lib/avatars'

export function AppTopbar({ onOpenNav }: { onOpenNav: () => void }) {
  const { profile } = useAuth()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!profile) return
    let active = true

    const count = async () => {
      const { count: n } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false)
      if (active) setUnread(n ?? 0)
    }
    count()

    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        count)
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [profile])

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14">
      {/* the brand sunburst runs the full width of the bar, sidebar included */}
      <div className="absolute inset-0 -z-10 bg-brand-deep">
        <img
          src={asset('/brand/topbar.png')}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-90"
        />
      </div>

      <div className="flex h-14 items-center gap-2 border-b-2 border-brand-ink px-3 sm:gap-4 sm:px-4">
        <button
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/85 transition-colors hover:bg-white/15 lg:hidden"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>

        <Wordmark to="/home" className="h-5 shrink-0" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Sections">
          {topNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-1.5 text-sm font-bold transition-colors',
                  isActive ? 'bg-white/20 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <SearchBar className="ml-auto w-full max-w-xs sm:max-w-sm lg:ml-4 lg:max-w-md" />

        <div className="ml-auto flex shrink-0 items-center gap-1 pl-1">
          {profile ? (
            <>
              {!profile.is_guest && <PixelBalance amount={profile.pixels} />}

              <Link
                to={`/u/${profile.username}`}
                className="hidden items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-white/15 sm:flex"
              >
                <Avatar src={avatarOf(profile)} name={profile.display_name} size="xs" />
                <span className="max-w-24 truncate text-sm font-bold text-white">
                  {profile.display_name}
                </span>
              </Link>

              <button
                onClick={() => setNotificationsOpen((v) => !v)}
                aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
                aria-expanded={notificationsOpen}
                className="relative grid h-9 w-9 place-items-center rounded-lg text-white/85 transition-colors hover:bg-white/15"
              >
                <FontAwesomeIcon icon={faBell} />
                {unread > 0 && (
                  <span className="absolute right-0.5 top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-space px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
            </>
          ) : (
            <Button size="sm" to="/signup">Sign Up</Button>
          )}

          {profile?.is_guest && (
            <Button size="sm" to="/signup" className="hidden sm:inline-flex">Make an account</Button>
          )}

          <UserMenu />
        </div>
      </div>

      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onReadAll={() => setUnread(0)}
      />
    </header>
  )
}
