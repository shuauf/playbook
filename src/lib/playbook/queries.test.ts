import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import { openPlaybookDb } from "@/lib/db"
import { bootstrapWorkspace } from "@/lib/db/seed"
import {
  getActivityDetail,
  getOpportunityDetail,
  getPlayDetail,
  listExplorerData,
  listOpenUndefinedLabels,
} from "@/lib/playbook/queries"

const dirs: string[] = []

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function seededDb() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "playbook-query-"))
  dirs.push(dir)
  const opened = await openPlaybookDb(path.join(dir, "playbook.sqlite"))
  await bootstrapWorkspace(opened.db)
  return opened
}

describe("playbook read queries", () => {
  it("reads a seeded play definition with its current prerequisites", async () => {
    const { db, client } = await seededDb()
    try {
      const play = await getPlayDetail("play-product-demo", db)
      expect(play?.currentVersion?.name).toBe("Product Demo")
      expect(play?.prerequisites.map((item) => item.key)).toEqual([
        "demo-discovery",
        "demo-problem",
        "demo-champion",
      ])
      expect(play?.versions).toHaveLength(1)
    } finally {
      client.close()
    }
  })

  it("returns an opportunity timeline without inventing undefined snapshots", async () => {
    const { db, client } = await seededDb()
    try {
      const labels = await listOpenUndefinedLabels(db)
      expect(labels[0]?.displayName).toMatch(/security questionnaire/i)
      const opportunity = await getOpportunityDetail("opp-undef-01", db)
      expect(opportunity).toBeTruthy()
      const undefinedActivity = opportunity?.activities.find((item) => item.captureKind === "undefined")
      expect(undefinedActivity).toBeTruthy()
      expect(undefinedActivity?.snapshots).toEqual([])
      expect(undefinedActivity?.allPrerequisitesMet).toBeNull()

      const snapshot = await getActivityDetail(undefinedActivity!.id, db)
      expect(snapshot?.snapshots).toEqual([])
      expect(snapshot?.playName).toMatch(/security questionnaire/i)
    } finally {
      client.close()
    }
  })

  it("lists the full explorer record set with activity counts and snapshot rollups", async () => {
    const { db, client } = await seededDb()
    try {
      const { opportunities, activities } = await listExplorerData(db)
      expect(opportunities.length).toBeGreaterThan(30)
      expect(activities.length).toBeGreaterThan(30)
      expect(opportunities.every((row) => row.activityCount >= 0)).toBe(true)
      expect(activities.some((row) => row.captureKind === "undefined")).toBe(true)
      const defined = activities.find((row) => row.captureKind === "defined")
      expect(defined?.unmetCount).toEqual(expect.any(Number))
      const undefinedRow = activities.find((row) => row.captureKind === "undefined")
      expect(undefinedRow?.allPrerequisitesMet).toBeNull()
      expect(undefinedRow?.unmetCount).toBeNull()
    } finally {
      client.close()
    }
  })
})
