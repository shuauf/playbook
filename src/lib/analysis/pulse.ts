import { percentPoints } from "@/lib/format"
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
    const skipped = percentPoints(input.exceptionRate, 0)
    const drop =
      penalty !== null && penalty !== undefined
        ? ` Skipping a step on ${enforce.playName} has hurt win rate the most — those deals win ${percentPoints(penalty, 0)}% less often.`
        : ` ${enforce.playName} is where that happens most.`
    return `About ${skipped}% of activities skipped a playbook step.${drop}`
  }

  if (highVolume && input.exceptionRate !== null && highVolume.win.confidence === "insufficient") {
    return `Activities skip a playbook step most often on ${highVolume.playName}, though we do not have enough closed deals yet to know if that changes outcomes.`
  }

  if (highVolume && input.exceptionRate !== null) {
    const penalty = highVolume.win.difference
    const skipped = percentPoints(input.exceptionRate, 0)
    if (penalty !== null && highVolume.win.confidence !== "insufficient" && penalty > 0.02) {
      return `About ${skipped}% of activities skipped a playbook step. ${highVolume.playName} is the most common place that happens, and those deals win ${percentPoints(penalty, 0)}% less often.`
    }
    return `About ${skipped}% of activities skipped a playbook step. ${highVolume.playName} accounts for most of them.`
  }

  return "Some activities skipped a playbook step, but no play yet has a clear win-rate comparison."
}
