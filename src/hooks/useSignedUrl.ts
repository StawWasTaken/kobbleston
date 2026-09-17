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
 * Takes whatever a Space stored for a picture: a plain URL, or a reference
 * to a piece of Create content by its ID. Either way you get something you
 * can put in a src.
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
