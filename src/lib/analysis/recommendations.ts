import { addDays } from "@/lib/dates"
import { percentPoints } from "@/lib/format"
import { inWindow } from "@/lib/analysis/period"
import type { AnalysisActivity, LookCloserItem, PrerequisiteFinding } from "@/lib/analysis/types"

const LOOK_CLOSER_LIMIT = 3
const SIX_WEEKS_DAYS = 42
const GAP_MIN_CLOSED = 15
const GONG_MIN_WINS = 20
const DEFINE_MIN_WEEKLY = 1

function presenceRate(unmetRate: number | null) {
  if (unmetRate === null) return null
  return 1 - unmetRate
}

function aboutWeekly(count: number, weeks: number) {
  const weekly = count / weeks
  const rounded = Math.round(weekly)
  if (rounded < 1) return { weekly, label: "under one" }
  return { weekly, label: String(rounded) }
}

function pickGap(prerequisites: PrerequisiteFinding[]): LookCloserItem | null {
  const ranked = prerequisites
    .filter((item) => {
      const presence = presenceRate(item.unmetRate)
      return (
        presence !== null &&
        presence > 0.15 &&
        presence < 0.85 &&
        item.win.difference !== null &&
        item.win.difference >= 0.08 &&
        item.win.metN >= GAP_MIN_CLOSED &&
        item.win.unmetN >= GAP_MIN_CLOSED &&
        item.win.confidence === "supported"
      )
    })
    .slice()
    .sort((a, b) => {
      const aImpact = (a.win.difference ?? 0) * (a.unmetRate ?? 0)
      const bImpact = (b.win.difference ?? 0) * (b.unmetRate ?? 0)
      return bImpact - aImpact
    })
  const item = ranked[0]
  if (!item || item.win.difference === null || item.unmetRate === null) return null
  const present = percentPoints(1 - item.unmetRate, 0)
  const gap = percentPoints(item.win.difference, 0)
  return {
    id: `gap-${item.playId}-${item.key}`,
    kind: "gap",
    label: item.playName,
    body: `“${item.text}” is on only ${present}% of ${item.playName} activities, but win rate is ${gap} points higher when it’s there.`,
    href: `/?modal=play&playId=${item.playId}`,
    playId: item.playId,
    prerequisiteKey: item.key,
  }
}

function wonPresence(item: PrerequisiteFinding) {
  const wins = item.win.metWins + item.win.unmetWins
  return wins === 0 ? 0 : item.win.metWins / wins
}

function gongDistinctiveness(item: PrerequisiteFinding) {
  const presence = presenceRate(item.unmetRate)
  if (presence === null) return 0
  return wonPresence(item) - presence
}

function pickGong(prerequisites: PrerequisiteFinding[], usedKey?: string): LookCloserItem | null {
  const ranked = prerequisites
    .filter((item) => {
      const wins = item.win.metWins + item.win.unmetWins
      return (
        `${item.playId}:${item.key}` !== usedKey &&
        item.unmetRate !== null &&
        item.unmetRate >= 0.08 &&
        wins >= GONG_MIN_WINS &&
        wonPresence(item) >= 0.7 &&
        gongDistinctiveness(item) >= 0.05
      )
    })
    .slice()
    .sort((a, b) => gongDistinctiveness(b) - gongDistinctiveness(a) || wonPresence(b) - wonPresence(a))
  const item = ranked[0]
  if (!item) return null
  return {
    id: `gong-${item.playId}-${item.key}`,
    kind: "gong",
    label: "Gong",
    body: `From Gong, most ${item.playName} activities that closed as wins had “${item.text}” on the activity.`,
    href: `/?modal=play&playId=${item.playId}`,
    playId: item.playId,
    prerequisiteKey: item.key,
  }
}

function pickDefine(activities: AnalysisActivity[], asOf: Date): LookCloserItem | null {
  const window = { start: addDays(asOf, -SIX_WEEKS_DAYS), end: asOf }
  const recent = activities.filter(
    (item) => item.captureKind === "undefined" && inWindow(item.activityDate, window)
  )
  const groups = new Map<string, AnalysisActivity[]>()
  for (const activity of recent) {
    const label = activity.undefinedLabel ?? "Untitled activity"
    const list = groups.get(label) ?? []
    list.push(activity)
    groups.set(label, list)
  }
  const ranked = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
  const top = ranked[0]
  if (!top) return null
  const [name, rows] = top
  const { weekly, label } = aboutWeekly(rows.length, 6)
  if (weekly < DEFINE_MIN_WEEKLY) return null
  const byPerson = new Map<string, number>()
  for (const row of rows) {
    byPerson.set(row.seName, (byPerson.get(row.seName) ?? 0) + 1)
  }
  const leader = [...byPerson.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
  const lead = leader ? ` ${leader[0]} has done the most — a natural person to help standardize it.` : ""
  return {
    id: `define-${name}`,
    kind: "define",
    label: "Not defined",
    body: `About ${label} “${name}” ${label === "1" ? "activity" : "activities"} a week for the past 6 weeks.${lead}`,
    href: "/?modal=offbook",
  }
}

export function recommendLookCloser(input: {
  prerequisites: PrerequisiteFinding[]
  activities: AnalysisActivity[]
  asOf: Date
}): LookCloserItem[] {
  const items: LookCloserItem[] = []
  const gap = pickGap(input.prerequisites)
  if (gap) items.push(gap)
  const usedKey = gap?.playId && gap.prerequisiteKey ? `${gap.playId}:${gap.prerequisiteKey}` : undefined
  const gong = pickGong(input.prerequisites, usedKey)
  if (gong) items.push(gong)
  const define = pickDefine(input.activities, input.asOf)
  if (define) items.push(define)
  return items.slice(0, LOOK_CLOSER_LIMIT)
}
