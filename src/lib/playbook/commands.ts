import { eq } from "drizzle-orm"

import {
  playVersionPrerequisites,
  salesPlayVersions,
  salesPlays,
} from "@/lib/db/schema"
import type { PlaybookDb } from "@/lib/db/types"
import { newId } from "@/lib/ids"
import { PIPELINE_STAGES, type PipelineStage, type PlayStatus } from "@/lib/domain/types"

export type PlayDefinitionInput = {
  name: string
  description: string
  typicalStages: string[]
  prerequisites: Array<{ key?: string; text: string }>
}

function requiredText(value: string, label: string) {
  const trimmed = value.trim()
  if (!trimmed) throw new Error(`${label} is required.`)
  return trimmed
}

function normalizeStages(stages: string[]): PipelineStage[] {
  const allowed = new Set<string>(PIPELINE_STAGES)
  const unique = [...new Set(stages.map((item) => item.trim()).filter(Boolean))]
  const valid = unique.filter((item): item is PipelineStage => allowed.has(item))
  if (valid.length === 0) {
    throw new Error("Select at least one typical stage.")
  }
  return valid
}

function normalizePrerequisites(input: PlayDefinitionInput["prerequisites"]) {
  const used = new Set<string>()
  const items = input
    .map((item) => ({
      key: item.key?.trim(),
      text: item.text.trim(),
    }))
    .filter((item) => item.text.length > 0)

  if (items.length === 0) {
    throw new Error("Add at least one success signal.")
  }

  return items.map((item, index) => {
    const key = uniqueKey(item.text, used, item.key)
    used.add(key)
    return { key, text: item.text, sortOrder: index }
  })
}

export function uniqueKey(text: string, used: Set<string>, hint?: string) {
  const base =
    (hint && hint.trim()) ||
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) ||
    "prerequisite"
  let key = base
  let n = 2
  while (used.has(key)) {
    key = `${base}-${n++}`
  }
  return key
}

function sameDefinition(
  current: {
    name: string
    description: string
    typicalStages: string[]
    prerequisites: Array<{ key: string; text: string }>
  },
  next: {
    name: string
    description: string
    typicalStages: string[]
    prerequisites: Array<{ key: string; text: string }>
  }
) {
  return (
    current.name === next.name &&
    current.description === next.description &&
    current.typicalStages.join("|") === next.typicalStages.join("|") &&
    current.prerequisites.length === next.prerequisites.length &&
    current.prerequisites.every(
      (item, index) =>
        item.key === next.prerequisites[index]?.key &&
        item.text === next.prerequisites[index]?.text
    )
  )
}

async function loadCurrentDefinition(db: PlaybookDb, playId: string) {
  const [play] = await db.select().from(salesPlays).where(eq(salesPlays.id, playId)).limit(1)
  if (!play) throw new Error("Play not found.")
  if (!play.currentVersionId) {
    return { play, current: null, versionNumber: 0 }
  }
  const [version] = await db
    .select()
    .from(salesPlayVersions)
    .where(eq(salesPlayVersions.id, play.currentVersionId))
    .limit(1)
  const prerequisites = version
    ? await db
        .select()
        .from(playVersionPrerequisites)
        .where(eq(playVersionPrerequisites.versionId, version.id))
    : []
  return {
    play,
    current: version
      ? {
          name: version.name,
          description: version.description,
          typicalStages: JSON.parse(version.typicalStages) as string[],
          prerequisites: prerequisites
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((item) => ({ key: item.prerequisiteKey, text: item.text })),
        }
      : null,
    versionNumber: version?.version ?? 0,
  }
}

async function writeVersion(
  db: PlaybookDb,
  playId: string,
  versionNumber: number,
  input: PlayDefinitionInput,
  now: Date
) {
  const name = requiredText(input.name, "Play name")
  const description = requiredText(input.description, "Description")
  const typicalStages = normalizeStages(input.typicalStages)
  const prerequisites = normalizePrerequisites(input.prerequisites)
  const versionId = newId("spv")

  await db.insert(salesPlayVersions).values({
    id: versionId,
    playId,
    version: versionNumber,
    name,
    description,
    typicalStages: JSON.stringify(typicalStages),
    createdAt: now,
  })
  await db.insert(playVersionPrerequisites).values(
    prerequisites.map((item) => ({
      id: `${versionId}-${item.key}`,
      versionId,
      prerequisiteKey: item.key,
      text: item.text,
      sortOrder: item.sortOrder,
    }))
  )
  await db
    .update(salesPlays)
    .set({ currentVersionId: versionId, updatedAt: now })
    .where(eq(salesPlays.id, playId))

  return { versionId, versionNumber, name }
}

export async function createPlay(db: PlaybookDb, input: PlayDefinitionInput) {
  const now = new Date()
  const playId = newId("play")
  await db.insert(salesPlays).values({
    id: playId,
    status: "active",
    currentVersionId: null,
    createdAt: now,
    updatedAt: now,
    retiredAt: null,
  })
  await writeVersion(db, playId, 1, input, now)
  return playId
}

export async function savePlayVersion(db: PlaybookDb, playId: string, input: PlayDefinitionInput) {
  const now = new Date()
  const loaded = await loadCurrentDefinition(db, playId)
  if (loaded.play.status === "retired") {
    throw new Error("Reactivate the play before editing it.")
  }
  const name = requiredText(input.name, "Play name")
  const description = requiredText(input.description, "Description")
  const typicalStages = normalizeStages(input.typicalStages)
  const prerequisites = normalizePrerequisites(input.prerequisites)
  if (
    loaded.current &&
    sameDefinition(loaded.current, {
      name,
      description,
      typicalStages,
      prerequisites,
    })
  ) {
    return { playId, version: loaded.versionNumber, changed: false }
  }

  const written = await writeVersion(db, playId, loaded.versionNumber + 1, input, now)
  return { playId, version: written.versionNumber, changed: true }
}

export async function setPlayStatus(db: PlaybookDb, playId: string, status: PlayStatus) {
  const [play] = await db.select().from(salesPlays).where(eq(salesPlays.id, playId)).limit(1)
  if (!play) throw new Error("Play not found.")
  const now = new Date()
  await db
    .update(salesPlays)
    .set({
      status,
      retiredAt: status === "retired" ? now : null,
      updatedAt: now,
    })
    .where(eq(salesPlays.id, playId))
}
