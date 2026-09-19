import { Link } from 'react-router-dom'
import { Price } from '@/components/brand/Currency'
import { FaceStage } from '@/components/style/FaceStage'
import { asWorn, styleTag } from '@/lib/api'
import type { StyleItem } from '@/lib/api'
import { defaultAvatars } from '@/lib/avatars'

/**
 * A row of things to wear, each on a face. Used under an item and anywhere
 * else a handful of them belong side by side.
 */
export function StyleRow({
  items, face, name,
}: {
  items: StyleItem[]
  face?: string | null
  name: string
}) {
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 kob-scroll">
      {items.map((item, i) => (
        <Link
          key={item.id}
          to={`/style/${styleTag(item.content_id)}`}
          className="group w-36 shrink-0 overflow-hidden rounded-2xl border border-ink-line bg-ink-raised transition-colors hover:border-brand/60"
        >
          <span className="grid aspect-square place-items-center p-5">
            <FaceStage
              src={face ?? defaultAvatars[i % defaultAvatars.length]}
              name={name}
              items={[asWorn(item)]}
              className="w-full transition-transform duration-200 group-hover:scale-[1.04]"
            />
          </span>
          <span className="block border-t border-ink-line p-2.5">
            <span className="block truncate text-xs font-bold">{item.name}</span>
            <Price amount={item.price} className="mt-0.5 text-xs font-extrabold text-muted" />
          </span>
        </Link>
      ))}
    </div>
  )
}
