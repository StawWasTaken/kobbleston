import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faImage, faMusic, faVideo, faFont, faCube, faCircleCheck, faDownload,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { assetUrl } from '@/lib/api'
import { formatCount } from '@/lib/format'
import type { AssetKind, MarketAsset } from '@/types/db'

export const kindIcons: Record<AssetKind, IconDefinition> = {
  image: faImage,
  audio: faMusic,
  video: faVideo,
  font: faFont,
  model: faCube,
}

export const kindLabels: Record<AssetKind, string> = {
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
  font: 'Font',
  model: 'Model',
}

const tagPrefix: Record<AssetKind, string> = {
  image: 'IMG', audio: 'SND', video: 'VID', font: 'FNT', model: 'MDL',
}

/** The number every piece of content carries, with its kind in front. */
export const contentTag = (kind: AssetKind, id: number | null) =>
  id ? `${tagPrefix[kind]}-${id}` : ''

export function AssetTile({ item }: { item: MarketAsset }) {
  const preview = item.thumbnail_path ?? (item.kind === 'image' ? item.file_path : null)
  const tag = contentTag(item.kind, item.content_id)

  return (
    <Link
      to={tag ? `/create/${tag}` : '/create'}
      className="block overflow-hidden rounded-xl border border-ink-line bg-ink-card transition-colors hover:border-brand/60">
      <div className="relative grid aspect-square place-items-center overflow-hidden bg-brand-ink">
        {preview ? (
          <img
            src={assetUrl(preview)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <FontAwesomeIcon icon={kindIcons[item.kind]} className="text-3xl text-white/35" />
        )}
        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/80">
          {kindLabels[item.kind]}
        </span>
      </div>

      <div className="p-3">
        <h3 className="truncate text-sm font-bold">{item.name}</h3>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <span className="truncate">{item.creator_display_name}</span>
          {item.creator_is_admin && (
            <FontAwesomeIcon
              icon={faCircleCheck}
              className="shrink-0 text-[#4d68ff]"
              title="Verified Kobbleston upload"
              aria-label="Verified"
            />
          )}
        </span>
        <p className="mt-2 flex items-center justify-between gap-2 text-[11px] text-white/40">
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faDownload} />
            {formatCount(item.download_count)}
          </span>
          <span className="font-mono">{tag}</span>
        </p>
      </div>
    </Link>
  )
}
