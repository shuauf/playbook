"use client"

import { useMemo, useState } from "react"

import { OutcomeDumbbell, type OutcomeRow } from "@/components/health-charts"
import type { HealthAnalysis } from "@/lib/analysis/types"
import { cn } from "@/lib/utils"

type Slice = "play" | "signal"
type Metric = "winRate" | "cycleTime"

function Toggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: Array<{ id: T; label: string }>
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-white p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-full px-3 py-1 text-xs transition-colors",
            value === option.id ? "bg-[#2B2A27] text-white" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function OutcomeChart({ analysis }: { analysis: HealthAnalysis }) {
  const [slice, setSlice] = useState<Slice>("play")
  const [metric, setMetric] = useState<Metric>("winRate")

  const rows = useMemo<OutcomeRow[]>(() => {
    if (slice === "play") {
      return analysis.plays
        .filter((play) => play.closedOpportunityCount > 0)
        .slice()
        .sort((a, b) =>
          metric === "winRate"
            ? (b.win.difference ?? -1) - (a.win.difference ?? -1)
            : Math.abs(b.cycle.differenceDays ?? 0) - Math.abs(a.cycle.differenceDays ?? 0)
        )
        .map((play) =>
          metric === "winRate"
            ? {
                id: play.playId,
                label: play.playName,
                followed: play.win.metRate,
                exception: play.win.unmetRate,
                difference: play.win.difference,
                confidence: play.win.confidence,
              }
            : {
                id: play.playId,
                label: play.playName,
                followed: play.cycle.metDays,
                exception: play.cycle.unmetDays,
                difference: play.cycle.differenceDays,
                confidence: play.cycle.confidence,
              }
        )
    }
    return analysis.prerequisites
      .filter((item) => item.closedOpportunityCount > 0)
      .slice()
      .sort((a, b) =>
        metric === "winRate"
          ? (b.win.difference ?? -1) - (a.win.difference ?? -1)
          : Math.abs(b.cycle.differenceDays ?? 0) - Math.abs(a.cycle.differenceDays ?? 0)
      )
      .map((item) =>
        metric === "winRate"
          ? {
              id: `${item.playId}-${item.key}`,
              label: `${item.text} · ${item.playName}`,
              followed: item.win.metRate,
              exception: item.win.unmetRate,
              difference: item.win.difference,
              confidence: item.win.confidence,
            }
          : {
              id: `${item.playId}-${item.key}`,
              label: `${item.text} · ${item.playName}`,
              followed: item.cycle.metDays,
              exception: item.cycle.unmetDays,
              difference: item.cycle.differenceDays,
              confidence: item.cycle.confidence,
            }
      )
  }, [analysis.plays, analysis.prerequisites, metric, slice])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Toggle
          value={slice}
          onChange={setSlice}
          options={[
            { id: "play", label: "By sales play" },
            { id: "signal", label: "By missing signal" },
          ]}
        />
        <Toggle
          value={metric}
          onChange={setMetric}
          options={[
            { id: "winRate", label: "Win rate" },
            { id: "cycleTime", label: "Cycle time" },
          ]}
        />
      </div>
      <OutcomeDumbbell rows={rows} metric={metric} />
    </div>
  )
}
