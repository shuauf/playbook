"use client"

import Link from "next/link"
import { useState } from "react"

import { confidenceFill } from "@/components/confidence-badge"
import { formatCount, formatDays, pct, pp } from "@/lib/format"
import type { PlayFinding } from "@/lib/analysis/types"

type Tip = { x: number; y: number; lines: string[] }

function ChartTip({ tip }: { tip: Tip | null }) {
  if (!tip) return null
  return (
    <div
      className="pointer-events-none absolute z-20 max-w-xs rounded-md border border-border bg-card px-2.5 py-2 text-xs shadow-sm"
      style={{ left: tip.x, top: tip.y }}
    >
      {tip.lines.map((line) => (
        <p key={line} className="text-muted-foreground first:font-medium first:text-foreground">
          {line}
        </p>
      ))}
    </div>
  )
}

function playTip(play: PlayFinding) {
  return [
    play.playName,
    `${formatCount(play.activityCount)} activities · ${formatCount(play.opportunityCount)} opportunities`,
    `Exception rate ${play.exceptionRate === null ? "—" : pct(play.exceptionRate)}`,
    `Win rate followed ${play.win.metRate === null ? "—" : pct(play.win.metRate)} (n=${play.win.metN})`,
    `Win rate with exceptions ${play.win.unmetRate === null ? "—" : pct(play.win.unmetRate)} (n=${play.win.unmetN})`,
    `Difference ${play.win.difference === null ? "—" : pp(play.win.difference, 0)}`,
    `${play.win.confidence} sample`,
  ]
}

export function ExceptionBubbleChart({ plays }: { plays: PlayFinding[] }) {
  const [tip, setTip] = useState<Tip | null>(null)
  const usable = plays.filter((play) => play.activityCount > 0)
  const width = 640
  const height = 360
  const pad = { l: 48, r: 16, t: 28, b: 40 }
  const xs = usable.map((play) => play.exceptionRate ?? 0)
  const ys = usable.map((play) => play.win.difference ?? 0)
  const maxX = Math.max(0.45, ...xs, 0.01)
  const maxY = Math.max(0.25, ...ys.map(Math.abs), 0.05)
  const minY = -maxY
  const x = (value: number) => pad.l + (value / maxX) * (width - pad.l - pad.r)
  const y = (value: number) => pad.t + ((maxY - value) / (maxY - minY)) * (height - pad.t - pad.b)
  const midX = x(0.25)
  const zeroY = y(0)
  const sizes = usable.map((play) => play.opportunityCount)
  const maxSize = Math.max(...sizes, 1)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Exception attention chart">
        <rect x={pad.l} y={pad.t} width={midX - pad.l} height={zeroY - pad.t} fill="oklch(0.96 0.02 85)" />
        <rect x={midX} y={pad.t} width={width - pad.r - midX} height={zeroY - pad.t} fill="oklch(0.95 0.025 25 / 0.45)" />
        <rect x={pad.l} y={zeroY} width={midX - pad.l} height={height - pad.b - zeroY} fill="oklch(0.97 0.01 80)" />
        <rect x={midX} y={zeroY} width={width - pad.r - midX} height={height - pad.b - zeroY} fill="oklch(0.96 0.02 75 / 0.4)" />
        <line x1={pad.l} x2={width - pad.r} y1={zeroY} y2={zeroY} stroke="oklch(0.55 0.03 50)" strokeWidth="1" />
        <line x1={midX} x2={midX} y1={pad.t} y2={height - pad.b} stroke="oklch(0.82 0.02 80)" strokeWidth="1" />
        <text x={width - pad.r} y={18} textAnchor="end" className="fill-muted-foreground" fontSize="10">
          High frequency, high impact
        </text>
        <text x={pad.l} y={18} className="fill-muted-foreground" fontSize="10">
          Low frequency, high impact
        </text>
        <text x={width - pad.r} y={height - 8} textAnchor="end" className="fill-muted-foreground" fontSize="10">
          High frequency, lower impact
        </text>
        <text x={pad.l} y={height - 8} className="fill-muted-foreground" fontSize="10">
          Lower priority
        </text>
        <text x={(pad.l + width - pad.r) / 2} y={height - 20} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
          Exception rate
        </text>
        <text
          x="14"
          y={(pad.t + height - pad.b) / 2}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="10"
          transform={`rotate(-90 14 ${(pad.t + height - pad.b) / 2})`}
        >
          Win-rate penalty
        </text>
        {usable.map((play) => {
          const cx = x(play.exceptionRate ?? 0)
          const cy = y(play.win.difference ?? 0)
          const r = 8 + (Math.sqrt(play.opportunityCount / maxSize) * 18)
          const muted = play.win.confidence === "insufficient"
          return (
            <a key={play.playId} href={`/plays/${play.playId}`}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={confidenceFill(play.win.confidence)}
                fillOpacity={muted ? 0.28 : 0.72}
                stroke={muted ? "oklch(0.7 0.02 80)" : "oklch(0.32 0.04 50)"}
                strokeWidth="1"
                onMouseEnter={(event) => {
                  const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect()
                  setTip({
                    x: event.clientX - (box?.left ?? 0) + 12,
                    y: event.clientY - (box?.top ?? 0) + 12,
                    lines: playTip(play),
                  })
                }}
                onMouseLeave={() => setTip(null)}
              />
            </a>
          )
        })}
      </svg>
      <ChartTip tip={tip} />
    </div>
  )
}

export function WinRateDumbbell({ plays }: { plays: PlayFinding[] }) {
  const rows = plays
    .filter((play) => play.closedOpportunityCount > 0)
    .slice()
    .sort((a, b) => (b.win.difference ?? -1) - (a.win.difference ?? -1))
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No closed play comparisons in this view.</p>
  }
  return (
    <div className="space-y-3">
      {rows.map((play) => {
        const met = play.win.metRate ?? 0
        const unmet = play.win.unmetRate ?? 0
        const muted = play.win.confidence === "insufficient"
        return (
          <div key={play.playId}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <Link href={`/plays/${play.playId}`} className="font-medium hover:underline">
                {play.playName}
              </Link>
              <span className="text-xs text-muted-foreground">
                {play.win.difference === null ? "—" : pp(play.win.difference, 0)} · n {play.win.metN}/{play.win.unmetN}
              </span>
            </div>
            <div className="relative h-6">
              <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-border" />
              <div
                className="absolute top-1/2 h-px -translate-y-1/2 bg-foreground/40"
                style={{
                  left: `${Math.min(met, unmet) * 100}%`,
                  width: `${Math.abs(met - unmet) * 100}%`,
                }}
              />
              <span
                title={`Followed ${pct(met)}`}
                className={`absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  muted ? "border border-foreground/40 bg-card" : "bg-[oklch(0.38_0.06_175)]"
                }`}
                style={{ left: `${met * 100}%` }}
              />
              <span
                title={`Exceptions ${pct(unmet)}`}
                className={`absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  muted ? "border border-foreground/30 bg-card" : "bg-[oklch(0.5_0.12_25)]"
                }`}
                style={{ left: `${unmet * 100}%` }}
              />
            </div>
          </div>
        )
      })}
      <p className="text-[11px] text-muted-foreground">
        Forest marks are win rate when every prerequisite was met. Coral marks are win rate when at
        least one was unmet.
      </p>
    </div>
  )
}

export function CycleDivergingBars({ plays }: { plays: PlayFinding[] }) {
  const rows = plays.filter((play) => play.cycle.differenceDays !== null)
  const max = Math.max(20, ...rows.map((play) => Math.abs(play.cycle.differenceDays ?? 0)))
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Not enough won opportunities to compare cycle time.</p>
  }
  return (
    <div className="space-y-2.5">
      {rows
        .slice()
        .sort((a, b) => Math.abs(b.cycle.differenceDays ?? 0) - Math.abs(a.cycle.differenceDays ?? 0))
        .map((play) => {
          const days = play.cycle.differenceDays ?? 0
          const muted = play.cycle.confidence === "insufficient"
          const width = (Math.abs(days) / max) * 50
          return (
            <div key={play.playId} className="grid grid-cols-[7rem_1fr_7rem] items-center gap-2 text-sm">
              <Link href={`/plays/${play.playId}`} className="truncate hover:underline">
                {play.playName}
              </Link>
              <div className="relative h-5">
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-foreground/50" />
                <div
                  className={`absolute top-1 h-3 rounded-sm ${
                    muted
                      ? "bg-muted-foreground/30"
                      : days >= 0
                        ? "bg-[oklch(0.62_0.1_25)]"
                        : "bg-[oklch(0.5_0.07_175)]"
                  }`}
                  style={{
                    width: `${width}%`,
                    left: days >= 0 ? "50%" : `${50 - width}%`,
                  }}
                  title={`${formatDays(Math.abs(days))} ${days >= 0 ? "slower" : "faster"} · won n ${play.cycle.metN}/${play.cycle.unmetN}`}
                />
              </div>
              <span className="text-right text-xs text-muted-foreground">
                {days === 0 ? "no difference" : `${Math.round(Math.abs(days))} days ${days > 0 ? "slower" : "faster"}`}
              </span>
            </div>
          )
        })}
    </div>
  )
}
