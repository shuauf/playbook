"use client"

import Link from "next/link"
import { useMemo, useState, type ReactNode } from "react"

import { PageIntro } from "@/components/page-intro"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PIPELINE_STAGES, TEAMS } from "@/lib/domain/types"
import { filterActivities, filterOpportunities, prerequisiteRollupLabel } from "@/lib/explorer/search"
import type { ExplorerActivity, ExplorerOpportunity, ExplorerPlayOption } from "@/lib/explorer/types"
import { formatCount } from "@/lib/format"
import {
  explorerQuery,
  type ExplorerFilters,
} from "@/lib/navigation"
import { cn } from "@/lib/utils"

const OUTCOMES = [
  { value: "all", label: "All outcomes" },
  { value: "open", label: "Open" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const

const CAPTURES = [
  { value: "all", label: "Defined and undefined" },
  { value: "defined", label: "Defined plays" },
  { value: "undefined", label: "Undefined only" },
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

export function ExplorerView({
  initialFilters,
  opportunities,
  activities,
  plays,
  seNames,
}: {
  initialFilters: ExplorerFilters
  opportunities: ExplorerOpportunity[]
  activities: ExplorerActivity[]
  plays: ExplorerPlayOption[]
  seNames: string[]
}) {
  const [filters, setFilters] = useState(initialFilters)

  function apply(patch: Partial<ExplorerFilters>) {
    const next = { ...filters, ...patch }
    setFilters(next)
    const query = explorerQuery(next)
    window.history.replaceState(null, "", query ? `/activity?${query}` : "/activity")
  }

  const visibleOpportunities = useMemo(
    () => filterOpportunities(opportunities, filters),
    [opportunities, filters]
  )
  const visibleActivities = useMemo(
    () => filterActivities(activities, filters),
    [activities, filters]
  )
  const shown = filters.view === "opportunities" ? visibleOpportunities.length : visibleActivities.length
  const total = filters.view === "opportunities" ? opportunities.length : activities.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageIntro className="mb-0" kicker="Activity Explorer" title="The operational record">
          Search the live workspace. Click an opportunity for its timeline, or an activity for the
          exact Met / Not Met snapshot. Undefined work stays unknown.
        </PageIntro>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/activity?${explorerQuery({ ...filters, view: "opportunities" })}`}
            className={cn(
              buttonVariants({ variant: filters.view === "opportunities" ? "default" : "outline" })
            )}
            aria-current={filters.view === "opportunities" ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault()
              apply({ view: "opportunities" })
            }}
          >
            Opportunities
          </Link>
          <Link
            href={`/activity?${explorerQuery({ ...filters, view: "activities" })}`}
            className={cn(
              buttonVariants({ variant: filters.view === "activities" ? "default" : "outline" })
            )}
            aria-current={filters.view === "activities" ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault()
              apply({ view: "activities" })
            }}
          >
            Sales Activities
          </Link>
          <Link href="/activity/new" className={cn(buttonVariants())}>
            Add Activity
          </Link>
        </div>
      </div>

      <form
        className="grid gap-3 rounded-xl border border-border bg-card/70 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        aria-label="Activity Explorer filters"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="grid gap-1 text-xs font-medium text-muted-foreground sm:col-span-2">
          Search
          <Input
            value={filters.q}
            onChange={(event) => apply({ q: event.target.value })}
            placeholder="Account, opportunity, play, SE, AE, team"
            aria-label="Search records"
          />
        </label>
        <FilterField
          id="explorer-play"
          label="Sales play"
          value={filters.playId}
          onChange={(value) => apply({ playId: value })}
        >
          <option value="all">All plays</option>
          <option value="undefined">Undefined only</option>
          {plays.map((play) => (
            <option key={play.id} value={play.id}>
              {play.name}
            </option>
          ))}
        </FilterField>
        <FilterField
          id="explorer-stage"
          label="Stage"
          value={filters.stage}
          onChange={(value) => apply({ stage: value })}
        >
          <option value="all">All stages</option>
          {PIPELINE_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </FilterField>
        <FilterField
          id="explorer-owner"
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
        <FilterField
          id="explorer-outcome"
          label="Outcome"
          value={filters.outcome}
          onChange={(value) => apply({ outcome: value })}
        >
          {OUTCOMES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </FilterField>
        <FilterField
          id="explorer-capture"
          label="Definition"
          value={filters.capture}
          onChange={(value) =>
            apply({ capture: value as ExplorerFilters["capture"] })
          }
        >
          {CAPTURES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </FilterField>
      </form>

      <p className="text-xs text-muted-foreground">
        Showing {formatCount(shown)} of {formatCount(total)}{" "}
        {filters.view === "opportunities" ? "opportunities" : "sales activities"}.
      </p>

      <Card>
        <CardContent className="px-0">
          {filters.view === "opportunities" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Close</TableHead>
                  <TableHead>Activities</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleOpportunities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground">
                      No opportunities match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleOpportunities.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-normal">
                        <Link
                          href={`/activity/opportunities/${row.id}`}
                          className="font-medium hover:underline"
                        >
                          {row.name}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-normal">{row.account}</TableCell>
                      <TableCell>{row.stage}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-normal">
                        {row.seName} · {row.team}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.outcome}</Badge>
                      </TableCell>
                      <TableCell>{row.createdAt}</TableCell>
                      <TableCell>{row.closeDate ?? "Open"}</TableCell>
                      <TableCell>{row.activityCount}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Play</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>SE</TableHead>
                  <TableHead>Recommended prerequisites</TableHead>
                  <TableHead>Unmet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      No sales activities match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleActivities.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="whitespace-normal">
                        <Link
                          href={`/activity/opportunities/${row.opportunityId}`}
                          className="hover:underline"
                        >
                          {row.opportunityName}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <Link
                          href={`/activity/activities/${row.id}`}
                          className="font-medium hover:underline"
                        >
                          {row.playName}
                        </Link>
                        {row.captureKind === "undefined" ? (
                          <Badge variant="outline" className="ml-2">
                            Undefined
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>{row.stageAtActivity}</TableCell>
                      <TableCell className="text-muted-foreground">{row.seName}</TableCell>
                      <TableCell>
                        {prerequisiteRollupLabel(row.allPrerequisitesMet, row.unmetCount)}
                      </TableCell>
                      <TableCell>{row.unmetCount ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
