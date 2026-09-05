"use client"

import { useMemo, useState } from "react"

import { PlayPick } from "@/components/scribe/play-pick"
import { pct, periodTitleLower } from "@/lib/format"
import type { HealthAnalysis, SignalFrequency } from "@/lib/analysis/types"
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

  const playFinding = analysis.plays.find((item) => item.playId === playId)
  const closed = (playFinding?.win.metN ?? 0) + (playFinding?.win.unmetN ?? 0)
  const playWinRate =
    closed === 0 ? 0 : ((playFinding?.win.metWins ?? 0) + (playFinding?.win.unmetWins ?? 0)) / closed
  const landedRate = playFinding?.exceptionRate == null ? 0 : 1 - playFinding.exceptionRate
  const signRows =
    details[playId]?.signsOfSuccess.map((item, index) => ({
      key: item.key,
      label: item.text,
      metRate: index === 0 ? landedRate : playWinRate,
    })) ?? []

  return (
    <section className="mt-5">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Rates from logged {selectedName} calls in the {period}.
        </p>
        <PlayPick plays={plays} value={playId} onChange={setPlayId} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-3">
          <h2 className="font-heading text-xl">Recommended prerequisites</h2>
          <p className="mb-2 text-xs text-muted-foreground">
            Share of calls where each recommended prerequisite was present.
          </p>
          <FrequencyBars
            rows={signalRows}
            empty={`No recommended-prerequisite results for ${selectedName} in the ${period}.`}
            barClass="bg-[#3D8B8B]"
          />
        </div>
        <div className="rounded-2xl bg-white p-3">
          <h2 className="font-heading text-xl">Success criteria</h2>
          <p className="mb-2 text-xs text-muted-foreground">
            First criterion: calls where every recommended prerequisite was present. Second: closed win
            rate after this play.
          </p>
          <FrequencyBars
            rows={signRows}
            empty={`No success criteria are defined for ${selectedName} yet.`}
            barClass="bg-[#D9893A]"
          />
        </div>
      </div>
    </section>
  )
}

export function SignalFrequencyChart({ rows }: { rows: SignalFrequency[] }) {
  return (
    <FrequencyBars
      rows={rows.map((row) => ({ key: `${row.playName}-${row.key}`, label: row.label, metRate: row.metRate }))}
      empty="No recommended-prerequisite results in this window."
      barClass="bg-[#3D8B8B]"
    />
  )
}
