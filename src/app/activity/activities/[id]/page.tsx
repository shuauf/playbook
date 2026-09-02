import Link from "next/link"
import { notFound } from "next/navigation"

import { PageIntro } from "@/components/page-intro"
import { SnapshotList } from "@/components/snapshot-list"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prerequisiteRollupLabel } from "@/lib/explorer/search"
import { getActivityDetail } from "@/lib/playbook/queries"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const activity = await getActivityDetail(id)
  if (!activity) notFound()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageIntro className="mb-0" kicker={activity.account || "Sales activity"} title={activity.playName}>
          {activity.date} · {activity.stageAtActivity} · {activity.seName}
          {activity.playVersion ? ` · version ${activity.playVersion}` : ""}
        </PageIntro>
        <div className="flex flex-wrap gap-2">
          {activity.captureKind === "undefined" ? (
            <Badge variant="outline">Undefined</Badge>
          ) : (
            <Badge variant="outline">
              {prerequisiteRollupLabel(activity.allPrerequisitesMet, activity.unmetCount)}
            </Badge>
          )}
          <Link
            href={`/activity/opportunities/${activity.opportunityId}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Opportunity
          </Link>
          {activity.playId ? (
            <Link href={`/plays/${activity.playId}`} className={cn(buttonVariants({ variant: "outline" }))}>
              Play definition
            </Link>
          ) : (
            <Link href="/admin/undefined" className={cn(buttonVariants({ variant: "outline" }))}>
              Undefined plays
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recorded snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.12em]">Opportunity</p>
              <p className="mt-1">
                <Link
                  href={`/activity/opportunities/${activity.opportunityId}`}
                  className="hover:underline"
                >
                  {activity.opportunityName}
                </Link>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.12em]">Source</p>
              <p className="mt-1 capitalize">{activity.source}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.12em]">Unmet</p>
              <p className="mt-1">{activity.unmetCount ?? "Unknown"}</p>
            </div>
          </div>
          <SnapshotList captureKind={activity.captureKind} snapshots={activity.snapshots} />
          {activity.note ? (
            <p className="text-sm text-muted-foreground">Note: {activity.note}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
