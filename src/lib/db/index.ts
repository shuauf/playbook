import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import type { Client } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"

import { applyForwardMigrations } from "@/lib/db/migrate"
import { schema } from "@/lib/db/schema"
import { bootstrapWorkspace } from "@/lib/db/seed"
import type { PlaybookDb } from "@/lib/db/types"

export type { PlaybookDb } from "@/lib/db/types"

function env(name: string) {
  const value = process.env[name]
  return value && value.length > 0 ? value : undefined
}

export function isReadOnlyDeployFs() {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY ||
      process.env.LAMBDA_TASK_ROOT
  )
}

export type DbConnection =
  | { kind: "file"; path: string }
  | { kind: "remote"; url: string; authToken?: string }

export function defaultDbPath() {
  const explicit = env("PLAYBOOK_DB_PATH")
  if (explicit) return explicit
  if (isReadOnlyDeployFs()) {
    return path.join(os.tmpdir(), "playbook.sqlite")
  }
  return path.join(process.cwd(), "data", "playbook.sqlite")
}

export function resolveDbConnection(): DbConnection {
  const url = env("PLAYBOOK_DB_URL") ?? env("TURSO_DATABASE_URL") ?? env("LIBSQL_URL")
  if (url && !url.startsWith("file:")) {
    return {
      kind: "remote",
      url,
      authToken:
        env("PLAYBOOK_DB_AUTH_TOKEN") ?? env("TURSO_AUTH_TOKEN") ?? env("LIBSQL_AUTH_TOKEN"),
    }
  }
  return {
    kind: "file",
    path: url?.startsWith("file:") ? url.slice("file:".length) : defaultDbPath(),
  }
}

export function toRemoteLibsqlUrl(url: string) {
  return url.startsWith("libsql://") ? `https://${url.slice("libsql://".length)}` : url
}

export function persistenceCaption(connection: DbConnection = resolveDbConnection()) {
  if (connection.kind === "remote") return "Shared Turso database"
  if (process.env.VERCEL) return "Demo dataset on this instance"
  return "Local SQLite"
}

export function ensureWritableSqlitePath(filePath: string) {
  const dir = path.dirname(filePath)
  try {
    fs.mkdirSync(dir, { recursive: true })
    return filePath
  } catch {
    const fallback = path.join(os.tmpdir(), path.basename(filePath) || "playbook.sqlite")
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
