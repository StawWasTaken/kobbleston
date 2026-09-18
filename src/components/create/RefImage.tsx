import { useAssetRef } from '@/hooks/useSignedUrl'
import { cn } from '@/lib/cn'

/**
 * An image whose source may be a link or a reference to Create content by
 * its ID. Never draggable, never right-clickable: what is shown is used, not
 * taken.
 */
export function RefImage({
  value, alt, className, fallback, style,
}: {
  value?: string | null
  alt: string
  className?: string
  fallback?: string
  style?: React.CSSProperties
}) {
  const url = useAssetRef(value) ?? fallback ?? null
  if (!url) return null
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      style={style}
      className={cn('select-none', className)}
    />
  )
}
