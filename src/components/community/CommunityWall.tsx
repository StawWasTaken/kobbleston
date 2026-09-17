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
import type { CommunityOverview } from '@/types/db'

/** A wall post carries who said it, their rank at the time, and when. */
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
              <Link to={`/u/${post.author?.username ?? ''}`} className="shrink-0">
                <Avatar
                  src={post.author?.avatar_url}
                  name={post.author?.display_name ?? 'K'}
                  size="lg"
                  className="rounded-xl"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/u/${post.author?.username ?? ''}`}
                    className="font-bold hover:underline"
                  >
                    {post.author?.display_name ?? 'Someone'}
                  </Link>
                  {post.is_announcement && (
                    <Badge tone="brand" icon={faBullhorn}>Announcement</Badge>
                  )}
                </div>

                <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed text-white/85">
                  {post.body}
                </p>

                <p className="mt-2 text-xs text-muted">{stamp(post.created_at)}</p>
              </div>

              {(rights?.can_moderate_wall || post.author_id === profile?.id) && (
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
