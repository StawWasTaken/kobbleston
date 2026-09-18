import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFont, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { Select } from '@/components/ui/Select'
import { useAsync } from '@/hooks/useAsync'
import { listInventory } from '@/lib/api'
import { contentTag } from '@/components/create/AssetTile'
import { BUILT_IN_FONT_LABELS } from '@/lib/blocks'

/**
 * Which font, out of the four the site comes with and the ones you own.
 *
 * A font is content like anything else: it has a number, it belongs to
 * whoever made it, and it can only be used by somebody who has it. So the
 * list here is your inventory, not a catalogue of everything that exists,
 * and the way to get more of them is to go and get them.
 */
export function FontField({
  label, value, onChange, inherit,
}: {
  label: string
  value: string
  onChange: (next: string) => void
  /** Text blocks may simply follow the page rather than choose for themselves. */
  inherit?: boolean
}) {
  const fonts = useAsync(() => listInventory('font'), [])

  const mine = (fonts.data ?? [])
    .map((asset) => ({ tag: contentTag(asset.kind, asset.content_id), name: asset.name }))
    .filter((one) => one.tag)

  return (
    <div>
      <Select
        label={label}
        value={value}
        onChange={onChange}
        options={[
          ...(inherit ? [{ value: '', label: 'Same as the page' }] : []),
          ...Object.entries(BUILT_IN_FONT_LABELS).map(([key, name]) => ({ value: key, label: name })),
          ...mine.map((one) => ({ value: one.tag, label: `${one.name} · ${one.tag}` })),
        ]}
      />

      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
        <FontAwesomeIcon icon={faFont} />
        {mine.length
          ? `${mine.length} ${mine.length === 1 ? 'font' : 'fonts'} of yours`
          : 'You own no fonts yet'}
        <Link
          to="/create/marketplace?kind=font"
          className="inline-flex items-center gap-1 font-bold text-link hover:underline"
        >
          Get more
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[9px]" />
        </Link>
      </p>
    </div>
  )
}
