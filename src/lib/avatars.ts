import { asset } from './asset'

/** Given out when somebody signs up without picking a picture. */
export const defaultAvatars = Array.from({ length: 8 }, (_, i) =>
  asset(`/brand/avatars/avatar${i + 1}.png`),
)

export const randomAvatar = () =>
  defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)]

/** Guests all wear the same face, so it is obvious who is passing through. */
export const guestAvatar = asset('/brand/guest-avatar.png')

/**
 * The picture to show for somebody. Guests get the guest avatar whatever is
 * stored against them, so a throwaway account cannot pass as a member.
 */
export function avatarOf(
  person?: { avatar_url?: string | null; is_guest?: boolean | null } | null,
): string | null {
  if (!person) return null
  return person.is_guest ? guestAvatar : person.avatar_url ?? null
}
