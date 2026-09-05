"use client"

import type { Segment } from "@/lib/domain/types"
import { cn } from "@/lib/utils"

export type SegmentFilter = "all" | Segment

const OPTIONS: Array<{ id: SegmentFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "Strategic", label: "Strat" },
  { id: "Mid-Market", label: "Mid-Market" },
  { id: "SMB", label: "SMB" },
]

export function SegmentToggle({
  value,
  onChange,
}: {
  value: SegmentFilter
  onChange: (value: SegmentFilter) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-[11px] text-muted-foreground">Segment</p>
      <div className="inline-flex rounded-full border border-border bg-white p-0.5" role="group" aria-label="Segment">
        {OPTIONS.map((option) => (
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
    </div>
  )
}
