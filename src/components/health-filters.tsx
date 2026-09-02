"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"

import type { HealthFilters } from "@/lib/navigation"
import { PIPELINE_STAGES, SEGMENTS, TEAMS } from "@/lib/domain/types"

const PERIODS = [
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 180 days" },
  { value: "365", label: "Last 12 months" },
  { value: "all", label: "All time" },
] as const

const OUTCOMES = [
  { value: "all", label: "All outcomes" },
  { value: "open", label: "Open" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const

function FilterField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 rounded-lg border border-input bg-card px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {children}
      </select>
    </label>
  )
}

export function HealthFilters({
  filters,
  plays,
  seNames,
}: {
  filters: HealthFilters
  plays: Array<{ id: string; name: string }>
  seNames: string[]
}) {
  const router = useRouter()

  function apply(patch: Partial<HealthFilters>) {
    const next = { ...filters, ...patch }
    const params = new URLSearchParams()
    for (const [name, item] of Object.entries(next)) {
      if (item && item !== "all" && !(name === "period" && item === "90")) {
        params.set(name, item)
      }
    }
    const query = params.toString()
    router.replace(query ? `/?${query}` : "/", { scroll: false })
  }

  return (
    <form
      className="grid gap-3 rounded-xl border border-border bg-card/70 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      aria-label="Playbook Health filters"
    >
      <FilterField id="period" label="Time period" value={filters.period} onChange={(value) => apply({ period: value as HealthFilters["period"] })}>
        {PERIODS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </FilterField>
      <FilterField id="playId" label="Sales play" value={filters.playId} onChange={(value) => apply({ playId: value })}>
        <option value="all">All plays</option>
        {plays.map((play) => (
          <option key={play.id} value={play.id}>
            {play.name}
          </option>
        ))}
      </FilterField>
      <FilterField id="stage" label="Stage" value={filters.stage} onChange={(value) => apply({ stage: value })}>
        <option value="all">All stages</option>
        {PIPELINE_STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {stage}
          </option>
        ))}
      </FilterField>
      <FilterField id="segment" label="Segment" value={filters.segment} onChange={(value) => apply({ segment: value })}>
        <option value="all">All segments</option>
        {SEGMENTS.map((segment) => (
          <option key={segment} value={segment}>
            {segment}
          </option>
        ))}
      </FilterField>
      <FilterField
        id="team"
        label="SE / team"
        value={filters.se !== "all" ? `se:${filters.se}` : filters.team}
        onChange={(value) => {
          if (value.startsWith("se:")) {
            apply({ se: value.slice(3), team: "all" })
            return
          }
          apply({ team: value, se: "all" })
        }}
      >
        <option value="all">All SEs and teams</option>
        {TEAMS.map((team) => (
          <option key={team} value={team}>
            {team} team
          </option>
        ))}
        {seNames.map((name) => (
          <option key={name} value={`se:${name}`}>
            {name}
          </option>
        ))}
      </FilterField>
      <FilterField id="outcome" label="Outcome" value={filters.outcome} onChange={(value) => apply({ outcome: value })}>
        {OUTCOMES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </FilterField>
    </form>
  )
}
