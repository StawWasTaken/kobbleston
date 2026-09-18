import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { UploadDialog } from '@/components/create/UploadDialog'
import { contentTag } from '@/components/create/AssetTile'
import { useToast } from '@/components/ui/Toast'
import type { AssetKind } from '@/types/db'

/**
 * Where a picture, a sound or a clip comes from.
 *
 * Content is used by its number, never copied, so this is a box you type a
 * number into. Nobody should have to go and find that number first, so the
 * same field can upload: what comes back goes into your inventory in Create
 * the way any upload does, and its number lands in the box by itself.
 */
export function AssetField({
  label, kind, value, onChange,
}: {
  label: string
  kind: AssetKind
  value: string
  onChange: (tag: string) => void
}) {
  const toast = useToast()
  const [uploading, setUploading] = useState(false)

  const tidy = value.trim().toUpperCase().replace(/^KOB:\/\//, '')
  const looksRight = /^[A-Z]{3}-\d+$/.test(tidy)

  return (
    <div>
      <Input
        label={label}
        labelNote={`a ${kind} from Create`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={kind === 'image' ? 'IMG-1042' : kind === 'audio' ? 'SND-1033' : 'VID-1020'}
        hint={
          value && !looksRight
            ? 'A number looks like IMG-1042.'
            : 'Type a number, or upload something and it fills itself in.'
        }
      />

      <div className="mt-2 flex items-center gap-2">
        <Button size="sm" variant="subtle" icon={faUpload} onClick={() => setUploading(true)}>
          Upload
        </Button>

        {!!value && (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold ${
              looksRight ? 'text-space-bright' : 'text-danger'
            }`}
          >
            <FontAwesomeIcon icon={looksRight ? faCircleCheck : faCircleXmark} />
            {looksRight ? tidy : 'Not a number'}
          </span>
        )}
      </div>

      <UploadDialog
        open={uploading}
        onClose={() => setUploading(false)}
        only={kind}
        onUploaded={(created) => {
          if (!created) return
          const tag = contentTag(created.kind, created.content_id)
          if (!tag) {
            toast('Uploaded. It has no number yet, so give it a moment.', 'info')
            return
          }
          onChange(tag)
          toast(
            created.status === 'approved'
              ? `${tag} is in your inventory and on the page.`
              : `${tag} is on the page. It goes live once it has been looked at.`,
            'success',
          )
        }}
      />
    </div>
  )
}
