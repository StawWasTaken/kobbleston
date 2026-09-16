import { Picker } from '@/components/ui/Picker'

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const thisYear = new Date().getFullYear()
const years = Array.from({ length: 90 }, (_, i) => String(thisYear - i))

function daysIn(month: number, year: number) {
  if (!month) return 31
  return new Date(year || 2000, month, 0).getDate()
}

export type Birthday = { day: string; month: string; year: string }

export const emptyBirthday: Birthday = { day: '', month: '', year: '' }

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
  const dayCount = daysIn(Number(value.month), Number(value.year))

  // A shorter month clears a day that no longer exists rather than quietly
  // holding an impossible date.
  const setMonth = (month: string) => {
    const limit = daysIn(Number(month), Number(value.year))
    onChange({ ...value, month, day: Number(value.day) > limit ? '' : value.day })
  }

  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Birthday</legend>
      <div className="grid grid-cols-[1.5fr_1fr_1.1fr] gap-2">
        <Picker
          label="Birth month"
          placeholder="Month"
          value={value.month}
          invalid={Boolean(error)}
          columns={2}
          onChange={setMonth}
          options={months.map((name, i) => ({ value: String(i + 1), label: name.slice(0, 3) }))}
        />
        <Picker
          label="Birth day"
          placeholder="Day"
          value={value.day}
          invalid={Boolean(error)}
          columns={4}
          onChange={(day) => onChange({ ...value, day })}
          options={Array.from({ length: dayCount }, (_, i) => ({
            value: String(i + 1),
            label: String(i + 1),
          }))}
        />
        <Picker
          label="Birth year"
          placeholder="Year"
          value={value.year}
          invalid={Boolean(error)}
          onChange={(year) => onChange({ ...value, year })}
          options={years.map((y) => ({ value: y, label: y }))}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </fieldset>
  )
}
