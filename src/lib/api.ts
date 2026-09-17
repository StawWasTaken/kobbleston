import { supabase } from './supabase'
import type {
  ActivityEvent, AssetKind, Community, EarnedBadge, Friendship, MarketAsset,
  MemberCommunity, Message, Notification, OwnAsset, PixelTransaction, PlatformStats, Profile,
  ProfileOverview, Space, SpaceBadge, SpaceCategory, SpaceMessage, SpaceStats, Conversation,
  CommunityMember, CommunityOverview, CommunityPost, CommunityRank, CommunityRequest,
  CommunityRelation, CommunityBan, CommunityAuditEntry,
  AssetPageItem, AssetDay, CreatorAssetRow, Collaborator, UsernameRecord,
  AssetRequest, OwnedAsset, AssetReview, CreatorPage,
  CommunityEvent, EventPage, EventAttendee, BuildTarget,
} from '@/types/db'

const SPACE_FIELDS =
  'id, owner_id, slug, name, description, category, cover_url, is_published, visit_count, ' +
  'like_count, favorite_count, dislike_count, update_count, published_at, created_at, updated_at, ' +
  'emblem_url, thumbnail_urls, genre, content_id, ' +
  'chat_enabled, chat_greeting, chat_slowmode_seconds, ' +
  'owner:profiles!spaces_owner_id_fkey (id, username, display_name, avatar_url, is_online, is_admin, is_guest)'

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

/** The name behind a number, for a link like /u/1042/stawrer. */
export async function usernameById(contentId: number): Promise<string | null> {
  return (unwrap(await supabase.rpc('username_by_id', { target: contentId })) as string | null) ?? null
}

export async function spaceById(contentId: number): Promise<{ owner_username: string; slug: string } | null> {
  const rows = unwrap(await supabase.rpc('space_by_id', { target: contentId })) as
    { owner_username: string; slug: string }[]
  return rows?.[0] ?? null
}

export async function communitySlugById(contentId: number): Promise<string | null> {
  return (unwrap(await supabase.rpc('community_by_id', { target: contentId })) as string | null) ?? null
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles').select('*').ilike('username', username).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as Profile | null) ?? null
}

/**
 * Everyone matches, yourself included: People is a directory, not a list of
 * strangers, so searching your own name has to find you. Friends passes
 * `excludeId` because you cannot befriend yourself.
 */
export async function searchProfiles(
  term: string, excludeId?: string, limit = 12,
): Promise<Profile[]> {
  if (!term.trim()) return []
  let query = supabase.from('profiles').select('*')
    .or(`username.ilike.%${term.trim()}%,display_name.ilike.%${term.trim()}%`)
    .order('username').limit(limit)
  if (excludeId) query = query.neq('id', excludeId)
  return (unwrap(await query) as Profile[]) ?? []
}

/** What a name change costs. The database charges it; this is for the copy. */
export const USERNAME_CHANGE_COST = 250

export async function changeUsername(name: string): Promise<string> {
  return unwrap(await supabase.rpc('change_username', { new_name: name })) as string
}

export async function usernameHistory(userId: string): Promise<UsernameRecord[]> {
  return (unwrap(await supabase.rpc('username_history_of', { target: userId })) as UsernameRecord[]) ?? []
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

export async function startConversation(otherId: string): Promise<string> {
  return unwrap(await supabase.rpc('start_conversation', { other: otherId })) as string
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const rows = unwrap(await supabase.from('messages')
    .select('id, conversation_id, sender_id, body, created_at, edited_at, is_removed')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false }).limit(100)) as Message[]
  return (rows ?? []).reverse()
}

export async function editMessage(id: number, body: string) {
  unwrap(await supabase.from('messages').update({ body: body.trim() })
    .eq('id', id).select('id').single())
}

export async function deleteMessage(id: number) {
  unwrap(await supabase.from('messages').update({ is_removed: true })
    .eq('id', id).select('id').single())
}

/**
 * Everyone you can talk to, whether or not you have yet. Friends with an
 * existing conversation carry it; the rest open one on first message.
 */
export async function chatRoster(): Promise<Conversation[]> {
  const [conversations, edges] = await Promise.all([
    myConversations(),
    supabase.auth.getUser().then(({ data }) =>
      data.user ? listFriendships(data.user.id) : []),
  ])

  const spokenTo = new Set(
    conversations.flatMap((c) => (c.is_group ? [] : c.members.map((m) => m.id))),
  )

  const quiet = edges
    .filter((edge) => edge.friendship.status === 'accepted' && !spokenTo.has(edge.profile.id))
    .map<Conversation>((edge) => ({
      id: `friend:${edge.profile.id}`,
      title: null,
      is_group: false,
      last_message_at: edge.friendship.created_at,
      last_message: null,
      unread_count: 0,
      members: [{
        id: edge.profile.id,
        username: edge.profile.username,
        display_name: edge.profile.display_name,
        avatar_url: edge.profile.avatar_url,
        is_online: edge.profile.is_online,
        in_space_id: edge.profile.in_space_id,
      }],
    }))

  return [...conversations, ...quiet]
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
    .select('*, actor:profiles!notifications_actor_id_fkey (username, display_name, avatar_url, is_guest), ' +
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

/**
 * Uploads live in a private bucket, so there is no lasting link to a file.
 * A preview asks for a short-lived signed URL instead, and only gets one for
 * content that is listed or for your own files.
 *
 * This keeps the file from being addressable. It cannot stop a browser from
 * showing a picture it has been given, and nothing here pretends it can:
 * what protects the work is that using it in a Space goes through the
 * permission check, not that the pixels are unreachable.
 */
export async function assetUrl(path: string, seconds = 900): Promise<string | null> {
  const { data } = await supabase.storage.from(assetBucket).createSignedUrl(path, seconds)
  return data?.signedUrl ?? null
}

/**
 * A Space stores a reference, not a file: "kob://IMG-1042". Resolving one
 * looks the item up and asks for a short-lived link to show it. The answers
 * are kept for the life of the page so a grid of tiles does not ask twice
 * for the same thing.
 */
const refCache = new Map<string, Promise<string | null>>()

export const isAssetRef = (value?: string | null): value is string =>
  typeof value === 'string' && value.startsWith('kob://')

export function assetRefTag(value: string) {
  return value.replace('kob://', '').toUpperCase()
}

export function resolveAssetRef(value: string): Promise<string | null> {
  const cached = refCache.get(value)
  if (cached) return cached

  const work = (async () => {
    const number = Number(assetRefTag(value).split('-')[1])
    if (!Number.isFinite(number)) return null
    const path = await resolveOwnedRef(number)
    if (!path) return null
    return assetUrl(path, 3600)
  })()

  refCache.set(value, work)
  return work
}

export async function rateAsset(assetId: string, up: boolean | null) {
  const { data: session } = await supabase.auth.getUser()
  const me = session.user?.id
  if (!me) throw new Error('Sign in first.')

  if (up === null) {
    unwrap(await supabase.from('asset_ratings').delete()
      .eq('asset_id', assetId).eq('user_id', me).select('asset_id'))
    return
  }
  unwrap(await supabase.from('asset_ratings')
    .upsert({ asset_id: assetId, user_id: me, up }, { onConflict: 'asset_id,user_id' })
    .select('asset_id').single())
}

export async function listAssetReviews(assetId: string): Promise<AssetReview[]> {
  return (unwrap(await supabase.rpc('asset_reviews_of', { target: assetId })) as AssetReview[]) ?? []
}

export async function writeAssetReview(assetId: string, body: string) {
  const { data: session } = await supabase.auth.getUser()
  const me = session.user?.id
  if (!me) throw new Error('Sign in first.')
  unwrap(await supabase.from('asset_reviews')
    .upsert({ asset_id: assetId, user_id: me, body: body.trim() }, { onConflict: 'asset_id,user_id' })
    .select('id').single())
}

export async function removeAssetReview(id: string) {
  unwrap(await supabase.from('asset_reviews').delete().eq('id', id).select('id'))
}

/** Other things the same person has made, for the row under an item. */
export async function listAssetsByCreator(creatorId: string, exceptId?: string): Promise<MarketAsset[]> {
  return (unwrap(await supabase.rpc('assets_by_creator', {
    target: creatorId, except_id: exceptId ?? null, limit_count: 12,
  })) as MarketAsset[]) ?? []
}

/**
 * A reference only resolves for somebody who has the thing. The id in an
 * address bar is just a number: without it being in your inventory, this
 * answers with nothing.
 */
export async function resolveOwnedRef(contentId: number): Promise<string | null> {
  const rows = unwrap(await supabase.rpc('resolve_asset_ref', {
    target_content_id: contentId,
  })) as { file_path: string }[]
  return rows?.[0]?.file_path ?? null
}

/** Putting content into a Space you own. Checked once, at that moment. */
export async function useAssetInSpace(spaceId: string, contentId: number): Promise<string> {
  return unwrap(await supabase.rpc('use_asset_in_space', {
    space: spaceId, target_content_id: contentId,
  })) as string
}

/** The file behind a reference a Space is already using, for its visitors. */
export async function spaceAssetPath(spaceId: string, contentId: number): Promise<string | null> {
  return (unwrap(await supabase.rpc('space_asset_path', {
    space: spaceId, target_content_id: contentId,
  })) as string | null) ?? null
}

export async function dropFromInventory(assetId: string) {
  unwrap(await supabase.rpc('drop_from_inventory', { target: assetId }))
}

export async function requestAssetUse(assetId: string, note: string) {
  const { data: session } = await supabase.auth.getUser()
  const me = session.user?.id
  if (!me) throw new Error('Sign in first.')
  unwrap(await supabase.from('asset_grants')
    .insert({ asset_id: assetId, user_id: me, note: note.trim() || null })
    .select('asset_id').single())
}

export async function withdrawAssetRequest(assetId: string) {
  const { data: session } = await supabase.auth.getUser()
  unwrap(await supabase.from('asset_grants').delete()
    .eq('asset_id', assetId).eq('user_id', session.user?.id ?? '').select('asset_id'))
}

export async function answerAssetRequest(assetId: string, asker: string, accept: boolean) {
  unwrap(await supabase.rpc('answer_asset_request', { target: assetId, asker, accept }))
}

export async function listAssetRequests(): Promise<AssetRequest[]> {
  return (unwrap(await supabase.rpc('asset_requests_for_me')) as AssetRequest[]) ?? []
}

/** Everything in your inventory: your own, verified, and what you have taken. */
export async function listInventory(kind?: AssetKind): Promise<OwnedAsset[]> {
  return (unwrap(await supabase.rpc('my_inventory', {
    kind_filter: kind ?? null,
  })) as OwnedAsset[]) ?? []
}

export type AssetSort = 'new' | 'used' | 'rated' | 'cheap'

export async function listAssets(options: {
  kind?: AssetKind | 'all'
  search?: string
  limit?: number
  sort?: AssetSort
  creator?: string
} = {}): Promise<MarketAsset[]> {
  const { kind = 'all', search, limit = 24, sort = 'new', creator } = options
  return unwrap(await supabase.rpc('list_assets', {
    kind_filter: kind === 'all' ? null : kind,
    search: search?.trim() || null,
    limit_count: limit,
    sort,
    creator: creator ?? null,
  })) ?? []
}

/** The most somebody may charge for each kind of thing. */
export const priceCeilings: Record<AssetKind, number> = {
  image: 100, audio: 250, video: 500, font: 300, model: 750,
}

export async function buyAsset(assetId: string) {
  unwrap(await supabase.rpc('buy_asset', { target: assetId }))
}

export async function getCreatorPage(username: string): Promise<CreatorPage | null> {
  const rows = unwrap(await supabase.rpc('creator_page', { target: username })) as CreatorPage[]
  return rows?.[0] ?? null
}

export async function listOwnAssets(userId: string): Promise<OwnAsset[]> {
  return (unwrap(await supabase.from('assets')
    .select('id, kind, name, description, file_path, status, review_note, byte_size, download_count, content_id, is_public, created_at')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })) as unknown as OwnAsset[]) ?? []
}

/** One upload with its creator, looked up by the number it carries. */
export async function getAsset(contentId: number): Promise<AssetPageItem | null> {
  const rows = unwrap(await supabase.rpc('get_asset', { target_content_id: contentId })) as AssetPageItem[]
  return rows?.[0] ?? null
}

/**
 * A view or a download. Counts, never who: the creator needs to know their
 * work is being used, not who looked at it.
 */
export async function recordAssetEvent(assetId: string, kind: 'view' | 'use') {
  await supabase.rpc('record_asset_event', { target: assetId, event_kind: kind })
}

export async function assetAnalytics(assetId: string): Promise<AssetDay[]> {
  return (unwrap(await supabase.rpc('asset_analytics', { target: assetId })) as AssetDay[]) ?? []
}

export async function creatorAnalytics(userId: string): Promise<CreatorAssetRow[]> {
  return (unwrap(await supabase.rpc('creator_analytics', { target: userId })) as CreatorAssetRow[]) ?? []
}

/**
 * A creator may rename, re-describe and unlist their own upload. Everything
 * else on the row is pinned by the database, so this cannot publish anything.
 */
export async function updateAsset(id: string, patch: {
  name?: string
  description?: string | null
  is_public?: boolean
  price?: number
}) {
  unwrap(await supabase.from('assets').update(patch).eq('id', id).select('id').single())
}

// ------------------------------------------------------- Space collaborators

export async function listCollaborators(spaceId: string): Promise<Collaborator[]> {
  return (unwrap(await supabase.rpc('space_collaborators_list', { target: spaceId })) as Collaborator[]) ?? []
}

export async function addCollaborator(spaceId: string, userId: string) {
  unwrap(await supabase.from('space_collaborators')
    .insert({ space_id: spaceId, user_id: userId }).select('space_id').single())
}

export async function removeCollaborator(spaceId: string, userId: string) {
  unwrap(await supabase.from('space_collaborators').delete()
    .eq('space_id', spaceId).eq('user_id', userId).select('space_id'))
}

/** Spaces somebody else owns that you have been asked to work on. */
export async function listSharedSpaces(): Promise<Space[]> {
  return (unwrap(await supabase.rpc('spaces_shared_with_me')) as Space[]) ?? []
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
  /** Set when the upload is being made for a Community rather than a person. */
  communityId?: string | null
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
      community_id: input.communityId ?? null,
    }).select('id, kind, name, description, file_path, status, review_note, byte_size, download_count, content_id, is_public, created_at')
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

// ------------------------------------------------------------- favourites

export async function isFavorite(spaceId: string, userId: string) {
  const { data } = await supabase
    .from('space_favorites').select('space_id')
    .eq('space_id', spaceId).eq('user_id', userId).maybeSingle()
  return Boolean(data)
}

export async function setFavorite(spaceId: string, userId: string, on: boolean) {
  const result = on
    ? await supabase.from('space_favorites').insert({ space_id: spaceId, user_id: userId })
    : await supabase.from('space_favorites').delete().eq('space_id', spaceId).eq('user_id', userId)
  if (result.error) throw new Error(result.error.message)
}

export async function listFavoriteSpaces(userId: string): Promise<Space[]> {
  const { data: rows } = await supabase
    .from('space_favorites').select('space_id').eq('user_id', userId)
  const ids = (rows ?? []).map((r) => r.space_id)
  if (!ids.length) return []
  return (unwrap(await supabase.from('spaces').select(SPACE_FIELDS)
    .in('id', ids).eq('is_published', true)) as unknown as Space[]) ?? []
}

// ----------------------------------------------------------------- follows

export async function isFollowing(followerId: string, followingId: string) {
  const { data } = await supabase
    .from('follows').select('follower_id')
    .eq('follower_id', followerId).eq('following_id', followingId).maybeSingle()
  return Boolean(data)
}

/** People you follow, and people who follow you. */
export async function listFollows(userId: string, side: 'followers' | 'following'): Promise<Profile[]> {
  const column = side === 'followers' ? 'following_id' : 'follower_id'
  const other = side === 'followers' ? 'follower_id' : 'following_id'
  const rows = unwrap(await supabase.from('follows').select(other).eq(column, userId)) as
    Record<string, string>[]
  const ids = (rows ?? []).map((row) => row[other])
  if (!ids.length) return []
  return (unwrap(await supabase.from('profiles').select('*').in('id', ids)) as Profile[]) ?? []
}

export async function setFollowing(followerId: string, followingId: string, on: boolean) {
  const result = on
    ? await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId })
    : await supabase.from('follows').delete()
        .eq('follower_id', followerId).eq('following_id', followingId)
  if (result.error) throw new Error(result.error.message)
}

// ------------------------------------------------------------------ badges

export async function listSpaceBadges(spaceId: string): Promise<SpaceBadge[]> {
  return (unwrap(await supabase.from('space_badges').select('*')
    .eq('space_id', spaceId).order('created_at')) as unknown as SpaceBadge[]) ?? []
}

export async function createSpaceBadge(input: {
  spaceId: string
  name: string
  description: string
  iconUrl: string | null
}): Promise<SpaceBadge> {
  return unwrap(await supabase.from('space_badges').insert({
    space_id: input.spaceId,
    name: input.name.trim(),
    description: input.description.trim() || null,
    icon_url: input.iconUrl,
  }).select('*').single()) as unknown as SpaceBadge
}

export async function updateSpaceBadge(id: string, patch: Partial<Pick<SpaceBadge,
  'name' | 'description' | 'is_enabled' | 'icon_url'>>) {
  unwrap(await supabase.from('space_badges').update(patch).eq('id', id).select('id').single())
}

export async function deleteSpaceBadge(id: string) {
  const { error } = await supabase.from('space_badges').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Only the Space owner can award, enforced in the database. */
export async function awardBadge(badgeId: string, recipientId: string): Promise<boolean> {
  return unwrap(await supabase.rpc('award_badge', { badge: badgeId, recipient: recipientId })) as boolean
}

export async function listEarnedBadges(userId: string): Promise<EarnedBadge[]> {
  return unwrap(await supabase.rpc('earned_badges', { target: userId })) ?? []
}

// ------------------------------------------------------------- communities

export async function getProfileOverview(userId: string): Promise<ProfileOverview> {
  const rows = unwrap(await supabase.rpc('profile_overview', { target: userId }))
  return (Array.isArray(rows) ? rows[0] : rows) as ProfileOverview
}

export async function listMemberCommunities(userId: string): Promise<MemberCommunity[]> {
  return unwrap(await supabase.rpc('member_communities', { target: userId })) ?? []
}

export async function listCommunities(search?: string): Promise<Community[]> {
  let query = supabase.from('communities').select('*')
    .eq('is_public', true).order('member_count', { ascending: false }).limit(40)
  if (search?.trim()) query = query.ilike('name', `%${search.trim()}%`)
  return (unwrap(await query) as unknown as Community[]) ?? []
}

export async function getCommunity(slug: string): Promise<Community | null> {
  const { data, error } = await supabase
    .from('communities').select('*').eq('slug', slug).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as Community | null) ?? null
}

// --------------------------------------------------------- community events

export async function listCommunityEvents(
  communityId: string, upcomingOnly = false,
): Promise<CommunityEvent[]> {
  return (unwrap(await supabase.rpc('community_events_list', {
    target: communityId, upcoming_only: upcomingOnly,
  })) as CommunityEvent[]) ?? []
}

export async function getEvent(contentId: number): Promise<EventPage | null> {
  const rows = unwrap(await supabase.rpc('event_by_id', { target: contentId })) as EventPage[]
  return rows?.[0] ?? null
}

export async function listEventAttendees(eventId: string): Promise<EventAttendee[]> {
  return (unwrap(await supabase.rpc('event_attendees', {
    target: eventId, limit_count: 24,
  })) as EventAttendee[]) ?? []
}

export async function setEventAttendance(eventId: string, going: boolean) {
  unwrap(await supabase.rpc('set_event_attendance', { target: eventId, going }))
}

export async function saveEvent(input: {
  id?: string
  community_id: string
  title: string
  subtitle: string | null
  description: string | null
  cover_url: string | null
  starts_at: string
  ends_at: string | null
}) {
  if (input.id) {
    const { id, ...patch } = input
    unwrap(await supabase.from('community_events').update(patch).eq('id', id).select('id').single())
    return
  }
  unwrap(await supabase.from('community_events').insert(input).select('id').single())
}

export async function cancelEvent(id: string, cancelled: boolean) {
  unwrap(await supabase.from('community_events')
    .update({ is_cancelled: cancelled }).eq('id', id).select('id').single())
}

export async function deleteEvent(id: string) {
  unwrap(await supabase.from('community_events').delete().eq('id', id).select('id'))
}

// ----------------------------------------------- making things for a Community

/** The Communities you are allowed to make things for. */
export async function listBuildTargets(): Promise<BuildTarget[]> {
  return (unwrap(await supabase.rpc('communities_i_build_for')) as BuildTarget[]) ?? []
}

/** A Community's uploads, drafts and all, for the people who run it. */
export async function listCommunityUploads(communityId: string): Promise<OwnAsset[]> {
  return (unwrap(await supabase.rpc('community_uploads', {
    target: communityId,
  })) as OwnAsset[]) ?? []
}

export async function communityAnalytics(communityId: string): Promise<CreatorAssetRow[]> {
  return (unwrap(await supabase.rpc('community_analytics', {
    target: communityId,
  })) as CreatorAssetRow[]) ?? []
}

export async function listCommunitySpacesManaged(communityId: string): Promise<Space[]> {
  return (unwrap(await supabase.rpc('community_spaces_managed', {
    target: communityId,
  })) as unknown as Space[]) ?? []
}

export async function listCommunityAssets(communityId: string): Promise<MarketAsset[]> {
  return (unwrap(await supabase.rpc('community_assets', {
    target: communityId, limit_count: 40,
  })) as MarketAsset[]) ?? []
}

/** Making a Space for a Community, from Create, as that Community. */
export async function buildSpaceForCommunity(spaceId: string, communityId: string) {
  unwrap(await supabase.rpc('link_space_to_community', { space: spaceId, community: communityId }))
}

export async function listPixelTransactions(userId: string): Promise<PixelTransaction[]> {
  return (unwrap(await supabase.from('pixel_transactions')
    .select('id, amount, kind, note, created_at')
    .eq('user_id', userId).order('created_at', { ascending: false })
    .limit(30)) as unknown as PixelTransaction[]) ?? []
}

// -------------------------------------------------------------- space chat

export async function listSpaceMessages(spaceId: string): Promise<SpaceMessage[]> {
  const rows = unwrap(await supabase.from('space_messages')
    .select('id, space_id, sender_id, body, created_at, ' +
      'sender:profiles!space_messages_sender_id_fkey (username, display_name, avatar_url, is_admin, is_guest)')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false }).limit(50)) as unknown as SpaceMessage[]
  return (rows ?? []).reverse()
}

export async function sendSpaceMessage(spaceId: string, senderId: string, body: string) {
  unwrap(await supabase.from('space_messages')
    .insert({ space_id: spaceId, sender_id: senderId, body })
    .select('id').single())
}

export async function updateSpaceChatSettings(spaceId: string, patch: {
  chat_enabled?: boolean
  chat_greeting?: string | null
  chat_slowmode_seconds?: number
}) {
  unwrap(await supabase.from('spaces').update(patch).eq('id', spaceId).select('id').single())
}

// ------------------------------------------------------------- moderation

/** Checks a username before signup bothers submitting it. */
export async function checkUsername(candidate: string): Promise<{ ok: boolean; reason: string | null }> {
  const rows = unwrap(await supabase.rpc('check_username', { candidate }))
  return (Array.isArray(rows) ? rows[0] : rows) as { ok: boolean; reason: string | null }
}

/**
 * Signs in with a username. The lookup from username to email runs in the
 * `login` edge function behind the service role key, so nothing here can be
 * used to harvest addresses.
 */
export async function signInWithUsername(username: string, password: string) {
  const { data, error } = await supabase.functions.invoke('login', {
    body: { username, password },
  })

  if (error) {
    // The function returns its own message in the body on a refusal.
    const detail = await (error as { context?: Response }).context?.json?.().catch(() => null)
    throw new Error(detail?.error ?? 'Wrong username or password.')
  }

  const { access_token, refresh_token } = data as { access_token: string; refresh_token: string }
  const applied = await supabase.auth.setSession({ access_token, refresh_token })
  if (applied.error) throw new Error(applied.error.message)
  return applied.data.session
}

// -------------------------------------------------------------- group chat

export async function myConversations(): Promise<Conversation[]> {
  return (unwrap(await supabase.rpc('my_conversations')) as Conversation[]) ?? []
}

export async function createGroupConversation(title: string, memberIds: string[]): Promise<string> {
  return unwrap(await supabase.rpc('create_group_conversation', {
    title: title.trim(),
    members: memberIds,
  })) as string
}

/** What a conversation is called when it has no name of its own. */
export function conversationName(conversation: Conversation) {
  if (conversation.title) return conversation.title
  const names = conversation.members.map((m) => m.display_name)
  if (!names.length) return 'Empty chat'
  if (names.length <= 2) return names.join(' and ')
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`
}

// ------------------------------------------------------- community details

export async function getCommunityOverview(communityId: string): Promise<CommunityOverview> {
  const rows = unwrap(await supabase.rpc('community_overview', { community: communityId }))
  return (Array.isArray(rows) ? rows[0] : rows) as CommunityOverview
}

export async function listCommunityRoster(communityId: string): Promise<CommunityMember[]> {
  return unwrap(await supabase.rpc('community_roster', { community: communityId })) ?? []
}

export async function listCommunityRequests(communityId: string): Promise<CommunityRequest[]> {
  return unwrap(await supabase.rpc('community_requests', { community: communityId })) ?? []
}

export async function listCommunityRanks(communityId: string): Promise<CommunityRank[]> {
  return (unwrap(await supabase.from('community_ranks').select('*')
    .eq('community_id', communityId)
    .order('rank', { ascending: false })) as unknown as CommunityRank[]) ?? []
}

export async function saveCommunityRank(rank: Partial<CommunityRank> & { community_id: string }) {
  const { id, ...fields } = rank
  const result = id
    ? await supabase.from('community_ranks').update(fields).eq('id', id).select('id').single()
    : await supabase.from('community_ranks').insert(fields).select('id').single()
  unwrap(result)
}

export async function deleteCommunityRank(id: string) {
  const { error } = await supabase.from('community_ranks').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function createCommunityFull(input: {
  name: string
  slug: string
  description: string
  iconUrl: string | null
  bannerUrl: string | null
  joinPolicy: 'open' | 'approval'
}): Promise<string> {
  return unwrap(await supabase.rpc('create_community', {
    name: input.name.trim(),
    slug: input.slug,
    description: input.description,
    icon_url: input.iconUrl,
    banner_url: input.bannerUrl,
    join_policy: input.joinPolicy,
  })) as string
}

export async function joinCommunity(communityId: string): Promise<'joined' | 'requested'> {
  return unwrap(await supabase.rpc('join_community', { community: communityId })) as
    'joined' | 'requested'
}

export async function leaveCommunity(communityId: string, userId: string) {
  const { error } = await supabase.from('community_members').delete()
    .eq('community_id', communityId).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function answerJoinRequest(communityId: string, applicantId: string, accept: boolean) {
  unwrap(await supabase.rpc('answer_join_request', {
    community: communityId, applicant: applicantId, accept,
  }))
}

export async function setMemberRank(communityId: string, targetId: string, rankId: string) {
  unwrap(await supabase.rpc('set_member_rank', {
    community: communityId, target: targetId, new_rank: rankId,
  }))
}

export async function removeMember(communityId: string, targetId: string, ban = false, reason = '') {
  unwrap(await supabase.rpc('remove_member', {
    community: communityId, target: targetId, ban, reason,
  }))
}

export async function updateCommunity(id: string, patch: Partial<Pick<Community,
  'name' | 'description' | 'icon_url' | 'banner_url' | 'join_policy'>>) {
  unwrap(await supabase.from('communities').update(patch).eq('id', id).select('id').single())
}

// --------------------------------------------------------- community walls

/**
 * The wall and the announcements are separate lists, both newest first. An
 * announcement never shows on the wall and a wall post never pretends to be
 * an announcement.
 */
export async function listCommunityPosts(
  communityId: string, announcements = false,
): Promise<CommunityPost[]> {
  return (unwrap(await supabase.rpc('community_posts_list', {
    target: communityId, announcements, limit_count: 50,
  })) as unknown as CommunityPost[]) ?? []
}

export async function saveAnnouncement(input: {
  id?: number
  communityId: string
  authorId: string
  title: string | null
  body: string
  mediaUrl: string | null
  mediaKind: 'image' | 'video' | null
}) {
  const row = {
    title: input.title,
    body: input.body,
    media_url: input.mediaUrl,
    media_kind: input.mediaKind,
  }
  if (input.id) {
    unwrap(await supabase.from('community_posts').update(row).eq('id', input.id)
      .select('id').single())
    return
  }
  unwrap(await supabase.from('community_posts').insert({
    ...row,
    community_id: input.communityId,
    author_id: input.authorId,
    is_announcement: true,
  }).select('id').single())
}

export async function editPost(id: number, body: string) {
  unwrap(await supabase.from('community_posts').update({ body }).eq('id', id).select('id').single())
}

export async function postToCommunity(input: {
  communityId: string
  authorId: string
  body: string
  isAnnouncement: boolean
}) {
  unwrap(await supabase.from('community_posts').insert({
    community_id: input.communityId,
    author_id: input.authorId,
    body: input.body.trim(),
    is_announcement: input.isAnnouncement,
  }).select('id').single())
}

export async function removeCommunityPost(id: number) {
  unwrap(await supabase.from('community_posts').update({ is_removed: true })
    .eq('id', id).select('id').single())
}

// ------------------------------------------------------- community Spaces

export async function listCommunitySpaces(communityId: string): Promise<Space[]> {
  const { data: rows } = await supabase.from('community_spaces')
    .select('space_id').eq('community_id', communityId)
  const ids = (rows ?? []).map((r) => r.space_id)
  if (!ids.length) return []
  return (unwrap(await supabase.from('spaces').select(SPACE_FIELDS)
    .in('id', ids).eq('is_published', true)) as unknown as Space[]) ?? []
}

export async function linkSpaceToCommunity(communityId: string, spaceId: string, link: boolean) {
  const result = link
    ? await supabase.from('community_spaces').insert({ community_id: communityId, space_id: spaceId })
    : await supabase.from('community_spaces').delete()
        .eq('community_id', communityId).eq('space_id', spaceId)
  if (result.error) throw new Error(result.error.message)
}

/**
 * Pictures the platform itself shows: avatars, Community emblems and banners,
 * Space emblems, covers and thumbnails. These are ordinary uploads from your
 * machine, not Create content, and they carry no id: an id is for what goes
 * inside a Space.
 */
export async function uploadCommunityImage(userId: string, file: File, kind: 'emblem' | 'cover') {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const path = `${userId}/community-${kind}-${Date.now()}.${extension}`
  const { error } = await supabase.storage
    .from('avatars').upload(path, file, { contentType: file.type, upsert: true })
  if (error) throw new Error(error.message)
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

export const uploadSpaceImage = uploadCommunityImage

export async function blockPerson(targetId: string) {
  unwrap(await supabase.rpc('block_person', { target: targetId }))
}

// ------------------------------------------------------------ space detail

export async function getSpaceStats(spaceId: string): Promise<SpaceStats> {
  const rows = unwrap(await supabase.rpc('space_stats', { target: spaceId }))
  return (Array.isArray(rows) ? rows[0] : rows) as SpaceStats
}

/** Like, dislike, favourite and notify all toggle the same way. */
export async function toggleSpaceFlag(
  table: 'space_likes' | 'space_dislikes' | 'space_favorites' | 'space_watchers',
  spaceId: string,
  userId: string,
  on: boolean,
) {
  const result = on
    ? await supabase.from(table).insert({ space_id: spaceId, user_id: userId })
    : await supabase.from(table).delete().eq('space_id', spaceId).eq('user_id', userId)
  if (result.error) throw new Error(result.error.message)
}

export async function updateSpace(id: string, patch: Partial<Pick<Space,
  'name' | 'description' | 'category' | 'genre' | 'emblem_url' | 'cover_url' |
  'thumbnail_urls' | 'is_published' | 'chat_enabled' | 'chat_greeting' | 'chat_slowmode_seconds'>>) {
  unwrap(await supabase.from('spaces').update(patch).eq('id', id).select('id').single())
}

export async function getSpaceById(id: string): Promise<Space | null> {
  const { data, error } = await supabase
    .from('spaces').select(SPACE_FIELDS).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as Space | null) ?? null
}

// ------------------------------------------------------------- affiliates

export async function listRelations(
  communityId: string,
  relation: 'ally' | 'enemy',
  onlyPending = false,
): Promise<CommunityRelation[]> {
  return unwrap(await supabase.rpc('community_relations_list', {
    community: communityId, want: relation, only_pending: onlyPending,
  })) ?? []
}

export async function requestAlly(communityId: string, otherId: string) {
  unwrap(await supabase.rpc('request_ally', { community: communityId, other: otherId }))
}

export async function answerAllyRequest(communityId: string, otherId: string, accept: boolean) {
  unwrap(await supabase.rpc('answer_ally_request', {
    community: communityId, other: otherId, accept,
  }))
}

export async function declareEnemy(communityId: string, otherId: string) {
  unwrap(await supabase.rpc('declare_enemy', { community: communityId, other: otherId }))
}

export async function removeRelation(communityId: string, otherId: string) {
  unwrap(await supabase.rpc('remove_relation', { community: communityId, other: otherId }))
}

// ------------------------------------------------- moderation and the log

export async function listCommunityBanned(communityId: string): Promise<CommunityBan[]> {
  return unwrap(await supabase.rpc('community_banned', { community: communityId })) ?? []
}

export async function liftBan(communityId: string, targetId: string) {
  unwrap(await supabase.rpc('lift_ban', { community: communityId, target: targetId }))
}

export async function listCommunityAudit(communityId: string): Promise<CommunityAuditEntry[]> {
  return unwrap(await supabase.rpc('community_audit_log', { community: communityId })) ?? []
}
