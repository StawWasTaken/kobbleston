import { useEffect, useState } from 'react'
import { assetUrl } from '@/lib/api'

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
