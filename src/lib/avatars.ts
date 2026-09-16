import { asset } from './asset'

/** Given out when somebody signs up without picking a picture. */
export const defaultAvatars = Array.from({ length: 8 }, (_, i) =>
  asset(`/brand/avatars/avatar${i + 1}.png`),
)

export const randomAvatar = () =>
  defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)]
