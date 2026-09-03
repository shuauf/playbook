import type { ExplorerActivity, ExplorerOpportunity } from "@/lib/explorer/types"
import type { ExplorerFilters } from "@/lib/navigation"

export function tokensFromQuery(query: string) {
  return query.toLowerCase().trim().split(/\s+/).filter(Boolean)
}

export function matchesSearch(fields: Array<string | null | undefined>, query: string) {
  const tokens = tokensFromQuery(query)
  if (tokens.length === 0) return true
  const haystack = fields.filter(Boolean).join(" ").toLowerCase()
  return tokens.every((token) => haystack.includes(token))
}

function matchesPlayFilter(
  playId: string,
  row: { playIds?: string[]; playId?: string | null; hasUndefined?: boolean; captureKind?: string }
) {
  if (playId === "all") return true
  if (playId === "undefined") {
    return row.hasUndefined === true || row.captureKind === "undefined"
  }
  if (row.playIds) return row.playIds.includes(playId)
  return row.playId === playId
}

export function filterOpportunities(
  rows: ExplorerOpportunity[],
  filters: ExplorerFilters
): ExplorerOpportunity[] {
  return rows.filter((row) => {
    if (filters.outcome !== "all" && row.outcome !== filters.outcome) return false
    if (filters.team !== "all" && row.team !== filters.team) return false
    if (filters.se !== "all" && row.seName !== filters.se) return false
    if (filters.stage !== "all" && row.stage !== filters.stage) return false
    if (filters.capture === "undefined" && !row.hasUndefined) return false
    if (filters.capture === "defined" && row.playIds.length === 0) return false
    if (!matchesPlayFilter(filters.playId, row)) return false
    return matchesSearch(
      [row.name, row.account, row.seName, row.aeName, row.team, row.segment, row.stage],
      filters.q
    )
  })
}

export function filterActivities(
  rows: ExplorerActivity[],
  filters: ExplorerFilters
): ExplorerActivity[] {
  return rows.filter((row) => {
    if (filters.outcome !== "all" && row.outcome !== filters.outcome) return false
    if (filters.team !== "all" && row.team !== filters.team) return false
    if (filters.se !== "all" && row.seName !== filters.se) return false
    if (filters.stage !== "all" && row.stageAtActivity !== filters.stage) return false
    if (filters.capture !== "all" && row.captureKind !== filters.capture) return false
    if (!matchesPlayFilter(filters.playId, row)) return false
    return matchesSearch(
      [
        row.opportunityName,
        row.account,
        row.playName,
        row.seName,
        row.team,
        row.stageAtActivity,
      ],
      filters.q
    )
  })
}

export function prerequisiteRollupLabel(
  allMet: boolean | null,
  unmetCount: number | null
) {
  if (allMet === null || unmetCount === null) return "Unknown"
  if (allMet) return "All met"
  return `${unmetCount} unmet`
}
