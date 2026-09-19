import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  faMagnifyingGlass, faPlus, faCheck, faShirt, faUpload, faXmark, faEyeSlash, faStore,
} from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { Confirm } from '@/components/ui/Confirm'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { GuestGate } from '@/components/ui/GuestGate'
import { Kube } from '@/components/brand/Kube'
import { Verified } from '@/components/brand/Verified'
import { StyleLayer } from '@/components/style/StyleLayer'
import { StyleStudio, StyleDetails, startingPlace } from '@/components/style/StyleStudio'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useTitle } from '@/hooks/useTitle'
import {
  asWorn, buyStyleItem, myStyle, placeStyleItem, publishStyleItem, retireStyleItem,
  styleImage, styleShop, uploadStyleImage, wearStyleItem,
} from '@/lib/api'
import type { Placement, StyleItem } from '@/lib/api'
import { avatarOf } from '@/lib/avatars'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'

const slotNames: Record<StyleItem['slot'], string> = {
  hat: 'Hat', hair: 'Hair', face: 'Face', accessory: 'Accessory', frame: 'Frame',
}

const filters: { value: StyleItem['slot'] | null; label: string }[] = [
  { value: null, label: 'Everything' },
  { value: 'hat', label: 'Hats' },
  { value: 'hair', label: 'Hair' },
  { value: 'face', label: 'Faces' },
  { value: 'accessory', label: 'Accessories' },
  { value: 'frame', label: 'Frames' },
]

/**
 * One thing in the shop, shown the only way worth showing it: on a face,
 * exactly where it will sit when you wear it.
 */
function ItemCard({
  item, face, name, busy, onGet, onWear,
}: {
  item: StyleItem
  face: string | null
  name: string
  busy: boolean
  onGet: () => void
  onWear: () => void
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-ink-line bg-ink-card transition-colors hover:border-brand/60">
      <div className="relative grid aspect-square place-items-center bg-ink-raised p-6">
        <span className="relative block h-full w-full max-w-[9rem]">
          <StyleLayer items={[asWorn(item)]} layer={0} />
          <span className="relative block h-full w-full">
            <Avatar src={face} name={name} size="md" className="h-full w-full rounded-full" />
          </span>
          <StyleLayer items={[asWorn(item)]} layer={1} />
        </span>

        <span className="absolute left-2.5 top-2.5 rounded-md bg-ink-card/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted ring-1 ring-ink-line backdrop-blur">
          {slotNames[item.slot]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-ink-line p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{item.name}</p>
          <p className="truncate text-xs text-muted">
            By @{item.creator_username} <Verified className="ml-0.5 text-[10px]" />
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-sm font-extrabold">
            {item.price > 0 ? (
              <>
                <Kube className="h-3.5 w-3.5" />
                {formatCount(item.price)}
              </>
            ) : 'Free'}
          </span>

          {item.owned ? (
            <Button
              size="sm"
              variant={item.worn ? 'primary' : 'subtle'}
              icon={item.worn ? faCheck : faShirt}
              disabled={busy}
              onClick={onWear}
            >
              {item.worn ? 'Worn' : 'Wear'}
            </Button>
          ) : (
            <GuestGate action="buy things">
              <Button size="sm" disabled={busy} onClick={onGet}>
                {item.price > 0 ? 'Get' : 'Take'}
              </Button>
            </GuestGate>
          )}
        </div>
      </div>
    </article>
  )
}

export default function Style() {
  useTitle('Style')
  const { profile, refreshProfile } = useAuth()
  const toast = useToast()

  /*
   * The words can arrive in the address, because the bar at the top of the
   * site hands its search straight to this page, and because a search worth
   * making is a search worth sending somebody.
   */
  const [params, setParams] = useSearchParams()
  const [term, setTerm] = useState(params.get('q') ?? '')
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [slot, setSlot] = useState<StyleItem['slot'] | null>(null)
  const [tab, setTab] = useState<'shop' | 'mine'>('shop')
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const words = term.trim()
      setSearch(words)
      setParams(words ? { q: words } : {}, { replace: true })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [term, setParams])

  const shop = useAsync(() => styleShop({ search, slot }), [search, slot])
  const mine = useAsync(async () => (profile ? myStyle() : []), [profile?.id])

  const canMake = Boolean(profile?.is_verified || profile?.is_admin)
  const face = avatarOf(profile)

  /* ------------------------------------------------------------ making one */

  const [making, setMaking] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [place, setPlace] = useState<Placement>({ ...startingPlace })
  const [details, setDetails] = useState({
    name: '', description: '', slot: 'hat' as StyleItem['slot'], price: '0',
  })
  const [publishing, setPublishing] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const [retiring, setRetiring] = useState<StyleItem | null>(null)

  const pickFile = async (chosen: File | null) => {
    if (!chosen || !profile) return
    if (chosen.size > 4 * 1024 * 1024) {
      toast('That picture is over 4MB.', 'error')
      return
    }
    setUploading(true)
    try {
      setImage(await uploadStyleImage(profile.id, chosen))
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not upload.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const publish = async () => {
    if (!image || !details.name.trim()) {
      toast('It needs a picture and a name.', 'error')
      return
    }
    setPublishing(true)
    try {
      await publishStyleItem({
        name: details.name,
        description: details.description,
        slot: details.slot,
        image,
        place,
        price: Number(details.price || 0),
      })
      toast(`${details.name} is in the shop.`, 'success')
      setMaking(false)
      setImage(null)
      setPlace({ ...startingPlace })
      setDetails({ name: '', description: '', slot: 'hat', price: '0' })
      shop.reload()
      mine.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not go up.', 'error')
    } finally {
      setPublishing(false)
    }
  }

  /* ------------------------------------------------------- getting, wearing */

  const get = async (item: StyleItem) => {
    setBusy(item.id)
    try {
      await buyStyleItem(item.id)
      toast(item.price > 0 ? `Bought ${item.name}.` : `${item.name} is yours.`, 'success')
      await refreshProfile()
      shop.reload()
      mine.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    } finally {
      setBusy(null)
    }
  }

  const wear = async (item: StyleItem) => {
    setBusy(item.id)
    try {
      await wearStyleItem(item.id, !item.worn)
      await refreshProfile()
      shop.reload()
      mine.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    } finally {
      setBusy(null)
    }
  }

  const moveOwn = async (item: StyleItem, next: Placement) => {
    try {
      await placeStyleItem(item.id, next)
      toast('Moved. Everybody wearing it sees it there now.', 'success')
      shop.reload()
      mine.reload()
      await refreshProfile()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not move.', 'error')
    }
  }

  const shown = tab === 'shop' ? shop.data ?? [] : mine.data ?? []

  return (
    <Page className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-ink-line bg-ink-card px-5 py-7 sm:px-8">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand/20 blur-3xl"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Style</h1>
            <p className="mt-1.5 max-w-xl text-sm text-muted">
              Hats, hair and whatever else people make, worn on your own picture and shown
              wherever you turn up on Kobbleston.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Your own face, wearing what you have on right now. */}
            <span className="relative hidden h-16 w-16 sm:block">
              <StyleLayer items={profile?.style} layer={0} />
              <span className="relative block h-full w-full">
                <Avatar
                  src={face}
                  name={profile?.display_name ?? 'You'}
                  size="md"
                  className="h-full w-full rounded-full"
                />
              </span>
              <StyleLayer items={profile?.style} layer={1} />
            </span>

            {canMake && (
              <Button icon={faPlus} onClick={() => setMaking(true)}>Make something</Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-ink-line bg-ink-card p-1">
          {(['shop', 'mine'] as const).map((one) => (
            <button
              key={one}
              onClick={() => setTab(one)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-bold transition-colors',
                tab === one ? 'bg-brand text-onbrand' : 'text-white/60 hover:text-white',
              )}
            >
              {one === 'shop' ? 'The shop' : 'Mine'}
            </button>
          ))}
        </div>

        {tab === 'shop' && (
          <>
            <Input
              icon={faMagnifyingGlass}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search the shop"
              aria-label="Search the shop"
              className="min-w-[12rem] flex-1"
            />
            <div className="flex flex-wrap gap-1.5">
              {filters.map((one) => (
                <button
                  key={one.label}
                  onClick={() => setSlot(one.value)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors',
                    slot === one.value
                      ? 'border-brand-bright bg-brand/15 text-white'
                      : 'border-ink-line bg-ink-card text-white/60 hover:text-white',
                  )}
                >
                  {one.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {(tab === 'shop' ? shop.error : mine.error) && (
        <ErrorState
          message={(tab === 'shop' ? shop.error : mine.error) as string}
          onRetry={tab === 'shop' ? shop.reload : mine.reload}
        />
      )}

      {(tab === 'shop' ? shop.loading : mine.loading) && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
        </div>
      )}

      {!shown.length && !(tab === 'shop' ? shop.loading : mine.loading)
        && !(tab === 'shop' ? shop.error : mine.error) && (
        <Card>
          <EmptyState
            mood={search ? 'noResults' : 'emptyBox'}
            title={tab === 'mine' ? 'Nothing yet' : search ? 'Nothing matches' : 'The shop is empty'}
            body={
              tab === 'mine'
                ? 'Anything you take from the shop turns up here, ready to wear.'
                : search
                  ? 'Try fewer letters.'
                  : 'Verified accounts put things here. There will be more soon.'
            }
            action={tab === 'mine' ? <Button icon={faStore} onClick={() => setTab('shop')}>Open the shop</Button> : undefined}
          />
        </Card>
      )}

      {!!shown.length && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((item) => (
            <div key={item.id} className="space-y-1.5">
              <ItemCard
                item={item}
                face={face}
                name={profile?.display_name ?? 'You'}
                busy={busy === item.id}
                onGet={() => get(item)}
                onWear={() => wear(item)}
              />

              {/* Whoever made it can move it after the fact, and take it
                  back out of the shop. */}
              {tab === 'mine' && item.mine && (
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={faUpload}
                    onClick={() => {
                      setImage(styleImage(item.image_path))
                      setPlace({
                        x: item.x, y: item.y, width: item.width,
                        rotation: item.rotation, flipped: item.flipped, layer: item.layer,
                      })
                      setDetails({
                        name: item.name, description: '', slot: item.slot,
                        price: String(item.price),
                      })
                      setMaking(true)
                    }}
                  >
                    Copy its placing
                  </Button>
                  {item.is_public && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={faEyeSlash}
                      onClick={() => setRetiring(item)}
                    >
                      Take down
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------ the studio */}

      <Dialog
        open={making}
        onClose={() => setMaking(false)}
        title="Make something to wear"
        description="Upload the picture, put it where it belongs, and set what it costs."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setMaking(false)} disabled={publishing}>
              Never mind
            </Button>
            <Button onClick={publish} disabled={publishing || !image || !details.name.trim()}>
              Put it in the shop
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={file}
              type="file"
              accept="image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="subtle"
              icon={faUpload}
              onClick={() => file.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading' : image ? 'Change the picture' : 'Upload a picture'}
            </Button>
            {image && (
              <Button variant="ghost" icon={faXmark} onClick={() => setImage(null)}>
                Clear
              </Button>
            )}
            <p className="text-xs text-muted">
              A PNG with a see through background sits best.
            </p>
          </div>

          <StyleStudio image={image} place={place} onPlace={setPlace} face={face} />

          <StyleDetails
            name={details.name}
            description={details.description}
            slot={details.slot}
            price={details.price}
            onChange={(patch) => setDetails((all) => ({ ...all, ...patch }))}
          />
        </div>
      </Dialog>

      <Confirm
        open={!!retiring}
        onClose={() => setRetiring(null)}
        onConfirm={async () => {
          if (!retiring) return
          try {
            await retireStyleItem(retiring.id)
            toast(`${retiring.name} is out of the shop.`, 'success')
            shop.reload()
            mine.reload()
          } catch (err) {
            toast(err instanceof Error ? err.message : 'That did not work.', 'error')
          }
        }}
        title={`Take ${retiring?.name ?? 'it'} down?`}
        lead="It leaves the shop, and nobody new can get it."
        points={[
          'Everybody who already has it keeps it, and keeps wearing it.',
          'You can put it back up later.',
        ]}
        confirmText="Take it down"
        icon={faEyeSlash}
      />

      {/* Moving your own thing about once it is up, without leaving the page. */}
      {tab === 'mine' && (
        <MineStudio items={mine.data ?? []} face={face} onMove={moveOwn} />
      )}
    </Page>
  )
}

/**
 * The placement of something you made, changed after the fact. Everybody
 * wearing it moves with it, which is the point of keeping the placement on
 * the thing rather than on each person.
 */
function MineStudio({
  items, face, onMove,
}: {
  items: StyleItem[]
  face: string | null
  onMove: (item: StyleItem, place: Placement) => void
}) {
  const own = items.filter((one) => one.mine)
  const [editing, setEditing] = useState<StyleItem | null>(null)
  const [place, setPlace] = useState<Placement>({ ...startingPlace })

  if (!own.length) return null

  return (
    <section className="rounded-2xl border border-ink-line bg-ink-card p-4">
      <h2 className="font-display text-lg font-extrabold">Things you made</h2>
      <p className="mt-1 text-sm text-muted">
        Move one and it moves on everybody wearing it.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {own.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={editing?.id === item.id ? 'primary' : 'subtle'}
            onClick={() => {
              setEditing(item)
              setPlace({
                x: item.x, y: item.y, width: item.width,
                rotation: item.rotation, flipped: item.flipped, layer: item.layer,
              })
            }}
          >
            {item.name}
          </Button>
        ))}
      </div>

      {editing && (
        <div className="mt-4 space-y-4">
          <StyleStudio
            image={styleImage(editing.image_path)}
            place={place}
            onPlace={setPlace}
            face={face}
          />
          <div className="flex gap-2">
            <Button onClick={() => onMove(editing, place)}>Save where it sits</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Done</Button>
          </div>
        </div>
      )}
    </section>
  )
}
