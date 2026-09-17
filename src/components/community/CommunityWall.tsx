import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBullhorn, faTrash } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { listCommunityPosts, postToCommunity, removeCommunityPost } from '@/lib/api'
import { timeAgo } from '@/lib/format'
import type { CommunityOverview } from '@/types/db'

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
      await postToCommunity({
        communityId, authorId: profile.id, body, isAnnouncement: announce,
      })
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
    <div className="space-y-4">
      {rights?.can_post_wall && (
        <Card className="p-4">
          <form onSubmit={send}>
            <label className="sr-only" htmlFor="wall-post">Post to the wall</label>
            <textarea
              id="wall-post"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Say something to the Community"
              className="w-full resize-y rounded-xl border border-ink-line bg-ink-raised px-3.5 py-2.5 text-sm placeholder:text-white/30 focus:border-brand-bright"
            />
            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              {rights.can_manage_community && (
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-white/65">
                  <input
                    type="checkbox"
                    checked={announce}
                    onChange={(e) => setAnnounce(e.target.checked)}
                    className="h-4 w-4 accent-[#1B34E8]"
                  />
                  <FontAwesomeIcon icon={faBullhorn} />
                  Pin as an announcement
                </label>
              )}
              <Button
                type="submit"
                size="sm"
                className="ml-auto"
                loading={pending}
                disabled={!body.trim()}
              >
                Post
              </Button>
            </div>
          </form>
        </Card>
      )}

      {posts.loading && (
        <Card className="space-y-3 p-4">
          {[0, 1].map((i) => <Skeleton key={i} className="h-16" />)}
        </Card>
      )}

      {!posts.loading && !posts.data?.length && (
        <Card>
          <EmptyState
            mood="construction"
            title="Nothing on the wall"
            body="No announcements yet, and nobody has posted."
          />
        </Card>
      )}

      {posts.data?.map((post) => (
        <Card key={post.id} className="p-4">
          <div className="flex items-start gap-3">
            <Link to={`/u/${post.author?.username ?? ''}`} className="shrink-0">
              <Avatar
                src={post.author?.avatar_url}
                name={post.author?.display_name ?? 'K'}
                size="sm"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/u/${post.author?.username ?? ''}`}
                  className="text-sm font-bold hover:underline"
                >
                  {post.author?.display_name ?? 'Someone'}
                </Link>
                {post.is_announcement && (
                  <Badge tone="brand" icon={faBullhorn}>Announcement</Badge>
                )}
                <span className="text-xs text-muted">{timeAgo(post.created_at)}</span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/75">
                {post.body}
              </p>
            </div>

            {(rights?.can_moderate_wall || post.author_id === profile?.id) && (
              <Button
                size="sm"
                variant="ghost"
                icon={faTrash}
                aria-label="Delete this post"
                onClick={() => remove(post.id)}
              />
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
