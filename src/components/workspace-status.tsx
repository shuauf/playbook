import { PageIntro } from "@/components/page-intro"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCount } from "@/lib/format"
import type { WorkspaceStatus } from "@/lib/workspace/status"

export function WorkspaceStatusView({ status }: { status: WorkspaceStatus }) {
  const metrics = [
    { label: "Sales plays", value: status.counts.plays },
    { label: "Opportunities", value: status.counts.opportunities },
    { label: "Sales activities", value: status.counts.activities },
    { label: "Undefined activities", value: status.counts.undefinedActivities },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageIntro className="mb-0" kicker={status.workspaceName} title={status.productName}>
          The playbook is loaded. This status page confirms the new domain model and
          development dataset. Playbook Health, Activity Explorer, and Admin Console come next.
        </PageIntro>
        <div className="flex flex-wrap gap-2">
          {status.isDemo ? (
            <Badge variant="outline">Demo data</Badge>
          ) : (
            <Badge variant="outline">Workspace data</Badge>
          )}
          <Badge variant="secondary">{status.persistence}</Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} size="sm">
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="font-heading text-3xl">{formatCount(metric.value)}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Playbook catalog</CardTitle>
            <CardDescription>
              Each play is versioned. Historical activities will keep the version captured at
              the time.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {status.plays.map((play) => (
              <div key={play.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium">{play.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Typical stages: {play.typicalStages.join(", ") || "—"} ·{" "}
                    {play.prerequisiteCount} prerequisites
                  </p>
                </div>
                <Badge variant="outline">{play.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>What the seed is planting</CardTitle>
            <CardDescription>
              Replaceable development data with patterns the analysis engine will later have to
              find.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Product Demo includes a frequently skipped prerequisite associated with a large
              closed-won gap, and another frequently skipped prerequisite with little outcome
              difference.
            </p>
            <p>
              Workshop has only {status.planted.investigateClosed} closed opportunities and a
              dramatic-looking split — later analysis must label that Investigate or
              Insufficient, never Supported.
            </p>
            <p>
              {status.planted.repeatedOpportunityCount} opportunities have more than one Product
              Demo. {status.planted.offStageDiscoveryCount} Discovery activities sit outside
              typical stages.
            </p>
            <p>
              Undefined play in the queue:{" "}
              <span className="text-foreground">{status.planted.undefinedLabel}</span> (
              {status.counts.undefinedActivities} activities, no invented prerequisite snapshots).
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="border-b">
          <CardTitle>Schema and compatibility</CardTitle>
          <CardDescription>
            Forward migration {status.schemaVersion}. Predecessor tables are detected and left
            untouched.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 py-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Connection</p>
            <p className="mt-1 font-medium">
              {status.connectionKind === "remote" ? "Turso HTTP" : "File SQLite"}
            </p>
          </div>
          <div>
            <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Snapshots</p>
            <p className="mt-1 font-medium">{formatCount(status.counts.snapshots)} captured checks</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
              Predecessor tables
            </p>
            <p className="mt-1 font-medium">
              {status.predecessorTables.length === 0
                ? "None detected"
                : `${status.predecessorTables.length} left untouched`}
            </p>
            {status.predecessorTables.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {status.predecessorTables.join(", ")}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
