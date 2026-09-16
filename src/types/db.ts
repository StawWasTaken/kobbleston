export type SpaceCategory =
  | 'personal' | 'community' | 'interactive' | 'experiment' | 'story' | 'fan'

export type Profile = {
  id: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  is_online: boolean
  last_seen_at: string
  in_space_id: string | null
  is_moderator: boolean
  created_at: string
}

export type Space = {
  id: string
  owner_id: string
  slug: string
  name: string
  description: string | null
  category: SpaceCategory
  cover_url: string | null
  is_published: boolean
  visit_count: number
  like_count: number
  update_count: number
  published_at: string | null
  created_at: string
  updated_at: string
  owner?: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'is_online'>
}

export type PlatformStats = {
  total_visits: number
  published_spaces: number
  total_updates: number
  total_accounts: number
  people_online: number
}

export type ActivityEvent = {
  id: number
  kind: 'space_published' | 'space_updated' | 'space_entered' | 'user_joined'
  created_at: string
  actor_username: string
  actor_display_name: string
  actor_avatar_url: string | null
  space_id: string | null
  space_name: string | null
  space_slug: string | null
}

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked'

export type Friendship = {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  responded_at: string | null
}

export type Message = {
  id: number
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}

export type Notification = {
  id: number
  user_id: string
  kind: 'friend_request' | 'friend_accepted' | 'space_like' | 'space_visit' | 'message' | 'system'
  actor_id: string | null
  space_id: string | null
  body: string | null
  is_read: boolean
  created_at: string
  actor?: Pick<Profile, 'username' | 'display_name' | 'avatar_url'> | null
  space?: Pick<Space, 'name' | 'slug'> | null
}
