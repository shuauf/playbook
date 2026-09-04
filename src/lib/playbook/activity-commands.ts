import { eq } from "drizzle-orm"

import {
  activityPrerequisiteSnapshots,
  opportunities,
  playVersionPrerequisites,
  salesActivities,
  salesPlayVersions,
  salesPlays,
  undefinedPlayLabels,
} from "@/lib/db/schema"
import type { PlaybookDb } from "@/lib/db/types"
import { displayUndefinedLabel, undefinedLabelKey } from "@/lib/domain/labels"
import {
  PIPELINE_STAGES,
  PREREQUISITE_STATUSES,
  RECORD_SOURCES,
  type PipelineStage,
  type PrerequisiteStatus,
  type RecordSource,
} from "@/lib/domain/types"
import { parseIsoDate } from "@/lib/dates"
import { newExternalId, newId } from "@/lib/ids"

export type DefinedActivityCapture = {
  kind: "defined"
  playId: string
  checks: Array<{ key: string; status: string }>
}

export type UndefinedActivityCapture = {
  kind: "undefined"
  name: string
  description?: string
}

export type RecordActivityInput = {
  opportunityId: string
  activityDate: string
  stageAtActivity: string
  seName?: string
  note?: string
  source?: RecordSource
  capture: DefinedActivityCapture | UndefinedActivityCapture
}

function requiredText(value: string | undefined, label: string) {
  const trimmed = value?.trim() ?? ""
  if (!trimmed) throw new Error(`${label} is required.`)
  return trimmed
}

function normalizeStage(value: string): PipelineStage {
  const stage = value.trim()
  if (!(PIPELINE_STAGES as readonly string[]).includes(stage)) {
    throw new Error("Select a valid pipeline stage.")
  }
  return stage as PipelineStage
}

function normalizeSource(value: RecordSource | undefined): RecordSource {
  if (!value) return "manual"
  if (!(RECORD_SOURCES as readonly string[]).includes(value)) {
    throw new Error("Unknown record source.")
  }
  return value
}

function normalizeChecks(
  checks: Array<{ key: string; status: string }>,
  prerequisites: Array<{ key: string; text: string }>
) {
  const byKey = new Map(checks.map((item) => [item.key, item.status]))
  const missing = prerequisites.filter((item) => {
    const status = byKey.get(item.key)
    return !status || !(PREREQUISITE_STATUSES as readonly string[]).includes(status)
  })
  if (missing.length > 0) {
    throw new Error("Mark every success signal as Met or Not Met.")
  }
  return prerequisites.map((item) => ({
    key: item.key,
    text: item.text,
    status: byKey.get(item.key) as PrerequisiteStatus,
  }))
}

async function loadCurrentPlay(db: PlaybookDb, playId: string) {
  const [play] = await db.select().from(salesPlays).where(eq(salesPlays.id, playId)).limit(1)
  if (!play) throw new Error("Sales play not found.")
  if (!play.currentVersionId) throw new Error("This play has no current version.")
  const [version] = await db
    .select()
    .from(salesPlayVersions)
    .where(eq(salesPlayVersions.id, play.currentVersionId))
    .limit(1)
  if (!version) throw new Error("This play has no current version.")
  const prerequisites = await db
    .select()
    .from(playVersionPrerequisites)
    .where(eq(playVersionPrerequisites.versionId, version.id))
  return {
    play,
    version,
    prerequisites: prerequisites
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({ key: item.prerequisiteKey, text: item.text })),
  }
}

async function upsertUndefinedLabel(
  db: PlaybookDb,
  name: string,
  description: string | undefined,
  now: Date
) {
  const displayName = displayUndefinedLabel(name)
  const normalizedLabel = undefinedLabelKey(displayName)
  const [existing] = await db
    .select()
    .from(undefinedPlayLabels)
    .where(eq(undefinedPlayLabels.normalizedLabel, normalizedLabel))
    .limit(1)
  const trimmedDescription = description?.trim() || null
  if (!existing) {
    await db.insert(undefinedPlayLabels).values({
      id: newId("upl"),
      normalizedLabel,
      displayName,
      description: trimmedDescription,
      status: "open",
      mappedPlayId: null,
      createdAt: now,
      updatedAt: now,
    })
    return displayName
  }
  if (trimmedDescription && !existing.description) {
    await db
      .update(undefinedPlayLabels)
      .set({ description: trimmedDescription, updatedAt: now })
      .where(eq(undefinedPlayLabels.id, existing.id))
  }
  return existing.displayName
}

export async function recordActivity(db: PlaybookDb, input: RecordActivityInput) {
  const now = new Date()
  const opportunityId = requiredText(input.opportunityId, "Opportunity")
  const [opportunity] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, opportunityId))
    .limit(1)
  if (!opportunity) throw new Error("Opportunity not found.")

  const activityDate = parseIsoDate(requiredText(input.activityDate, "Activity date"))
  if (!activityDate) throw new Error("Enter a valid activity date.")
  const stageAtActivity = normalizeStage(input.stageAtActivity)
  const seName = input.seName?.trim() || opportunity.seName
  const note = input.note?.trim() || null
  const source = normalizeSource(input.source)
  const activityId = newId("act")

  if (input.capture.kind === "undefined") {
    const undefinedLabel = await upsertUndefinedLabel(
      db,
      requiredText(input.capture.name, "Activity type"),
      input.capture.description,
      now
    )
    await db.insert(salesActivities).values({
      id: activityId,
      externalId: newExternalId("act"),
      opportunityId,
      playId: null,
      playVersionId: null,
      undefinedLabel,
      mappedPlayId: null,
      activityDate,
      stageAtActivity,
      seName,
      note,
      source,
      captureKind: "undefined",
      createdAt: now,
    })
    return { id: activityId, captureKind: "undefined" as const, opportunityId }
  }

  const play = await loadCurrentPlay(db, input.capture.playId)
  const checks = normalizeChecks(input.capture.checks, play.prerequisites)
  await db.insert(salesActivities).values({
    id: activityId,
    externalId: newExternalId("act"),
    opportunityId,
    playId: play.play.id,
    playVersionId: play.version.id,
    undefinedLabel: null,
    mappedPlayId: null,
    activityDate,
    stageAtActivity,
    seName,
    note,
    source,
    captureKind: "defined",
    createdAt: now,
  })
  if (checks.length > 0) {
    await db.insert(activityPrerequisiteSnapshots).values(
      checks.map((item) => ({
        id: newId("aps"),
        activityId,
        prerequisiteKey: item.key,
        textAtCapture: item.text,
        status: item.status,
        createdAt: now,
      }))
    )
  }

  return { id: activityId, captureKind: "defined" as const, opportunityId }
}
