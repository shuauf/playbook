import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { eq } from "drizzle-orm"
import { afterEach, describe, expect, it } from "vitest"

import { openPlaybookDb } from "@/lib/db"
import {
  activityPrerequisiteSnapshots,
  salesActivities,
  undefinedPlayLabels,
} from "@/lib/db/schema"
import { bootstrapWorkspace } from "@/lib/db/seed"
import { recordActivity } from "@/lib/playbook/activity-commands"
import { savePlayVersion } from "@/lib/playbook/commands"
import { getActivityDetail, getOpportunityDetail } from "@/lib/playbook/queries"

const dirs: string[] = []

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function seededDb() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "playbook-act-"))
  dirs.push(dir)
  const opened = await openPlaybookDb(path.join(dir, "playbook.sqlite"))
  await bootstrapWorkspace(opened.db)
  return opened
}

describe("recordActivity", () => {
  it("writes a defined activity snapshot against the current play version", async () => {
    const { db, client } = await seededDb()
    try {
      const result = await recordActivity(db, {
        opportunityId: "opp-undef-01",
        activityDate: "2026-02-02",
        stageAtActivity: "Evaluate",
        note: "Follow-up demo",
        capture: {
          kind: "defined",
          playId: "play-product-demo",
          checks: [
            { key: "demo-discovery", status: "met" },
            { key: "demo-problem", status: "not_met" },
            { key: "demo-champion", status: "met" },
          ],
        },
      })
      const detail = await getActivityDetail(result.id, db)
      expect(detail?.captureKind).toBe("defined")
      expect(detail?.playName).toBe("Product Demo")
      expect(detail?.seName).toBeTruthy()
      expect(detail?.note).toBe("Follow-up demo")
      expect(detail?.snapshots.map((item) => item.status)).toEqual(["met", "not_met", "met"])
      expect(detail?.allPrerequisitesMet).toBe(false)
      expect(detail?.unmetCount).toBe(1)
    } finally {
      client.close()
    }
  })

  it("requires an explicit Met or Not Met for every prerequisite", async () => {
    const { db, client } = await seededDb()
    try {
      await expect(
        recordActivity(db, {
          opportunityId: "opp-undef-01",
          activityDate: "2026-02-02",
          stageAtActivity: "Evaluate",
          capture: {
            kind: "defined",
            playId: "play-product-demo",
            checks: [
              { key: "demo-discovery", status: "met" },
              { key: "demo-problem", status: "met" },
            ],
          },
        })
      ).rejects.toThrow(/Met or Not Met/)
    } finally {
      client.close()
    }
  })

  it("records an undefined activity without inventing snapshots", async () => {
    const { db, client } = await seededDb()
    try {
      const result = await recordActivity(db, {
        opportunityId: "opp-undef-01",
        activityDate: "2026-02-03",
        stageAtActivity: "Propose",
        capture: {
          kind: "undefined",
          name: " Executive briefing ",
          description: "Ad hoc leadership session",
        },
      })
      const detail = await getActivityDetail(result.id, db)
      expect(detail?.captureKind).toBe("undefined")
      expect(detail?.playName).toBe("Executive briefing")
      expect(detail?.snapshots).toEqual([])
      expect(detail?.allPrerequisitesMet).toBeNull()

      const labels = await db.select().from(undefinedPlayLabels)
      expect(labels.some((item) => item.displayName === "Executive briefing")).toBe(true)

      const snapshots = await db
        .select()
        .from(activityPrerequisiteSnapshots)
        .where(eq(activityPrerequisiteSnapshots.activityId, result.id))
      expect(snapshots).toHaveLength(0)
    } finally {
      client.close()
    }
  })

  it("attaches new activities to a later play version without rewriting history", async () => {
    const { db, client } = await seededDb()
    try {
      const before = await recordActivity(db, {
        opportunityId: "opp-undef-01",
        activityDate: "2026-02-02",
        stageAtActivity: "Evaluate",
        capture: {
          kind: "defined",
          playId: "play-product-demo",
          checks: [
            { key: "demo-discovery", status: "met" },
            { key: "demo-problem", status: "met" },
            { key: "demo-champion", status: "met" },
          ],
        },
      })
      await savePlayVersion(db, "play-product-demo", {
        name: "Product Demo",
        description: "Updated for future activities.",
        typicalStages: ["Evaluate"],
        prerequisites: [
          { key: "demo-discovery", text: "The SE has completed direct discovery" },
          { key: "demo-problem", text: "The business problem is written in the account plan" },
          { key: "demo-champion", text: "A champion or accountable stakeholder is involved" },
        ],
      })
      const after = await recordActivity(db, {
        opportunityId: "opp-undef-01",
        activityDate: "2026-02-10",
        stageAtActivity: "Evaluate",
        capture: {
          kind: "defined",
          playId: "play-product-demo",
          checks: [
            { key: "demo-discovery", status: "met" },
            { key: "demo-problem", status: "not_met" },
            { key: "demo-champion", status: "met" },
          ],
        },
      })

      const [oldActivity] = await db
        .select()
        .from(salesActivities)
        .where(eq(salesActivities.id, before.id))
      const [newActivity] = await db
        .select()
        .from(salesActivities)
        .where(eq(salesActivities.id, after.id))
      expect(oldActivity?.playVersionId).toBe("play-product-demo-v1")
      expect(newActivity?.playVersionId).not.toBe("play-product-demo-v1")

      const oldSnapshots = await db
        .select()
        .from(activityPrerequisiteSnapshots)
        .where(eq(activityPrerequisiteSnapshots.activityId, before.id))
      expect(oldSnapshots.find((item) => item.prerequisiteKey === "demo-problem")?.textAtCapture).toBe(
        "Business problem confirmed"
      )

      const newDetail = await getActivityDetail(after.id, db)
      expect(newDetail?.snapshots.find((item) => item.key === "demo-problem")?.text).toMatch(
        /account plan/
      )

      const opportunity = await getOpportunityDetail("opp-undef-01", db)
      expect(opportunity?.activities.some((item) => item.id === before.id)).toBe(true)
    } finally {
      client.close()
    }
  })
})
