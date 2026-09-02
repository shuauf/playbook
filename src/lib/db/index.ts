import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import type { Client } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"

import {
  resolveDbConnection,
  toRemoteLibsqlUrl,
  type DbConnection,
} from "@/lib/db/connection"
import { applyForwardMigrations } from "@/lib/db/migrate"
import { schema } from "@/lib/db/schema"
import { bootstrapWorkspace } from "@/lib/db/seed"
import type { PlaybookDb } from "@/lib/db/types"

export type { PlaybookDb } from "@/lib/db/types"
export {
  defaultDbPath,
  isReadOnlyDeployFs,
  persistenceCaption,
  resolveDbConnection,
  toRemoteLibsqlUrl,
  type DbConnection,
} from "@/lib/db/connection"

export function ensureWritableSqlitePath(filePath: string) {
  const dir = path.dirname(filePath)
  try {
    fs.mkdirSync(dir, { recursive: true })
    return filePath
  } catch {
    const fallback = path.join(
      /*turbopackIgnore: true*/ os.tmpdir(),
      path.basename(filePath) || "playbook.sqlite"
    )
    fs.mkdirSync(path.dirname(fallback), { recursive: true })
    return fallback
  }
}

async function createPlaybookClient(connection: DbConnection): Promise<Client> {
  if (connection.kind === "remote") {
    if (!connection.authToken) {
      throw new Error(
        "TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL (or PLAYBOOK_DB_URL) is set."
      )
    }
    const { createClient } = await import("@libsql/client/web")
    return createClient({
      url: toRemoteLibsqlUrl(connection.url),
      authToken: connection.authToken,
    })
  }
  const { createClient } = await import("@libsql/client")
  const filePath = ensureWritableSqlitePath(connection.path)
  return createClient({ url: `file:${filePath}` })
}

export async function openPlaybookConnection(
  connection: DbConnection = resolveDbConnection()
): Promise<{
  client: Client
  db: PlaybookDb
}> {
  const client = await createPlaybookClient(connection)
  await applyForwardMigrations(client)
  const db = drizzle(client, { schema })
  return { client, db }
}

export async function openPlaybookDb(filePath: string) {
  return openPlaybookConnection({ kind: "file", path: filePath })
}

const globalForDb = globalThis as unknown as {
  playbook?: Promise<{ client: Client; db: PlaybookDb }>
}

export async function getDb(): Promise<PlaybookDb> {
  if (!globalForDb.playbook) {
    globalForDb.playbook = (async () => {
      const opened = await openPlaybookConnection()
      await bootstrapWorkspace(opened.db)
      return opened
    })()
  }
  return (await globalForDb.playbook).db
}

export async function getOpenedConnection() {
  if (!globalForDb.playbook) {
    await getDb()
  }
  return globalForDb.playbook!
}
