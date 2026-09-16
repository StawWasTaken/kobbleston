import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faBell, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { Wordmark } from '@/components/brand/Wordmark'
import { Avatar } from '@/components/ui/Avatar'
import { NotificationsPanel } from '@/components/social/NotificationsPanel'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export function Topbar({ onOpenNav }: { onOpenNav: () => void }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const bellRef = useRef<HTMLButtonElement>(null)

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

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (term.trim()) navigate(`/discover?q=${encodeURIComponent(term.trim())}`)
  }

  return (
    <header className="sticky top-0 z-30 h-14 lg:pl-60">
      {/* topbar.png is a wide brand sunburst; it anchors the bar to the
          sidebar colour instead of sitting on top as a loose image */}
      <div className="absolute inset-y-0 right-0 left-0 -z-10 bg-brand-deep lg:left-60">
        <img
          src="/brand/topbar.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/35" />
      </div>

      <div className="flex h-14 items-center gap-3 border-b border-black/40 px-3 sm:px-5">
        <button
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="grid h-9 w-9 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/15 lg:hidden"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>

        <Wordmark to="/home" className="h-4 lg:hidden" />

        <form onSubmit={submitSearch} className="relative ml-auto w-full max-w-md lg:ml-0" role="search">
          <label htmlFor="platform-search" className="sr-only">Search Spaces</label>
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/45"
          />
          <input
            id="platform-search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search Spaces and people"
            className="h-9 w-full rounded-xl border border-white/15 bg-black/25 pl-9 pr-3 text-sm text-white placeholder:text-white/40 transition-colors focus:border-white/40 focus:bg-black/40"
          />
        </form>

        <div className="ml-auto flex items-center gap-1.5 pl-2">
          <button
            ref={bellRef}
            onClick={() => setNotificationsOpen((v) => !v)}
            aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
            aria-expanded={notificationsOpen}
            className="relative grid h-9 w-9 place-items-center rounded-lg text-white/85 transition-colors hover:bg-white/15"
          >
            <FontAwesomeIcon icon={faBell} />
            {unread > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-[1rem] place-items-center rounded-full bg-space px-1 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {profile && (
            <a href={`/u/${profile.username}`} className="rounded-full" aria-label="Your profile">
              <Avatar src={profile.avatar_url} name={profile.display_name} size="sm" />
            </a>
          )}
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
