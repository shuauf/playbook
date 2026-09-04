import { pct } from "@/lib/format"
import type { SignalFrequency, SignalTrendPoint } from "@/lib/analysis/types"

export function SignalFrequencyChart({ rows }: { rows: SignalFrequency[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No Gong-sourced signals in this period.</p>
  }
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={`${row.playName}-${row.key}`} className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-3">
          <div>
            <p className="truncate text-sm">{row.label}</p>
            <p className="text-[11px] text-muted-foreground">{row.playName}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#EBEDF1]">
              <div
                className="h-full rounded-full bg-[#3D8B8B]"
                style={{ width: `${Math.round(row.metRate * 100)}%` }}
              />
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
          <line
            x1={pad.l}
            x2={width - pad.r}
            y1={y(tick)}
            y2={y(tick)}
            stroke="#EBEDF1"
          />
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
