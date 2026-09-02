import type { RecordSource } from "@/lib/domain/types"

/**
 * Ingestion boundary. Demo seed, CSV import, manual entry, and a future CRM
 * adapter all write through the same domain functions. A real integration
 * should implement IngestionSource and stop using the demo source.
 */
export type IngestionSourceKind = RecordSource | "integration"

export type IngestionSource = {
  kind: IngestionSourceKind
  label: string
  isDemo: boolean
}

export const DEMO_INGESTION_SOURCE: IngestionSource = {
  kind: "demo",
  label: "Northstar SE demo workspace",
  isDemo: true,
}

export const MANUAL_INGESTION_SOURCE: IngestionSource = {
  kind: "manual",
  label: "Manual entry",
  isDemo: false,
}

export const CSV_INGESTION_SOURCE: IngestionSource = {
  kind: "import",
  label: "CSV import",
  isDemo: false,
}
