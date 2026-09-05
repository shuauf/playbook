import { daysBetween } from "@/lib/dates"
import { classifyConfidence, median } from "@/lib/analysis/confidence"
import { inWindow } from "@/lib/analysis/period"
import type {
  AnalysisActivity,
  AnalysisOpportunity,
  AnalysisSnapshot,
  CycleComparison,
  PerformanceTrendPoint,
  PeriodWindow,
  PlayFinding,
  PrerequisiteFinding,
  RateComparison,
  StackingBucket,
} from "@/lib/analysis/types"
import type { HealthFilters } from "@/lib/navigation"

export function activityHasException(activity: AnalysisActivity) {
  return activity.captureKind === "defined" && activity.unmetKeys.length > 0
}

export function matchesActivityFilters(
  activity: AnalysisActivity,
  opportunity: AnalysisOpportunity | undefined,
  filters: HealthFilters
) {
  if (!opportunity) return false
  if (filters.playId !== "all") {
    if (filters.playId === "undefined") {
      if (activity.captureKind !== "undefined") return false
    } else if (activity.playId !== filters.playId) {
      return false
    }
  }
  if (filters.stage !== "all" && activity.stageAtActivity !== filters.stage) return false
  if (filters.segment !== "all" && opportunity.segment !== filters.segment) return false
  if (filters.team !== "all" && opportunity.team !== filters.team) return false
  if (filters.se !== "all" && activity.seName !== filters.se) return false
  if (filters.outcome !== "all" && opportunity.outcome !== filters.outcome) return false
  return true
}

export function filterActivities(
  snapshot: AnalysisSnapshot,
  filters: HealthFilters,
  window: PeriodWindow
) {
  const opportunities = new Map(snapshot.opportunities.map((item) => [item.id, item]))
  return snapshot.activities.filter((activity) => {
    if (!inWindow(activity.activityDate, window)) return false
    return matchesActivityFilters(activity, opportunities.get(activity.opportunityId), filters)
  })
}

export type OpportunityPlayPair = {
  key: string
  opportunity: AnalysisOpportunity
  playId: string
  playName: string
  activities: AnalysisActivity[]
  hasException: boolean
  unmetCount: number
  unmetKeys: Set<string>
}

export function opportunityPlayPairs(
  snapshot: AnalysisSnapshot,
  activities: AnalysisActivity[]
): OpportunityPlayPair[] {
  const opportunities = new Map(snapshot.opportunities.map((item) => [item.id, item]))
  const groups = new Map<string, OpportunityPlayPair>()
  for (const activity of activities) {
    if (activity.captureKind !== "defined" || !activity.playId) continue
    const opportunity = opportunities.get(activity.opportunityId)
    if (!opportunity) continue
    const key = `${opportunity.id}::${activity.playId}`
    const existing = groups.get(key)
    if (existing) {
      existing.activities.push(activity)
      if (activityHasException(activity)) existing.hasException = true
      existing.unmetCount = Math.max(existing.unmetCount, activity.unmetKeys.length)
      for (const unmet of activity.unmetKeys) existing.unmetKeys.add(unmet)
      continue
    }
    groups.set(key, {
      key,
      opportunity,
      playId: activity.playId,
      playName: activity.playName,
      activities: [activity],
      hasException: activityHasException(activity),
      unmetCount: activity.unmetKeys.length,
      unmetKeys: new Set(activity.unmetKeys),
    })
  }
  return [...groups.values()]
}

function winRate(closed: Array<{ outcome: string }>) {
  const decided = closed.filter((item) => item.outcome === "won" || item.outcome === "lost")
  if (decided.length === 0) return null
  return decided.filter((item) => item.outcome === "won").length / decided.length
}

function cycleDays(opportunity: AnalysisOpportunity) {
  if (opportunity.outcome !== "won" || !opportunity.closeDate) return null
  return daysBetween(opportunity.createdAt, opportunity.closeDate)
}

export function rateComparison(
  met: AnalysisOpportunity[],
  unmet: AnalysisOpportunity[]
): RateComparison {
  const metClosed = met.filter((item) => item.outcome === "won" || item.outcome === "lost")
  const unmetClosed = unmet.filter((item) => item.outcome === "won" || item.outcome === "lost")
  const metWins = metClosed.filter((item) => item.outcome === "won").length
  const unmetWins = unmetClosed.filter((item) => item.outcome === "won").length
  const metRate = winRate(metClosed)
  const unmetRate = winRate(unmetClosed)
  return {
    metRate,
    unmetRate,
    difference:
      metRate === null || unmetRate === null ? null : metRate - unmetRate,
    metN: metClosed.length,
    unmetN: unmetClosed.length,
    metWins,
    unmetWins,
    confidence: classifyConfidence(metClosed.length, unmetClosed.length, {
      metWins,
      unmetWins,
    }),
  }
}

export function cycleComparison(
  met: AnalysisOpportunity[],
  unmet: AnalysisOpportunity[]
): CycleComparison {
  const metWon = met
    .map(cycleDays)
    .filter((value): value is number => value !== null)
  const unmetWon = unmet
    .map(cycleDays)
    .filter((value): value is number => value !== null)
  const metDays = median(metWon)
  const unmetDays = median(unmetWon)
  return {
    metDays,
    unmetDays,
    differenceDays:
      metDays === null || unmetDays === null ? null : unmetDays - metDays,
    metN: metWon.length,
    unmetN: unmetWon.length,
    confidence: classifyConfidence(metWon.length, unmetWon.length),
  }
}

export function playFindings(
  snapshot: AnalysisSnapshot,
  activities: AnalysisActivity[]
): PlayFinding[] {
  const pairs = opportunityPlayPairs(snapshot, activities)
  return snapshot.plays.map((play) => {
    const playActivities = activities.filter((item) => item.playId === play.id)
    const defined = playActivities.filter((item) => item.captureKind === "defined")
    const exceptions = defined.filter(activityHasException)
    const playPairs = pairs.filter((item) => item.playId === play.id)
    const met = playPairs.filter((item) => !item.hasException).map((item) => item.opportunity)
    const unmet = playPairs.filter((item) => item.hasException).map((item) => item.opportunity)
    const closed = playPairs.filter(
      (item) => item.opportunity.outcome === "won" || item.opportunity.outcome === "lost"
    )
    return {
      playId: play.id,
      playName: play.name,
      activityCount: playActivities.length,
      opportunityCount: new Set(playActivities.map((item) => item.opportunityId)).size,
      closedOpportunityCount: closed.length,
      exceptionRate: defined.length === 0 ? null : exceptions.length / defined.length,
      exceptionCount: exceptions.length,
      definedActivityCount: defined.length,
      win: rateComparison(met, unmet),
      cycle: cycleComparison(met, unmet),
    }
  })
}

export function prerequisiteFindings(
  snapshot: AnalysisSnapshot,
  activities: AnalysisActivity[]
): PrerequisiteFinding[] {
  const pairs = opportunityPlayPairs(snapshot, activities)
  const allKeys = new Map<string, { playId: string; playName: string; key: string }>()
  for (const activity of activities) {
    if (!activity.playId || activity.captureKind !== "defined") continue
    for (const key of activity.evaluatedKeys) {
      allKeys.set(`${activity.playId}:${key}`, {
        playId: activity.playId,
        playName: activity.playName,
        key,
      })
    }
  }

  return [...allKeys.values()].map((item) => {
    const playPairs = pairs.filter((pair) => pair.playId === item.playId)
    const relevant = playPairs.filter((pair) =>
      pair.activities.some((activity) => activity.evaluatedKeys.includes(item.key))
    )
    const met = relevant
      .filter((pair) => !pair.unmetKeys.has(item.key))
      .map((pair) => pair.opportunity)
    const unmet = relevant
      .filter((pair) => pair.unmetKeys.has(item.key))
      .map((pair) => pair.opportunity)
    const closed = relevant.filter(
      (pair) => pair.opportunity.outcome === "won" || pair.opportunity.outcome === "lost"
    )
    const withKey = activities.filter(
      (activity) => activity.playId === item.playId && activity.evaluatedKeys.includes(item.key)
    )
    const unmetActivities = withKey.filter((activity) => activity.unmetKeys.includes(item.key))
    return {
      playId: item.playId,
      playName: item.playName,
      key: item.key,
      text: prerequisiteLabel(item.key),
      activityCount: withKey.length,
      closedOpportunityCount: closed.length,
      unmetRate: withKey.length === 0 ? null : unmetActivities.length / withKey.length,
      win: rateComparison(met, unmet),
      cycle: cycleComparison(met, unmet),
    }
  })
}

const PREREQUISITE_LABELS: Record<string, string> = {
  "demo-discovery": "Use case tied to a measurable outcome",
  "demo-problem": "Business problem confirmed",
  "demo-champion": "Champion identified",
  "discovery-aligned": "Current-state workflow mapped",
  "discovery-problem": "Business problem confirmed",
  "discovery-owner": "Process owner identified",
  "arch-risks": "Automation and integration risks identified",
  "arch-stakeholder": "Technical stakeholder engaged",
  "arch-path": "System-of-record path confirmed",
  "workshop-agenda": "Session outcomes agreed",
  "workshop-workflow": "Target workflow selected for mapping",
  "poc-criteria": "Success criteria agreed with customer",
  "poc-technical": "Technical stakeholder engaged",
}

export function signalFrequencies(findings: PrerequisiteFinding[]) {
  return findings
    .map((item) => ({
      key: item.key,
      label: item.text,
      playName: item.playName,
      metRate: item.unmetRate === null ? 0 : 1 - item.unmetRate,
    }))
    .sort((a, b) => a.metRate - b.metRate)
}

export function playPerformanceTrend(
  snapshot: AnalysisSnapshot,
  activities: AnalysisActivity[],
  playId?: string
): PerformanceTrendPoint[] {
  const scoped = playId
    ? activities.filter((activity) => activity.playId === playId)
    : activities
  const opportunities = new Map(snapshot.opportunities.map((item) => [item.id, item]))
  const buckets = new Map<
    string,
    { sort: number; defined: number; exceptions: number; won: number; lost: number; cycles: number[] }
  >()

  function bucket(date: Date) {
    const sort = date.getFullYear() * 12 + date.getMonth()
    const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const existing = buckets.get(label)
    if (existing) return existing
    const created = { sort, defined: 0, exceptions: 0, won: 0, lost: 0, cycles: [] as number[] }
    buckets.set(label, created)
    return created
  }

  for (const activity of scoped) {
    const month = bucket(activity.activityDate)
    if (activity.captureKind !== "defined") continue
    month.defined += 1
    if (activityHasException(activity)) month.exceptions += 1
  }

  const latestActivity = new Map<string, Date>()
  for (const activity of scoped) {
    const previous = latestActivity.get(activity.opportunityId)
    if (!previous || activity.activityDate > previous) {
      latestActivity.set(activity.opportunityId, activity.activityDate)
    }
  }

  const counted = new Set<string>()
  for (const activity of scoped) {
    const opportunity = opportunities.get(activity.opportunityId)
    if (!opportunity) continue
    if (opportunity.outcome !== "won" && opportunity.outcome !== "lost") continue
    if (counted.has(opportunity.id)) continue
    const at = latestActivity.get(opportunity.id)
    if (!at) continue
    counted.add(opportunity.id)
    const month = bucket(at)
    if (opportunity.outcome === "won") {
      month.won += 1
      const days = cycleDays(opportunity)
      if (days !== null) month.cycles.push(days)
    } else {
      month.lost += 1
    }
  }

  return [...buckets.entries()]
    .sort((a, b) => a[1].sort - b[1].sort)
    .slice(-6)
    .map(([label, month]) => {
      const closed = month.won + month.lost
      return {
        label,
        winRate: closed === 0 ? null : month.won / closed,
        exceptionRate: month.defined === 0 ? null : month.exceptions / month.defined,
        cycleDays: month.cycles.length === 0 ? null : median(month.cycles),
        closedCount: closed,
        definedCount: month.defined,
      }
    })
}

export function signalTrend(activities: AnalysisActivity[]) {
  const defined = activities.filter(
    (activity) => activity.captureKind === "defined" && activity.evaluatedKeys.length > 0
  )
  const buckets = new Map<string, { met: number; total: number; sort: number }>()
  for (const activity of defined) {
    const year = activity.activityDate.getFullYear()
    const month = activity.activityDate.getMonth()
    const key = `${year}-${String(month + 1).padStart(2, "0")}`
    const bucket = buckets.get(key) ?? { met: 0, total: 0, sort: year * 12 + month }
    bucket.total += 1
    if (activity.unmetKeys.length === 0) bucket.met += 1
    buckets.set(key, bucket)
  }
  return [...buckets.entries()]
    .sort((a, b) => a[1].sort - b[1].sort)
    .slice(-6)
    .map(([label, bucket]) => ({
      label,
      metRate: bucket.total === 0 ? 0 : bucket.met / bucket.total,
    }))
}

export function prerequisiteLabel(key: string) {
  return PREREQUISITE_LABELS[key] ?? key
}

export function stackingBuckets(pairs: OpportunityPlayPair[]): StackingBucket[] {
  const groups = {
    none: pairs.filter((item) => item.unmetCount === 0),
    one: pairs.filter((item) => item.unmetCount === 1),
    twoPlus: pairs.filter((item) => item.unmetCount >= 2),
  }
  const toBucket = (
    key: StackingBucket["key"],
    label: string,
    rows: OpportunityPlayPair[]
  ): StackingBucket => {
    const closed = rows.filter(
      (item) => item.opportunity.outcome === "won" || item.opportunity.outcome === "lost"
    )
    const won = closed.filter((item) => item.opportunity.outcome === "won")
    const cycles = won
      .map((item) => cycleDays(item.opportunity))
      .filter((value): value is number => value !== null)
    return {
      key,
      label,
      opportunityCount: new Set(rows.map((item) => item.opportunity.id)).size,
      closedCount: closed.length,
      winRate: winRate(closed.map((item) => item.opportunity)),
      medianCycleDays: median(cycles),
      wonCount: won.length,
    }
  }
  return [
    toBucket("none", "No missing signals", groups.none),
    toBucket("one", "One missing signal", groups.one),
    toBucket("twoPlus", "Two or more missing signals", groups.twoPlus),
  ]
}

export function portfolioStats(snapshot: AnalysisSnapshot, activities: AnalysisActivity[]) {
  const opportunities = new Map(snapshot.opportunities.map((item) => [item.id, item]))
  const touched = [...new Set(activities.map((item) => item.opportunityId))]
    .map((id) => opportunities.get(id))
    .filter((item): item is AnalysisOpportunity => Boolean(item))
  const closed = touched.filter((item) => item.outcome === "won" || item.outcome === "lost")
  const won = closed.filter((item) => item.outcome === "won")
  const defined = activities.filter((item) => item.captureKind === "defined")
  const exceptions = defined.filter(activityHasException)
  const undefinedActivities = activities.filter((item) => item.captureKind === "undefined")
  const cycles = won
    .map(cycleDays)
    .filter((value): value is number => value !== null)
  return {
    activities: activities.length,
    definedActivities: defined.length,
    exceptionActivities: exceptions.length,
    exceptionRate: defined.length === 0 ? null : exceptions.length / defined.length,
    undefinedActivities: undefinedActivities.length,
    opportunities: touched.length,
    closedOpportunities: closed.length,
    winRate: winRate(closed),
    medianCycleDays: median(cycles),
    wonCount: won.length,
  }
}
