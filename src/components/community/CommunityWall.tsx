import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBullhorn, faTrash, faEllipsis } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Menu } from '@/components/ui/Menu'
import { Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { listCommunityPosts, postToCommunity, removeCommunityPost } from '@/lib/api'
import type { CommunityOverview, CommunityPost } from '@/types/db'
import { avatarOf } from '@/lib/avatars'
import { profileLink } from '@/lib/links'
import { Verified } from '@/components/brand/Verified'

/** The author, in the shape the avatar and link helpers expect. */
const authorOf = (post: CommunityPost) => ({
  username: post.author_username,
  display_name: post.author_display_name,
  avatar_url: post.author_avatar_url,
  is_guest: post.author_is_guest,
  content_id: post.author_content_id,
})

/** A wall post carries who said it, their rank, and when. */
function stamp(at: string) {
  const when = new Date(at)
  return `${when.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} | ${when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
}

export function CommunityWall({
  communityId, rights,
}: {
  communityId: string
  rights: CommunityOverview | null
}) {
  const { profile } = useAuth()
  const toast = useToast()
  const [body, setBody] = useState('')
  const [announce, setAnnounce] = useState(false)
  const [pending, setPending] = useState(false)

  const posts = useAsync(() => listCommunityPosts(communityId), [communityId])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !body.trim()) return
    setPending(true)
    try {
      await postToCommunity({ communityId, authorId: profile.id, body, isAnnouncement: announce })
      setBody('')
      setAnnounce(false)
      posts.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not post.', 'error')
    } finally {
      setPending(false)
    }
  }

  const remove = async (id: number) => {
    try {
      await removeCommunityPost(id)
      posts.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not delete.', 'error')
    }
  }

  return (
    <section>
      <h2 className="mb-3 font-display text-xl font-extrabold">Wall</h2>

      {rights?.can_post_wall && (
        <Card className="p-4">
          <form onSubmit={send} className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <label className="sr-only" htmlFor="wall-post">Say something</label>
            <textarea
              id="wall-post"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Say something..."
              className="min-h-[5.5rem] flex-1 resize-y rounded-xl border border-ink-line bg-ink-raised px-3.5 py-2.5 text-sm placeholder:text-white/30 focus:border-brand-bright"
            />
            <div className="flex shrink-0 flex-row items-center gap-3 sm:w-32 sm:flex-col sm:items-stretch">
              <Button
                type="submit"
                className="flex-1 sm:flex-none"
                loading={pending}
                disabled={!body.trim()}
              >
                Post
              </Button>
              {rights.can_manage_community && (
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-white/65">
                  <input
                    type="checkbox"
                    checked={announce}
                    onChange={(e) => setAnnounce(e.target.checked)}
                    className="h-4 w-4 accent-[#1B34E8]"
                  />
                  <FontAwesomeIcon icon={faBullhorn} />
                  Pin
                </label>
              )}
            </div>
          </form>
        </Card>
      )}

      {posts.loading && (
        <Card className="mt-3 space-y-3 p-4">
          {[0, 1].map((i) => <Skeleton key={i} className="h-16" />)}
        </Card>
      )}

      {!posts.loading && !posts.data?.length && (
        <p className="mt-3 text-sm text-muted">Nobody has posted on the wall yet.</p>
      )}

      <div className="mt-3 space-y-3">
        {posts.data?.map((post) => (
          <Card key={post.id} className="p-4">
            <div className="flex items-start gap-3">
              <Link to={profileLink(authorOf(post))} className="shrink-0">
                <Avatar
                  src={avatarOf(authorOf(post))}
                  name={post.author_display_name}
                  size="lg"
                  className="rounded-xl"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={profileLink(authorOf(post))}
                    className="inline-flex items-center gap-1.5 font-bold hover:underline"
                  >
                    {post.author_display_name}
                    {post.author_is_verified && <Verified className="text-xs" />}
                  </Link>
                  {post.author_rank && (
                    <Badge tone="neutral">{post.author_rank}</Badge>
                  )}
                </div>

                <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed text-white/85">
                  {post.body}
                </p>

                <p className="mt-2 text-xs text-muted">
                  {stamp(post.created_at)}
                  {post.edited_at && ' · edited'}
                </p>
              </div>

              {post.i_can_remove && (
                <Menu
                  label="Post options"
                  trigger={
                    <span className="grid h-7 w-7 place-items-center rounded-md text-white/35 transition-colors hover:bg-ink-hover hover:text-white">
                      <FontAwesomeIcon icon={faEllipsis} />
                    </span>
                  }
                  items={[
                    { label: 'Delete post', icon: faTrash, onSelect: () => remove(post.id), danger: true },
                  ]}
                />
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
