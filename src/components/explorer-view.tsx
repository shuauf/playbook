import Link from "next/link"

import { ComingPanel } from "@/components/coming-panel"
import { PageIntro } from "@/components/page-intro"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function ExplorerView({
  view,
  opportunities,
  activities,
}: {
  view: "opportunities" | "activities"
  opportunities: Array<{
    id: string
    name: string
    account: string
    stage: string
    outcome: string
    seName: string
    team: string
  }>
  activities: Array<{
    id: string
    date: string
    opportunityId: string
    opportunityName: string
    playName: string
    stageAtActivity: string
    seName: string
    captureKind: string
  }>
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageIntro className="mb-0" kicker="Activity Explorer" title="The operational record">
          Searchable grids, add-activity, and import land here next. These tables are a live
          preview of the same records the later explorer will filter.
        </PageIntro>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/activity?view=opportunities"
            className={cn(buttonVariants({ variant: view === "opportunities" ? "default" : "outline" }))}
            aria-current={view === "opportunities" ? "page" : undefined}
          >
            Opportunities
          </Link>
          <Link
            href="/activity?view=activities"
            className={cn(buttonVariants({ variant: view === "activities" ? "default" : "outline" }))}
            aria-current={view === "activities" ? "page" : undefined}
          >
            Sales Activities
          </Link>
          <span className={cn(buttonVariants({ variant: "outline" }), "opacity-60")}>
            Add Activity
          </span>
        </div>
      </div>

      <ComingPanel title="Search, filters, and Add Activity">
        Fast search across accounts, plays, and SE names comes with the full explorer. Add
        Activity will require an explicit Met or Not Met answer for every prerequisite.
      </ComingPanel>

      <Card>
        <CardContent className="px-0">
          {view === "opportunities" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>SE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/activity/opportunities/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell>{row.account}</TableCell>
                    <TableCell>{row.stage}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.outcome}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.seName} · {row.team}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Play</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>SE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>
                      <Link
                        href={`/activity/opportunities/${row.opportunityId}`}
                        className="hover:underline"
                      >
                        {row.opportunityName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {row.playName}
                      {row.captureKind === "undefined" ? (
                        <Badge variant="outline" className="ml-2">
                          Undefined
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{row.stageAtActivity}</TableCell>
                    <TableCell className="text-muted-foreground">{row.seName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
