export function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  const period = h < 12 ? "AM" : "PM"
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${displayH}:${String(min).padStart(2, "0")} ${period}`
}


export function timeToMinutes(t: string): number | null {
  const match = t.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return h * 60 + m
}


export type FieldResult = { value: number; error?: undefined } | { value?: undefined; error: string }


// One parser for both time inputs, so start and end are validated the same way.
export function parseTimeField(text: string, label: string, example: string): FieldResult {
  if (!text) return { error: `Enter ${label} time (HH:MM).` }
  const value = timeToMinutes(text)
  if (value === null) return { error: `Invalid time format. Use HH:MM (e.g. ${example}).` }
  return { value }
}
