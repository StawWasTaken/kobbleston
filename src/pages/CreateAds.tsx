import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRectangleAd, faPlus, faStop, faEye, faHandPointer, faCircleCheck,
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
import { buyAd, endAd, listMyAds, listOwnAssets } from '@/lib/api'
import type { AdSize, MyAd } from '@/lib/api'
import { AD_SIZES } from '@/lib/blocks'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { OwnAsset } from '@/types/db'

const CREATE = 'Kobbleston Create'

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

function Campaign({ ad, onStop }: { ad: MyAd; onStop: () => void }) {
  const picture = useSignedUrl(ad.file_path)
  const left = ad.budget - ad.spent

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
        <p className="mt-0.5 truncate text-xs text-muted">Sends people to {ad.target_path}</p>

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
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted">
          <FontAwesomeIcon icon={faCircleCheck} />
          Finished
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
  const [target, setTarget] = useState('/discover')
  const [budget, setBudget] = useState(50)
  const [pending, setPending] = useState(false)

  const buy = async () => {
    if (!picked) { toast('Pick a picture for the ad.', 'error'); return }
    if (!/^\/[a-zA-Z0-9/_-]{0,120}$/.test(target)) {
      toast('An address inside Kobbleston, like /c/1016/name.', 'error')
      return
    }
    setPending(true)
    try {
      await buyAd({ name: name.trim(), size, assetId: picked.id, target, kubes: budget })
      toast('Your ad is running.', 'success')
      setBuying(false)
      setName('')
      setPicked(null)
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
            Put a picture of yours in front of people, in the Spaces that keep an ad slot. One
            Kube a view, paid up front, and whatever is left comes back when you stop.
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
          {ads.data.map((ad) => <Campaign key={ad.id} ad={ad} onStop={() => stop(ad)} />)}
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
            hint="Only you see this."
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

          <Input
            label="Where it sends people"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            hint="An address inside Kobbleston, like /c/1016/kobbleston or /s/1042/my-space."
          />

          <div>
            <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted">
              Kubes behind it
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={Math.max(10, Math.min(2000, profile?.pixels ?? 10))}
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
              That is {budget} views. A Space that shows your ad keeps 15% of what each view costs.
            </p>
          </div>
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
