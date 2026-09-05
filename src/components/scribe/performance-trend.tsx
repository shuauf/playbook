"use client"

import { useMemo, useState } from "react"

import { PlayPick } from "@/components/scribe/play-pick"
import { formatCycle, pct, periodTitleLower } from "@/lib/format"
import type { HealthAnalysis, PerformanceTrendPoint } from "@/lib/analysis/types"
import { cn } from "@/lib/utils"

type Metric = "winRate" | "exceptionRate" | "cycleDays"

function monthLabel(value: string) {
  const [year, month] = value.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("en-US", { month: "short" })
}

export function PerformanceTrendChart({ analysis }: { analysis: HealthAnalysis }) {
  const [metric, setMetric] = useState<Metric>("winRate")
  const [playId, setPlayId] = useState("all")
  const period = periodTitleLower(analysis.filters.period)
  const points = useMemo<PerformanceTrendPoint[]>(() => {
    if (playId === "all") return analysis.performanceTrend
    return analysis.performanceTrendByPlay[playId] ?? []
  }, [analysis.performanceTrend, analysis.performanceTrendByPlay, playId])

  const playOptions = [
    { id: "all", name: "All plays" },
    ...analysis.plays.map((play) => ({ id: play.playId, name: play.playName })),
  ]

  const values = points.map((point) => {
    if (metric === "winRate") return point.winRate
    if (metric === "exceptionRate") return point.exceptionRate
    return point.cycleDays
  })
  const numeric = values.filter((value): value is number => value !== null)
  const max = metric === "cycleDays" ? Math.max(180, ...numeric, 1) : 1
  const width = 420
  const height = 168
  const pad = { l: metric === "cycleDays" ? 44 : 32, r: 10, t: 12, b: 24 }
  const xs = points.map((_, index) => pad.l + (index / Math.max(points.length - 1, 1)) * (width - pad.l - pad.r))
  const y = (value: number) => pad.t + (1 - value / max) * (height - pad.t - pad.b)
  const path = points
    .map((point, index) => {
      const raw = values[index]
      if (raw === null) return null
      return `${index === 0 || values.slice(0, index).every((item) => item === null) ? "M" : "L"} ${xs[index]} ${y(raw)}`
    })
    .filter(Boolean)
    .join(" ")

  const labels = {
    winRate: "Closed win rate",
    exceptionRate: "Exception rate",
    cycleDays: "Median cycle time",
  } as const

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-border bg-white p-0.5">
          {(
            [
              ["winRate", "Win rate"],
              ["exceptionRate", "Exception rate"],
              ["cycleDays", "Cycle time"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMetric(id)}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 text-xs transition-colors",
                metric === id
                  ? "bg-[#2B2A27] text-white"
                  : "text-muted-foreground hover:bg-[#EBEDF1] hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-2">
        <p className="mb-1.5 text-[11px] text-muted-foreground">Sales play</p>
        <PlayPick plays={playOptions} value={playId} onChange={setPlayId} />
      </div>
      <p className="mb-2 text-[11px] text-muted-foreground">
        {labels[metric]} over the {period}, computed from closed deals and logged activities.
      </p>
      {points.length === 0 ? (
        <p className="text-sm text-muted-foreground">Not enough dated activity to draw a trend yet.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={labels[metric]}>
          {[0.25, 0.5, 0.75, 1].map((tick) => (
            <g key={tick}>
              <line x1={pad.l} x2={width - pad.r} y1={y(tick * max)} y2={y(tick * max)} stroke="#EBEDF1" />
              <text x={2} y={y(tick * max) + 3} className="fill-muted-foreground" fontSize="9">
                {metric === "cycleDays" ? formatCycle(tick * max).replace(" months", " mo") : Math.round(tick * 100)}
              </text>
            </g>
          ))}
          {path ? <path d={path} fill="none" stroke="#2B2A27" strokeWidth="2" /> : null}
          {points.map((point, index) => {
            const raw = values[index]
            const tip =
              raw === null
                ? "No closed deals this month"
                : metric === "cycleDays"
                  ? formatCycle(raw)
                  : pct(raw)
            return (
              <g key={point.label}>
                <title>{`${monthLabel(point.label)}: ${tip}`}</title>
                {raw === null ? null : <circle cx={xs[index]} cy={y(raw)} r="3" fill="#D9893A" />}
                <text x={xs[index]} y={height - 6} textAnchor="middle" className="fill-muted-foreground" fontSize="9">
                  {monthLabel(point.label)}
                </text>
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
