import Link from "next/link"

import { ComingPanel } from "@/components/coming-panel"
import { PageIntro } from "@/components/page-intro"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listOpenUndefinedLabels } from "@/lib/playbook/queries"
import { getWorkspaceStatus } from "@/lib/workspace/status"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function UndefinedPlaysPage() {
  const [labels, status] = await Promise.all([listOpenUndefinedLabels(), getWorkspaceStatus()])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageIntro className="mb-0" kicker="Admin Console" title="Undefined plays">
          These labels were logged as activities without a formal play definition. Mapping or
          creating a play will not invent historical prerequisite results.
        </PageIntro>
        <Link href="/admin" className={cn(buttonVariants({ variant: "outline" }))}>
          Back
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open labels</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {labels.length === 0 ? (
            <p className="text-sm text-muted-foreground">No undefined labels are waiting.</p>
          ) : (
            labels.map((label) => (
              <div key={label.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="font-medium">{label.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {label.description ?? "No description captured."} ·{" "}
                    {status.counts.undefinedActivities} activities
                  </p>
                </div>
                <Badge variant="outline">{label.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ComingPanel title="Map, formalize, or leave ad hoc">
        An administrator will be able to map a label to an existing play or create a new play
        from it. A person must confirm that action. Historical records will stay honest.
      </ComingPanel>
    </div>
  )
}
