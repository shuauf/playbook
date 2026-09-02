export const PRIMARY_NAV = [
  {
    href: "/",
    label: "Playbook Health",
    hint: "What deserves attention",
  },
  {
    href: "/activity",
    label: "Activity Explorer",
    hint: "What actually happened",
  },
  {
    href: "/admin",
    label: "Admin Console",
    hint: "Maintain the playbook",
  },
] as const

export type HealthFilters = {
  period: "90" | "180" | "365" | "all"
  playId: string
  stage: string
  segment: string
  team: string
  se: string
  outcome: string
}

export const DEFAULT_HEALTH_FILTERS: HealthFilters = {
  period: "90",
  playId: "all",
  stage: "all",
  segment: "all",
  team: "all",
  se: "all",
  outcome: "all",
}

export function parseHealthFilters(
  input: Record<string, string | string[] | undefined>
): HealthFilters {
  const read = (key: keyof HealthFilters) => {
    const value = input[key]
    return typeof value === "string" && value.length > 0 ? value : DEFAULT_HEALTH_FILTERS[key]
  }
  const period = read("period")
  return {
    period: period === "180" || period === "365" || period === "all" ? period : "90",
    playId: read("playId"),
    stage: read("stage"),
    segment: read("segment"),
    team: read("team"),
    se: read("se"),
    outcome: read("outcome"),
  }
}

export function parseExplorerView(value: string | string[] | undefined) {
  return value === "activities" ? "activities" : "opportunities"
}

export type ExplorerFilters = {
  view: "opportunities" | "activities"
  q: string
  outcome: string
  team: string
  se: string
  playId: string
  stage: string
  capture: "all" | "defined" | "undefined"
}

export const DEFAULT_EXPLORER_FILTERS: ExplorerFilters = {
  view: "opportunities",
  q: "",
  outcome: "all",
  team: "all",
  se: "all",
  playId: "all",
  stage: "all",
  capture: "all",
}

function readParam(
  input: Record<string, string | string[] | undefined>,
  key: string,
  fallback: string
) {
  const value = input[key]
  return typeof value === "string" ? value : fallback
}

export function parseExplorerFilters(
  input: Record<string, string | string[] | undefined>
): ExplorerFilters {
  const capture = readParam(input, "capture", "all")
  return {
    view: parseExplorerView(input.view),
    q: readParam(input, "q", ""),
    outcome: readParam(input, "outcome", "all"),
    team: readParam(input, "team", "all"),
    se: readParam(input, "se", "all"),
    playId: readParam(input, "playId", "all"),
    stage: readParam(input, "stage", "all"),
    capture: capture === "defined" || capture === "undefined" ? capture : "all",
  }
}

export function explorerQuery(filters: ExplorerFilters) {
  const params = new URLSearchParams()
  if (filters.view === "activities") params.set("view", "activities")
  if (filters.q.trim()) params.set("q", filters.q.trim())
  if (filters.outcome !== "all") params.set("outcome", filters.outcome)
  if (filters.team !== "all") params.set("team", filters.team)
  if (filters.se !== "all") params.set("se", filters.se)
  if (filters.playId !== "all") params.set("playId", filters.playId)
  if (filters.stage !== "all") params.set("stage", filters.stage)
  if (filters.capture !== "all") params.set("capture", filters.capture)
  return params.toString()
}
