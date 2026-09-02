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
import type { WorkspacePlaySummary } from "@/lib/workspace/status"

export function AdminView({
  plays,
  undefinedCount,
}: {
  plays: WorkspacePlaySummary[]
  undefinedCount: number
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageIntro className="mb-0" kicker="Admin Console" title="Maintain the playbook">
          Sales plays are the primary object. Editing a play will write a new version for future
          activities. Historical snapshots stay as they were recorded.
        </PageIntro>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/plays/new" className={cn(buttonVariants())}>
            New play
          </Link>
          <Link href="/admin/undefined" className={cn(buttonVariants({ variant: "outline" }))}>
            Undefined plays
            {undefinedCount > 0 ? ` (${undefinedCount})` : ""}
          </Link>
        </div>
      </div>

      <ComingPanel title="Play editor and versioning">
        Creating, editing, retiring, reordering prerequisites, and reviewing version history are
        the next Admin phase. These rows already open a definition page so you can inspect the
        current catalog.
      </ComingPanel>

      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Play</TableHead>
                <TableHead>Typical stages</TableHead>
                <TableHead>Prerequisites</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plays.map((play) => (
                <TableRow key={play.id}>
                  <TableCell>
                    <Link href={`/admin/plays/${play.id}`} className="font-medium hover:underline">
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
