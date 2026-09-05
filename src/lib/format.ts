export function pct(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`
}

export function percentPoints(value: number, digits = 0) {
  return Number((value * 100).toFixed(digits))
}

export function compactDelta(value: number, digits = 0) {
  const points = value * 100
  const sign = points > 0 ? "+" : ""
  return `${sign}${points.toFixed(digits)}%`
}

export function winRateCompare(delta: number) {
  const points = Math.round(Math.abs(delta) * 100)
  if (delta > 0) return `${points}% higher`
  if (delta < 0) return `${points}% lower`
  return "about the same"
}

export function periodTitle(period: "90" | "180" | "365" | "all") {
  if (period === "90") return "Last 90 days"
  if (period === "180") return "Last 180 days"
  if (period === "365") return "Last 12 months"
  return "All time"
}

export function periodTitleLower(period: "90" | "180" | "365" | "all") {
  return periodTitle(period).toLowerCase()
}

export function formatCount(n: number) {
  return n.toLocaleString("en-US")
}

export function formatDays(days: number | null) {
  if (days === null || Number.isNaN(days)) return "—"
  const rounded = Math.round(days)
  return `${rounded} day${rounded === 1 ? "" : "s"}`
}
