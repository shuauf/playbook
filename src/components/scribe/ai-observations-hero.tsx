"use client"

import type { LookCloserItem, ObservationMark } from "@/lib/analysis/types"
import { cn } from "@/lib/utils"

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
              className="mx-0.5 inline-flex translate-y-[-1px] items-center rounded-full bg-white/12 px-2 py-0.5 text-[0.72em] font-medium tracking-normal text-[#f3f2ee] align-baseline"
            >
              {mark.value}
            </span>
          )
        }
        if (mark.type === "person") {
          return (
            <strong key={`${mark.type}-${index}`} className="font-semibold text-[#f3f2ee]">
              {mark.value}
            </strong>
          )
        }
        if (mark.type === "metric") {
          return (
            <span
              key={`${mark.type}-${index}`}
              className="font-semibold tabular-nums text-[#D9893A]"
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
}: {
  items: LookCloserItem[]
  period: string
  stats: Array<{ value: string; label: string }>
  onOpen: (href: string) => void
}) {
  return (
    <section className="rounded-2xl bg-[#2B2A27] px-4 py-4 text-[#f3f2ee] md:px-5 md:py-5">
      <div className="max-w-3xl">
        <p className="text-[11px] tracking-[0.16em] text-[#D9893A] uppercase">AI Observations</p>
        <h2 className="font-heading mt-1 text-2xl leading-tight md:text-[1.7rem]">
          The system found these patterns first
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-white/60">
          Pattern-finding across logged activity and Gong in the {period}. Three findings worth a
          closer look before the rest of the page.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="mt-5 text-sm text-white/60">Nothing stands out in this window yet.</p>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.href)}
              className={cn(
                "flex h-full cursor-pointer flex-col rounded-xl bg-white/[0.07] px-4 py-4 text-left",
                "transition-colors hover:bg-white/[0.11]"
              )}
            >
              <span className="text-[11px] tracking-[0.14em] text-white/40 uppercase">{item.label}</span>
              <p className="font-heading mt-2 text-lg leading-snug">
                <ObservationCopy marks={item.headline} />
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/55">
                <ObservationCopy marks={item.detail} />
              </p>
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-xl font-medium tracking-tight tabular-nums text-white/90">{stat.value}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-white/40">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
