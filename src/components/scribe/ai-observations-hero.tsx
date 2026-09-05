"use client"

import type { LookCloserItem, ObservationMark } from "@/lib/analysis/types"
import { cn } from "@/lib/utils"

const CATEGORY_TONE: Record<LookCloserItem["kind"], string> = {
  gap: "text-[#D9893A]",
  gong: "text-[#3D8B8B]",
  define: "text-[#6F6E6A]",
}

function ObservationCopy({
  marks,
  className,
}: {
  marks: ObservationMark[]
  className?: string
}) {
  return (
    <span className={className}>
      {marks.map((mark, index) => {
        if (mark.type === "play") {
          return (
            <span
              key={`${mark.type}-${index}`}
              className="mx-0.5 inline-flex translate-y-[-1px] items-center rounded-full bg-[#2B2A27] px-2 py-0.5 text-[0.78em] font-semibold tracking-normal text-[#f3f2ee] align-baseline"
            >
              {mark.value}
            </span>
          )
        }
        if (mark.type === "person") {
          return (
            <strong key={`${mark.type}-${index}`} className="font-bold text-[#2B2A27]">
              {mark.value}
            </strong>
          )
        }
        if (mark.type === "metric") {
          return (
            <span
              key={`${mark.type}-${index}`}
              className="font-bold tabular-nums text-[#D9893A]"
            >
              {mark.value}
            </span>
          )
        }
        return <span key={`${mark.type}-${index}`}>{mark.value}</span>
      })}
    </span>
  )
}

export function AiObservationsHero({
  items,
  period,
  stats,
  onOpen,
  onExplorer,
  onLog,
}: {
  items: LookCloserItem[]
  period: string
  stats: Array<{ value: string; label: string }>
  onOpen: (href: string) => void
  onExplorer: () => void
  onLog: () => void
}) {
  return (
    <section className="rounded-2xl bg-[#2B2A27] px-4 py-4 text-[#f3f2ee] md:px-5 md:py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] tracking-[0.16em] text-[#D9893A] uppercase">AI Observations</p>
          <h2 className="font-heading mt-1 text-2xl leading-tight md:text-[1.7rem]">
            The system found these patterns first
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-white/60">
            Pattern-finding across logged activity in the {period}.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:pt-1">
          <button
            type="button"
            onClick={onExplorer}
            className="cursor-pointer rounded-full border border-white/25 px-4 py-1.5 text-sm text-[#f3f2ee] hover:bg-white/10"
          >
            Activity explorer
          </button>
          <button
            type="button"
            onClick={onLog}
            className="cursor-pointer rounded-full bg-[#f7f7f5] px-4 py-1.5 text-sm text-[#2B2A27] hover:bg-white"
          >
            Log activity
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <p className="text-sm font-medium tracking-tight tabular-nums text-white/75">{stat.value}</p>
            <p className="text-[11px] leading-snug text-white/40">{stat.label}</p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-white/60">Nothing stands out in this window yet.</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.href)}
              className={cn(
                "flex h-full cursor-pointer flex-col rounded-xl bg-[#f7f7f5] px-4 py-4 text-left text-[#2B2A27]",
                "shadow-sm transition-colors hover:bg-white"
              )}
            >
              <span className={cn("text-[11px] font-semibold tracking-[0.14em] uppercase", CATEGORY_TONE[item.kind])}>
                {item.label}
              </span>
              <p className="font-heading mt-2 text-lg leading-snug text-[#2B2A27]">
                <ObservationCopy marks={item.headline} />
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#2B2A27]/55">
                <ObservationCopy marks={item.detail} />
              </p>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
