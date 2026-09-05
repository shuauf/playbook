import { percentPoints } from "@/lib/format"
import type { ActionItem, HygieneIssue, PlayFinding, PrerequisiteFinding } from "@/lib/analysis/types"

export const ACTION_RULES = {
  enforceExceptionRate: 0.2,
  enforcePenalty: 0.08,
  revisitUnmetRate: 0.25,
  revisitMaxPenalty: 0.05,
  investigateMinClosed: 6,
  investigatePenalty: 0.12,
  defineMinActivities: 20,
  monitorExceptionRate: 0.12,
  maxItems: 5,
} as const

const RANK: Record<ActionItem["classification"], number> = {
  enforce: 0,
  revisit: 1,
  define: 2,
  investigate: 3,
  monitor: 4,
}

function dropPercent(delta: number) {
  return percentPoints(Math.abs(delta), 0)
}

export function rankActions(input: {
  plays: PlayFinding[]
  prerequisites: PrerequisiteFinding[]
  hygiene: HygieneIssue[]
}): ActionItem[] {
  const items: ActionItem[] = []

  for (const play of input.plays) {
    const penalty = play.win.difference
    if (
      play.exceptionRate !== null &&
      play.exceptionRate >= ACTION_RULES.enforceExceptionRate &&
      penalty !== null &&
      penalty >= ACTION_RULES.enforcePenalty &&
      play.win.confidence === "supported"
    ) {
      items.push({
        id: `enforce-${play.playId}`,
        classification: "enforce",
        subject: play.playName,
        playId: play.playId,
        playName: play.playName,
        evidence: `Skipping a step on ${play.playName} calls has hurt win rate the most — deals win ${dropPercent(penalty)}% less often when that happens.`,
        sampleSize: play.win.metN + play.win.unmetN,
        confidence: play.win.confidence,
        href: `/?modal=play&playId=${play.playId}`,
      })
    } else if (
      play.closedOpportunityCount < 15 &&
      play.closedOpportunityCount >= ACTION_RULES.investigateMinClosed &&
      penalty !== null &&
      Math.abs(penalty) >= ACTION_RULES.investigatePenalty
    ) {
      items.push({
        id: `investigate-${play.playId}`,
        classification: "investigate",
        subject: play.playName,
        playId: play.playId,
        playName: play.playName,
        evidence: `${play.playName} looks like it might be changing win rate, but we have not closed enough deals to be sure yet.`,
        sampleSize: play.closedOpportunityCount,
        confidence: "insufficient",
        href: `/?modal=play&playId=${play.playId}`,
      })
    } else if (
      play.exceptionRate !== null &&
      play.exceptionRate >= ACTION_RULES.monitorExceptionRate &&
      play.activityCount >= 15 &&
      (play.win.confidence === "insufficient" ||
        penalty === null ||
        Math.abs(penalty) < ACTION_RULES.enforcePenalty)
    ) {
      items.push({
        id: `monitor-${play.playId}`,
        classification: "monitor",
        subject: play.playName,
        playId: play.playId,
        playName: play.playName,
        evidence: `${play.playName} calls skip a recommended prerequisite fairly often, but the win-rate difference is too small to change the play yet.`,
        sampleSize: play.closedOpportunityCount,
        confidence: play.win.confidence,
        href: `/?modal=play&playId=${play.playId}`,
      })
    }
  }

  for (const prereq of input.prerequisites) {
    const penalty = prereq.win.difference
    if (
      prereq.unmetRate !== null &&
      prereq.unmetRate >= ACTION_RULES.revisitUnmetRate &&
      prereq.win.metN >= 15 &&
      prereq.win.unmetN >= 15 &&
      (penalty === null || Math.abs(penalty) < ACTION_RULES.revisitMaxPenalty)
    ) {
      items.push({
        id: `revisit-${prereq.playId}-${prereq.key}`,
        classification: "revisit",
        subject: prereq.text,
        playId: prereq.playId,
        playName: prereq.playName,
        evidence: `“${prereq.text}” is often missing on ${prereq.playName} calls, but win rate looks about the same either way — worth asking if we still need this prerequisite.`,
        sampleSize: prereq.win.metN + prereq.win.unmetN,
        confidence: prereq.win.confidence === "insufficient" ? "directional" : prereq.win.confidence,
        href: `/?modal=play&playId=${prereq.playId}`,
      })
    } else if (
      prereq.unmetRate !== null &&
      prereq.unmetRate >= ACTION_RULES.enforceExceptionRate &&
      penalty !== null &&
      penalty >= ACTION_RULES.enforcePenalty &&
      prereq.win.confidence === "supported"
    ) {
      items.push({
        id: `enforce-${prereq.playId}-${prereq.key}`,
        classification: "enforce",
        subject: prereq.text,
        playId: prereq.playId,
        playName: prereq.playName,
        evidence: `When “${prereq.text}” is missing on ${prereq.playName} calls, deals win ${dropPercent(penalty)}% less often.`,
        sampleSize: prereq.win.metN + prereq.win.unmetN,
        confidence: prereq.win.confidence,
        href: `/?modal=play&playId=${prereq.playId}`,
      })
    }
  }

  for (const issue of input.hygiene.filter((item) => item.kind === "undefined")) {
    if (issue.activityCount >= ACTION_RULES.defineMinActivities) {
      items.push({
        id: `define-${issue.id}`,
        classification: "define",
        subject: issue.name,
        playId: null,
        playName: null,
        evidence: `SCs logged “${issue.name}” ${issue.activityCount} times outside the defined plays. We do not yet know which recommended prerequisites matter for that work.`,
        sampleSize: issue.activityCount,
        confidence: issue.activityCount >= 40 ? "supported" : "directional",
        href: issue.href,
      })
    }
  }

  return items
    .sort((a, b) => {
      const rank = RANK[a.classification] - RANK[b.classification]
      if (rank !== 0) return rank
      return b.sampleSize - a.sampleSize
    })
    .slice(0, ACTION_RULES.maxItems)
}

export function undefinedExplorerHref() {
  return "/?modal=explorer"
}
