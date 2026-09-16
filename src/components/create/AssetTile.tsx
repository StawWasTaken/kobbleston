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

export function AssetTile({ item }: { item: MarketAsset }) {
  const preview = item.thumbnail_path ?? (item.kind === 'image' ? item.file_path : null)

  return (
    <article className="overflow-hidden rounded-xl border border-ink-line bg-ink-card transition-colors hover:border-brand/60">
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
        <Link
          to={`/u/${item.creator_username}`}
          className="mt-1 flex items-center gap-1.5 text-xs text-muted hover:text-white"
        >
          <span className="truncate">{item.creator_display_name}</span>
          {item.creator_is_admin && (
            <FontAwesomeIcon
              icon={faCircleCheck}
              className="shrink-0 text-[#4d68ff]"
              title="Verified Kobbleston upload"
              aria-label="Verified"
            />
          )}
        </Link>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/40">
          <FontAwesomeIcon icon={faDownload} />
          {formatCount(item.download_count)}
        </p>
      </div>
    </article>
  )
}
