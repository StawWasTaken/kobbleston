import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { defaultAvatars } from '@/lib/avatars'
import { cn } from '@/lib/cn'

/** Leaving this alone is fine: signup hands out a random one. */
export function AvatarPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">
        Picture <span className="font-medium normal-case text-white/30">optional, we pick one otherwise</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {defaultAvatars.map((src, i) => {
          const active = value === src
          return (
            <button
              key={src}
              type="button"
              aria-label={`Picture ${i + 1}`}
              aria-pressed={active}
              onClick={() => onChange(active ? '' : src)}
              className={cn(
                'relative h-11 w-11 overflow-hidden rounded-lg border-2 transition-colors',
                active ? 'border-brand-bright' : 'border-transparent hover:border-white/25',
              )}
            >
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
              {active && (
                <span className="absolute inset-0 grid place-items-center bg-brand/60 text-xs text-white">
                  <FontAwesomeIcon icon={faCheck} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
