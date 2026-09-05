import { MIGRATION_0001_ID, MIGRATION_0001_SQL } from "@/lib/db/migrations/0001_init"
import { MIGRATION_0002_ID, MIGRATION_0002_SQL } from "@/lib/db/migrations/0002_activity_segment"

export type Migration = {
  id: string
  sql: string
}

export const MIGRATIONS: Migration[] = [
  { id: MIGRATION_0001_ID, sql: MIGRATION_0001_SQL },
  { id: MIGRATION_0002_ID, sql: MIGRATION_0002_SQL },
]

export const CURRENT_SCHEMA_VERSION = MIGRATION_0002_ID
