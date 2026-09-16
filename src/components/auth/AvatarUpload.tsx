import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera, faXmark } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/cn'

export const MAX_AVATAR_BYTES = 4 * 1024 * 1024

/**
 * Optional at signup. Leaving it empty is a real choice: the account gets one
 * of the Kobby pictures instead, and it can be changed later in settings.
 */
export function AvatarUpload({
  file,
  onChange,
  note = 'Leave it empty and we will give you one.',
  className,
}: {
  file: File | null
  onChange: (next: File | null) => void
  note?: string
  className?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pick = (chosen: File | null) => {
    if (!chosen) return
    if (!chosen.type.startsWith('image/')) {
      setError('Pictures only.')
      return
    }
    if (chosen.size > MAX_AVATAR_BYTES) {
      setError('That image is over 4 MB.')
      return
    }
    setError(null)
    onChange(chosen)
  }

  return (
    <fieldset className={className}>
      <legend className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">
        Picture <span className="font-medium normal-case text-white/30">optional</span>
      </legend>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={cn(
            'group relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-dashed transition-colors',
            preview ? 'border-transparent' : 'border-ink-line hover:border-brand/70 hover:bg-ink-hover',
          )}
          aria-label={preview ? 'Change your picture' : 'Upload a picture'}
        >
          {preview ? (
            <>
              <img src={preview} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 grid place-items-center bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <FontAwesomeIcon icon={faCamera} />
              </span>
            </>
          ) : (
            <FontAwesomeIcon icon={faCamera} className="text-white/35" />
          )}
        </button>

        <div className="min-w-0">
          <p className="text-sm text-white/70">
            {file ? file.name : 'Upload a picture'}
          </p>
          <p className="mt-0.5 text-xs text-muted">{error ?? note}</p>
          {file && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white"
            >
              <FontAwesomeIcon icon={faXmark} /> Remove
            </button>
          )}
        </div>
      </div>

      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="sr-only"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
    </fieldset>
  )
}
