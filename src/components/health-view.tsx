import Link from "next/link"

import { ComingPanel } from "@/components/coming-panel"
import { HealthFilters } from "@/components/health-filters"
import { PageIntro } from "@/components/page-intro"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCount } from "@/lib/format"
import type { HealthFilters as HealthFilterValues } from "@/lib/navigation"
import type { WorkspaceStatus } from "@/lib/workspace/status"

export function HealthView({
  status,
  filters,
  seNames,
}: {
  status: WorkspaceStatus
  filters: HealthFilterValues
  seNames: string[]
}) {
  const openUndefined = status.undefinedLabels.filter((item) => item.status === "open")

  return (
    <div className="space-y-6">
      <PageIntro kicker="Playbook Health" title="What deserves attention">
        This is the leadership landing page. Portfolio comparisons and the grounded brief still
        need the analysis engine. The counts, attention items, and play catalog below are live
        workspace data.
      </PageIntro>

      <HealthFilters
        filters={filters}
        plays={status.plays.map((play) => ({ id: play.id, name: play.name }))}
        seNames={seNames}
      />
      <p className="text-xs text-muted-foreground">
        Filters are remembered in the URL. They will drive metrics, the attention queue, and the
        AI brief once those surfaces exist.
      </p>

      <ComingPanel title="AI Playbook Brief">
        A short, evidence-backed brief will sit here. It will only summarize findings the
        application has already computed. It will not invent metrics, and it will not be a
        chatbot.
      </ComingPanel>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Opportunities analyzed", value: status.counts.opportunities },
          { label: "Sales activities logged", value: status.counts.activities },
          { label: "Undefined activities", value: status.counts.undefinedActivities },
          { label: "Play definitions", value: status.counts.plays },
        ].map((metric) => (
          <Card key={metric.label} size="sm">
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="font-heading text-3xl">{formatCount(metric.value)}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Attention queue</CardTitle>
          <CardDescription>
            Issues a leader can act on now. Outcome-linked alerts arrive with the analysis
            engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {openUndefined.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No undefined plays need attention.</p>
          ) : (
            openUndefined.map((item) => (
              <div key={item.displayName} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="font-medium">{item.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCount(status.counts.undefinedActivities)} activities are not mapped to a
                    formal sales play.
                  </p>
                </div>
                <Link
                  href="/admin/undefined"
                  className="text-sm text-[oklch(0.32_0.06_175)] hover:underline"
                >
                  Review
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Play performance</CardTitle>
          <CardDescription>
            Volume is from the workspace. Exception rate, win rate, and cycle comparisons will
            fill these columns later. Click a play to inspect its definition.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sales play</TableHead>
                <TableHead>Typical stages</TableHead>
                <TableHead>Prerequisites</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {status.plays.map((play) => (
                <TableRow key={play.id}>
                  <TableCell>
                    <Link href={`/plays/${play.id}`} className="font-medium hover:underline">
                      {play.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {play.typicalStages.join(", ") || "—"}
                  </TableCell>
                  <TableCell>{play.prerequisiteCount}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{play.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
