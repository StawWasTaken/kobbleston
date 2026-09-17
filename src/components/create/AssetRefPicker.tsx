import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHashtag, faUpload, faXmark, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { useAssetRef } from '@/hooks/useSignedUrl'
import { assetRefTag, getAsset, isAssetRef, listUsableAssets, recordAssetEvent, uploadAsset } from '@/lib/api'
import { contentTag } from './AssetTile'
import { cn } from '@/lib/cn'
import type { AssetKind } from '@/types/db'

const MAX_BYTES = 25 * 1024 * 1024

/** One thing you are allowed to use, as a square you can pick. */
function LibraryTile({ path, name, tag, onPick }: {
  path: string
  name: string
  tag: string
  onPick: () => void
}) {
  const url = useAssetRef(`kob://${tag}`)
  return (
    <button
      type="button"
      onClick={onPick}
      title={`${name} · ${tag}`}
      className="group overflow-hidden rounded-lg border border-ink-line bg-ink-raised transition-colors hover:border-brand/70"
    >
      <span className="grid aspect-square place-items-center overflow-hidden bg-brand-ink">
        {url
          ? <img src={url} alt="" draggable={false} className="h-full w-full select-none object-cover" />
          : <Skeleton className="h-full w-full rounded-none" />}
      </span>
      <span className="block truncate px-1.5 py-1 text-[11px] font-mono text-muted">{tag}</span>
      <span className="sr-only">{name}</span>
      <span className="sr-only">{path}</span>
    </button>
  )
}

/**
 * How a picture gets into a Space: paste the ID of something in Create, pick
 * from what you are allowed to use, or upload a new file, which goes through
 * Create like any other upload and comes back with its own ID.
 *
 * What is stored is the reference, never a copy of the file.
 */
export function AssetRefPicker({
  value, onChange, kind = 'image', label, note,
}: {
  value: string | null
  onChange: (next: string | null) => void
  kind?: AssetKind
  label: string
  note?: string
}) {
  const { profile } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState<'ID' | 'Library' | 'Upload'>('ID')
  const [typed, setTyped] = useState('')
  const [pending, setPending] = useState(false)

  const preview = useAssetRef(value)
  const library = useAsync(
    async () => (tab === 'Library' ? (await listUsableAssets()).filter((a) => a.kind === kind) : []),
    [tab, kind],
  )

  const useTag = async (raw: string) => {
    const tag = raw.trim().toUpperCase()
    if (!/^[A-Z]{3}-\d+$/.test(tag)) {
      toast('An ID looks like IMG-1042.', 'error')
      return
    }
    setPending(true)
    try {
      const item = await getAsset(Number(tag.split('-')[1]))
      if (!item) { toast('Nothing carries that ID.', 'error'); return }
      if (item.kind !== kind) { toast(`${tag} is not ${kind === 'image' ? 'an image' : `a ${kind}`}.`, 'error'); return }
      if (!item.i_can_use) {
        toast('You are not allowed to use that one yet. Ask its creator on its page.', 'error')
        return
      }
      void recordAssetEvent(item.id, 'use')
      onChange(`kob://${tag}`)
      setTyped('')
      toast(`${tag} is in.`, 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    } finally {
      setPending(false)
    }
  }

  const upload = async (file: File) => {
    if (!profile) return
    if (file.size > MAX_BYTES) { toast('25 MB at most.', 'error'); return }
    setPending(true)
    try {
      const created = await uploadAsset({
        userId: profile.id,
        file,
        kind,
        name: file.name.replace(/\.[^.]+$/, '').slice(0, 60),
        description: '',
      })
      if (created.status !== 'approved') {
        toast('Uploaded. It is in review, so it cannot be used until it passes.', 'info')
        return
      }
      const tag = contentTag(created.kind, created.content_id)
      onChange(`kob://${tag}`)
      toast(`Uploaded as ${tag}.`, 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not upload.', 'error')
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>

      <div className="flex gap-4">
        <div className="relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-ink-line bg-ink-raised">
          {preview ? (
            <>
              <img src={preview} alt="" draggable={false} className="h-full w-full select-none object-cover" />
              <button
                type="button"
                onClick={() => onChange(null)}
                aria-label="Remove"
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-lg bg-ink/80 text-white/80 backdrop-blur hover:text-white"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </>
          ) : (
            <FontAwesomeIcon icon={faHashtag} className="text-xl text-white/25" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex gap-1.5">
            {(['ID', 'Library', 'Upload'] as const).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setTab(name)}
                aria-pressed={tab === name}
                className={cn(
                  'h-8 rounded-lg px-3 text-xs font-bold transition-colors',
                  tab === name ? 'bg-brand text-onbrand' : 'bg-ink-hover text-white/65 hover:text-white',
                )}
              >
                {name === 'ID' ? 'Paste an ID' : name === 'Library' ? 'What I can use' : 'Upload'}
              </button>
            ))}
          </div>

          {tab === 'ID' && (
            <div className="mt-2 flex gap-2">
              <Input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void useTag(typed) } }}
                placeholder="IMG-1042"
                aria-label="Content ID"
                className="flex-1"
              />
              <Button type="button" loading={pending} onClick={() => useTag(typed)}>Use</Button>
            </div>
          )}

          {tab === 'Library' && (
            <div className="mt-2">
              {library.loading && <Skeleton className="h-20" />}
              {!library.loading && !library.data?.length && (
                <p className="text-xs text-muted">
                  Nothing yet. Anything you upload, and anything Kobbleston publishes, shows up here.
                </p>
              )}
              {!!library.data?.length && (
                <div className="grid max-h-40 grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-6 kob-scroll">
                  {library.data.map((item) => {
                    const tag = contentTag(item.kind, item.content_id)
                    return (
                      <LibraryTile
                        key={item.id}
                        path={item.file_path}
                        name={item.name}
                        tag={tag}
                        onPick={() => { void recordAssetEvent(item.id, 'use'); onChange(`kob://${tag}`) }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'Upload' && (
            <div className="mt-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-ink-hover px-3 py-2 text-xs font-bold hover:bg-ink-line">
                <FontAwesomeIcon icon={faUpload} />
                {pending ? 'Uploading...' : 'Choose a file'}
                <input
                  type="file"
                  className="hidden"
                  accept={kind === 'image' ? 'image/png,image/jpeg,image/gif,image/webp,image/avif' : undefined}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void upload(file)
                    e.target.value = ''
                  }}
                />
              </label>
              <p className="mt-1.5 text-xs text-muted">
                It goes through Create like any other upload, gets its own ID, and lands in your
                uploads.
              </p>
            </div>
          )}

          {isAssetRef(value) && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <FontAwesomeIcon icon={faCircleCheck} className="text-space-bright" />
              Using <span className="font-mono text-link">{assetRefTag(value)}</span>
            </p>
          )}

          {note && <p className="mt-1.5 text-xs text-muted">{note}</p>}
        </div>
      </div>
    </div>
  )
}
