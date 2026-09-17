import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faImage, faMusic, faVideo, faFont, faCube, faCircleCheck, faThumbsUp, faHandPointUp, faCheck,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { useSignedUrl } from '@/hooks/useSignedUrl'
import { formatCount } from '@/lib/format'
import type { AssetKind, MarketAsset } from '@/types/db'
import { Tooltip } from '@/components/ui/Tooltip'
import { Kube } from '@/components/brand/Kube'

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

export function AssetTile({ item, owned }: { item: MarketAsset; owned?: boolean }) {
  const preview = useSignedUrl(item.thumbnail_path ?? (item.kind === 'image' ? item.file_path : null))
  const tag = contentTag(item.kind, item.content_id)

  return (
    <Tooltip
      label={item.price ? `${item.name} · ${item.price} Kubes` : `${item.name} · free`}
      side="top"
    >
    <Link
      to={tag ? `/create/${tag}` : '/create'}
      className="block overflow-hidden rounded-xl border border-ink-line bg-ink-card transition-colors hover:border-brand/60">
      <div className="relative grid aspect-square place-items-center overflow-hidden bg-media">
        {preview ? (
          <img
            src={preview}
            alt=""
            loading="lazy"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="h-full w-full select-none object-cover"
          />
        ) : (
          <FontAwesomeIcon icon={kindIcons[item.kind]} className="text-3xl text-white/35" />
        )}
        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#fff]/85">
          {kindLabels[item.kind]}
        </span>
        {owned && (
          <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md bg-space text-[11px] text-[#fff]">
            <FontAwesomeIcon icon={faCheck} />
          </span>
        )}
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
          {typeof item.score === 'number' && item.score !== null ? (
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={faThumbsUp} />
              {item.score}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={faHandPointUp} />
              {formatCount(item.download_count)}
            </span>
          )}
          {item.price ? (
            <span className="inline-flex items-center gap-1 font-bold text-link">
              <Kube />
              {formatCount(item.price)}
            </span>
          ) : (
            <span className="font-mono">{tag}</span>
          )}
        </p>
      </div>
    </Link>
    </Tooltip>
  )
}
