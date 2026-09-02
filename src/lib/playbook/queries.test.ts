import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import { openPlaybookDb } from "@/lib/db"
import { bootstrapWorkspace } from "@/lib/db/seed"
import { getOpportunityDetail, getPlayDetail, listOpenUndefinedLabels } from "@/lib/playbook/queries"

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
      expect(opportunity?.activities.some((item) => item.captureKind === "undefined")).toBe(true)
    } finally {
      client.close()
    }
  })
})
