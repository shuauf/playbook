import { getDb } from "@/lib/db"
import {
  activityPrerequisiteSnapshots,
  opportunities,
  salesActivities,
  salesPlayVersions,
  salesPlays,
} from "@/lib/db/schema"
import type { PlaybookDb } from "@/lib/db/types"
import type { AnalysisSnapshot } from "@/lib/analysis/types"
import type { OpportunityOutcome } from "@/lib/domain/types"

function parseStages(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export async function loadAnalysisSnapshot(inputDb?: PlaybookDb): Promise<AnalysisSnapshot> {
  const db = inputDb ?? (await getDb())
  const [oppRows, activityRows, playRows, versionRows, snapshotRows] = await Promise.all([
    db.select().from(opportunities),
    db.select().from(salesActivities),
    db.select().from(salesPlays),
    db.select().from(salesPlayVersions),
    db.select().from(activityPrerequisiteSnapshots),
  ])

  const versionById = new Map(versionRows.map((item) => [item.id, item]))
  const currentByPlay = new Map(
    playRows.map((play) => [play.id, versionRows.find((item) => item.id === play.currentVersionId)])
  )
  const typicalByVersion = new Map(
    versionRows.map((item) => [item.id, parseStages(item.typicalStages)])
  )
  const snapshotsByActivity = new Map<string, typeof snapshotRows>()
  for (const row of snapshotRows) {
    const list = snapshotsByActivity.get(row.activityId) ?? []
    list.push(row)
    snapshotsByActivity.set(row.activityId, list)
  }

  return {
    opportunities: oppRows.map((row) => ({
      id: row.id,
      name: row.name,
      account: row.account,
      segment: row.segment,
      stage: row.stage,
      outcome: row.outcome as OpportunityOutcome,
      seName: row.seName,
      team: row.team,
      createdAt: row.createdAt,
      closeDate: row.closeDate,
    })),
    activities: activityRows.map((row) => {
      const snaps = snapshotsByActivity.get(row.id) ?? []
      const version = row.playVersionId ? versionById.get(row.playVersionId) : undefined
      const current = row.playId ? currentByPlay.get(row.playId) : undefined
      return {
        id: row.id,
        opportunityId: row.opportunityId,
        playId: row.playId,
        playName:
          row.captureKind === "undefined"
            ? row.undefinedLabel ?? "Undefined activity"
            : (version?.name ?? current?.name ?? "Unknown play"),
        typicalStages: version
          ? typicalByVersion.get(version.id) ?? []
          : current
            ? typicalByVersion.get(current.id) ?? []
            : [],
        captureKind: row.captureKind as "defined" | "undefined",
        undefinedLabel: row.undefinedLabel,
        activityDate: row.activityDate,
        stageAtActivity: row.stageAtActivity,
        seName: row.seName,
        segment: row.segment || "",
        evaluatedKeys: snaps.map((item) => item.prerequisiteKey),
        unmetKeys: snaps.filter((item) => item.status === "not_met").map((item) => item.prerequisiteKey),
        snapshotCount: snaps.length,
      }
    }),
    plays: playRows.map((play) => {
      const current = currentByPlay.get(play.id)
      return {
        id: play.id,
        name: current?.name ?? play.id,
        status: play.status,
        typicalStages: current ? typicalByVersion.get(current.id) ?? [] : [],
      }
    }),
  }
}
