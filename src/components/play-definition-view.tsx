import Link from "next/link"

import { PageIntro } from "@/components/page-intro"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type PlayDefinition = {
  id: string
  status: string
  currentVersion: {
    version: number
    name: string
    description: string
    typicalStages: string[]
  } | null
  versions: Array<{ version: number; name: string; createdAt: string }>
  prerequisites: Array<{ key: string; text: string }>
}

export function PlayDefinitionView({
  play,
  mode,
}: {
  play: PlayDefinition
  mode: "health" | "admin"
}) {
  const name = play.currentVersion?.name ?? play.id

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageIntro
          className="mb-0"
          kicker={mode === "admin" ? "Admin Console" : "Sales play"}
          title={name}
        >
          {play.currentVersion?.description ?? "This play has no current version."}
        </PageIntro>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{play.status}</Badge>
          {play.currentVersion ? (
            <Badge variant="secondary">Version {play.currentVersion.version}</Badge>
          ) : null}
          <Link href={mode === "admin" ? "/admin" : "/"} className={cn(buttonVariants({ variant: "outline" }))}>
            Back
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Definition</CardTitle>
          <CardDescription>
            Typical stages and the current success-signal list. Editing will create a new version
            rather than rewriting history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
              Typical stages
            </p>
            <p className="mt-1">{play.currentVersion?.typicalStages.join(", ") || "—"}</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
              Success signals
            </p>
            <ol className="mt-2 list-decimal space-y-2 pl-5">
              {play.prerequisites.map((item) => (
                <li key={item.key}>{item.text}</li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Version history</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {play.versions.map((version) => (
            <div key={version.version} className="flex items-center justify-between py-3">
              <p className="font-medium">
                v{version.version} · {version.name}
              </p>
              <p className="text-sm text-muted-foreground">{version.createdAt}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {mode === "health" ? (
        <p className="text-sm text-muted-foreground">
          Outcome comparisons for this play live on{" "}
          <Link href="/" className="hover:underline">
            Playbook Health
          </Link>
          .
        </p>
      ) : null}
    </div>
  )
}
