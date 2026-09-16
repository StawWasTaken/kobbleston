import { supabase } from './supabase'
import type {
  ActivityEvent, AssetKind, Friendship, MarketAsset, Message, Notification, OwnAsset,
  PlatformStats, Profile, Space, SpaceCategory,
} from '@/types/db'

const SPACE_FIELDS =
  'id, owner_id, slug, name, description, category, cover_url, is_published, visit_count, ' +
  'like_count, update_count, published_at, created_at, updated_at, ' +
  'owner:profiles!spaces_owner_id_fkey (id, username, display_name, avatar_url, is_online)'

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message)
  return result.data as T
}

// ------------------------------------------------------------------ public

export async function getPlatformStats(): Promise<PlatformStats> {
  const rows = unwrap(await supabase.rpc('platform_stats'))
  return (Array.isArray(rows) ? rows[0] : rows) as PlatformStats
}

export async function getRecentActivity(limit = 12): Promise<ActivityEvent[]> {
  return unwrap(await supabase.rpc('recent_activity', { limit_count: limit })) ?? []
}

// ------------------------------------------------------------------ spaces

export type SpaceSort = 'trending' | 'new' | 'popular'

export async function listSpaces(options: {
  sort?: SpaceSort
  category?: SpaceCategory | 'all'
  search?: string
  limit?: number
} = {}): Promise<Space[]> {
  const { sort = 'trending', category = 'all', search, limit = 24 } = options
  let query = supabase.from('spaces').select(SPACE_FIELDS).eq('is_published', true).limit(limit)

  if (category !== 'all') query = query.eq('category', category)
  if (search?.trim()) query = query.ilike('name', `%${search.trim()}%`)

  query = sort === 'new'
    ? query.order('published_at', { ascending: false })
    : sort === 'popular'
      ? query.order('like_count', { ascending: false })
      : query.order('visit_count', { ascending: false })

  return (unwrap(await query) as unknown as Space[]) ?? []
}

export async function listSpacesByOwner(ownerId: string, includeDrafts: boolean): Promise<Space[]> {
  let query = supabase.from('spaces').select(SPACE_FIELDS).eq('owner_id', ownerId)
  if (!includeDrafts) query = query.eq('is_published', true)
  return (unwrap(await query.order('updated_at', { ascending: false })) as unknown as Space[]) ?? []
}

export async function getSpace(username: string, slug: string): Promise<Space | null> {
  const owner = await getProfileByUsername(username)
  if (!owner) return null
  const { data, error } = await supabase
    .from('spaces').select(SPACE_FIELDS).eq('owner_id', owner.id).eq('slug', slug).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as Space | null) ?? null
}

export async function createSpace(input: {
  ownerId: string
  name: string
  slug: string
  description: string
  category: SpaceCategory
  publish: boolean
}): Promise<Space> {
  return unwrap(
    await supabase.from('spaces').insert({
      owner_id: input.ownerId,
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      category: input.category,
      is_published: input.publish,
    }).select(SPACE_FIELDS).single(),
  ) as Space
}

export async function logSpaceUpdate(spaceId: string, note: string) {
  unwrap(await supabase.from('space_updates').insert({ space_id: spaceId, note: note || null }).select('id').single())
}

export async function enterSpace(spaceId: string): Promise<{ visit_counted: boolean; visits: number }> {
  const rows = unwrap(await supabase.rpc('enter_space', { target: spaceId }))
  return (Array.isArray(rows) ? rows[0] : rows) as { visit_counted: boolean; visits: number }
}

export async function leaveSpace() {
  await supabase.rpc('leave_space')
}

export async function hasLiked(spaceId: string, userId: string) {
  const { data } = await supabase
    .from('space_likes').select('space_id').eq('space_id', spaceId).eq('user_id', userId).maybeSingle()
  return Boolean(data)
}

export async function setLiked(spaceId: string, userId: string, liked: boolean) {
  const result = liked
    ? await supabase.from('space_likes').insert({ space_id: spaceId, user_id: userId })
    : await supabase.from('space_likes').delete().eq('space_id', spaceId).eq('user_id', userId)
  if (result.error) throw new Error(result.error.message)
}

// ---------------------------------------------------------------- profiles

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles').select('*').ilike('username', username).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as Profile | null) ?? null
}

export async function searchProfiles(term: string, excludeId?: string): Promise<Profile[]> {
  if (!term.trim()) return []
  let query = supabase.from('profiles').select('*')
    .or(`username.ilike.%${term.trim()}%,display_name.ilike.%${term.trim()}%`).limit(12)
  if (excludeId) query = query.neq('id', excludeId)
  return (unwrap(await query) as Profile[]) ?? []
}

export async function updateProfile(id: string, patch: Partial<Pick<Profile,
  'display_name' | 'bio' | 'avatar_url' | 'username'>>) {
  unwrap(await supabase.from('profiles').update(patch).eq('id', id).select('id').single())
}

// ----------------------------------------------------------------- friends

export type FriendEdge = { friendship: Friendship; profile: Profile }

export async function listFriendships(userId: string): Promise<FriendEdge[]> {
  const rows = unwrap(await supabase.from('friendships').select('*')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order('created_at', { ascending: false })) as Friendship[]
  if (!rows?.length) return []

  const otherIds = rows.map((f) => (f.requester_id === userId ? f.addressee_id : f.requester_id))
  const profiles = unwrap(await supabase.from('profiles').select('*').in('id', otherIds)) as Profile[]
  const byId = new Map(profiles.map((p) => [p.id, p]))

  return rows.flatMap((friendship) => {
    const other = byId.get(friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id)
    return other ? [{ friendship, profile: other }] : []
  })
}

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  unwrap(await supabase.from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId }).select('id').single())
}

export async function respondToFriendRequest(id: string, accept: boolean) {
  if (!accept) {
    const { error } = await supabase.from('friendships').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return
  }
  unwrap(await supabase.from('friendships')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', id).select('id').single())
}

export async function removeFriendship(id: string) {
  const { error } = await supabase.from('friendships').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// -------------------------------------------------------------------- chat

export type ConversationSummary = {
  id: string
  last_message_at: string
  other: Profile
  lastMessage: string | null
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const memberships = unwrap(await supabase.from('conversation_members')
    .select('conversation_id').eq('user_id', userId)) as { conversation_id: string }[]
  if (!memberships?.length) return []

  const ids = memberships.map((m) => m.conversation_id)
  const [conversations, others, latest] = await Promise.all([
    supabase.from('conversations').select('id, last_message_at').in('id', ids)
      .order('last_message_at', { ascending: false }),
    supabase.from('conversation_members')
      .select('conversation_id, profiles:profiles!conversation_members_user_id_fkey (*)')
      .in('conversation_id', ids).neq('user_id', userId),
    supabase.from('messages').select('conversation_id, body, created_at')
      .in('conversation_id', ids).order('created_at', { ascending: false }).limit(200),
  ])

  const otherRows = (others.data ?? []) as unknown as
    { conversation_id: string; profiles: Profile }[]
  const profileByConversation = new Map(otherRows.map((r) => [r.conversation_id, r.profiles]))

  const lastByConversation = new Map<string, string>()
  for (const m of (latest.data ?? []) as { conversation_id: string; body: string }[]) {
    if (!lastByConversation.has(m.conversation_id)) lastByConversation.set(m.conversation_id, m.body)
  }

  return ((conversations.data ?? []) as { id: string; last_message_at: string }[]).flatMap((c) => {
    const other = profileByConversation.get(c.id)
    return other
      ? [{ id: c.id, last_message_at: c.last_message_at, other, lastMessage: lastByConversation.get(c.id) ?? null }]
      : []
  })
}

export async function startConversation(otherId: string): Promise<string> {
  return unwrap(await supabase.rpc('start_conversation', { other: otherId })) as string
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const rows = unwrap(await supabase.from('messages')
    .select('id, conversation_id, sender_id, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false }).limit(100)) as Message[]
  return (rows ?? []).reverse()
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  unwrap(await supabase.from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select('id, conversation_id, sender_id, body, created_at').single())
}

export async function markConversationRead(conversationId: string, userId: string) {
  await supabase.from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId).eq('user_id', userId)
}

// ----------------------------------------------------------- notifications

export async function listNotifications(userId: string): Promise<Notification[]> {
  return (unwrap(await supabase.from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey (username, display_name, avatar_url), ' +
      'space:spaces!notifications_space_id_fkey (name, slug)')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(40)) as unknown as Notification[]) ?? []
}

export async function markNotificationsRead(userId: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
}

// ------------------------------------------------------------- moderation

export async function submitReport(input: {
  reporterId: string
  targetType: 'profile' | 'space' | 'message'
  targetId: string
  reason: string
  details: string
}) {
  unwrap(await supabase.from('reports').insert({
    reporter_id: input.reporterId,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    details: input.details || null,
  }).select('id').single())
}

// ------------------------------------------------------- Kobbleston Create

export const assetBucket = 'uploads'

export function assetUrl(path: string) {
  return supabase.storage.from(assetBucket).getPublicUrl(path).data.publicUrl
}

export async function listAssets(options: {
  kind?: AssetKind | 'all'
  search?: string
  limit?: number
} = {}): Promise<MarketAsset[]> {
  const { kind = 'all', search, limit = 24 } = options
  return unwrap(await supabase.rpc('list_assets', {
    kind_filter: kind === 'all' ? null : kind,
    search: search?.trim() || null,
    limit_count: limit,
  })) ?? []
}

export async function listOwnAssets(userId: string): Promise<OwnAsset[]> {
  return (unwrap(await supabase.from('assets')
    .select('id, kind, name, description, file_path, status, review_note, byte_size, download_count, created_at')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })) as unknown as OwnAsset[]) ?? []
}

/**
 * Uploads the file, then records it as pending. Nothing the browser can call
 * sets a status, so an upload stays invisible until the review pipeline
 * approves it.
 */
export async function uploadAsset(input: {
  userId: string
  file: File
  kind: AssetKind
  name: string
  description: string
}): Promise<OwnAsset> {
  const extension = input.file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const path = `${input.userId}/${crypto.randomUUID()}.${extension}`

  const uploaded = await supabase.storage
    .from(assetBucket)
    .upload(path, input.file, { contentType: input.file.type, upsert: false })
  if (uploaded.error) throw new Error(uploaded.error.message)

  try {
    return unwrap(await supabase.from('assets').insert({
      creator_id: input.userId,
      kind: input.kind,
      name: input.name.trim(),
      description: input.description.trim() || null,
      file_path: path,
      byte_size: input.file.size,
    }).select('id, kind, name, description, file_path, status, review_note, byte_size, download_count, created_at')
      .single()) as unknown as OwnAsset
  } catch (err) {
    // Never leave a file in storage with no row pointing at it.
    await supabase.storage.from(assetBucket).remove([path])
    throw err
  }
}

export async function deleteAsset(id: string, filePath: string) {
  const { error } = await supabase.from('assets').delete().eq('id', id)
  if (error) throw new Error(error.message)
  await supabase.storage.from(assetBucket).remove([filePath])
}

// --------------------------------------------------------- profile picture

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const path = `${userId}/${Date.now()}.${extension}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { contentType: file.type, upsert: true })
  if (error) throw new Error(error.message)

  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}
