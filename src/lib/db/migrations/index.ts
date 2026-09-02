import { MIGRATION_0001_ID, MIGRATION_0001_SQL } from "@/lib/db/migrations/0001_init"

export type Migration = {
  id: string
  sql: string
}

export const MIGRATIONS: Migration[] = [
  { id: MIGRATION_0001_ID, sql: MIGRATION_0001_SQL },
]

export const CURRENT_SCHEMA_VERSION = MIGRATION_0001_ID
