import { useId } from 'react'

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const field =
  'h-10 rounded-lg border border-ink-line bg-ink-raised px-2.5 text-sm text-white ' +
  'transition-colors focus:border-brand-bright'

const thisYear = new Date().getFullYear()
const years = Array.from({ length: 90 }, (_, i) => thisYear - i)

function daysIn(month: number, year: number) {
  if (!month || !year) return 31
  return new Date(year, month, 0).getDate()
}

export type Birthday = { day: string; month: string; year: string }

export const birthdayToDate = (b: Birthday) =>
  b.day && b.month && b.year
    ? `${b.year}-${b.month.padStart(2, '0')}-${b.day.padStart(2, '0')}`
    : ''

export function BirthdayPicker({
  value,
  onChange,
  error,
}: {
  value: Birthday
  onChange: (next: Birthday) => void
  error?: string | null
}) {
  const id = useId()
  const dayCount = daysIn(Number(value.month), Number(value.year))

  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Birthday</legend>
      <div className="grid grid-cols-[1.4fr_1fr_1.2fr] gap-2">
        <label className="sr-only" htmlFor={`${id}-month`}>Month</label>
        <select
          id={`${id}-month`}
          className={field}
          value={value.month}
          onChange={(e) => onChange({ ...value, month: e.target.value })}
          required
        >
          <option value="">Month</option>
          {months.map((name, i) => (
            <option key={name} value={String(i + 1)}>{name}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor={`${id}-day`}>Day</label>
        <select
          id={`${id}-day`}
          className={field}
          value={value.day}
          onChange={(e) => onChange({ ...value, day: e.target.value })}
          required
        >
          <option value="">Day</option>
          {Array.from({ length: dayCount }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor={`${id}-year`}>Year</label>
        <select
          id={`${id}-year`}
          className={field}
          value={value.year}
          onChange={(e) => onChange({ ...value, year: e.target.value })}
          required
        >
          <option value="">Year</option>
          {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </fieldset>
  )
}
