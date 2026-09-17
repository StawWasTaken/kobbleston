import { useEffect, useState } from 'react'
import { assetUrl, isAssetRef, resolveAssetRef } from '@/lib/api'

/**
 * Uploads are not publicly addressable, so a preview needs a signed URL that
 * expires. This asks for one and keeps it for as long as the thing is on
 * screen.
 */
export function useSignedUrl(path?: string | null) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    if (!path) { setUrl(null); return }
    assetUrl(path).then((next) => { if (live) setUrl(next) }).catch(() => {})
    return () => { live = false }
  }, [path])

  return url
}

/**
 * Takes whatever was stored for a picture. Emblems, covers, avatars and
 * thumbnails are ordinary uploads and come back untouched. A "kob://IMG-1042"
 * reference is Create content used inside a Space, and is resolved to a
 * short-lived link. Both forms go through here so a picture never has to
 * know which it is.
 */
export function useAssetRef(value?: string | null) {
  const [url, setUrl] = useState<string | null>(isAssetRef(value) ? null : value ?? null)

  useEffect(() => {
    let live = true
    if (!value) { setUrl(null); return }
    if (!isAssetRef(value)) { setUrl(value); return }
    setUrl(null)
    resolveAssetRef(value).then((next) => { if (live) setUrl(next) }).catch(() => {})
    return () => { live = false }
  }, [value])

  return url
}
