import {
  faHouse, faCompass, faUserGroup, faComments, faBookmark, faGear, faShapes,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export type NavItem = { to: string; label: string; icon: IconDefinition; end?: boolean }

export const primaryNav: NavItem[] = [
  { to: '/home', label: 'Home', icon: faHouse, end: true },
  { to: '/discover', label: 'Discover', icon: faCompass },
  { to: '/create', label: 'Create', icon: faShapes },
  { to: '/friends', label: 'Friends', icon: faUserGroup },
  { to: '/chat', label: 'Chat', icon: faComments },
  { to: '/library', label: 'Library', icon: faBookmark },
]

export const secondaryNav: NavItem[] = [
  { to: '/settings', label: 'Settings', icon: faGear },
]

/** The five that fit a phone's bottom bar. */
export const mobileNav: NavItem[] = [
  primaryNav[0], primaryNav[1], primaryNav[2], primaryNav[3], primaryNav[4],
]
