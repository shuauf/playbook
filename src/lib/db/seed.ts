import { eq } from "drizzle-orm"

import { appMeta, salesActivities, salesPlays } from "@/lib/db/schema"
import { clearDemoWorkspace, SEED_VERSION, seedPlantedWorkspace } from "@/lib/db/seed-planted"
import type { PlaybookDb } from "@/lib/db/types"

export async function isNewSchemaEmpty(db: PlaybookDb) {
  const [play] = await db.select({ id: salesPlays.id }).from(salesPlays).limit(1)
  const [activity] = await db.select({ id: salesActivities.id }).from(salesActivities).limit(1)
  return !play && !activity
}

export async function currentSeedVersion(db: PlaybookDb) {
  const [row] = await db.select().from(appMeta).where(eq(appMeta.key, "demo_seed")).limit(1)
  return row?.value ?? null
}

export async function needsReseed(db: PlaybookDb) {
  const version = await currentSeedVersion(db)
  return version !== SEED_VERSION
}

export async function bootstrapWorkspace(db: PlaybookDb) {
  if (await isNewSchemaEmpty(db)) {
    await seedPlantedWorkspace(db)
    return { seeded: true, reseeded: false }
  }
  if (await needsReseed(db)) {
    await clearDemoWorkspace(db)
    await seedPlantedWorkspace(db)
    return { seeded: true, reseeded: true }
  }
  return { seeded: false, reseeded: false }
}
