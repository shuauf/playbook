import { desc, eq, inArray } from "drizzle-orm"

import { getDb } from "@/lib/db"
import type { PlaybookDb } from "@/lib/db/types"
import {
  activityPrerequisiteSnapshots,
  opportunities,
  people,
  playVersionPrerequisites,
  salesActivities,
  salesPlayVersions,
  salesPlays,
  undefinedPlayLabels,
} from "@/lib/db/schema"
import { formatDisplayDate } from "@/lib/dates"
import type { ExplorerActivity, ExplorerOpportunity } from "@/lib/explorer/types"
import type { PrerequisiteStatus } from "@/lib/domain/types"

function parseStages(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

async function resolveDb(db?: PlaybookDb) {
  return db ?? (await getDb())
}

function playNameForActivity(
  row: { captureKind: string; undefinedLabel: string | null; playVersionId: string | null },
  versions: Array<{ id: string; name: string }>
) {
  if (row.captureKind === "undefined") {
    return row.undefinedLabel ?? "Undefined activity"
  }
  return versions.find((item) => item.id === row.playVersionId)?.name ?? "Unknown play"
}

function snapshotRollup(
  captureKind: string,
  snapshots: Array<{ status: string }>
): { allPrerequisitesMet: boolean | null; unmetCount: number | null } {
  if (captureKind === "undefined") {
    return { allPrerequisitesMet: null, unmetCount: null }
  }
  const unmetCount = snapshots.filter((item) => item.status === "not_met").length
  return {
    allPrerequisitesMet: unmetCount === 0,
    unmetCount,
  }
}

export async function getPlayDetail(playId: string, inputDb?: PlaybookDb) {
  const db = await resolveDb(inputDb)
  const [play] = await db.select().from(salesPlays).where(eq(salesPlays.id, playId)).limit(1)
  if (!play) return null

  const versions = await db
    .select()
    .from(salesPlayVersions)
    .where(eq(salesPlayVersions.playId, playId))
  const current = versions.find((item) => item.id === play.currentVersionId) ?? versions.at(-1)
  const prerequisites = current
    ? await db
        .select()
        .from(playVersionPrerequisites)
        .where(eq(playVersionPrerequisites.versionId, current.id))
    : []

  return {
    id: play.id,
    status: play.status,
    currentVersion: current
      ? {
          id: current.id,
          version: current.version,
          name: current.name,
          description: current.description,
          typicalStages: parseStages(current.typicalStages),
        }
      : null,
    versions: versions
      .slice()
      .sort((a, b) => b.version - a.version)
      .map((item) => ({
        id: item.id,
        version: item.version,
        name: item.name,
        createdAt: formatDisplayDate(item.createdAt),
      })),
    prerequisites: prerequisites
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        key: item.prerequisiteKey,
        text: item.text,
        sortOrder: item.sortOrder,
      })),
  }
}

export async function listPlayDefinitions(inputDb?: PlaybookDb) {
  const db = await resolveDb(inputDb)
  const [playRows, versionRows, prerequisiteRows] = await Promise.all([
    db.select().from(salesPlays),
    db.select().from(salesPlayVersions),
    db.select().from(playVersionPrerequisites),
  ])

  return playRows.map((play) => {
    const current = versionRows.find((item) => item.id === play.currentVersionId)
    const prerequisites = prerequisiteRows
      .filter((item) => item.versionId === play.currentVersionId)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
    return {
      id: play.id,
      status: play.status,
      name: current?.name ?? play.id,
      typicalStages: current ? parseStages(current.typicalStages) : [],
      prerequisites: prerequisites.map((item) => ({
        key: item.prerequisiteKey,
        text: item.text,
      })),
    }
  })
}

export type ActivitySnapshot = {
  key: string
  text: string
  status: PrerequisiteStatus
}

export type OpportunityActivity = {
  id: string
  date: string
  playId: string | null
  playName: string
  playVersion: number | null
  stageAtActivity: string
  captureKind: string
  seName: string
  note: string | null
  snapshots: ActivitySnapshot[]
  allPrerequisitesMet: boolean | null
  unmetCount: number | null
}

export async function getOpportunityDetail(opportunityId: string, inputDb?: PlaybookDb) {
  const db = await resolveDb(inputDb)
  const [opportunity] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, opportunityId))
    .limit(1)
  if (!opportunity) return null

  const activityRows = await db
    .select()
    .from(salesActivities)
    .where(eq(salesActivities.opportunityId, opportunityId))

  const versionIds = [...new Set(activityRows.map((row) => row.playVersionId).filter(Boolean))] as string[]
  const versions =
    versionIds.length > 0
      ? await db.select().from(salesPlayVersions).where(inArray(salesPlayVersions.id, versionIds))
      : []

  const activityIds = activityRows.map((row) => row.id)
  const snapshotRows =
    activityIds.length > 0
      ? await db
          .select()
          .from(activityPrerequisiteSnapshots)
          .where(inArray(activityPrerequisiteSnapshots.activityId, activityIds))
      : []

  return {
    id: opportunity.id,
    name: opportunity.name,
    account: opportunity.account,
    segment: opportunity.segment,
    stage: opportunity.stage,
    outcome: opportunity.outcome,
    seName: opportunity.seName,
    aeName: opportunity.aeName,
    team: opportunity.team,
    createdAt: formatDisplayDate(opportunity.createdAt),
    closeDate: opportunity.closeDate ? formatDisplayDate(opportunity.closeDate) : null,
    activities: activityRows
      .slice()
      .sort((a, b) => a.activityDate.getTime() - b.activityDate.getTime())
      .map((row) => {
        const version = versions.find((item) => item.id === row.playVersionId)
        const snapshots = snapshotRows
          .filter((item) => item.activityId === row.id)
          .map((item) => ({
            key: item.prerequisiteKey,
            text: item.textAtCapture,
            status: item.status as PrerequisiteStatus,
          }))
        return {
          id: row.id,
          date: formatDisplayDate(row.activityDate),
          playId: row.playId,
          playName: playNameForActivity(row, versions),
          playVersion: version?.version ?? null,
          stageAtActivity: row.stageAtActivity,
          captureKind: row.captureKind,
          seName: row.seName,
          note: row.note,
          snapshots,
          ...snapshotRollup(row.captureKind, snapshots),
        } satisfies OpportunityActivity
      }),
  }
}

export async function getActivityDetail(activityId: string, inputDb?: PlaybookDb) {
  const db = await resolveDb(inputDb)
  const [activity] = await db
    .select()
    .from(salesActivities)
    .where(eq(salesActivities.id, activityId))
    .limit(1)
  if (!activity) return null

  const [opportunity] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, activity.opportunityId))
    .limit(1)
  const [version] = activity.playVersionId
    ? await db
        .select()
        .from(salesPlayVersions)
        .where(eq(salesPlayVersions.id, activity.playVersionId))
        .limit(1)
    : []
  const snapshotRows = await db
    .select()
    .from(activityPrerequisiteSnapshots)
    .where(eq(activityPrerequisiteSnapshots.activityId, activityId))
  const snapshots = snapshotRows.map((item) => ({
    key: item.prerequisiteKey,
    text: item.textAtCapture,
    status: item.status as PrerequisiteStatus,
  }))

  return {
    id: activity.id,
    date: formatDisplayDate(activity.activityDate),
    stageAtActivity: activity.stageAtActivity,
    seName: activity.seName,
    note: activity.note,
    source: activity.source,
    captureKind: activity.captureKind,
    playId: activity.playId,
    playName: playNameForActivity(activity, version ? [version] : []),
    playVersion: version?.version ?? null,
    opportunityId: activity.opportunityId,
    opportunityName: opportunity?.name ?? activity.opportunityId,
    account: opportunity?.account ?? "",
    snapshots,
    ...snapshotRollup(activity.captureKind, snapshots),
  }
}

export async function listExplorerData(inputDb?: PlaybookDb): Promise<{
  opportunities: ExplorerOpportunity[]
  activities: ExplorerActivity[]
}> {
  const db = await resolveDb(inputDb)
  const [oppRows, activityRows, versions, snapshotRows] = await Promise.all([
    db.select().from(opportunities),
    db.select().from(salesActivities),
    db.select().from(salesPlayVersions),
    db.select().from(activityPrerequisiteSnapshots),
  ])

  const snapshotsByActivity = new Map<string, Array<{ status: string }>>()
  for (const row of snapshotRows) {
    const list = snapshotsByActivity.get(row.activityId) ?? []
    list.push(row)
    snapshotsByActivity.set(row.activityId, list)
  }

  const activitiesByOpportunity = new Map<string, typeof activityRows>()
  for (const row of activityRows) {
    const list = activitiesByOpportunity.get(row.opportunityId) ?? []
    list.push(row)
    activitiesByOpportunity.set(row.opportunityId, list)
  }

  const opportunityById = new Map(oppRows.map((row) => [row.id, row]))

  const opportunitiesOut: ExplorerOpportunity[] = oppRows
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((row) => {
      const related = activitiesByOpportunity.get(row.id) ?? []
      const playIds = [
        ...new Set(related.map((item) => item.playId).filter((id): id is string => Boolean(id))),
      ]
      return {
        id: row.id,
        name: row.name,
        account: row.account,
        segment: row.segment,
        stage: row.stage,
        outcome: row.outcome,
        seName: row.seName,
        aeName: row.aeName,
        team: row.team,
        createdAt: formatDisplayDate(row.createdAt),
        closeDate: row.closeDate ? formatDisplayDate(row.closeDate) : null,
        activityCount: related.length,
        playIds,
        hasUndefined: related.some((item) => item.captureKind === "undefined"),
      }
    })

  const activitiesOut: ExplorerActivity[] = activityRows
    .slice()
    .sort((a, b) => b.activityDate.getTime() - a.activityDate.getTime())
    .map((row) => {
      const opportunity = opportunityById.get(row.opportunityId)
      const snapshots = snapshotsByActivity.get(row.id) ?? []
      return {
        id: row.id,
        date: formatDisplayDate(row.activityDate),
        opportunityId: row.opportunityId,
        opportunityName: opportunity?.name ?? row.opportunityId,
        account: opportunity?.account ?? "",
        playId: row.playId,
        playName: playNameForActivity(row, versions),
        stageAtActivity: row.stageAtActivity,
        seName: row.seName,
        team: opportunity?.team ?? "",
        outcome: opportunity?.outcome ?? "",
        captureKind: row.captureKind as "defined" | "undefined",
        ...snapshotRollup(row.captureKind, snapshots),
      }
    })

  return { opportunities: opportunitiesOut, activities: activitiesOut }
}

export async function listOpportunityChoices(inputDb?: PlaybookDb) {
  const db = await resolveDb(inputDb)
  const rows = await db.select().from(opportunities).orderBy(desc(opportunities.updatedAt))
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    account: row.account,
    stage: row.stage,
    outcome: row.outcome,
    seName: row.seName,
    aeName: row.aeName,
    team: row.team,
    segment: row.segment,
  }))
}

export async function listPeople(inputDb?: PlaybookDb) {
  const db = await resolveDb(inputDb)
  return db.select().from(people)
}

export async function listOpenUndefinedLabels(inputDb?: PlaybookDb) {
  const db = await resolveDb(inputDb)
  return db.select().from(undefinedPlayLabels)
}
