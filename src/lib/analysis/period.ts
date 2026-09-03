import { addDays, DAY_MS } from "@/lib/dates"
import type { HealthFilters } from "@/lib/navigation"
import type { PeriodWindow } from "@/lib/analysis/types"

export function periodDays(period: HealthFilters["period"]) {
  if (period === "90") return 90
  if (period === "180") return 180
  if (period === "365") return 365
  return null
}

export function periodWindow(period: HealthFilters["period"], asOf: Date): PeriodWindow {
  const days = periodDays(period)
  return {
    start: days === null ? null : addDays(asOf, -days),
    end: asOf,
  }
}

export function priorWindow(period: HealthFilters["period"], asOf: Date): PeriodWindow | null {
  const days = periodDays(period)
  if (days === null) return null
  return {
    start: addDays(asOf, -days * 2),
    end: addDays(asOf, -days),
  }
}

export function inWindow(date: Date, window: PeriodWindow) {
  if (date.getTime() >= window.end.getTime()) return false
  if (window.start && date.getTime() < window.start.getTime()) return false
  return true
}

export function windowLabel(period: HealthFilters["period"]) {
  if (period === "90") return "last 90 days"
  if (period === "180") return "last 180 days"
  if (period === "365") return "last 12 months"
  return "all time"
}

export { DAY_MS }
