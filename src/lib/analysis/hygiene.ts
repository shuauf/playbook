import { formatDisplayDate } from "@/lib/dates"
import { undefinedExplorerHref } from "@/lib/analysis/actions"
import type { AnalysisActivity, AnalysisSnapshot, HygieneIssue, PlayFinding } from "@/lib/analysis/types"

export function hygieneIssues(
  snapshot: AnalysisSnapshot,
  activities: AnalysisActivity[],
  plays: PlayFinding[]
): HygieneIssue[] {
  const issues: HygieneIssue[] = []
  const opportunities = new Map(snapshot.opportunities.map((item) => [item.id, item]))

  const undefinedGroups = new Map<string, AnalysisActivity[]>()
  for (const activity of activities.filter((item) => item.captureKind === "undefined")) {
    const label = activity.undefinedLabel ?? "Untitled activity"
    const list = undefinedGroups.get(label) ?? []
    list.push(activity)
    undefinedGroups.set(label, list)
  }
  for (const [name, rows] of undefinedGroups) {
    const dates = rows.map((item) => item.activityDate.getTime())
    issues.push({
      id: `undefined-${name}`,
      kind: "undefined",
      name,
      activityCount: rows.length,
      opportunityCount: new Set(rows.map((item) => item.opportunityId)).size,
      firstAt: formatDisplayDate(new Date(Math.min(...dates))),
      lastAt: formatDisplayDate(new Date(Math.max(...dates))),
      href: "/?modal=explorer",
      action: "Define",
    })
  }

  const offStage = activities.filter(
    (item) =>
      item.captureKind === "defined" &&
      item.typicalStages.length > 0 &&
      !item.typicalStages.includes(item.stageAtActivity)
  )
  const offByPlay = new Map<string, AnalysisActivity[]>()
  for (const activity of offStage) {
    const list = offByPlay.get(activity.playName) ?? []
    list.push(activity)
    offByPlay.set(activity.playName, list)
  }
  for (const [name, rows] of offByPlay) {
    const dates = rows.map((item) => item.activityDate.getTime())
    const playId = rows[0]?.playId
    issues.push({
      id: `off-stage-${playId}`,
      kind: "off_stage",
      name: `${name} used outside typical stages`,
      activityCount: rows.length,
      opportunityCount: new Set(rows.map((item) => item.opportunityId)).size,
      firstAt: formatDisplayDate(new Date(Math.min(...dates))),
      lastAt: formatDisplayDate(new Date(Math.max(...dates))),
      href: playId ? `/?modal=play&playId=${playId}` : "/?modal=explorer",
      action: "View activities",
    })
  }

  for (const play of snapshot.plays.filter((item) => item.status === "active")) {
    const finding = plays.find((item) => item.playId === play.id)
    if ((finding?.activityCount ?? 0) > 8) continue
    issues.push({
      id: `low-usage-${play.id}`,
      kind: "low_usage",
      name: `${play.name} has little recent usage`,
      activityCount: finding?.activityCount ?? 0,
      opportunityCount: finding?.opportunityCount ?? 0,
      firstAt: null,
      lastAt: null,
      href: `/?modal=play&playId=${play.id}`,
      action: "Review",
    })
  }

  const missing = activities.filter(
    (item) => item.captureKind === "defined" && item.snapshotCount === 0
  )
  if (missing.length > 0) {
    issues.push({
      id: "missing-snapshots",
      kind: "missing_snapshots",
      name: "Defined activities missing recommended-prerequisite information",
      activityCount: missing.length,
      opportunityCount: new Set(missing.map((item) => item.opportunityId)).size,
      firstAt: formatDisplayDate(
        new Date(Math.min(...missing.map((item) => item.activityDate.getTime())))
      ),
      lastAt: formatDisplayDate(
        new Date(Math.max(...missing.map((item) => item.activityDate.getTime())))
      ),
      href: undefinedExplorerHref(),
      action: "Review",
    })
  }

  void opportunities
  return issues.sort((a, b) => b.activityCount - a.activityCount)
}
