import { count, eq } from "drizzle-orm"

import { detectPredecessorTables } from "@/lib/db/legacy"
import { persistenceCaption, resolveDbConnection } from "@/lib/db/connection"
import { getOpenedConnection } from "@/lib/db"
import { CURRENT_SCHEMA_VERSION } from "@/lib/db/migrate"
import {
  activityPrerequisiteSnapshots,
  appMeta,
  opportunities,
  people,
  playVersionPrerequisites,
  salesActivities,
  salesPlayVersions,
  salesPlays,
  undefinedPlayLabels,
} from "@/lib/db/schema"
import { SEED_CONTRACT } from "@/lib/db/seed-planted"

export type WorkspacePlaySummary = {
  id: string
  name: string
  typicalStages: string[]
  prerequisiteCount: number
  status: string
}

export type WorkspaceStatus = {
  productName: string
  workspaceName: string
  persistence: string
  isDemo: boolean
  schemaVersion: string
  connectionKind: "file" | "remote"
  counts: {
    plays: number
    people: number
    opportunities: number
    activities: number
    snapshots: number
    undefinedLabels: number
    undefinedActivities: number
  }
  plays: WorkspacePlaySummary[]
  undefinedLabels: Array<{ displayName: string; status: string }>
  predecessorTables: string[]
  planted: typeof SEED_CONTRACT
}

function parseStages(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export async function getWorkspaceStatus(): Promise<WorkspaceStatus> {
  const connection = resolveDbConnection()
  const opened = await getOpenedConnection()
  const db = opened.db
  const predecessorTables = await detectPredecessorTables(opened.client)

  const [
    playCount,
    peopleCount,
    opportunityCount,
    activityCount,
    snapshotCount,
    undefinedLabelCount,
    undefinedActivityCount,
    metaRows,
    playRows,
    versionRows,
    labelRows,
    prerequisiteRows,
  ] = await Promise.all([
    db.select({ value: count() }).from(salesPlays),
    db.select({ value: count() }).from(people),
    db.select({ value: count() }).from(opportunities),
    db.select({ value: count() }).from(salesActivities),
    db.select({ value: count() }).from(activityPrerequisiteSnapshots),
    db.select({ value: count() }).from(undefinedPlayLabels),
    db
      .select({ value: count() })
      .from(salesActivities)
      .where(eq(salesActivities.captureKind, "undefined")),
    db.select().from(appMeta),
    db.select().from(salesPlays),
    db.select().from(salesPlayVersions),
    db.select().from(undefinedPlayLabels),
    db.select().from(playVersionPrerequisites),
  ])

  const meta = new Map(metaRows.map((row) => [row.key, row.value]))
  const versions = versionRows.filter((row) =>
    playRows.some((play) => play.currentVersionId === row.id)
  )

  const plays: WorkspacePlaySummary[] = playRows.map((play) => {
    const version = versions.find((item) => item.id === play.currentVersionId)
    return {
      id: play.id,
      name: version?.name ?? play.id,
      typicalStages: version ? parseStages(version.typicalStages) : [],
      prerequisiteCount: prerequisiteRows.filter((item) => item.versionId === play.currentVersionId)
        .length,
      status: play.status,
    }
  })

  return {
    productName: "Playbook Iterator",
    workspaceName: meta.get("workspace_name") ?? "Workspace",
    persistence: persistenceCaption(connection),
    isDemo: meta.get("data_source") === "demo",
    schemaVersion: CURRENT_SCHEMA_VERSION,
    connectionKind: connection.kind,
    counts: {
      plays: playCount[0]?.value ?? 0,
      people: peopleCount[0]?.value ?? 0,
      opportunities: opportunityCount[0]?.value ?? 0,
      activities: activityCount[0]?.value ?? 0,
      snapshots: snapshotCount[0]?.value ?? 0,
      undefinedLabels: undefinedLabelCount[0]?.value ?? 0,
      undefinedActivities: undefinedActivityCount[0]?.value ?? 0,
    },
    plays,
    undefinedLabels: labelRows.map((row) => ({
      displayName: row.displayName,
      status: row.status,
    })),
    predecessorTables,
    planted: SEED_CONTRACT,
  }
}
