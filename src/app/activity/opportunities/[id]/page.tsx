import Link from "next/link"
import { notFound } from "next/navigation"

import { ComingPanel } from "@/components/coming-panel"
import { PageIntro } from "@/components/page-intro"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getOpportunityDetail } from "@/lib/playbook/queries"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const opportunity = await getOpportunityDetail(id)
  if (!opportunity) notFound()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageIntro className="mb-0" kicker={opportunity.account} title={opportunity.name}>
          {opportunity.seName} with {opportunity.aeName} · {opportunity.team} ·{" "}
          {opportunity.segment}
        </PageIntro>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{opportunity.outcome}</Badge>
          <Link href="/activity?view=opportunities" className={cn(buttonVariants({ variant: "outline" }))}>
            Back to explorer
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opportunity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.12em]">Stage</p>
            <p className="mt-1">{opportunity.stage}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.12em]">Created</p>
            <p className="mt-1">{opportunity.createdAt}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.12em]">Close date</p>
            <p className="mt-1">{opportunity.closeDate ?? "Open"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales activity timeline</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {opportunity.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales activities recorded.</p>
          ) : (
            opportunity.activities.map((activity) => (
              <div key={activity.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{activity.playName}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.date} · {activity.stageAtActivity} · {activity.seName}
                  </p>
                </div>
                {activity.captureKind === "undefined" ? (
                  <Badge variant="outline">Undefined</Badge>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ComingPanel title="Expandable prerequisite snapshots">
        Each activity will open the exact Met / Not Met snapshot recorded at the time. Undefined
        activities will keep showing that prerequisite status was unknown.
      </ComingPanel>
    </div>
  )
}
