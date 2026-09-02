import { salesActivities, salesPlays } from "@/lib/db/schema"
import { seedPlantedWorkspace } from "@/lib/db/seed-planted"
import type { PlaybookDb } from "@/lib/db/types"

export async function isNewSchemaEmpty(db: PlaybookDb) {
  const [play] = await db.select({ id: salesPlays.id }).from(salesPlays).limit(1)
  const [activity] = await db.select({ id: salesActivities.id }).from(salesActivities).limit(1)
  return !play && !activity
}

export async function bootstrapWorkspace(db: PlaybookDb) {
  if (!(await isNewSchemaEmpty(db))) {
    return { seeded: false }
  }
  await seedPlantedWorkspace(db)
  return { seeded: true }
}
