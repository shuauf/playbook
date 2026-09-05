const DAY_MS = 86_400_000

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function parseIsoDate(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    const date = new Date(year, month - 1, day)
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null
    }
    return date
  }
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export function formatIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatDisplayDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function daysBetween(from: Date, to: Date) {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS)
}

export function daysUntil(isoDate: string, asOf = new Date()) {
  return daysBetween(asOf, new Date(`${isoDate}T00:00:00`))
}

export const PLAY_REVIEW_CADENCE_DAYS = 90

/** Full ring = review is imminent. Empty ring = a full cadence remains. */
export function hygieneUrgencyFill(daysLeft: number, cadenceDays = PLAY_REVIEW_CADENCE_DAYS) {
  if (daysLeft <= 0) return 100
  if (daysLeft >= cadenceDays) return 0
  return Math.round((1 - daysLeft / cadenceDays) * 100)
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export { DAY_MS }
