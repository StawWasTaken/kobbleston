import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCopy, faCircleCheck, faLock, faLockOpen, faPen, faTrash, faShieldHalved,
  faTriangleExclamation, faClock, faHandPointUp, faCheck, faXmark, faEllipsis,
  faThumbsUp, faThumbsDown, faComment, faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Input, Textarea } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { Tooltip } from '@/components/ui/Tooltip'
import { useToast } from '@/components/ui/Toast'
import { contentTag, kindIcons, kindLabels } from '@/components/create/AssetTile'
import { MediaPlayer } from '@/components/create/MediaPlayer'
import { FontPreview } from '@/components/create/FontPreview'
import { AssetTile } from '@/components/create/AssetTile'
import { Menu } from '@/components/ui/Menu'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import {
  answerAssetRequest, assetAnalytics, deleteAsset, getAsset, listAssetRequests,
  listAssetReviews, listAssetsByCreator, rateAsset, recordAssetEvent, removeAssetReview,
  requestAssetUse, updateAsset, withdrawAssetRequest, writeAssetReview,
} from '@/lib/api'
import { useSignedUrl } from '@/hooks/useSignedUrl'
import { avatarOf } from '@/lib/avatars'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { AssetDay, AssetPageItem } from '@/types/db'
import { timeAgo } from '@/lib/format'
import { profileLink } from '@/lib/links'

const prefixes: Record<string, string> = {
  IMG: 'image', SND: 'audio', VID: 'video', FNT: 'font', MDL: 'model',
}

const sizeLabel = (bytes: number) =>
  bytes > 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

/** Thirty days of use, drawn from the numbers themselves rather than invented. */
function UseChart({ days }: { days: AssetDay[] }) {
  const peak = Math.max(1, ...days.map((d) => d.views + d.uses))
  const total = days.reduce((sum, d) => sum + d.views + d.uses, 0)

  if (!total) {
    return <p className="py-6 text-center text-sm text-muted">Nothing yet in the last 30 days.</p>
  }

  return (
    <div className="flex h-32 items-end gap-[3px]" role="img" aria-label="Use over the last 30 days">
      {days.map((day) => {
        const height = ((day.views + day.uses) / peak) * 100
        return (
          <Tooltip
            key={day.day}
            side="top"
            label={`${new Date(day.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: ${day.views} views, ${day.uses} uses`}
          >
            <div className="flex h-32 flex-1 items-end">
              <div
                className="w-full rounded-t-sm bg-brand transition-colors hover:bg-brand-bright"
                style={{ height: `${Math.max(height, 2)}%` }}
              />
            </div>
          </Tooltip>
        )
      })}
    </div>
  )
}


/**
 * Content is used by its ID, never downloaded. The Kobbleston account's work
 * is verified and open to everybody; anything else needs its creator to agree.
 */
function UsePanel({ asset, onChanged }: { asset: AssetPageItem; onChanged: () => void }) {
  const { profile } = useAuth()
  const toast = useToast()
  const [asking, setAsking] = useState(false)
  const [note, setNote] = useState('')
  const [pending, setPending] = useState(false)

  const tag = contentTag(asset.kind, asset.content_id)
  const mine = profile?.id === asset.creator_id

  const copy = () => {
    void navigator.clipboard?.writeText(tag)
    void recordAssetEvent(asset.id, 'use')
    toast(`${tag} copied. Paste it into your Space.`, 'success')
    onChanged()
  }

  if (asset.i_can_use) {
    return (
      <div className="space-y-2">
        <Button block icon={faCopy} onClick={copy}>Copy ID</Button>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
          <FontAwesomeIcon
            icon={asset.creator_is_admin ? faCircleCheck : faShieldHalved}
            className="mt-0.5 shrink-0"
          />
          <span>
            {mine
              ? 'Yours, so you can use it anywhere.'
              : asset.creator_is_admin
                ? 'Verified, so anyone may use it.'
                : 'The creator let you use this.'}
          </span>
        </p>
      </div>
    )
  }

  if (asset.i_asked) {
    return (
      <div className="space-y-2">
        <Button block variant="subtle" icon={faClock} disabled>Waiting on the creator</Button>
        <button
          onClick={async () => {
            await withdrawAssetRequest(asset.id)
            toast('Request withdrawn.', 'info')
            onChanged()
          }}
          className="text-xs text-muted hover:text-white"
        >
          Withdraw the request
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        block
        icon={faHandPointUp}
        disabled={!profile || profile.is_guest}
        onClick={() => setAsking(true)}
      >
        Ask to use this
      </Button>
      <p className="text-xs text-muted">
        You cannot take the file. {asset.creator_display_name} decides who may use {tag}.
      </p>

      <Dialog
        open={asking}
        onClose={() => setAsking(false)}
        title={`Ask to use ${asset.name}`}
        description={`${asset.creator_display_name} will see your name and what you say here.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAsking(false)}>Cancel</Button>
            <Button
              loading={pending}
              onClick={async () => {
                setPending(true)
                try {
                  await requestAssetUse(asset.id, note)
                  toast('Asked.', 'success')
                  setAsking(false)
                  onChanged()
                } catch (err) {
                  toast(err instanceof Error ? err.message : 'That did not send.', 'error')
                } finally {
                  setPending(false)
                }
              }}
            >
              Send
            </Button>
          </>
        }
      >
        <Textarea
          label="What is it for?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          placeholder="I am building a Space about..."
        />
      </Dialog>
    </div>
  )
}

export default function AssetPage() {
  const { tag = '' } = useParams()
  const { profile } = useAuth()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pending, setPending] = useState(false)
  const [panel, setPanel] = useState<'Description' | 'Reviews' | 'Requests' | 'Numbers'>('Description')

  const [prefix, number] = useMemo(() => {
    const match = tag.toUpperCase().match(/^([A-Z]{3})-(\d+)$/)
    return match ? [match[1], Number(match[2])] : ['', NaN]
  }, [tag])

  const item = useAsync(
    async () => (Number.isFinite(number) ? getAsset(number) : null),
    [number],
  )
  const asset = item.data
  const mine = !!profile && asset?.creator_id === profile.id

  const stats = useAsync(
    async () => (mine && asset ? assetAnalytics(asset.id) : []),
    [mine, asset?.id],
  )
  const requests = useAsync(
    async () => (mine ? (await listAssetRequests()).filter((r) => r.asset_id === asset?.id) : []),
    [mine, asset?.id],
  )

  const reviews = useAsync(
    async () => (asset ? listAssetReviews(asset.id) : []),
    [asset?.id],
  )
  const more = useAsync(
    async () => (asset ? listAssetsByCreator(asset.creator_id, asset.id) : []),
    [asset?.creator_id, asset?.id],
  )

  const preview = useSignedUrl(
    asset ? asset.thumbnail_path ?? (asset.kind === 'image' ? asset.file_path : null) : null,
  )
  // Sound and video play from a signed URL that expires; there is no link to
  // keep, and the player is told not to offer a download.
  const file = useSignedUrl(
    asset && (asset.kind === 'audio' || asset.kind === 'video' || asset.kind === 'font')
      ? asset.file_path
      : null,
  )

  // A view is recorded once the page has actually opened the item.
  useEffect(() => {
    if (asset) void recordAssetEvent(asset.id, 'view')
  }, [asset?.id])

  useEffect(() => {
    setName(asset?.name ?? '')
    setDescription(asset?.description ?? '')
  }, [asset?.id])

  if (item.loading) {
    return <div className="space-y-4"><Skeleton className="h-96 w-full" /></div>
  }
  if (item.error) {
    return <ErrorState message={item.error} onRetry={item.reload} />
  }
  if (!asset || (prefix && prefixes[prefix] !== asset.kind)) {
    return (
      <Card>
        <EmptyState
            mood="noResults"
            title="Nothing carries that number"
            body={`There is no item at ${tag}. It may have been taken down, or it may not be listed.`}
          action={<Button to="/create">Kobbleston Create</Button>}
        />
      </Card>
    )
  }

  const previewUrl = preview
  const fileUrl = file

  const save = async () => {
    if (!name.trim()) { toast('It needs a name.', 'error'); return }
    setPending(true)
    try {
      await updateAsset(asset.id, { name: name.trim(), description: description.trim() || null })
      toast('Saved.', 'success')
      setEditing(false)
      item.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not save.', 'error')
    } finally {
      setPending(false)
    }
  }

  const setListed = async (listed: boolean) => {
    try {
      await updateAsset(asset.id, { is_public: listed })
      toast(listed ? 'Back in Create.' : 'Taken out of Create.', 'success')
      item.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    }
  }

  const sizeText = sizeLabel(asset.byte_size)
  const stamp = (iso: string) => new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* The head of an item: what it is, who made it, and what you may do
          with it. The file itself is never one of the options. */}
      <header className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className="max-w-md"
            />
          ) : (
            <h1 className="font-display text-3xl font-extrabold leading-tight">{asset.name}</h1>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <Link to={`/u/${asset.creator_username}`} className="inline-flex items-center gap-1.5 hover:text-white">
              By @{asset.creator_username}
              {asset.creator_is_admin && (
                <FontAwesomeIcon icon={faCircleCheck} className="text-xs text-[#4d68ff]" />
              )}
            </Link>
            <span className="h-3.5 w-px bg-ink-line" aria-hidden="true" />
            {asset.score === null ? (
              <span className="italic">Not enough ratings</span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <FontAwesomeIcon icon={faThumbsUp} className="text-space-bright" />
                <span className="font-bold text-white">{asset.score}%</span>
                <span>({formatCount(asset.votes)} {asset.votes === 1 ? 'vote' : 'votes'})</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={faComment} />
              {formatCount(asset.review_count)} {asset.review_count === 1 ? 'review' : 'reviews'}
            </span>
            <span className="font-mono text-link">{contentTag(asset.kind, asset.content_id)}</span>
            <span>{formatCount(asset.download_count)} uses</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-52">
            <UsePanel asset={asset} onChanged={item.reload} />
          </div>
          {mine && (
            <Menu
              label="More"
              align="right"
              trigger={
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-ink-line bg-ink-card text-white/70 transition-colors hover:bg-ink-hover hover:text-white">
                  <FontAwesomeIcon icon={faEllipsis} />
                </span>
              }
              items={[
                { label: 'Edit details', icon: faPen, onSelect: () => setEditing(true) },
                {
                  label: asset.is_public ? 'Take out of Create' : 'List in Create again',
                  icon: asset.is_public ? faLock : faLockOpen,
                  onSelect: () => setListed(!asset.is_public),
                },
                {
                  label: 'Delete',
                  icon: faTrash,
                  danger: true,
                  onSelect: async () => {
                    await deleteAsset(asset.id, asset.file_path)
                    toast('Deleted.', 'success')
                    item.reload()
                  },
                },
              ]}
            />
          )}
        </div>
      </header>

      {mine && asset.status !== 'approved' && (
        <p className={cn(
          'flex items-start gap-2 rounded-xl px-4 py-3 text-sm',
          asset.status === 'pending'
            ? 'bg-amber-400/10 text-amber-200'
            : 'bg-red-500/10 text-red-200',
        )}>
          <FontAwesomeIcon
            icon={asset.status === 'pending' ? faClock : faTriangleExclamation}
            className="mt-0.5"
          />
          {asset.status === 'pending'
            ? 'In review. Nobody else can see it until it passes.'
            : asset.review_note ?? 'This was turned down.'}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-[14rem_1fr] sm:items-start">
        <div>
          <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl border border-ink-line bg-ink-raised">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={asset.name}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="h-full w-full select-none object-contain"
              />
            ) : (
              <FontAwesomeIcon icon={kindIcons[asset.kind]} className="text-5xl text-white/25" />
            )}
          </div>
          <Link
            to={`/u/${asset.creator_username}`}
            className="mt-2 flex items-center gap-2 text-sm font-bold hover:text-link"
          >
            <Avatar
              src={avatarOf({ avatar_url: asset.creator_avatar_url })}
              name={asset.creator_display_name}
              size="xs"
            />
            <span className="truncate">{asset.creator_display_name}</span>
          </Link>
        </div>

        <div className="min-w-0 space-y-5">
          {(asset.kind === 'audio' || asset.kind === 'video') && (
            <MediaPlayer src={fileUrl} kind={asset.kind} poster={previewUrl} />
          )}

          {asset.kind === 'font' && <FontPreview src={fileUrl} name={asset.name} />}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Type', value: kindLabels[asset.kind] },
              { label: 'Created', value: stamp(asset.created_at) },
              { label: 'Updated', value: stamp(asset.updated_at) },
              { label: 'Size', value: sizeText },
            ].map((fact) => (
              <div key={fact.label}>
                <p className="text-xs text-muted">{fact.label}</p>
                <p className="text-sm font-bold">{fact.value}</p>
              </div>
            ))}
          </div>

          <div>
            <div className="flex border-b border-ink-line" role="tablist">
              {(['Description', 'Reviews', ...(mine ? ['Requests', 'Numbers'] as const : [])] as const).map((name) => (
                <button
                  key={name}
                  role="tab"
                  aria-selected={panel === name}
                  onClick={() => setPanel(name)}
                  className={cn(
                    'border-b-2 px-5 py-2.5 text-sm font-bold transition-colors',
                    panel === name
                      ? 'border-white text-white'
                      : 'border-transparent text-white/50 hover:text-white',
                  )}
                >
                  {name}
                  {name === 'Requests' && !!requests.data?.length && (
                    <span className="ml-1.5 text-link">({requests.data.length})</span>
                  )}
                  {name === 'Reviews' && !!asset.review_count && (
                    <span className="ml-1.5 text-muted">({asset.review_count})</span>
                  )}
                </button>
              ))}
            </div>

            {panel === 'Description' && (
              <div className="pt-4">
                {editing ? (
                  <div className="space-y-3">
                    <Textarea
                      label="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={400}
                    />
                    <div className="flex gap-2">
                      <Button loading={pending} onClick={save}>Save</Button>
                      <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                    </div>
                    <p className="text-xs text-muted">
                      A new name goes back through the same check the upload went through.
                    </p>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                    {asset.description || 'No description.'}
                  </p>
                )}
              </div>
            )}


            {panel === 'Reviews' && (
              <div className="space-y-5 pt-4">
                {!mine && (
                  <ReviewBox
                    asset={asset}
                    onDone={() => { item.reload(); reviews.reload() }}
                  />
                )}

                {reviews.loading && <Skeleton className="h-20" />}

                {!reviews.loading && !reviews.data?.length && (
                  <p className="text-sm text-muted">
                    No reviews yet.{mine ? '' : ' Say what you made with it.'}
                  </p>
                )}

                <ul className="space-y-4">
                  {reviews.data?.map((review) => (
                    <li key={review.id} className="flex gap-3">
                      <Avatar src={avatarOf(review)} name={review.display_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm">
                          <Link to={`/u/${review.username}`} className="font-bold hover:underline">
                            {review.display_name}
                          </Link>
                          {review.up !== null && (
                            <FontAwesomeIcon
                              icon={review.up ? faThumbsUp : faThumbsDown}
                              className={cn('text-xs', review.up ? 'text-space-bright' : 'text-white/40')}
                            />
                          )}
                          <span className="text-xs text-muted">{timeAgo(review.created_at)}</span>
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                          {review.body}
                        </p>
                      </div>
                      {(mine || review.user_id === profile?.id) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={faTrash}
                          aria-label={`Remove the review by ${review.display_name}`}
                          onClick={async () => {
                            await removeAssetReview(review.id)
                            item.reload()
                            reviews.reload()
                          }}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {panel === 'Requests' && (
              <div className="space-y-3 pt-4">
                {!requests.data?.length && (
                  <p className="text-sm text-muted">Nobody is asking to use this.</p>
                )}
                {requests.data?.map((request) => (
                  <div key={request.user_id} className="flex items-start gap-2.5">
                    <Avatar src={avatarOf(request)} name={request.display_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <Link to={profileLink(request)} className="block truncate text-sm font-bold hover:underline">
                        {request.display_name}
                      </Link>
                      {request.note && (
                        <p className="text-xs leading-relaxed text-white/60">{request.note}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      icon={faCheck}
                      onClick={async () => {
                        await answerAssetRequest(asset.id, request.user_id, true)
                        requests.reload()
                      }}
                    >
                      Allow
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={faXmark}
                      aria-label={`Turn down ${request.display_name}`}
                      onClick={async () => {
                        await answerAssetRequest(asset.id, request.user_id, false)
                        requests.reload()
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {panel === 'Numbers' && (
              <div className="pt-4">
                {stats.loading ? <Skeleton className="h-32" /> : <UseChart days={stats.data ?? []} />}
                <p className="mt-3 text-xs text-muted">
                  Views and uses over the last 30 days, counted as they happen.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {!!more.data?.length && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold">
            More from {asset.creator_display_name}
            <Link
              to={`/u/${asset.creator_username}`}
              aria-label={`Everything by ${asset.creator_display_name}`}
              className="text-sm text-white/40 transition-colors hover:text-white"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </Link>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
            {more.data.map((other) => <AssetTile key={other.id} item={other} />)}
          </div>
        </section>
      )}
    </div>
  )
}

/** Your thumb and your words about somebody else's work. */
function ReviewBox({ asset, onDone }: { asset: AssetPageItem; onDone: () => void }) {
  const { profile } = useAuth()
  const toast = useToast()
  const [body, setBody] = useState('')
  const [pending, setPending] = useState(false)

  const vote = async (up: boolean) => {
    try {
      await rateAsset(asset.id, asset.my_vote === up ? null : up)
      onDone()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not save.', 'error')
    }
  }

  if (!profile || profile.is_guest) {
    return <p className="text-sm text-muted">Sign in to rate this or leave a review.</p>
  }

  return (
    <div className="space-y-3 rounded-xl border border-ink-line bg-ink-raised p-4">
      <div className="flex items-center gap-2">
        {[true, false].map((up) => (
          <button
            key={String(up)}
            onClick={() => vote(up)}
            aria-pressed={asset.my_vote === up}
            aria-label={up ? 'Rate this up' : 'Rate this down'}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-bold transition-colors',
              asset.my_vote === up
                ? up ? 'bg-space text-white' : 'bg-ink-hover text-white'
                : 'bg-ink-card text-white/60 hover:bg-ink-hover hover:text-white',
            )}
          >
            <FontAwesomeIcon icon={up ? faThumbsUp : faThumbsDown} />
            {up ? 'Good' : 'Not for me'}
          </button>
        ))}
      </div>

      <Textarea
        label="Review"
        labelNote="optional"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={600}
        placeholder="What did you build with it?"
      />

      <div className="flex justify-end">
        <Button
          size="sm"
          loading={pending}
          disabled={!body.trim()}
          onClick={async () => {
            setPending(true)
            try {
              await writeAssetReview(asset.id, body)
              setBody('')
              toast('Posted.', 'success')
              onDone()
            } catch (err) {
              toast(err instanceof Error ? err.message : 'That did not post.', 'error')
            } finally {
              setPending(false)
            }
          }}
        >
          Post review
        </Button>
      </div>
    </div>
  )
}
