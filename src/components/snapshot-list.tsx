import { Badge } from "@/components/ui/badge"
import type { ActivitySnapshot } from "@/lib/playbook/queries"

export function SnapshotList({
  captureKind,
  snapshots,
}: {
  captureKind: string
  snapshots: ActivitySnapshot[]
}) {
  if (captureKind === "undefined") {
    return (
      <p className="text-sm text-muted-foreground">
        Prerequisite status is unknown. This activity was not a defined sales play, so no Met /
        Not Met snapshot was recorded.
      </p>
    )
  }

  if (snapshots.length === 0) {
    return <p className="text-sm text-muted-foreground">No recommended prerequisites were attached to this play version.</p>
  }

  return (
    <ul className="space-y-2">
      {snapshots.map((item) => (
        <li key={item.key} className="flex items-start justify-between gap-3 text-sm">
          <span>{item.text}</span>
          <Badge variant="outline">{item.status === "met" ? "Met" : "Not Met"}</Badge>
        </li>
      ))}
    </ul>
  )
}
