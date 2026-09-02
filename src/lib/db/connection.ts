import os from "node:os"
import path from "node:path"

export function env(name: string) {
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
    return path.join(/*turbopackIgnore: true*/ os.tmpdir(), "playbook.sqlite")
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
