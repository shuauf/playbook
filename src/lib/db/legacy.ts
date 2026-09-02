import type { Client } from "@libsql/client"

import { listTableNames } from "@/lib/db/migrate"

export const PREDECESSOR_TABLES = [
  "plays",
  "prerequisites",
  "prerequisite_versions",
  "exception_reasons",
  "playbook_events",
  "play_runs",
  "prerequisite_checks",
] as const

export async function detectPredecessorTables(client: Client) {
  const names = new Set(await listTableNames(client))
  return PREDECESSOR_TABLES.filter((name) => names.has(name))
}
