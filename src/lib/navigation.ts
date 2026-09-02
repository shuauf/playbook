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
