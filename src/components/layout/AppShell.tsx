import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Sidebar, SidebarContent } from './Sidebar'
import { Topbar } from './Topbar'
import { mobileNav } from './nav'
import { cn } from '@/lib/cn'

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-dvh bg-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      <Sidebar />
      <Topbar onOpenNav={() => setNavOpen(true)} />

      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setNavOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-64 animate-pop-in shadow-pop">
            <SidebarContent onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}

      <main id="main" className="pb-20 lg:pb-0 lg:pl-60">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-line bg-ink-raised/95 backdrop-blur lg:hidden"
        aria-label="Primary"
      >
        <ul className="flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {mobileNav.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors',
                    isActive ? 'text-white' : 'text-white/50',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'grid h-7 w-12 place-items-center rounded-lg text-base transition-colors',
                        isActive && 'bg-brand text-white',
                      )}
                    >
                      <FontAwesomeIcon icon={item.icon} />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export function Page({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8', className)}>{children}</div>
  )
}
