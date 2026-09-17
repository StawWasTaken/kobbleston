import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDownload, faEye, faCircleCheck, faLock, faLockOpen, faPen, faTrash,
  faTriangleExclamation, faClock,
} from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Input, Textarea } from '@/components/ui/Input'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { Tooltip } from '@/components/ui/Tooltip'
import { useToast } from '@/components/ui/Toast'
import { contentTag, kindIcons, kindLabels } from '@/components/create/AssetTile'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import {
  assetAnalytics, assetUrl, deleteAsset, getAsset, recordAssetEvent, updateAsset,
} from '@/lib/api'
import { avatarOf } from '@/lib/avatars'
import { formatCount, timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { AssetDay } from '@/types/db'

const prefixes: Record<string, string> = {
  IMG: 'image', SND: 'audio', VID: 'video', FNT: 'font', MDL: 'model',
}

const sizeLabel = (bytes: number) =>
  bytes > 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

/** Thirty days of use, drawn from the numbers themselves rather than invented. */
function UseChart({ days }: { days: AssetDay[] }) {
  const peak = Math.max(1, ...days.map((d) => d.views + d.downloads))
  const total = days.reduce((sum, d) => sum + d.views + d.downloads, 0)

  if (!total) {
    return <p className="py-6 text-center text-sm text-muted">Nothing yet in the last 30 days.</p>
  }

  return (
    <div className="flex h-32 items-end gap-[3px]" role="img" aria-label="Use over the last 30 days">
      {days.map((day) => {
        const height = ((day.views + day.downloads) / peak) * 100
        return (
          <Tooltip
            key={day.day}
            side="top"
            label={`${new Date(day.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: ${day.views} views, ${day.downloads} downloads`}
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

export default function AssetPage() {
  const { tag = '' } = useParams()
  const { profile } = useAuth()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pending, setPending] = useState(false)

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

  // A view is recorded once the page has actually opened the item.
  useEffect(() => {
    if (asset) void recordAssetEvent(asset.id, 'view')
  }, [asset?.id])

  useEffect(() => {
    setName(asset?.name ?? '')
    setDescription(asset?.description ?? '')
  }, [asset?.id])

  if (item.loading) {
    return <Page className="space-y-4"><Skeleton className="h-96 w-full" /></Page>
  }
  if (item.error) {
    return <Page><ErrorState message={item.error} onRetry={item.reload} /></Page>
  }
  if (!asset || (prefix && prefixes[prefix] !== asset.kind)) {
    return (
      <Page>
        <Card>
          <EmptyState
            mood="noResults"
            title="Nothing carries that number"
            body={`There is no item at ${tag}. It may have been taken down, or it may not be listed.`}
            action={<Button to="/create">Kobbleston Create</Button>}
          />
        </Card>
      </Page>
    )
  }

  const preview = asset.thumbnail_path ?? (asset.kind === 'image' ? asset.file_path : null)
  const fileUrl = assetUrl(asset.file_path)

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

  return (
    <Page className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="min-w-0 space-y-6">
        <Card className="overflow-hidden">
          <div className="grid aspect-[16/10] place-items-center bg-brand-ink">
            {preview ? (
              <img src={assetUrl(preview)} alt={asset.name} className="h-full w-full object-contain" />
            ) : asset.kind === 'audio' ? (
              <audio controls src={fileUrl} className="w-3/4" />
            ) : asset.kind === 'video' ? (
              <video controls src={fileUrl} className="h-full w-full" />
            ) : (
              <FontAwesomeIcon icon={kindIcons[asset.kind]} className="text-6xl text-white/25" />
            )}
          </div>
        </Card>

        {mine && (
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-extrabold">How it is doing</h2>
              <span className="text-xs text-muted">Last 30 days</span>
            </div>
            {stats.loading ? <Skeleton className="h-32" /> : <UseChart days={stats.data ?? []} />}
            <p className="mt-3 text-xs text-muted">
              Views and downloads are counted as they happen, not as unique people.
            </p>
          </Card>
        )}
      </div>

      <aside className="space-y-4">
        <Card className="p-5">
          {editing ? (
            <div className="space-y-3">
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
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
            <>
              <div className="flex items-start justify-between gap-3">
                <h1 className="font-display text-2xl font-extrabold leading-tight">{asset.name}</h1>
                <Badge tone="neutral">{kindLabels[asset.kind]}</Badge>
              </div>

              <Link
                to={`/u/${asset.creator_username}`}
                className="mt-3 flex items-center gap-2 text-sm text-muted hover:text-white"
              >
                <Avatar src={avatarOf({ avatar_url: asset.creator_avatar_url })} name={asset.creator_display_name} size="sm" />
                <span className="truncate">{asset.creator_display_name}</span>
                {asset.creator_is_admin && (
                  <FontAwesomeIcon icon={faCircleCheck} className="text-xs text-[#4d68ff]" />
                )}
              </Link>

              {asset.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                  {asset.description}
                </p>
              )}
            </>
          )}
        </Card>

        <Card className="divide-y divide-ink-line">
          {[
            { label: 'Content ID', value: contentTag(asset.kind, asset.content_id), mono: true },
            { label: 'Downloads', value: formatCount(asset.download_count) },
            { label: 'Size', value: sizeLabel(asset.byte_size) },
            { label: 'Uploaded', value: timeAgo(asset.created_at) },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="text-muted">{row.label}</span>
              <span className={cn('font-bold', row.mono && 'font-mono text-[#9fadff]')}>{row.value}</span>
            </div>
          ))}
        </Card>

        <Button
          block
          icon={faDownload}
          onClick={() => {
            void recordAssetEvent(asset.id, 'download')
            window.open(fileUrl, '_blank', 'noopener,noreferrer')
          }}
        >
          Download
        </Button>

        {mine && (
          <Card className="space-y-3 p-4">
            <h2 className="text-sm font-extrabold">Yours</h2>

            {asset.status === 'pending' && (
              <p className="flex items-start gap-2 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                <FontAwesomeIcon icon={faClock} className="mt-0.5" />
                In review. Nobody else can see it until it passes.
              </p>
            )}

            {asset.status === 'rejected' && (
              <p className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-200">
                <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
                {asset.review_note ?? 'This was turned down.'}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="subtle" icon={faPen} onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="subtle"
                icon={asset.is_public ? faLock : faLockOpen}
                onClick={() => setListed(!asset.is_public)}
              >
                {asset.is_public ? 'Unlist' : 'List again'}
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon={faTrash}
                onClick={async () => {
                  await deleteAsset(asset.id, asset.file_path)
                  toast('Deleted.', 'success')
                  item.reload()
                }}
              >
                Delete
              </Button>
            </div>

            <p className="flex items-center gap-2 text-xs text-muted">
              <FontAwesomeIcon icon={faEye} />
              {asset.is_public
                ? 'Listed in Create, so anybody can find it.'
                : 'Not listed. Only this link reaches it.'}
            </p>
          </Card>
        )}
      </aside>
    </Page>
  )
}
