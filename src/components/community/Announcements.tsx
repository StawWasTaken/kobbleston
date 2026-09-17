import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBullhorn, faPen, faTrash, faEllipsis, faPlus, faImage, faVideo, faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input, Textarea } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Menu } from '@/components/ui/Menu'
import { Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { MediaPlayer } from '@/components/create/MediaPlayer'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import {
  listCommunityPosts, removeCommunityPost, saveAnnouncement, uploadCommunityImage,
} from '@/lib/api'
import { avatarOf } from '@/lib/avatars'
import { timeAgo } from '@/lib/format'
import { profileLink } from '@/lib/links'
import type { CommunityOverview, CommunityPost } from '@/types/db'
import { Verified } from '@/components/brand/Verified'

const MAX_BYTES = 12 * 1024 * 1024

/**
 * What a Community says to everybody. An announcement has a heading, can
 * carry a picture or a clip, can be fixed after it goes out, and never
 * appears on the wall, which is for conversation.
 */
export function Announcements({
  communityId, rights, compact, onSeeAll,
}: {
  communityId: string
  rights?: CommunityOverview | null
  /** On the About tab only the first few show, with a way to the rest. */
  compact?: boolean
  onSeeAll?: () => void
}) {
  const { profile } = useAuth()
  const toast = useToast()
  const posts = useAsync(() => listCommunityPosts(communityId, true), [communityId])

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CommunityPost | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [media, setMedia] = useState<{ url: string; kind: 'image' | 'video' } | null>(null)
  const [pending, setPending] = useState(false)

  const canManage = !!rights?.can_manage_community
  const shown = compact ? (posts.data ?? []).slice(0, 2) : posts.data ?? []

  const begin = (post: CommunityPost | null) => {
    setEditing(post)
    setTitle(post?.title ?? '')
    setBody(post?.body ?? '')
    setMedia(post?.media_url && post.media_kind
      ? { url: post.media_url, kind: post.media_kind }
      : null)
    setOpen(true)
  }

  const attach = async (file: File | undefined) => {
    if (!file || !profile) return
    const kind = file.type.startsWith('video/') ? 'video' as const : 'image' as const
    if (file.size > MAX_BYTES) { toast('12 MB at most.', 'error'); return }
    setPending(true)
    try {
      const url = await uploadCommunityImage(profile.id, file, 'cover')
      setMedia({ url, kind })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not upload.', 'error')
    } finally {
      setPending(false)
    }
  }

  const save = async () => {
    if (!profile) return
    if (body.trim().length < 1) { toast('Say something.', 'error'); return }
    setPending(true)
    try {
      await saveAnnouncement({
        id: editing?.id,
        communityId,
        authorId: profile.id,
        title: title.trim() || null,
        body: body.trim(),
        mediaUrl: media?.url ?? null,
        mediaKind: media?.kind ?? null,
      })
      toast(editing ? 'Updated.' : 'Announced.', 'success')
      setOpen(false)
      posts.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not post.', 'error')
    } finally {
      setPending(false)
    }
  }

  if (!canManage && !posts.loading && !posts.data?.length) return null

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
          <FontAwesomeIcon icon={faBullhorn} className="text-sm text-white/40" />
          Announcements
        </h2>

        <div className="ml-auto flex items-center gap-2">
          {compact && (posts.data?.length ?? 0) > 2 && onSeeAll && (
            <button onClick={onSeeAll} className="text-xs font-bold text-link hover:underline">
              See all
            </button>
          )}
          {canManage && (
            <Button size="sm" variant="subtle" icon={faPlus} onClick={() => begin(null)}>
              Announce
            </Button>
          )}
        </div>
      </div>

      {posts.loading && <Skeleton className="h-24" />}

      {!posts.loading && !shown.length && (
        <p className="text-sm text-muted">Nothing announced yet.</p>
      )}

      <div className="space-y-3">
        {shown.map((post) => (
          <article
            key={post.id}
            className="relative overflow-hidden rounded-2xl border border-brand/30 bg-brand/[0.07]"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-brand/20 blur-2xl"
            />

            <div className="relative p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Link to={profileLink({
                  username: post.author_username, content_id: post.author_content_id,
                })} className="shrink-0">
                  <Avatar
                    src={avatarOf({
                      avatar_url: post.author_avatar_url, is_guest: post.author_is_guest,
                    })}
                    name={post.author_display_name}
                    size="md"
                    className="rounded-xl"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  {post.title && (
                    <h3 className="font-display text-lg font-extrabold leading-tight">
                      {post.title}
                    </h3>
                  )}
                  <p className="text-xs text-muted">
                    <Link
                      to={profileLink({
                        username: post.author_username, content_id: post.author_content_id,
                      })}
                      className="inline-flex items-center gap-1 font-bold text-white/80 hover:underline"
                    >
                      {post.author_display_name}
                      {post.author_is_verified && <Verified className="text-[11px]" />}
                    </Link>
                    {post.author_rank && <span> · {post.author_rank}</span>}
                    <span> · {timeAgo(post.created_at)}</span>
                    {post.edited_at && <span> · edited</span>}
                  </p>
                </div>

                {post.i_can_remove && (
                  <Menu
                    label="Announcement options"
                    align="right"
                    trigger={
                      <span className="grid h-8 w-8 place-items-center rounded-lg text-white/45 transition-colors hover:bg-ink-hover hover:text-white">
                        <FontAwesomeIcon icon={faEllipsis} />
                      </span>
                    }
                    items={[
                      { label: 'Edit', icon: faPen, onSelect: () => begin(post) },
                      {
                        label: 'Delete',
                        icon: faTrash,
                        danger: true,
                        onSelect: async () => {
                          await removeCommunityPost(post.id)
                          posts.reload()
                        },
                      },
                    ]}
                  />
                )}
              </div>

              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/85">
                {post.body}
              </p>

              {post.media_url && post.media_kind === 'image' && (
                <img
                  src={post.media_url}
                  alt=""
                  loading="lazy"
                  className="mt-3 max-h-96 w-full rounded-xl object-cover"
                />
              )}

              {post.media_url && post.media_kind === 'video' && (
                <MediaPlayer src={post.media_url} kind="video" className="mt-3" />
              )}
            </div>
          </article>
        ))}
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit this announcement' : 'New announcement'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={pending} onClick={save}>{editing ? 'Save' : 'Announce it'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Heading"
            labelNote="optional"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="We are live"
          />

          <Textarea
            label="What is happening"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={4000}
            className="min-h-[9rem]"
            hint={`${body.length}/4000`}
          />

          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">
              Picture or clip <span className="font-semibold normal-case text-white/35">optional</span>
            </p>

            {media ? (
              <div className="relative overflow-hidden rounded-xl border border-ink-line">
                {media.kind === 'image'
                  ? <img src={media.url} alt="" className="max-h-56 w-full object-cover" />
                  : <MediaPlayer src={media.url} kind="video" />}
                <button
                  type="button"
                  onClick={() => setMedia(null)}
                  aria-label="Remove"
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-ink/80 text-white/80 backdrop-blur hover:text-white"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            ) : (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-ink-hover px-3 py-2 text-xs font-bold transition-colors hover:bg-ink-line">
                <FontAwesomeIcon icon={faImage} />
                <FontAwesomeIcon icon={faVideo} />
                {pending ? 'Uploading...' : 'Add a picture or a clip'}
                <input
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm"
                  onChange={(e) => { void attach(e.target.files?.[0]); e.target.value = '' }}
                />
              </label>
            )}
          </div>
        </div>
      </Dialog>
    </section>
  )
}
