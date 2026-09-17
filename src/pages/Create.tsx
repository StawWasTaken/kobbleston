import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUpload, faMagnifyingGlass, faClock, faCircleCheck, faCircleXmark, faTrash, faPlus,
} from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { GuestGate } from '@/components/ui/GuestGate'
import { AssetTile, contentTag, kindIcons, kindLabels } from '@/components/create/AssetTile'
import { UploadDialog } from '@/components/create/UploadDialog'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import {
  deleteAsset, listAssets, listOwnAssets, listSharedSpaces, listSpacesByOwner,
} from '@/lib/api'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { AssetKind, OwnAsset } from '@/types/db'

const kinds: (AssetKind | 'all')[] = ['all', 'image', 'audio', 'video', 'font', 'model']

const statusLook = {
  pending: { icon: faClock, tone: 'text-amber-300', label: 'In review' },
  approved: { icon: faCircleCheck, tone: 'text-space-bright', label: 'Live' },
  rejected: { icon: faCircleXmark, tone: 'text-red-400', label: 'Turned down' },
} as const

function OwnUpload({ item, onDeleted }: { item: OwnAsset; onDeleted: () => void }) {
  const toast = useToast()
  const look = statusLook[item.status]

  const remove = async () => {
    try {
      await deleteAsset(item.id, item.file_path)
      onDeleted()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete that.', 'error')
    }
  }

  const tag = contentTag(item.kind, item.content_id)

  return (
    <li className="flex items-center gap-3 border-b border-ink-line/70 px-4 py-3 last:border-0">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-hover text-white/60">
        <FontAwesomeIcon icon={kindIcons[item.kind]} />
      </span>
      <div className="min-w-0 flex-1">
        <Link
          to={tag ? `/create/${tag}` : '/create'}
          className="block truncate text-sm font-bold hover:text-link"
        >
          {item.name}
        </Link>
        <p className={cn('flex items-center gap-1.5 text-xs', look.tone)}>
          <FontAwesomeIcon icon={look.icon} />
          {look.label}
          <span className="text-muted">· {timeAgo(item.created_at)}</span>
          {!item.is_public && <span className="text-muted">· Unlisted</span>}
        </p>
        {item.status === 'rejected' && item.review_note && (
          <p className="mt-1 text-xs text-white/50">{item.review_note}</p>
        )}
      </div>
      <Button
        size="sm"
        variant="ghost"
        icon={faTrash}
        aria-label={`Delete ${item.name}`}
        onClick={remove}
      />
    </li>
  )
}

export default function Create() {
  const { profile } = useAuth()
  const [kind, setKind] = useState<AssetKind | 'all'>('all')
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term), 250)
    return () => window.clearTimeout(timer)
  }, [term])

  const market = useAsync(() => listAssets({ kind, search: debounced, limit: 36 }), [kind, debounced])
  const mine = useAsync(
    async () => (profile ? listOwnAssets(profile.id) : []),
    [profile?.id],
  )
  const spaces = useAsync(
    async () => (profile ? listSpacesByOwner(profile.id, true) : []),
    [profile?.id],
  )
  const shared = useAsync(
    async () => (profile ? listSharedSpaces() : []),
    [profile?.id],
  )

  return (
    <Page className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="min-w-0">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Kobbleston Create</h1>
            <p className="mt-1.5 text-muted">
              Images, sounds, video and fonts, made by people here.
            </p>
          </div>
          <GuestGate action="upload">
            <Button icon={faUpload} onClick={() => setUploading(true)} disabled={!profile}>
              Upload
            </Button>
          </GuestGate>
        </header>

        <div className="mb-5 space-y-3">
          <Input
            icon={faMagnifyingGlass}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search Create"
            aria-label="Search Create"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 kob-scroll">
            {kinds.map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                className={cn(
                  'h-9 shrink-0 rounded-lg border px-3.5 text-sm font-bold transition-colors',
                  kind === k
                    ? 'border-brand-bright bg-brand text-white'
                    : 'border-ink-line bg-ink-card text-white/60 hover:bg-ink-hover hover:text-white',
                )}
              >
                {k === 'all' ? 'Everything' : kindLabels[k]}
              </button>
            ))}
          </div>
        </div>

        {market.loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="aspect-[4/5]" />)}
          </div>
        )}

        {market.error && <ErrorState message={market.error} onRetry={market.reload} />}

        {!market.loading && !market.error && !market.data?.length && (
          <Card>
            <EmptyState
              mood={debounced ? 'noResults' : 'emptyBox'}
              title={debounced ? 'Kobby couldn’t find anything' : 'Nothing here yet'}
              body={
                debounced
                  ? `Nothing in Create matches "${debounced}".`
                  : 'Be the first to upload something people can build with.'
              }
              action={
                profile && !debounced
                  ? <Button icon={faPlus} onClick={() => setUploading(true)}>Upload something</Button>
                  : undefined
              }
            />
          </Card>
        )}

        {!!market.data?.length && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {market.data.map((item) => <AssetTile key={item.id} item={item} />)}
          </div>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20">
        <Card className="overflow-hidden">
          <div className="border-b border-ink-line px-4 py-3.5">
            <h2 className="text-sm font-extrabold">My Uploads</h2>
          </div>

          {mine.loading && (
            <div className="space-y-2 p-4">
              {[0, 1].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          )}

          {!mine.loading && !mine.data?.length && (
            <p className="px-4 py-6 text-center text-sm text-muted">
              Nothing uploaded yet.
            </p>
          )}

          {!!mine.data?.length && (
            <ul>
              {mine.data.map((item) => (
                <OwnUpload key={item.id} item={item} onDeleted={mine.reload} />
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-line px-4 py-3.5">
            <h2 className="text-sm font-extrabold">My Spaces</h2>
            <Button size="sm" variant="ghost" to="/spaces/new" icon={faPlus}>New</Button>
          </div>

          {spaces.loading && (
            <div className="space-y-2 p-3">
              {[0, 1].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          )}

          {!spaces.loading && !spaces.data?.length && (
            <p className="px-4 py-6 text-center text-sm text-muted">
              Create holds the parts. A Space is what you build out of them.
            </p>
          )}

          {!!spaces.data?.length && (
            <ul>
              {spaces.data.map((space) => (
                <li
                  key={space.id}
                  className="flex items-center gap-3 border-b border-ink-line/70 px-4 py-2.5 last:border-0"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-ink text-xs">
                    {space.emblem_url
                      ? <img src={space.emblem_url} alt="" className="h-full w-full object-cover" />
                      : space.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{space.name}</span>
                    <span className="block text-xs text-muted">
                      {space.content_id ? `SPC-${space.content_id}` : 'No number yet'}{space.is_published ? '' : ' · draft'}
                    </span>
                  </span>
                  <Button size="sm" variant="subtle" to={`/spaces/${space.id}/edit`}>Configure</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Spaces somebody else owns that you have been asked to work on. */}
        {!!shared.data?.length && (
          <Card className="overflow-hidden">
            <div className="border-b border-ink-line px-4 py-3.5">
              <h2 className="text-sm font-extrabold">Shared With Me</h2>
            </div>
            <ul>
              {shared.data.map((space) => (
                <li
                  key={space.id}
                  className="flex items-center gap-3 border-b border-ink-line/70 px-4 py-2.5 last:border-0"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-ink text-xs">
                    {space.emblem_url
                      ? <img src={space.emblem_url} alt="" className="h-full w-full object-cover" />
                      : space.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{space.name}</span>
                  <Button size="sm" variant="subtle" to={`/spaces/${space.id}/edit`}>Open</Button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </aside>

      <UploadDialog
        open={uploading}
        onClose={() => setUploading(false)}
        onUploaded={mine.reload}
      />
    </Page>
  )
}
