import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChartSimple, faCubes, faGaugeHigh, faInbox, faShapes, faUpload,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { cn } from '@/lib/cn'

export const createSections: { to: string; label: string; icon: IconDefinition; end?: boolean }[] = [
  { to: '/create', label: 'Overview', icon: faGaugeHigh, end: true },
  { to: '/create/spaces', label: 'My Spaces', icon: faCubes },
  { to: '/create/uploads', label: 'My Uploads', icon: faUpload },
  { to: '/create/marketplace', label: 'Marketplace', icon: faShapes },
  { to: '/create/requests', label: 'Requests', icon: faInbox },
  { to: '/create/analytics', label: 'Analytics', icon: faChartSimple },
]

/** The sections of Create, kept beside every one of its pages. */
export function CreateRail({ requestCount = 0 }: { requestCount?: number }) {
  return (
    <aside
      className="sticky top-14 hidden max-h-[calc(100dvh-3.5rem)] w-60 shrink-0 flex-col overflow-y-auto border-r border-ink-line px-3 pb-6 pt-4 lg:flex kob-scroll"
      aria-label="Kobbleston Create"
    >
      <p className="mb-2 px-2 font-display text-base font-extrabold">Create</p>

      {createSections.map((section) => (
        <NavLink
          key={section.to}
          to={section.to}
          end={section.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
              isActive ? 'bg-brand text-onbrand' : 'text-white/65 hover:bg-ink-hover hover:text-white',
            )
          }
        >
          <FontAwesomeIcon icon={section.icon} className="w-4 text-xs opacity-80" />
          <span className="flex-1">{section.label}</span>
          {section.label === 'Requests' && requestCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-onbrand px-1.5 text-[11px] font-extrabold text-brand-deep">
              {requestCount}
            </span>
          )}
        </NavLink>
      ))}
    </aside>
  )
}
