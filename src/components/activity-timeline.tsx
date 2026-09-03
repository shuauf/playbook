"use client"

import Link from "next/link"
import { useState } from "react"

import { SnapshotList } from "@/components/snapshot-list"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { prerequisiteRollupLabel } from "@/lib/explorer/search"
import type { OpportunityActivity } from "@/lib/playbook/queries"
import { cn } from "@/lib/utils"

export function ActivityTimeline({ activities }: { activities: OpportunityActivity[] }) {
  const [openId, setOpenId] = useState<string | null>(activities[0]?.id ?? null)

  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">No sales activities recorded.</p>
  }

  return (
    <div className="divide-y">
      {activities.map((activity) => {
        const open = openId === activity.id
        return (
          <div key={activity.id} className="py-3">
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 text-left"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : activity.id)}
            >
              <div>
                <p className="font-medium">{activity.playName}</p>
                <p className="text-sm text-muted-foreground">
                  {activity.date} · {activity.stageAtActivity} · {activity.seName}
                  {activity.playVersion ? ` · v${activity.playVersion}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {activity.captureKind === "undefined" ? (
                  <Badge variant="outline">Undefined</Badge>
                ) : (
                  <Badge variant="outline">
                    {prerequisiteRollupLabel(activity.allPrerequisitesMet, activity.unmetCount)}
                  </Badge>
                )}
              </div>
            </button>
            {open ? (
              <div className="mt-3 space-y-3 rounded-lg border border-border bg-card/60 p-3">
                <SnapshotList captureKind={activity.captureKind} snapshots={activity.snapshots} />
                {activity.note ? (
                  <p className="text-sm text-muted-foreground">Note: {activity.note}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/activity/activities/${activity.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Open snapshot
                  </Link>
                  {activity.playId ? (
                    <Link
                      href={`/plays/${activity.playId}`}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                    >
                      Play definition
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
