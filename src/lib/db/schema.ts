import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

export const schemaMigrations = sqliteTable("schema_migrations", {
  id: text("id").primaryKey(),
  appliedAt: integer("applied_at", { mode: "timestamp_ms" }).notNull(),
})

export const appMeta = sqliteTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
})

export const people = sqliteTable("people", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  team: text("team").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
})

export const salesPlays = sqliteTable("sales_plays", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  currentVersionId: text("current_version_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  retiredAt: integer("retired_at", { mode: "timestamp_ms" }),
})

export const salesPlayVersions = sqliteTable(
  "sales_play_versions",
  {
    id: text("id").primaryKey(),
    playId: text("play_id")
      .notNull()
      .references(() => salesPlays.id),
    version: integer("version").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    typicalStages: text("typical_stages").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("sales_play_versions_play_version_idx").on(table.playId, table.version)]
)

export const playVersionPrerequisites = sqliteTable(
  "play_version_prerequisites",
  {
    id: text("id").primaryKey(),
    versionId: text("version_id")
      .notNull()
      .references(() => salesPlayVersions.id),
    prerequisiteKey: text("prerequisite_key").notNull(),
    text: text("text").notNull(),
    sortOrder: integer("sort_order").notNull(),
  },
  (table) => [
    uniqueIndex("play_version_prerequisites_key_idx").on(table.versionId, table.prerequisiteKey),
  ]
)

export const undefinedPlayLabels = sqliteTable(
  "undefined_play_labels",
  {
    id: text("id").primaryKey(),
    normalizedLabel: text("normalized_label").notNull(),
    displayName: text("display_name").notNull(),
    description: text("description"),
    status: text("status").notNull(),
    mappedPlayId: text("mapped_play_id").references(() => salesPlays.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("undefined_play_labels_normalized_idx").on(table.normalizedLabel)]
)

export const opportunities = sqliteTable(
  "opportunities",
  {
    id: text("id").primaryKey(),
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    account: text("account").notNull(),
    segment: text("segment").notNull(),
    stage: text("stage").notNull(),
    outcome: text("outcome").notNull(),
    seName: text("se_name").notNull(),
    aeName: text("ae_name").notNull(),
    team: text("team").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    closeDate: integer("close_date", { mode: "timestamp_ms" }),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    source: text("source").notNull(),
  },
  (table) => [uniqueIndex("opportunities_external_id_idx").on(table.externalId)]
)

export const salesActivities = sqliteTable(
  "sales_activities",
  {
    id: text("id").primaryKey(),
    externalId: text("external_id").notNull(),
    opportunityId: text("opportunity_id")
      .notNull()
      .references(() => opportunities.id),
    playId: text("play_id").references(() => salesPlays.id),
    playVersionId: text("play_version_id").references(() => salesPlayVersions.id),
    undefinedLabel: text("undefined_label"),
    mappedPlayId: text("mapped_play_id").references(() => salesPlays.id),
    activityDate: integer("activity_date", { mode: "timestamp_ms" }).notNull(),
    stageAtActivity: text("stage_at_activity").notNull(),
    seName: text("se_name").notNull(),
    note: text("note"),
    source: text("source").notNull(),
    captureKind: text("capture_kind").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("sales_activities_external_id_idx").on(table.externalId)]
)

export const activityPrerequisiteSnapshots = sqliteTable(
  "activity_prerequisite_snapshots",
  {
    id: text("id").primaryKey(),
    activityId: text("activity_id")
      .notNull()
      .references(() => salesActivities.id),
    prerequisiteKey: text("prerequisite_key").notNull(),
    textAtCapture: text("text_at_capture").notNull(),
    status: text("status").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("activity_prerequisite_snapshots_key_idx").on(
      table.activityId,
      table.prerequisiteKey
    ),
  ]
)

export const ingestionBatches = sqliteTable("ingestion_batches", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  filename: text("filename"),
  committedAt: integer("committed_at", { mode: "timestamp_ms" }).notNull(),
  rowCounts: text("row_counts").notNull(),
  mode: text("mode").notNull(),
})

export const schema = {
  schemaMigrations,
  appMeta,
  people,
  salesPlays,
  salesPlayVersions,
  playVersionPrerequisites,
  undefinedPlayLabels,
  opportunities,
  salesActivities,
  activityPrerequisiteSnapshots,
  ingestionBatches,
}
