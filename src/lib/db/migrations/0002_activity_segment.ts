export const MIGRATION_0002_ID = "0002_activity_segment"

export const MIGRATION_0002_SQL = `
ALTER TABLE sales_activities ADD COLUMN segment TEXT NOT NULL DEFAULT 'Mid-Market';
CREATE INDEX IF NOT EXISTS sales_activities_segment_idx ON sales_activities(segment);
`
