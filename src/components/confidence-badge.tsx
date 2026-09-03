import { Badge } from "@/components/ui/badge"
import type { ConfidenceLevel } from "@/lib/domain/types"
import { cn } from "@/lib/utils"

export function ConfidenceBadge({
  level,
  className,
}: {
  level: ConfidenceLevel
  className?: string
}) {
  const label =
    level === "supported" ? "Supported" : level === "directional" ? "Directional" : "Insufficient"
  return (
    <Badge
      variant="outline"
      className={cn(
        level === "supported" && "border-[oklch(0.72_0.08_25)] text-[oklch(0.45_0.12_25)]",
        level === "directional" && "border-[oklch(0.78_0.1_75)] text-[oklch(0.48_0.1_70)]",
        level === "insufficient" && "text-muted-foreground",
        className
      )}
    >
      {label}
    </Badge>
  )
}

export function confidenceFill(level: ConfidenceLevel) {
  if (level === "supported") return "oklch(0.48 0.12 25)"
  if (level === "directional") return "oklch(0.62 0.12 75)"
  return "oklch(0.72 0.02 80)"
}
