export const MIGRATION_0001_ID = "0001_init"

export const MIGRATION_0001_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  team TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_plays (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  current_version_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  retired_at INTEGER
);

CREATE TABLE IF NOT EXISTS sales_play_versions (
  id TEXT PRIMARY KEY,
  play_id TEXT NOT NULL REFERENCES sales_plays(id),
  version INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  typical_stages TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS play_version_prerequisites (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL REFERENCES sales_play_versions(id),
  prerequisite_key TEXT NOT NULL,
  text TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS undefined_play_labels (
  id TEXT PRIMARY KEY,
  normalized_label TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  mapped_play_id TEXT REFERENCES sales_plays(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  account TEXT NOT NULL,
  segment TEXT NOT NULL,
  stage TEXT NOT NULL,
  outcome TEXT NOT NULL,
  se_name TEXT NOT NULL,
  ae_name TEXT NOT NULL,
  team TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  close_date INTEGER,
  updated_at INTEGER NOT NULL,
  source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_activities (
  id TEXT PRIMARY KEY,
  external_id TEXT NOT NULL,
  opportunity_id TEXT NOT NULL REFERENCES opportunities(id),
  play_id TEXT REFERENCES sales_plays(id),
  play_version_id TEXT REFERENCES sales_play_versions(id),
  undefined_label TEXT,
  mapped_play_id TEXT REFERENCES sales_plays(id),
  activity_date INTEGER NOT NULL,
  stage_at_activity TEXT NOT NULL,
  se_name TEXT NOT NULL,
  note TEXT,
  source TEXT NOT NULL,
  capture_kind TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_prerequisite_snapshots (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES sales_activities(id),
  prerequisite_key TEXT NOT NULL,
  text_at_capture TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ingestion_batches (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  filename TEXT,
  committed_at INTEGER NOT NULL,
  row_counts TEXT NOT NULL,
  mode TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS sales_play_versions_play_version_idx
  ON sales_play_versions(play_id, version);
CREATE INDEX IF NOT EXISTS sales_play_versions_play_idx
  ON sales_play_versions(play_id);
CREATE UNIQUE INDEX IF NOT EXISTS play_version_prerequisites_key_idx
  ON play_version_prerequisites(version_id, prerequisite_key);
CREATE INDEX IF NOT EXISTS play_version_prerequisites_version_idx
  ON play_version_prerequisites(version_id);
CREATE UNIQUE INDEX IF NOT EXISTS undefined_play_labels_normalized_idx
  ON undefined_play_labels(normalized_label);
CREATE UNIQUE INDEX IF NOT EXISTS opportunities_external_id_idx
  ON opportunities(external_id);
CREATE INDEX IF NOT EXISTS opportunities_outcome_idx
  ON opportunities(outcome);
CREATE INDEX IF NOT EXISTS opportunities_se_idx
  ON opportunities(se_name);
CREATE UNIQUE INDEX IF NOT EXISTS sales_activities_external_id_idx
  ON sales_activities(external_id);
CREATE INDEX IF NOT EXISTS sales_activities_opportunity_idx
  ON sales_activities(opportunity_id);
CREATE INDEX IF NOT EXISTS sales_activities_play_idx
  ON sales_activities(play_id);
CREATE INDEX IF NOT EXISTS sales_activities_date_idx
  ON sales_activities(activity_date);
CREATE UNIQUE INDEX IF NOT EXISTS activity_prerequisite_snapshots_key_idx
  ON activity_prerequisite_snapshots(activity_id, prerequisite_key);
CREATE INDEX IF NOT EXISTS activity_prerequisite_snapshots_activity_idx
  ON activity_prerequisite_snapshots(activity_id);
`
