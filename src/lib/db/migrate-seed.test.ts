import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { eq } from "drizzle-orm"
import { afterEach, describe, expect, it } from "vitest"

import { openPlaybookDb } from "@/lib/db"
import { detectPredecessorTables } from "@/lib/db/legacy"
import { CURRENT_SCHEMA_VERSION } from "@/lib/db/migrate"
import {
  activityPrerequisiteSnapshots,
  opportunities,
  salesActivities,
  salesPlayVersions,
  salesPlays,
  schemaMigrations,
  undefinedPlayLabels,
} from "@/lib/db/schema"
import { bootstrapWorkspace } from "@/lib/db/seed"
import { SEED_CONTRACT } from "@/lib/db/seed-planted"

const dirs: string[] = []

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function openTemp() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "playbook-seed-"))
  dirs.push(dir)
  return openPlaybookDb(path.join(dir, "playbook.sqlite"))
}

describe("migrations and demo seed", () => {
  it("applies the forward migration and records the schema version", async () => {
    const { db, client } = await openTemp()
    try {
      const rows = await db.select().from(schemaMigrations)
      expect(rows.map((row) => row.id)).toContain(CURRENT_SCHEMA_VERSION)
      const tables = await client.execute(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'sales_plays'`
      )
      expect(tables.rows).toHaveLength(1)
    } finally {
      client.close()
    }
  })

  it("is idempotent and does not duplicate demo records", async () => {
    const { db, client } = await openTemp()
    try {
      const first = await bootstrapWorkspace(db)
      const second = await bootstrapWorkspace(db)
      expect(first.seeded).toBe(true)
      expect(second.seeded).toBe(false)
      const plays = await db.select().from(salesPlays)
      const activities = await db.select().from(salesActivities)
      expect(plays).toHaveLength(SEED_CONTRACT.playCount)
      expect(activities.filter((row) => row.captureKind === "undefined")).toHaveLength(
        SEED_CONTRACT.undefinedActivityCount
      )
    } finally {
      client.close()
    }
  })

  it("leaves predecessor tables untouched", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "playbook-legacy-"))
    dirs.push(dir)
    const file = path.join(dir, "playbook.sqlite")
    const { createClient } = await import("@libsql/client")
    const prior = createClient({ url: `file:${file}` })
    await prior.execute(`CREATE TABLE plays (id TEXT PRIMARY KEY, name TEXT NOT NULL)`)
    await prior.execute(`INSERT INTO plays (id, name) VALUES ('legacy-play', 'Keep me')`)
    prior.close()

    const { db, client } = await openPlaybookDb(file)
    try {
      await bootstrapWorkspace(db)
      const leftover = await client.execute(`SELECT id, name FROM plays`)
      expect(leftover.rows).toHaveLength(1)
      expect(String(leftover.rows[0]?.id)).toBe("legacy-play")
      expect(String(leftover.rows[0]?.name)).toBe("Keep me")
      expect(await detectPredecessorTables(client)).toContain("plays")
      const newPlays = await db.select().from(salesPlays)
      expect(newPlays).toHaveLength(SEED_CONTRACT.playCount)
    } finally {
      client.close()
    }
  })

  it("stores immutable play versions and empty snapshots for undefined activities", async () => {
    const { db, client } = await openTemp()
    try {
      await bootstrapWorkspace(db)
      const versions = await db.select().from(salesPlayVersions)
      expect(versions.every((row) => row.version === 1)).toBe(true)
      expect(new Set(versions.map((row) => row.playId)).size).toBe(SEED_CONTRACT.playCount)

      const undefinedActivities = await db
        .select()
        .from(salesActivities)
        .where(eq(salesActivities.captureKind, "undefined"))
      expect(undefinedActivities).toHaveLength(SEED_CONTRACT.undefinedActivityCount)
      expect(undefinedActivities.every((row) => row.playId === null)).toBe(true)
      expect(undefinedActivities.every((row) => row.playVersionId === null)).toBe(true)

      for (const activity of undefinedActivities) {
        const snapshots = await db
          .select()
          .from(activityPrerequisiteSnapshots)
          .where(eq(activityPrerequisiteSnapshots.activityId, activity.id))
        expect(snapshots).toHaveLength(0)
      }

      const labels = await db.select().from(undefinedPlayLabels)
      expect(labels).toHaveLength(1)
      expect(labels[0]?.displayName).toBe(SEED_CONTRACT.undefinedLabel)
      expect(labels[0]?.status).toBe("open")

      const closed = await db.select().from(opportunities)
      expect(closed.some((row) => row.outcome === "open")).toBe(true)
      expect(closed.some((row) => row.outcome === "won")).toBe(true)
      expect(closed.some((row) => row.outcome === "lost")).toBe(true)
      expect(closed.every((row) => row.aeName.length > 0 && row.seName.length > 0)).toBe(true)
    } finally {
      client.close()
    }
  })
})
