import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChartSimple, faCubes, faGaugeHigh, faInbox, faShapes, faUpload,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { cn } from '@/lib/cn'
import { Tooltip } from '@/components/ui/Tooltip'

export const createSections: {
  to: string
  label: string
  icon: IconDefinition
  end?: boolean
  note: string
}[] = [
  { to: '/create', label: 'Overview', icon: faGaugeHigh, end: true, note: 'Everything at a glance' },
  { to: '/create/spaces', label: 'My Spaces', icon: faCubes, note: 'The Spaces you build' },
  { to: '/create/uploads', label: 'My Uploads', icon: faUpload, note: 'What you have put into Create' },
  { to: '/create/marketplace', label: 'Marketplace', icon: faShapes, note: 'Everything anybody can build with' },
  { to: '/create/requests', label: 'Requests', icon: faInbox, note: 'People asking to use your work' },
  { to: '/create/analytics', label: 'Analytics', icon: faChartSimple, note: 'Views and uses, counted' },
]

/** The sections of Create, kept beside every one of its pages. */
export function CreateRail({ requestCount = 0 }: { requestCount?: number }) {
  return (
    <aside
      className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 flex-col overflow-y-auto border-r border-ink-line px-3 pb-6 pt-4 lg:flex kob-scroll"
      aria-label="Kobbleston Create"
    >
      <p className="mb-2 px-2 font-display text-base font-extrabold">Create</p>

      {createSections.map((section) => (
        <Tooltip key={section.to} label={section.note} side="right">
        <NavLink
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
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-extrabold text-white">
              {requestCount}
            </span>
          )}
        </NavLink>
        </Tooltip>
      ))}
    </aside>
  )
}
