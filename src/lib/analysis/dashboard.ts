import { formatCount, formatDays, pct, pp } from "@/lib/format"
import { rankActions } from "@/lib/analysis/actions"
import {
  filterActivities,
  opportunityPlayPairs,
  playFindings,
  portfolioStats,
  prerequisiteFindings,
  signalFrequencies,
  signalTrend,
  stackingBuckets,
} from "@/lib/analysis/compute"
import { hygieneIssues } from "@/lib/analysis/hygiene"
import { periodWindow, priorWindow } from "@/lib/analysis/period"
import { assemblePulse } from "@/lib/analysis/pulse"
import type {
  AnalysisSnapshot,
  HealthAnalysis,
  PortfolioMetric,
} from "@/lib/analysis/types"
import type { HealthFilters } from "@/lib/navigation"

function metricDelta(current: number | null, prior: number | null) {
  if (current === null || prior === null) return null
  return current - prior
}

function formatSignedPct(value: number | null) {
  if (value === null) return null
  return pp(value, 0)
}

function formatSignedDays(value: number | null) {
  if (value === null) return null
  const rounded = Math.round(value)
  if (rounded === 0) return "unchanged"
  return `${rounded > 0 ? "+" : ""}${rounded}d`
}

export function analyzeHealth(
  snapshot: AnalysisSnapshot,
  filters: HealthFilters,
  asOf: Date
): HealthAnalysis {
  const window = periodWindow(filters.period, asOf)
  const previous = priorWindow(filters.period, asOf)
  const activities = filterActivities(snapshot, filters, window)
  const priorActivities = previous ? filterActivities(snapshot, filters, previous) : []
  const current = portfolioStats(snapshot, activities)
  const prior = previous ? portfolioStats(snapshot, priorActivities) : null
  const plays = playFindings(snapshot, activities)
  const prerequisites = prerequisiteFindings(snapshot, activities)
  const pairs = opportunityPlayPairs(snapshot, activities)
  const stacking = stackingBuckets(pairs)
  const hygiene = hygieneIssues(snapshot, activities, plays)
  const actions = rankActions({ plays, prerequisites, hygiene })

  const metrics: PortfolioMetric[] = [
    {
      id: "win-rate",
      label: "Closed win rate",
      value: current.winRate === null ? "—" : pct(current.winRate, 0),
      raw: current.winRate,
      prior: prior?.winRate === null || prior === null ? null : formatSignedPct(metricDelta(current.winRate, prior.winRate)),
      delta: metricDelta(current.winRate, prior?.winRate ?? null),
      definition: "Won opportunities divided by won plus lost. Open opportunities are excluded.",
      href: "/?modal=explorer",
    },
    {
      id: "cycle",
      label: "Median won cycle",
      value: formatDays(current.medianCycleDays),
      raw: current.medianCycleDays,
      prior:
        prior?.medianCycleDays === null || prior === null
          ? null
          : formatSignedDays(metricDelta(current.medianCycleDays, prior.medianCycleDays)),
      delta: metricDelta(current.medianCycleDays, prior?.medianCycleDays ?? null),
      definition: "Median days from opportunity created date to close date for won opportunities only.",
      href: "/?modal=explorer",
    },
    {
      id: "activities",
      label: "Sales activities",
      value: formatCount(current.activities),
      raw: current.activities,
      prior:
        prior === null ? null : formatSignedCount(current.activities - prior.activities),
      delta: prior === null ? null : current.activities - prior.activities,
      definition: "Individual sales activities in the selected period, including repeats and undefined work.",
      href: "/?modal=explorer",
    },
    {
      id: "exception-rate",
      label: "Activity exception rate",
      value: current.exceptionRate === null ? "—" : pct(current.exceptionRate, 0),
      raw: current.exceptionRate,
      prior:
        prior?.exceptionRate === null || prior === null
          ? null
          : formatSignedPct(metricDelta(current.exceptionRate, prior.exceptionRate)),
      delta: metricDelta(current.exceptionRate, prior?.exceptionRate ?? null),
      definition:
        "Share of defined activities with at least one missing success signal. Off-playbook activities are excluded.",
      href: "/?modal=explorer",
    },
    {
      id: "undefined",
      label: "Undefined activities",
      value: formatCount(current.undefinedActivities),
      raw: current.undefinedActivities,
      prior:
        prior === null ? null : formatSignedCount(current.undefinedActivities - prior.undefinedActivities),
      delta: prior === null ? null : current.undefinedActivities - prior.undefinedActivities,
      definition:
        "Activities that do not map to a formal active or historical sales-play definition.",
      href: "/?modal=explorer",
    },
  ]

  const stackingUseful = stacking.filter((item) => item.closedCount >= 15).length >= 2

  return {
    filters,
    window,
    priorWindow: previous,
    pulse: assemblePulse({
      exceptionRate: current.exceptionRate,
      definedActivities: current.definedActivities,
      closedOpportunities: current.closedOpportunities,
      plays,
      actions,
    }),
    metrics,
    plays,
    prerequisites,
    signalFrequencies: signalFrequencies(prerequisites),
    signalTrend: signalTrend(activities),
    stacking,
    stackingUseful,
    actions,
    hygiene,
    totals: {
      activities: current.activities,
      definedActivities: current.definedActivities,
      exceptionActivities: current.exceptionActivities,
      undefinedActivities: current.undefinedActivities,
      opportunities: current.opportunities,
      closedOpportunities: current.closedOpportunities,
    },
  }
}

function formatSignedCount(value: number) {
  if (value === 0) return "unchanged"
  return `${value > 0 ? "+" : ""}${formatCount(value)}`
}
