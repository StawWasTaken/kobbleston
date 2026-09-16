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
  is_admin: boolean
  is_guest: boolean
  pixels: number
  birth_date: string | null
  gender: 'male' | 'female' | 'other' | null
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
  chat_enabled: boolean
  chat_greeting: string | null
  chat_slowmode_seconds: number
  visit_count: number
  like_count: number
  favorite_count: number
  update_count: number
  published_at: string | null
  created_at: string
  updated_at: string
  owner?: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'is_online' | 'is_admin'>
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

export type AssetKind = 'image' | 'audio' | 'video' | 'font' | 'model'
export type ModerationStatus = 'pending' | 'approved' | 'rejected'

export type MarketAsset = {
  id: string
  kind: AssetKind
  name: string
  description: string | null
  file_path: string
  thumbnail_path: string | null
  download_count: number
  created_at: string
  creator_username: string
  creator_display_name: string
  creator_avatar_url: string | null
  creator_is_admin: boolean
}

export type OwnAsset = {
  id: string
  kind: AssetKind
  name: string
  description: string | null
  file_path: string
  status: ModerationStatus
  review_note: string | null
  byte_size: number
  download_count: number
  created_at: string
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

export type SpaceBadge = {
  id: string
  space_id: string
  name: string
  description: string | null
  icon_url: string | null
  is_enabled: boolean
  awarded_count: number
  created_at: string
}

export type EarnedBadge = {
  id: string
  name: string
  description: string | null
  icon_url: string | null
  awarded_at: string
  space_name: string
  space_slug: string
  space_owner: string
}

export type ProfileOverview = {
  follower_count: number
  following_count: number
  friend_count: number
  badge_count: number
}

export type CommunityRole = 'owner' | 'admin' | 'member'

export type Community = {
  id: string
  owner_id: string
  slug: string
  name: string
  description: string | null
  icon_url: string | null
  member_count: number
  created_at: string
}

export type MemberCommunity = {
  id: string
  slug: string
  name: string
  icon_url: string | null
  member_count: number
  role: CommunityRole
}

export type PixelTransaction = {
  id: number
  amount: number
  kind: 'signup_grant' | 'daily' | 'purchase' | 'sale' | 'refund' | 'admin'
  note: string | null
  created_at: string
}

export type SpaceMessage = {
  id: number
  space_id: string
  sender_id: string
  body: string
  created_at: string
  sender?: Pick<Profile, 'username' | 'display_name' | 'avatar_url' | 'is_admin'> | null
}

export type ConversationMember = Pick<
  Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'is_online' | 'in_space_id'
>

export type Conversation = {
  id: string
  title: string | null
  is_group: boolean
  last_message_at: string
  last_message: string | null
  unread_count: number
  members: ConversationMember[]
}
