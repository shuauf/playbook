"use client"

import { cn } from "@/lib/utils"

export function PlayPick({
  plays,
  value,
  onChange,
}: {
  plays: Array<{ id: string; name: string }>
  value: string
  onChange: (id: string) => void
}) {
  const selected = plays.some((play) => play.id === value) ? value : plays[0]?.id ?? ""
  return (
    <div className="flex flex-wrap gap-1.5">
      {plays.map((play) => (
        <button
          key={play.id}
          type="button"
          onClick={() => onChange(play.id)}
          className={cn(
            "cursor-pointer rounded-full px-3 py-1 text-xs transition-colors",
            play.id === selected
              ? "bg-[#2B2A27] text-white"
              : "border border-border bg-white text-muted-foreground hover:border-[#2B2A27]/40 hover:text-foreground"
          )}
        >
          {play.name}
        </button>
      ))}
    </div>
  )
}
