import { desc, eq } from "drizzle-orm"

import { getDb } from "@/lib/db"
import type { PlaybookDb } from "@/lib/db/types"
import {
  opportunities,
  people,
  playVersionPrerequisites,
  salesActivities,
  salesPlayVersions,
  salesPlays,
  undefinedPlayLabels,
} from "@/lib/db/schema"
import { formatDisplayDate } from "@/lib/dates"

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

  const versionIds = [...new Set(activityRows.map((row) => row.playVersionId).filter(Boolean))]
  const versions =
    versionIds.length > 0 ? await db.select().from(salesPlayVersions) : []

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
        return {
          id: row.id,
          date: formatDisplayDate(row.activityDate),
          playName:
            row.captureKind === "undefined"
              ? row.undefinedLabel ?? "Undefined activity"
              : (version?.name ?? "Unknown play"),
          stageAtActivity: row.stageAtActivity,
          captureKind: row.captureKind,
          seName: row.seName,
        }
      }),
  }
}

export async function listOpportunityPreviews(limit = 25, inputDb?: PlaybookDb) {
  const db = await resolveDb(inputDb)
  const rows = await db
    .select()
    .from(opportunities)
    .orderBy(desc(opportunities.updatedAt))
    .limit(limit)
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    account: row.account,
    stage: row.stage,
    outcome: row.outcome,
    seName: row.seName,
    team: row.team,
  }))
}

export async function listActivityPreviews(limit = 25, inputDb?: PlaybookDb) {
  const db = await resolveDb(inputDb)
  const recent = await db
    .select()
    .from(salesActivities)
    .orderBy(desc(salesActivities.activityDate))
    .limit(limit)
  const undefinedRows = await db
    .select()
    .from(salesActivities)
    .where(eq(salesActivities.captureKind, "undefined"))
    .orderBy(desc(salesActivities.activityDate))
    .limit(8)
  const seen = new Set(recent.map((row) => row.id))
  const rows = [...undefinedRows.filter((row) => !seen.has(row.id)), ...recent]
  const versions = await db.select().from(salesPlayVersions)
  const opps = await db.select().from(opportunities)
  return rows.map((row) => {
    const version = versions.find((item) => item.id === row.playVersionId)
    const opportunity = opps.find((item) => item.id === row.opportunityId)
    return {
      id: row.id,
      date: formatDisplayDate(row.activityDate),
      opportunityId: row.opportunityId,
      opportunityName: opportunity?.name ?? row.opportunityId,
      playName:
        row.captureKind === "undefined"
          ? row.undefinedLabel ?? "Undefined activity"
          : (version?.name ?? "Unknown play"),
      stageAtActivity: row.stageAtActivity,
      seName: row.seName,
      captureKind: row.captureKind,
    }
  })
}

export async function listPeople(inputDb?: PlaybookDb) {
  const db = await resolveDb(inputDb)
  return db.select().from(people)
}

export async function listOpenUndefinedLabels(inputDb?: PlaybookDb) {
  const db = await resolveDb(inputDb)
  return db.select().from(undefinedPlayLabels)
}
