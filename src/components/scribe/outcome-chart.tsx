"use client"

import { useMemo, useState } from "react"

import { OutcomeDumbbell, type OutcomeRow } from "@/components/health-charts"
import { PlayPick } from "@/components/scribe/play-pick"
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
            "cursor-pointer rounded-full px-3 py-1 text-xs transition-colors",
            value === option.id
              ? "bg-[#2B2A27] text-white"
              : "text-muted-foreground hover:bg-[#EBEDF1] hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function OutcomeChart({ analysis }: { analysis: HealthAnalysis }) {
  const playOptions = analysis.plays.filter((play) =>
    analysis.prerequisites.some((item) => item.playId === play.playId)
  )
  const [slice, setSlice] = useState<Slice>("play")
  const [metric, setMetric] = useState<Metric>("winRate")
  const [signalPlayId, setSignalPlayId] = useState(
    playOptions.find((play) => play.playId === "play-product-demo")?.playId ?? playOptions[0]?.playId ?? ""
  )

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
      .filter((item) => item.playId === signalPlayId && item.closedOpportunityCount > 0)
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
              label: item.text,
              followed: item.win.metRate,
              exception: item.win.unmetRate,
              difference: item.win.difference,
              confidence: item.win.confidence,
            }
          : {
              id: `${item.playId}-${item.key}`,
              label: item.text,
              followed: item.cycle.metDays,
              exception: item.cycle.unmetDays,
              difference: item.cycle.differenceDays,
              confidence: item.cycle.confidence,
            }
      )
  }, [analysis.plays, analysis.prerequisites, metric, signalPlayId, slice])

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
      {slice === "signal" ? (
        <div className="mb-4">
          <p className="mb-1.5 text-[11px] text-muted-foreground">Sales play</p>
          <PlayPick
            plays={playOptions.map((play) => ({ id: play.playId, name: play.playName }))}
            value={signalPlayId}
            onChange={setSignalPlayId}
          />
        </div>
      ) : null}
      <OutcomeDumbbell rows={rows} metric={metric} />
    </div>
  )
}
