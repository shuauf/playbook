import { pct, pp } from "@/lib/format"
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
        evidence: `${pct(play.exceptionRate)} of ${play.playName} activities were missing a success signal, associated with a ${pp(penalty, 0)} lower closed win rate.`,
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
        evidence: `${play.playName} shows a ${pp(penalty, 0)} win-rate gap, but there is not yet enough closed-opportunity data to act.`,
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
        evidence: `${play.playName} exceptions appear in ${pct(play.exceptionRate)} of activities. The current comparison does not yet support a change to the play.`,
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
        evidence: `${pct(prereq.unmetRate)} of ${prereq.playName} calls did not show this signal, with no meaningful win-rate difference.`,
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
        evidence: `Calls missing “${prereq.text}” on ${prereq.playName} are associated with a ${pp(penalty, 0)} lower win rate.`,
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
        evidence: `Logged off-playbook on ${issue.opportunityCount} opportunities. Success-signal status is unknown.`,
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
