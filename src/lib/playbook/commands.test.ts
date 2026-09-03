import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { eq } from "drizzle-orm"
import { afterEach, describe, expect, it } from "vitest"

import { openPlaybookDb } from "@/lib/db"
import {
  activityPrerequisiteSnapshots,
  salesActivities,
  salesPlayVersions,
} from "@/lib/db/schema"
import { bootstrapWorkspace } from "@/lib/db/seed"
import { createPlay, savePlayVersion } from "@/lib/playbook/commands"
import { getPlayDetail } from "@/lib/playbook/queries"

const dirs: string[] = []

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function seededDb() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "playbook-cmd-"))
  dirs.push(dir)
  const opened = await openPlaybookDb(path.join(dir, "playbook.sqlite"))
  await bootstrapWorkspace(opened.db)
  return opened
}

describe("play versioning", () => {
  it("creates a play at version 1", async () => {
    const { db, client } = await seededDb()
    try {
      const id = await createPlay(db, {
        name: "Solution Demo",
        description: "A tailored demonstration against a named use case.",
        typicalStages: ["Evaluate", "Propose"],
        prerequisites: [{ text: "The use case is scoped" }],
      })
      const play = await getPlayDetail(id, db)
      expect(play?.currentVersion?.version).toBe(1)
      expect(play?.currentVersion?.typicalStages).toEqual(["Evaluate", "Propose"])
      expect(play?.prerequisites[0]?.text).toBe("The use case is scoped")
    } finally {
      client.close()
    }
  })

  it("writes a new version without changing historical snapshots", async () => {
    const { db, client } = await seededDb()
    try {
      const [activity] = await db
        .select()
        .from(salesActivities)
        .where(eq(salesActivities.playId, "play-product-demo"))
        .limit(1)
      expect(activity?.playVersionId).toBe("play-product-demo-v1")
      const before = await db
        .select()
        .from(activityPrerequisiteSnapshots)
        .where(eq(activityPrerequisiteSnapshots.activityId, activity!.id))

      const result = await savePlayVersion(db, "play-product-demo", {
        name: "Product Demo",
        description: "Updated description for future activities only.",
        typicalStages: ["Evaluate", "Propose"],
        prerequisites: [
          { key: "demo-discovery", text: "The SE has completed direct discovery" },
          { key: "demo-problem", text: "The business problem is written in the account plan" },
          { key: "demo-champion", text: "A champion or accountable stakeholder is involved" },
        ],
      })
      expect(result.changed).toBe(true)
      expect(result.version).toBe(2)

      const after = await db
        .select()
        .from(activityPrerequisiteSnapshots)
        .where(eq(activityPrerequisiteSnapshots.activityId, activity!.id))
      expect(after).toEqual(before)

      const [sameActivity] = await db
        .select()
        .from(salesActivities)
        .where(eq(salesActivities.id, activity!.id))
      expect(sameActivity?.playVersionId).toBe("play-product-demo-v1")

      const versions = await db
        .select()
        .from(salesPlayVersions)
        .where(eq(salesPlayVersions.playId, "play-product-demo"))
      expect(versions).toHaveLength(2)

      const current = await getPlayDetail("play-product-demo", db)
      expect(current?.currentVersion?.version).toBe(2)
      expect(current?.prerequisites.find((item) => item.key === "demo-problem")?.text).toMatch(
        /account plan/
      )
    } finally {
      client.close()
    }
  })

  it("does not mint a version when the definition is unchanged", async () => {
    const { db, client } = await seededDb()
    try {
      const play = await getPlayDetail("play-discovery", db)
      const result = await savePlayVersion(db, "play-discovery", {
        name: play!.currentVersion!.name,
        description: play!.currentVersion!.description,
        typicalStages: play!.currentVersion!.typicalStages,
        prerequisites: play!.prerequisites,
      })
      expect(result.changed).toBe(false)
      expect(result.version).toBe(1)
    } finally {
      client.close()
    }
  })
})
