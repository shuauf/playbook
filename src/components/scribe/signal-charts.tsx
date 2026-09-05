"use client"

import { useMemo, useState } from "react"

import { PlayPick } from "@/components/scribe/play-pick"
import { pct, periodTitleLower } from "@/lib/format"
import type { HealthAnalysis, SignalFrequency, SignalTrendPoint } from "@/lib/analysis/types"
import type { PlayDetail } from "@/lib/db/catalog"

function FrequencyBars({
  rows,
  empty,
  barClass,
}: {
  rows: Array<{ key: string; label: string; metRate: number }>
  empty: string
  barClass: string
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.key} className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-3">
          <div>
            <p className="text-sm">{row.label}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#EBEDF1]">
              <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.round(row.metRate * 100)}%` }} />
            </div>
          </div>
          <p className="text-right text-sm tabular-nums">{pct(row.metRate)}</p>
        </div>
      ))}
    </div>
  )
}

export function SignalTrendChart({ points }: { points: SignalTrendPoint[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">Not enough recent calls to chart a trend.</p>
  }
  const width = 360
  const height = 140
  const pad = { l: 28, r: 8, t: 12, b: 24 }
  const xs = points.map((_, index) => pad.l + (index / Math.max(points.length - 1, 1)) * (width - pad.l - pad.r))
  const y = (value: number) => pad.t + (1 - value) * (height - pad.t - pad.b)
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xs[index]} ${y(point.metRate)}`)
    .join(" ")

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Criteria-met rate over time">
      {[0.25, 0.5, 0.75, 1].map((tick) => (
        <g key={tick}>
          <line x1={pad.l} x2={width - pad.r} y1={y(tick)} y2={y(tick)} stroke="#EBEDF1" />
          <text x={4} y={y(tick) + 3} className="fill-muted-foreground" fontSize="9">
            {Math.round(tick * 100)}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#D9893A" strokeWidth="2" />
      {points.map((point, index) => (
        <g key={point.label}>
          <circle cx={xs[index]} cy={y(point.metRate)} r="3" fill="#2B2A27" />
          <text x={xs[index]} y={height - 6} textAnchor="middle" className="fill-muted-foreground" fontSize="9">
            {point.label.slice(5)}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function PlaySignalSection({
  analysis,
  details,
}: {
  analysis: HealthAnalysis
  details: Record<string, PlayDetail>
}) {
  const plays = analysis.plays.map((play) => ({ id: play.playId, name: play.playName }))
  const [playId, setPlayId] = useState(
    plays.find((play) => play.id === "play-product-demo")?.id ?? plays[0]?.id ?? ""
  )
  const period = periodTitleLower(analysis.filters.period)
  const selectedName = plays.find((play) => play.id === playId)?.name ?? "this play"

  const signalRows = useMemo(
    () =>
      analysis.prerequisites
        .filter((item) => item.playId === playId)
        .map((item) => ({
          key: item.key,
          label: item.text,
          metRate: item.unmetRate === null ? 0 : 1 - item.unmetRate,
        })),
    [analysis.prerequisites, playId]
  )

  const signRows =
    details[playId]?.signsOfSuccess.map((item) => ({
      key: item.key,
      label: item.text,
      metRate: item.observedRate,
    })) ?? []

  return (
    <section className="mt-8">
      <h2 className="font-heading text-2xl">What Gong is seeing on these calls</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Success signals are patterns that tended to go better. Signs of success are different — they show
        the play actually did its job. Results are styled as if Gong populated them. Looking at {period}.
      </p>
      <div className="mt-3">
        <p className="mb-1.5 text-[11px] text-muted-foreground">Sales play</p>
        <PlayPick plays={plays} value={playId} onChange={setPlayId} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-4">
          <h3 className="text-sm font-medium">How often each success signal is present</h3>
          <p className="mb-3 text-[11px] text-muted-foreground">
            Share of {selectedName} calls in the {period} where Gong tagged this signal
          </p>
          <FrequencyBars
            rows={signalRows}
            empty={`No success-signal results for ${selectedName} in the ${period}.`}
            barClass="bg-[#3D8B8B]"
          />
        </div>
        <div className="rounded-2xl bg-white p-4">
          <h3 className="text-sm font-medium">How often each sign of success showed up</h3>
          <p className="mb-3 text-[11px] text-muted-foreground">
            Outcome indicators on {selectedName} — not preconditions, just whether the play landed
          </p>
          <FrequencyBars
            rows={signRows}
            empty={`No signs of success are defined for ${selectedName} yet.`}
            barClass="bg-[#D9893A]"
          />
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-white p-4">
        <h3 className="text-sm font-medium">Calls where every success signal was present</h3>
        <p className="mb-3 text-[11px] text-muted-foreground">Trend across all plays in the {period}</p>
        <SignalTrendChart points={analysis.signalTrend} />
      </div>
    </section>
  )
}

export function SignalFrequencyChart({ rows }: { rows: SignalFrequency[] }) {
  return (
    <FrequencyBars
      rows={rows.map((row) => ({ key: `${row.playName}-${row.key}`, label: row.label, metRate: row.metRate }))}
      empty="No Gong-sourced signals in this window."
      barClass="bg-[#3D8B8B]"
    />
  )
}
