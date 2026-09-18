import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRectangleAd, faPlus, faStop, faEye, faHandPointer, faCircleCheck,
  faCubes, faUsers, faCalendarDay, faShapes, faGlobe, faLock, faRotateRight, faHourglassHalf,
} from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { Kube } from '@/components/brand/Kube'
import { UploadDialog } from '@/components/create/UploadDialog'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useTitle } from '@/hooks/useTitle'
import { useSignedUrl } from '@/hooks/useSignedUrl'
import {
  AD_MAX_KUBES, adDays, buyAd, endAd, listAdvertisable, listMyAds, listOwnAssets, renewAd,
} from '@/lib/api'
import type { AdSize, AdTarget, Advertisable, MyAd } from '@/lib/api'
import { AD_SIZES } from '@/lib/blocks'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { OwnAsset } from '@/types/db'

const CREATE = 'Kobbleston Create'

/** What an ad may be for, and what each of those looks like in a list. */
const targetLook: Record<AdTarget, { icon: typeof faCubes; label: string }> = {
  space: { icon: faCubes, label: 'Spaces' },
  community: { icon: faUsers, label: 'Communities' },
  event: { icon: faCalendarDay, label: 'Events' },
  asset: { icon: faShapes, label: 'Marketplace' },
  link: { icon: faGlobe, label: 'Somewhere else' },
}

const targetOrder: AdTarget[] = ['space', 'community', 'event', 'asset']

/** How much longer a campaign has, said the way a person would say it. */
function timeLeft(ends: string | null) {
  if (!ends) return null
  const hours = (new Date(ends).getTime() - Date.now()) / 3600000
  if (hours <= 0) return null
  if (hours < 1) return 'Less than an hour left'
  if (hours < 24) return `${Math.round(hours)} ${Math.round(hours) === 1 ? 'hour' : 'hours'} left`
  const days = Math.round(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'} left`
}

/** What a number of Kubes buys, in both of the ways it runs out. */
const runsFor = (kubes: number) => {
  const days = adDays(kubes)
  return `${kubes} views, or ${days} ${days === 1 ? 'day' : 'days'}, whichever goes first`
}

/** A picture of somebody's own, small, for picking one. */
function Thumb({ path, on }: { path: string; on: boolean }) {
  const url = useSignedUrl(path)
  return (
    <span
      className={cn(
        'block aspect-video w-full overflow-hidden rounded-lg border bg-media',
        on ? 'border-brand-bright' : 'border-ink-line',
      )}
    >
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
    </span>
  )
}

function Campaign({ ad, onStop, onRenew }: {
  ad: MyAd
  onStop: () => void
  onRenew: () => void
}) {
  const picture = useSignedUrl(ad.file_path)
  const left = ad.budget - ad.spent
  const remaining = ad.is_running ? timeLeft(ad.ends_at) : null

  return (
    <article className="flex flex-wrap items-center gap-4 rounded-2xl border border-ink-line bg-ink-card p-4">
      <span className="h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-media">
        {picture && <img src={picture} alt="" className="h-full w-full object-cover" />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate font-bold">
          {ad.name}
          <span className="rounded-full border border-ink-line px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-muted">
            {AD_SIZES[ad.size]?.label ?? ad.size}
          </span>
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted">
          <FontAwesomeIcon icon={targetLook[ad.target_kind]?.icon ?? faGlobe} />
          Sends people to {ad.target_path}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5 text-muted">
            <FontAwesomeIcon icon={faEye} />
            {formatCount(ad.views)} views
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted">
            <FontAwesomeIcon icon={faHandPointer} />
            {formatCount(ad.clicks)} clicks
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kube />
            {formatCount(left)} left of {formatCount(ad.budget)}
          </span>
          {remaining && (
            <span className="inline-flex items-center gap-1.5 text-muted">
              <FontAwesomeIcon icon={faHourglassHalf} />
              {remaining}
            </span>
          )}
          {ad.renewed_count > 0 && (
            <span className="text-muted">
              Renewed {ad.renewed_count} {ad.renewed_count === 1 ? 'time' : 'times'}
            </span>
          )}
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-raised">
          <span
            style={{ width: `${Math.min(100, (ad.spent / ad.budget) * 100)}%` }}
            className="block h-full bg-brand"
          />
        </div>
      </div>

      {ad.is_running ? (
        <Button size="sm" variant="ghost" icon={faStop} onClick={onStop}>Stop</Button>
      ) : (
        <span className="flex flex-col items-end gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted">
            <FontAwesomeIcon icon={faCircleCheck} />
            Finished
          </span>
          <Button size="sm" variant="subtle" icon={faRotateRight} onClick={onRenew}>
            Put it back up
          </Button>
        </span>
      )}
    </article>
  )
}

export default function CreateAds() {
  useTitle('Ads', CREATE)
  const { profile, refreshProfile } = useAuth()
  const toast = useToast()

  const ads = useAsync(() => (profile ? listMyAds() : Promise.resolve([])), [profile?.id])
  const targets = useAsync(
    () => (profile ? listAdvertisable() : Promise.resolve([] as Advertisable[])),
    [profile?.id],
  )

  // Only Kobbleston's own account may point an ad at another website.
  const official = profile?.username?.toLowerCase() === 'kobbleston'
  const pictures = useAsync(
    async () => (profile
      ? (await listOwnAssets(profile.id)).filter((a) => a.kind === 'image' && a.status === 'approved')
      : []),
    [profile?.id],
  )

  const [buying, setBuying] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState('')
  const [size, setSize] = useState<AdSize>('banner')
  const [picked, setPicked] = useState<OwnAsset | null>(null)
  const [forWhat, setForWhat] = useState<Advertisable | null>(null)
  const [outward, setOutward] = useState('')
  const [budget, setBudget] = useState(50)
  const [renewing, setRenewing] = useState<MyAd | null>(null)
  const [again, setAgain] = useState(50)
  const [pending, setPending] = useState(false)

  const buy = async () => {
    if (name.trim().length < 3) {
      toast('Give the ad a name of at least three letters.', 'error')
      return
    }
    if (!picked) { toast('Pick a picture for the ad.', 'error'); return }

    const away = official && outward.trim()
    if (!forWhat && !away) {
      toast('Say what the ad is for.', 'error')
      return
    }

    setPending(true)
    try {
      await buyAd({
        name: name.trim(),
        size,
        assetId: picked.id,
        kind: away ? 'link' : (forWhat as Advertisable).kind,
        targetId: away ? null : (forWhat as Advertisable).id,
        outward: away ? outward.trim() : null,
        kubes: budget,
      })
      toast('Your ad is running.', 'success')
      setBuying(false)
      setName('')
      setPicked(null)
      setForWhat(null)
      setOutward('')
      ads.reload()
      refreshProfile()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not go through.', 'error')
    } finally {
      setPending(false)
    }
  }

  const renew = async () => {
    if (!renewing) return
    setPending(true)
    try {
      const until = await renewAd(renewing.id, again)
      const days = Math.max(1, Math.round((new Date(until).getTime() - Date.now()) / 86400000))
      toast(`Back up for ${days} ${days === 1 ? 'day' : 'days'}.`, 'success')
      setRenewing(null)
      ads.reload()
      refreshProfile()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not go through.', 'error')
    } finally {
      setPending(false)
    }
  }

  const stop = async (ad: MyAd) => {
    try {
      const back = await endAd(ad.id)
      toast(back > 0 ? `Stopped. ${back} Kubes came back.` : 'Stopped.', 'info')
      ads.reload()
      refreshProfile()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not stop.', 'error')
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Ads</h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted">
            Put a picture of yours in front of people, in the Spaces that keep an ad slot and in
            Kobbleston&rsquo;s own. One Kube a view, paid up front, and whatever is left comes
            back when you stop. The more Kubes behind it, the longer it runs.
          </p>
        </div>

        <Button icon={faPlus} onClick={() => setBuying(true)} disabled={!profile}>
          Buy an ad
        </Button>
      </header>

      {ads.loading && <Skeleton className="h-28 rounded-2xl" />}
      {ads.error && <ErrorState message={ads.error} onRetry={ads.reload} />}

      {!ads.loading && !ads.data?.length && (
        <Card>
          <EmptyState
            mood="emptyBox"
            title="No ads yet"
            body="An ad needs a picture you have uploaded to Create, somewhere on Kobbleston to send people, and some Kubes behind it."
            action={<Button icon={faRectangleAd} onClick={() => setBuying(true)}>Buy one</Button>}
          />
        </Card>
      )}

      {!!ads.data?.length && (
        <div className="space-y-3">
          {ads.data.map((ad) => (
            <Campaign
              key={ad.id}
              ad={ad}
              onStop={() => stop(ad)}
              onRenew={() => { setRenewing(ad); setAgain(Math.min(50, profile?.pixels ?? 10)) }}
            />
          ))}
        </div>
      )}

      <Dialog
        open={buying}
        onClose={() => setBuying(false)}
        title="Buy an ad"
        description="It starts running as soon as it is paid for."
        size="lg"
        footer={
          <>
            <span className="mr-auto inline-flex items-center gap-1.5 text-sm text-muted">
              You have <Kube /> {formatCount(profile?.pixels ?? 0)}
            </span>
            <Button variant="ghost" onClick={() => setBuying(false)}>Cancel</Button>
            <Button loading={pending} onClick={buy}>
              <Kube />
              {budget}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="What to call it"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
            hint={
              name.trim() && name.trim().length < 3
                ? 'A name needs at least three letters.'
                : 'Only you see this. Three letters at least.'
            }
          />

          <div>
            <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted">
              Size
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.entries(AD_SIZES) as [AdSize, { label: string }][]).map(([value, shape]) => (
                <button
                  key={value}
                  onClick={() => setSize(value)}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition-colors',
                    size === value
                      ? 'border-brand-bright bg-brand/15'
                      : 'border-ink-line bg-ink-raised hover:bg-ink-hover',
                  )}
                >
                  {shape.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted">
                Picture
              </p>
              <button
                onClick={() => setUploading(true)}
                className="text-xs font-bold text-link hover:underline"
              >
                Upload one
              </button>
            </div>

            {pictures.loading && <Skeleton className="h-24 rounded-xl" />}

            {!pictures.loading && !pictures.data?.length && (
              <p className="rounded-xl border border-ink-line bg-ink-raised p-3 text-sm text-muted">
                You have no approved pictures in Create yet. Upload one and it can go in an ad
                once it has been looked at.
              </p>
            )}

            {!!pictures.data?.length && (
              <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 kob-scroll">
                {pictures.data.map((asset) => (
                  <button key={asset.id} onClick={() => setPicked(asset)} className="text-left">
                    <Thumb path={asset.file_path} on={picked?.id === asset.id} />
                    <span className="mt-1 block truncate text-[11px] font-semibold text-muted">
                      {asset.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted">
              What the ad is for
            </p>
            <p className="mb-2 text-xs text-muted">
              An ad points at a Space, a community, an event or something in the Marketplace, and
              only at one you made or have been given the run of.
            </p>

            {targets.loading && <Skeleton className="h-24 rounded-xl" />}

            {!targets.loading && !targets.data?.length && (
              <p className="rounded-xl border border-ink-line bg-ink-raised p-3 text-sm text-muted">
                There is nothing here to advertise yet. Build a Space, run a community, or put
                something in the Marketplace, and it turns up in this list.
              </p>
            )}

            {!!targets.data?.length && (
              <div className="max-h-56 space-y-3 overflow-y-auto pr-1 kob-scroll">
                {targetOrder.map((kind) => {
                  const rows = (targets.data ?? []).filter((one) => one.kind === kind)
                  if (!rows.length) return null

                  return (
                    <div key={kind}>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted">
                        <FontAwesomeIcon icon={targetLook[kind].icon} />
                        {targetLook[kind].label}
                      </p>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {rows.map((row) => (
                          <button
                            key={row.id}
                            onClick={() => { setForWhat(row); setOutward('') }}
                            className={cn(
                              'rounded-xl border px-3 py-2 text-left transition-colors',
                              forWhat?.id === row.id
                                ? 'border-brand-bright bg-brand/15'
                                : 'border-ink-line bg-ink-raised hover:bg-ink-hover',
                            )}
                          >
                            <span className="block truncate text-xs font-bold">{row.label}</span>
                            <span className="block truncate text-[11px] text-muted">
                              {row.note} · {row.path}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {official ? (
              <div className="mt-3">
                <Input
                  label="Or somewhere else entirely"
                  labelNote="Kobbleston only"
                  value={outward}
                  onChange={(e) => { setOutward(e.target.value); if (e.target.value) setForWhat(null) }}
                  placeholder="https://"
                  hint="This account may point an ad at another website. No other account can."
                />
              </div>
            ) : (
              <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted">
                <FontAwesomeIcon icon={faLock} />
                Ads cannot be pointed off Kobbleston.
              </p>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted">
              Kubes behind it
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={Math.max(10, Math.min(AD_MAX_KUBES, profile?.pixels ?? 10))}
                step={10}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="h-2 w-full accent-[#1B34E8]"
                aria-label="Kubes behind this ad"
              />
              <span className="inline-flex shrink-0 items-center gap-1.5 font-display text-lg font-extrabold tabular-nums">
                <Kube />
                {budget}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              That is {runsFor(budget)}. The more Kubes behind it, the longer it stays up, to a
              limit of a fortnight at {AD_MAX_KUBES}. A Space that shows your ad keeps 15% of what
              each view costs; in Kobbleston&rsquo;s own slots there is nobody whose page it is,
              so nobody takes a share.
            </p>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!renewing}
        onClose={() => setRenewing(null)}
        title="Put it back up"
        description={renewing ? `${renewing.name}, running again from today.` : ''}
        size="sm"
        footer={
          <>
            <span className="mr-auto inline-flex items-center gap-1.5 text-sm text-muted">
              You have <Kube /> {formatCount(profile?.pixels ?? 0)}
            </span>
            <Button variant="ghost" onClick={() => setRenewing(null)}>Cancel</Button>
            <Button loading={pending} onClick={renew}>
              <Kube />
              {again}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={10}
              max={Math.max(10, Math.min(AD_MAX_KUBES, profile?.pixels ?? 10))}
              step={10}
              value={again}
              onChange={(e) => setAgain(Number(e.target.value))}
              className="h-2 w-full accent-[#1B34E8]"
              aria-label="Kubes behind this renewal"
            />
            <span className="inline-flex shrink-0 items-center gap-1.5 font-display text-lg font-extrabold tabular-nums">
              <Kube />
              {again}
            </span>
          </div>
          <p className="text-xs text-muted">
            That is {runsFor(again)}. Anything left of the old budget stays where it is and these
            Kubes are added to it, so nothing bought before is lost.
          </p>
        </div>
      </Dialog>

      <UploadDialog
        open={uploading}
        onClose={() => setUploading(false)}
        only="image"
        onUploaded={(created) => {
          pictures.reload()
          if (created?.status === 'approved') {
            toast('Uploaded and ready to advertise with.', 'success')
          } else if (created) {
            toast('Uploaded. It can go in an ad once it has been looked at.', 'info')
          }
        }}
      />
    </div>
  )
}
