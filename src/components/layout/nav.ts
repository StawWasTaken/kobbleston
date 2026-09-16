import {
  faHouse, faCompass, faUserGroup, faBookmark, faGear, faShapes, faUser,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export type NavItem = {
  to: string
  label: string
  icon: IconDefinition
  end?: boolean
  /** 'friends' shows the number of pending friend requests. */
  badge?: 'friends'
}

/** Sections in the bar across the top. */
export const topNav: { to: string; label: string }[] = [
  { to: '/discover', label: 'Discover' },
  { to: '/create', label: 'Create' },
  { to: '/library', label: 'Library' },
]

/** The rail down the left. */
export const sideNav: NavItem[] = [
  { to: '/home', label: 'Home', icon: faHouse, end: true },
  { to: '/profile', label: 'Profile', icon: faUser },
  { to: '/friends', label: 'Friends', icon: faUserGroup, badge: 'friends' },
  { to: '/discover', label: 'Discover', icon: faCompass },
  { to: '/create', label: 'Create', icon: faShapes },
  { to: '/library', label: 'Library', icon: faBookmark },
  { to: '/settings', label: 'Settings', icon: faGear },
]

/** The five that fit a phone's bottom bar. */
export const mobileNav: NavItem[] = [
  sideNav[0], sideNav[3], sideNav[4], sideNav[2], sideNav[5],
]
