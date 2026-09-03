"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { PIPELINE_STAGES, SEGMENTS, TEAMS } from "@/lib/domain/types"
import { DEFAULT_HEALTH_FILTERS, healthQuery, type HealthFilters } from "@/lib/navigation"

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
    <label className="grid gap-0.5 text-[11px] font-medium text-muted-foreground">
      {label}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-7 rounded-md border border-input bg-card px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {children}
      </select>
    </label>
  )
}

function summarize(filters: HealthFilters, plays: Array<{ id: string; name: string }>) {
  const parts: string[] = []
  parts.push(PERIODS.find((item) => item.value === filters.period)?.label ?? "Last 90 days")
  if (filters.playId !== "all") {
    parts.push(plays.find((play) => play.id === filters.playId)?.name ?? filters.playId)
  }
  if (filters.stage !== "all") parts.push(filters.stage)
  if (filters.segment !== "all") parts.push(filters.segment)
  if (filters.se !== "all") parts.push(filters.se)
  else if (filters.team !== "all") parts.push(`${filters.team} team`)
  if (filters.outcome !== "all") parts.push(filters.outcome)
  return parts
}

export function HealthFiltersBar({
  filters,
  plays,
  seNames,
}: {
  filters: HealthFilters
  plays: Array<{ id: string; name: string }>
  seNames: string[]
}) {
  const router = useRouter()
  const [more, setMore] = useState(filters.stage !== "all" || filters.segment !== "all")
  const active = summarize(filters, plays)
  const isDefault = healthQuery(filters).length === 0

  function apply(patch: Partial<HealthFilters>) {
    const next = { ...filters, ...patch }
    const query = healthQuery(next)
    router.replace(query ? `/?${query}` : "/", { scroll: false })
  }

  return (
    <div className="space-y-2">
      <form
        className="flex flex-wrap items-end gap-2"
        aria-label="Playbook Health filters"
        onSubmit={(event) => event.preventDefault()}
      >
        <FilterField
          id="period"
          label="Time period"
          value={filters.period}
          onChange={(value) => apply({ period: value as HealthFilters["period"] })}
        >
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
        <FilterField
          id="owner"
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
        {more ? (
          <>
            <FilterField id="stage" label="Stage" value={filters.stage} onChange={(value) => apply({ stage: value })}>
              <option value="all">All stages</option>
              {PIPELINE_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </FilterField>
            <FilterField
              id="segment"
              label="Segment"
              value={filters.segment}
              onChange={(value) => apply({ segment: value })}
            >
              <option value="all">All segments</option>
              {SEGMENTS.map((segment) => (
                <option key={segment} value={segment}>
                  {segment}
                </option>
              ))}
            </FilterField>
          </>
        ) : null}
        <Button type="button" variant="ghost" size="sm" onClick={() => setMore((value) => !value)}>
          {more ? "Fewer filters" : "More filters"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isDefault}
          onClick={() => apply(DEFAULT_HEALTH_FILTERS)}
        >
          Reset
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Showing {active.join(" · ")}
      </p>
    </div>
  )
}
