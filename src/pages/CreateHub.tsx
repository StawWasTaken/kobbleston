import { useEffect, useState } from 'react'
import { Link, Outlet, useOutletContext } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUpload, faPlus, faMagnifyingGlass, faClock, faCircleCheck, faCircleXmark,
  faEye, faHandPointUp, faInbox, faCheck, faXmark, faLock,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { GuestGate } from '@/components/ui/GuestGate'
import { useToast } from '@/components/ui/Toast'
import { AssetTile, contentTag, kindIcons, kindLabels } from '@/components/create/AssetTile'
import { CreateRail } from '@/components/create/CreateRail'
import { UploadDialog } from '@/components/create/UploadDialog'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import {
  answerAssetRequest, creatorAnalytics, listAssetRequests, listAssets, listOwnAssets,
  listSharedSpaces, listSpacesByOwner,
} from '@/lib/api'
import { avatarOf } from '@/lib/avatars'
import { formatCount, timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { AssetKind, OwnAsset } from '@/types/db'
import { profileLink } from '@/lib/links'

type HubContext = { openUpload: () => void; requests: ReturnType<typeof useAsync<Awaited<ReturnType<typeof listAssetRequests>>>> }

export const useHub = () => useOutletContext<HubContext>()

const statusLook: Record<string, { icon: IconDefinition; tone: string; label: string }> = {
  pending: { icon: faClock, tone: 'text-amber-300', label: 'In review' },
  approved: { icon: faCircleCheck, tone: 'text-space-bright', label: 'Live' },
  rejected: { icon: faCircleXmark, tone: 'text-red-400', label: 'Turned down' },
}

/* ------------------------------------------------------------------ shell */

export default function CreateHub() {
  const { profile } = useAuth()
  const [uploading, setUploading] = useState(false)

  const requests = useAsync(
    async () => (profile ? listAssetRequests() : []),
    [profile?.id],
  )

  return (
    <div className="flex items-start">
      <CreateRail requestCount={requests.data?.length ?? 0} />

      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6">
        <Outlet context={{ openUpload: () => setUploading(true), requests } satisfies HubContext} />
      </div>

      <UploadDialog
        open={uploading}
        onClose={() => setUploading(false)}
        onUploaded={() => window.dispatchEvent(new CustomEvent('kobbleston:uploaded'))}
      />
    </div>
  )
}

/* --------------------------------------------------------------- overview */

function Tile({ icon, label, value, to }: {
  icon: IconDefinition
  label: string
  value: string
  to?: string
}) {
  const body = (
    <>
      <FontAwesomeIcon icon={icon} className="text-base text-link" />
      <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </>
  )
  return to
    ? <Link to={to} className="rounded-2xl border border-ink-line bg-ink-card p-4 transition-colors hover:border-brand/60">{body}</Link>
    : <div className="rounded-2xl border border-ink-line bg-ink-card p-4">{body}</div>
}

export function CreateOverview() {
  const { profile } = useAuth()
  const { openUpload, requests } = useHub()

  const mine = useAsync(async () => (profile ? listOwnAssets(profile.id) : []), [profile?.id])
  const spaces = useAsync(
    async () => (profile ? listSpacesByOwner(profile.id, true) : []),
    [profile?.id],
  )
  const rows = useAsync(async () => (profile ? creatorAnalytics(profile.id) : []), [profile?.id])

  useEffect(() => {
    const reload = () => mine.reload()
    window.addEventListener('kobbleston:uploaded', reload)
    return () => window.removeEventListener('kobbleston:uploaded', reload)
  }, [mine])

  const visits = (spaces.data ?? []).reduce((sum, space) => sum + (space.visit_count ?? 0), 0)
  const uses = (rows.data ?? []).reduce((sum, row) => sum + Number(row.uses ?? 0), 0)
  const views = (rows.data ?? []).reduce((sum, row) => sum + Number(row.views ?? 0), 0)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Kobbleston Create</h1>
          <p className="mt-1.5 text-muted">
            Everything you have made, and everything you are allowed to build with.
          </p>
        </div>
        <div className="flex gap-2">
          <GuestGate action="upload">
            <Button icon={faUpload} onClick={openUpload} disabled={!profile}>Upload</Button>
          </GuestGate>
          <Button variant="subtle" icon={faPlus} to="/spaces/new">New Space</Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Tile icon={kindIcons.model} label="Spaces" value={formatCount(spaces.data?.length ?? 0)} to="/create/spaces" />
        <Tile icon={faUpload} label="Uploads" value={formatCount(mine.data?.length ?? 0)} to="/create/uploads" />
        <Tile icon={faEye} label="Visits to your Spaces" value={formatCount(visits)} />
        <Tile icon={faHandPointUp} label="Uses of your content" value={formatCount(uses)} to="/create/analytics" />
        <Tile icon={faInbox} label="Requests waiting" value={formatCount(requests.data?.length ?? 0)} to="/create/requests" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-line px-4 py-3.5">
            <h2 className="text-sm font-extrabold">Latest uploads</h2>
            <Link to="/create/uploads" className="text-xs font-bold text-link hover:underline">See all</Link>
          </div>
          {mine.loading && <div className="space-y-2 p-4">{[0, 1].map((i) => <Skeleton key={i} className="h-12" />)}</div>}
          {!mine.loading && !mine.data?.length && (
            <p className="px-4 py-8 text-center text-sm text-muted">Nothing uploaded yet.</p>
          )}
          <ul>
            {(mine.data ?? []).slice(0, 5).map((item) => <UploadRow key={item.id} item={item} />)}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-line px-4 py-3.5">
            <h2 className="text-sm font-extrabold">How your content is doing</h2>
            <Link to="/create/analytics" className="text-xs font-bold text-link hover:underline">See all</Link>
          </div>
          {!rows.data?.length ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              Numbers show up once people find your work.
            </p>
          ) : (
            <div className="flex divide-x divide-ink-line">
              <div className="flex-1 p-4 text-center">
                <p className="font-display text-2xl font-extrabold tabular-nums">{formatCount(views)}</p>
                <p className="text-xs text-muted">Views</p>
              </div>
              <div className="flex-1 p-4 text-center">
                <p className="font-display text-2xl font-extrabold tabular-nums">{formatCount(uses)}</p>
                <p className="text-xs text-muted">Uses</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- uploads */

function UploadRow({ item }: { item: OwnAsset }) {
  const look = statusLook[item.status]
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
        <p className={cn('flex flex-wrap items-center gap-1.5 text-xs', look.tone)}>
          <FontAwesomeIcon icon={look.icon} />
          {look.label}
          <span className="text-muted">· {timeAgo(item.created_at)}</span>
          {!item.is_public && (
            <span className="inline-flex items-center gap-1 text-muted">
              <FontAwesomeIcon icon={faLock} /> Unlisted
            </span>
          )}
        </p>
        {item.status === 'rejected' && item.review_note && (
          <p className="mt-1 text-xs text-white/50">{item.review_note}</p>
        )}
      </div>
      <span className="hidden font-mono text-xs text-muted sm:block">{tag}</span>
    </li>
  )
}

export function CreateUploads() {
  const { profile } = useAuth()
  const { openUpload } = useHub()
  const mine = useAsync(async () => (profile ? listOwnAssets(profile.id) : []), [profile?.id])

  useEffect(() => {
    const reload = () => mine.reload()
    window.addEventListener('kobbleston:uploaded', reload)
    return () => window.removeEventListener('kobbleston:uploaded', reload)
  }, [mine])

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">My Uploads</h1>
          <p className="mt-1 text-sm text-muted">
            Every upload keeps its number. Open one to rename it, unlist it or see who is asking.
          </p>
        </div>
        <GuestGate action="upload">
          <Button icon={faUpload} onClick={openUpload} disabled={!profile}>Upload</Button>
        </GuestGate>
      </header>

      {mine.loading && <Skeleton className="h-40" />}
      {mine.error && <ErrorState message={mine.error} onRetry={mine.reload} />}

      {!mine.loading && !mine.data?.length && (
        <Card>
          <EmptyState
            mood="emptyBox"
            title="Nothing uploaded yet"
            body="Images, sounds, video, fonts and models. Everything you upload gets its own number."
            action={<Button icon={faUpload} onClick={openUpload}>Upload something</Button>}
          />
        </Card>
      )}

      {!!mine.data?.length && (
        <Card className="overflow-hidden">
          <ul>{mine.data.map((item) => <UploadRow key={item.id} item={item} />)}</ul>
        </Card>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- spaces */

export function CreateSpaces() {
  const { profile } = useAuth()
  const spaces = useAsync(
    async () => (profile ? listSpacesByOwner(profile.id, true) : []),
    [profile?.id],
  )
  const shared = useAsync(async () => (profile ? listSharedSpaces() : []), [profile?.id])

  const row = (space: { id: string; name: string; emblem_url?: string | null; content_id?: number | null; is_published?: boolean }, action: string) => (
    <li key={space.id} className="flex items-center gap-3 border-b border-ink-line/70 px-4 py-3 last:border-0">
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-ink text-xs">
        {space.emblem_url
          ? <img src={space.emblem_url} alt="" className="h-full w-full object-cover" />
          : space.name.slice(0, 2).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{space.name}</span>
        <span className="block text-xs text-muted">
          {space.content_id ? `SPC-${space.content_id}` : 'No number yet'}
          {space.is_published === false ? ' · draft' : ''}
        </span>
      </span>
      <Button size="sm" variant="subtle" to={`/spaces/${space.id}/edit`}>{action}</Button>
    </li>
  )

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">My Spaces</h1>
          <p className="mt-1 text-sm text-muted">Yours to build, and the ones you were invited onto.</p>
        </div>
        <Button icon={faPlus} to="/spaces/new">New Space</Button>
      </header>

      {spaces.loading && <Skeleton className="h-32" />}

      {!spaces.loading && !spaces.data?.length && (
        <Card>
          <EmptyState
            mood="emptyBox"
            title="No Spaces yet"
            body="A Space is the thing you build. Start one and it appears here."
            action={<Button to="/spaces/new">Make a Space</Button>}
          />
        </Card>
      )}

      {!!spaces.data?.length && (
        <Card className="overflow-hidden">
          <ul>{spaces.data.map((space) => row(space, 'Configure'))}</ul>
        </Card>
      )}

      {!!shared.data?.length && (
        <section>
          <h2 className="mb-2 text-sm font-extrabold">Shared with me</h2>
          <Card className="overflow-hidden">
            <ul>{shared.data.map((space) => row(space, 'Open'))}</ul>
          </Card>
        </section>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ marketplace */

const kinds: (AssetKind | 'all')[] = ['all', 'image', 'audio', 'video', 'font', 'model']

export function CreateMarketplace() {
  const { profile } = useAuth()
  const { openUpload } = useHub()
  const [kind, setKind] = useState<AssetKind | 'all'>('all')
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term), 250)
    return () => window.clearTimeout(timer)
  }, [term])

  const market = useAsync(() => listAssets({ kind, search: debounced, limit: 48 }), [kind, debounced])

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Marketplace</h1>
          <p className="mt-1 text-sm text-muted">
            Content is used by its ID, never downloaded. Kobbleston&rsquo;s own work is open to
            everyone; anything else you ask the creator for.
          </p>
        </div>
        <GuestGate action="upload">
          <Button icon={faUpload} onClick={openUpload} disabled={!profile}>Upload</Button>
        </GuestGate>
      </header>

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
                ? 'border-brand-bright bg-brand text-onbrand'
                : 'border-ink-line bg-ink-card text-white/60 hover:bg-ink-hover hover:text-white',
            )}
          >
            {k === 'all' ? 'Everything' : kindLabels[k]}
          </button>
        ))}
      </div>

      {market.loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="aspect-[4/5]" />)}
        </div>
      )}

      {market.error && <ErrorState message={market.error} onRetry={market.reload} />}

      {!market.loading && !market.error && !market.data?.length && (
        <Card>
          <EmptyState
            mood={debounced ? 'noResults' : 'emptyBox'}
            title={debounced ? 'Kobby could not find anything' : 'Nothing here yet'}
            body={
              debounced
                ? `Nothing in Create matches "${debounced}".`
                : 'Be the first to upload something people can build with.'
            }
          />
        </Card>
      )}

      {!!market.data?.length && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {market.data.map((item) => <AssetTile key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------------------------- requests */

export function CreateRequests() {
  const { requests } = useHub()
  const toast = useToast()

  const answer = async (assetId: string, userId: string, accept: boolean, name: string) => {
    try {
      await answerAssetRequest(assetId, userId, accept)
      toast(accept ? `${name} can use it now.` : 'Turned down.', accept ? 'success' : 'info')
      requests.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Requests</h1>
        <p className="mt-1 text-sm text-muted">People asking to use your content in their Spaces.</p>
      </header>

      {requests.loading && <Skeleton className="h-24" />}

      {!requests.loading && !requests.data?.length && (
        <Card>
          <EmptyState
            mood="emptyBox"
            title="Nobody is waiting"
            body="When somebody asks to use one of your uploads, it lands here."
          />
        </Card>
      )}

      {!!requests.data?.length && (
        <Card className="overflow-hidden">
          <ul>
            {requests.data.map((request) => (
              <li
                key={`${request.asset_id}-${request.user_id}`}
                className="flex items-start gap-3 border-b border-ink-line/70 p-4 last:border-0"
              >
                <Avatar src={avatarOf(request)} name={request.display_name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <Link to={profileLink(request)} className="font-bold hover:underline">
                      {request.display_name}
                    </Link>
                    <span className="text-muted"> wants to use </span>
                    <Link
                      to={`/create/${contentTag(request.kind, request.content_id)}`}
                      className="font-bold text-link hover:underline"
                    >
                      {request.asset_name}
                    </Link>
                  </p>
                  {request.note && (
                    <p className="mt-1 text-xs leading-relaxed text-white/60">{request.note}</p>
                  )}
                  <p className="mt-1 text-xs text-muted">{timeAgo(request.requested_at)}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    icon={faCheck}
                    onClick={() => answer(request.asset_id, request.user_id, true, request.display_name)}
                  >
                    Allow
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={faXmark}
                    aria-label={`Turn down ${request.display_name}`}
                    onClick={() => answer(request.asset_id, request.user_id, false, request.display_name)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- analytics */

export function CreateAnalytics() {
  const { profile } = useAuth()
  const rows = useAsync(async () => (profile ? creatorAnalytics(profile.id) : []), [profile?.id])

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-muted">
          Counted as they happen, not as unique people. Open an item for its last thirty days.
        </p>
      </header>

      {rows.loading && <Skeleton className="h-40" />}

      {!rows.loading && !rows.data?.length && (
        <Card>
          <EmptyState
            mood="emptyBox"
            title="Nothing to measure yet"
            body="Upload something and its numbers appear here."
          />
        </Card>
      )}

      {!!rows.data?.length && (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1fr_5rem_5rem_6rem] gap-3 border-b border-ink-line px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-muted sm:grid">
            <span>Item</span>
            <span className="text-right">Views</span>
            <span className="text-right">Uses</span>
            <span className="text-right">Requests</span>
          </div>
          <ul>
            {rows.data.map((row) => (
              <li
                key={row.asset_id}
                className="grid grid-cols-[1fr_auto] gap-3 border-b border-ink-line/70 px-4 py-3 last:border-0 sm:grid-cols-[1fr_5rem_5rem_6rem]"
              >
                <span className="min-w-0">
                  <Link
                    to={`/create/${contentTag(row.kind, row.content_id)}`}
                    className="block truncate text-sm font-bold hover:text-link"
                  >
                    {row.name}
                  </Link>
                  <span className="font-mono text-xs text-muted">
                    {contentTag(row.kind, row.content_id)}
                  </span>
                </span>
                <span className="text-right text-sm tabular-nums">{formatCount(Number(row.views))}</span>
                <span className="hidden text-right text-sm tabular-nums sm:block">
                  {formatCount(Number(row.uses))}
                </span>
                <span className="hidden text-right text-sm tabular-nums sm:block">
                  {Number(row.pending_requests) > 0 ? (
                    <Link to="/create/requests" className="font-bold text-link hover:underline">
                      {row.pending_requests}
                    </Link>
                  ) : '0'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
