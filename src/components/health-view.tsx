import Link from "next/link"

import { ConfidenceBadge } from "@/components/confidence-badge"
import {
  CycleDivergingBars,
  ExceptionBubbleChart,
  WinRateDumbbell,
} from "@/components/health-charts"
import { HealthFiltersBar } from "@/components/health-filters"
import { PlayPerformanceTable } from "@/components/health-table"
import { MetricTip } from "@/components/metric-tip"
import { Badge } from "@/components/ui/badge"
import { formatCount, formatCycle, pct } from "@/lib/format"
import type { HealthAnalysis } from "@/lib/analysis/types"
import { cn } from "@/lib/utils"

const ACTION_LABEL = {
  enforce: "Enforce",
  revisit: "Revisit",
  investigate: "Investigate",
  define: "Define",
  monitor: "Monitor",
} as const

export function HealthView({
  analysis,
  plays,
  seNames,
}: {
  analysis: HealthAnalysis
  plays: Array<{ id: string; name: string }>
  seNames: string[]
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-medium tracking-[0.16em] text-[oklch(0.42_0.06_175)] uppercase">
          Playbook Health
        </p>
        <h1 className="font-heading mt-1 text-3xl leading-tight text-foreground md:text-[2rem]">
          Where the playbook needs attention
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Compare playbook adherence with deal outcomes. Exceptions are associations, not proof of
          cause.
        </p>
      </div>

      <HealthFiltersBar filters={analysis.filters} plays={plays} seNames={seNames} />

      <section className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Playbook pulse
        </p>
        <p className="font-heading mt-1 text-xl leading-snug">{analysis.pulse}</p>
      </section>

      <section className="grid grid-cols-2 gap-2 xl:grid-cols-5">
        {analysis.metrics.map((metric) => (
          <Link
            key={metric.id}
            href={metric.href}
            className="rounded-lg bg-card px-3 py-2 ring-1 ring-foreground/10 hover:ring-foreground/20"
          >
            <div className="flex items-center text-[11px] text-muted-foreground">
              {metric.label}
              <MetricTip label={metric.label}>{metric.definition}</MetricTip>
            </div>
            <p className="mt-1 text-xl font-medium tracking-tight">{metric.value}</p>
            {metric.prior ? (
              <p className="text-[11px] text-muted-foreground">vs prior {metric.prior}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">No prior period</p>
            )}
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.9fr)]">
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="font-heading text-xl">Where exceptions deserve attention</h2>
          <p className="mb-2 text-xs text-muted-foreground">
            Bubble size is distinct opportunities. Color is sample confidence. Click a play to open
            its definition.
          </p>
          <ExceptionBubbleChart plays={analysis.plays} />
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="font-heading text-xl">What needs action</h2>
          <div className="mt-3 divide-y">
            {analysis.actions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No action-ready patterns in this filter set.
              </p>
            ) : (
              analysis.actions.map((item) => (
                <div key={item.id} className="py-3 first:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{ACTION_LABEL[item.classification]}</Badge>
                    <ConfidenceBadge level={item.confidence} />
                  </div>
                  <Link href={item.href} className="mt-1 block font-medium hover:underline">
                    {item.subject}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{item.evidence}</p>
                  {item.confidence === "insufficient" ? (
                    <p className="mt-1 text-xs text-muted-foreground">Insufficient data</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="font-heading text-xl">Win rate when plays are followed</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Closed opportunities only. Hollow marks mean the sample is insufficient.
          </p>
          <WinRateDumbbell plays={analysis.plays} />
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="font-heading text-xl">Cycle-time difference when exceptions occur</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Median days among won opportunities. Right is slower; left is faster.
          </p>
          <CycleDivergingBars plays={analysis.plays} />
        </div>
      </section>

      {analysis.stackingUseful ? (
        <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="font-heading text-xl">What happens as exceptions accumulate</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Unique opportunity × play pairs. Language here is association, not cause.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {analysis.stacking.map((bucket) => (
              <div key={bucket.key} className="rounded-lg bg-muted/50 px-3 py-3">
                <p className="text-sm font-medium">{bucket.label}</p>
                <p className="mt-2 text-2xl font-medium">
                  {bucket.winRate === null ? "—" : pct(bucket.winRate)}
                </p>
                <p className="text-xs text-muted-foreground">
                  closed win rate · {formatCount(bucket.closedCount)} opportunities
                </p>
                <p className="mt-2 text-sm">
                  {formatCycle(bucket.medianCycleDays)} median among {formatCount(bucket.wonCount)} wins
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl bg-card ring-1 ring-foreground/10">
        <div className="px-4 pt-4">
          <h2 className="font-heading text-xl">Sales play performance</h2>
        </div>
        <div className="mt-2 overflow-x-auto">
          <PlayPerformanceTable plays={analysis.plays} />
        </div>
      </section>

      <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="font-heading text-xl">Playbook hygiene</h2>
        <div className="mt-3 divide-y">
          {analysis.hygiene.length === 0 ? (
            <p className="text-sm text-muted-foreground">No operational hygiene issues in this view.</p>
          ) : (
            analysis.hygiene.map((issue) => (
              <div key={issue.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{issue.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCount(issue.activityCount)} activities ·{" "}
                    {formatCount(issue.opportunityCount)} opportunities
                    {issue.firstAt && issue.lastAt ? ` · ${issue.firstAt}–${issue.lastAt}` : ""}
                  </p>
                </div>
                <Link
                  href={issue.href}
                  className={cn("text-sm text-[oklch(0.32_0.06_175)] hover:underline")}
                >
                  {issue.action}
                </Link>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
