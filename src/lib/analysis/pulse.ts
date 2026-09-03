import { pct, pp } from "@/lib/format"
import type { ActionItem, PlayFinding } from "@/lib/analysis/types"

export function assemblePulse(input: {
  exceptionRate: number | null
  definedActivities: number
  closedOpportunities: number
  plays: PlayFinding[]
  actions: ActionItem[]
}) {
  if (input.definedActivities === 0) {
    return "Activity tracking is live, but there are no defined sales activities in this view yet."
  }
  if (input.closedOpportunities === 0) {
    return "Activity tracking is live, but there is not yet enough closed-opportunity data to evaluate outcome differences."
  }

  const enforce = input.actions.find((item) => item.classification === "enforce")
  const highVolume = input.plays
    .filter((play) => play.exceptionRate !== null && play.activityCount > 0)
    .slice()
    .sort((a, b) => (b.exceptionCount ?? 0) - (a.exceptionCount ?? 0))[0]

  if (enforce && input.exceptionRate !== null && enforce.playName) {
    const play = input.plays.find((item) => item.playId === enforce.playId)
    const penalty = play?.win.difference
    const magnitude =
      penalty !== null && penalty !== undefined
        ? ` associated with a ${pp(penalty, 0)} lower win rate`
        : ""
    return `${pct(input.exceptionRate)} of activities contained an exception. ${enforce.playName} has the highest-volume risk${magnitude}.`
  }

  if (highVolume && input.exceptionRate !== null && highVolume.win.confidence === "insufficient") {
    return `Exceptions are most common in ${highVolume.playName}, though the current sample is too small to determine whether they affect outcomes.`
  }

  if (highVolume && input.exceptionRate !== null) {
    const penalty = highVolume.win.difference
    if (penalty !== null && highVolume.win.confidence !== "insufficient") {
      return `${pct(input.exceptionRate)} of activities contained an exception. ${highVolume.playName} is the highest-volume pattern${
        penalty > 0.02 ? `, associated with a ${pp(penalty, 0)} lower win rate` : ""
      }.`
    }
    return `${pct(input.exceptionRate)} of activities contained an exception. ${highVolume.playName} accounts for the most of them.`
  }

  return "Exceptions appear in this view, but no play yet has a supported outcome comparison."
}
