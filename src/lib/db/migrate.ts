import type { Client } from "@libsql/client"

import { CURRENT_SCHEMA_VERSION, MIGRATIONS } from "@/lib/db/migrations"

export { CURRENT_SCHEMA_VERSION }

export async function listTableNames(client: Client): Promise<string[]> {
  const result = await client.execute(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
  )
  return result.rows.map((row) => String(row.name))
}

function statementsFrom(sql: string) {
  return sql
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function applyForwardMigrations(client: Client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `)

  const applied = await client.execute(`SELECT id FROM schema_migrations`)
  const appliedIds = new Set(applied.rows.map((row) => String(row.id)))

  for (const migration of MIGRATIONS) {
    if (appliedIds.has(migration.id)) continue

    for (const statement of statementsFrom(migration.sql)) {
      await client.execute(statement)
    }

    await client.execute({
      sql: `INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)`,
      args: [migration.id, Date.now()],
    })
  }
}
