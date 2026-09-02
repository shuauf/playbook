import { describe, expect, it } from "vitest"

import { openPlaybookConnection, resolveDbConnection } from "@/lib/db"
import { salesPlays } from "@/lib/db/schema"
import { bootstrapWorkspace } from "@/lib/db/seed"

const live = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN)

describe.skipIf(!live)("Turso live connection", () => {
  it(
    "connects over HTTP, applies forward migrations, and can read sales plays",
    async () => {
      expect(resolveDbConnection().kind).toBe("remote")
      const { db, client } = await openPlaybookConnection()
      try {
        await bootstrapWorkspace(db)
        const playRows = await db.select({ id: salesPlays.id }).from(salesPlays)
        expect(playRows.length).toBeGreaterThan(0)
      } finally {
        client.close()
      }
    },
    120_000
  )
})
