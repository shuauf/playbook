import { ScribeHome } from "@/components/scribe/scribe-home"
import { analyzeHealth } from "@/lib/analysis/dashboard"
import { loadAnalysisSnapshot } from "@/lib/analysis/load"
import { PLAY_DETAIL } from "@/lib/db/catalog"
import { parseHealthFilters } from "@/lib/navigation"
import {
  listExplorerData,
  listOpportunityChoices,
  listPeople,
  listPlayDefinitions,
} from "@/lib/playbook/queries"
import type { HealthAnalysis } from "@/lib/analysis/types"
import type { SegmentFilter } from "@/components/scribe/segment-toggle"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, snapshot, people, plays, explorer, opportunities] = await Promise.all([
    searchParams,
    loadAnalysisSnapshot(),
    listPeople(),
    listPlayDefinitions(),
    listExplorerData(),
    listOpportunityChoices(),
  ])
  const filters = parseHealthFilters(params)
  const asOf = new Date()
  const analysis = analyzeHealth(snapshot, { ...filters, segment: "all" }, asOf)
  const segmentAnalyses = {
    all: analysis,
    Strategic: analyzeHealth(snapshot, { ...filters, segment: "Strategic" }, asOf),
    "Mid-Market": analyzeHealth(snapshot, { ...filters, segment: "Mid-Market" }, asOf),
    SMB: analyzeHealth(snapshot, { ...filters, segment: "SMB" }, asOf),
  } satisfies Record<SegmentFilter, HealthAnalysis>
  const gongAt = new Date(asOf.getTime() - 3 * 60 * 60 * 1000)
  const salesforceAt = new Date(asOf.getTime() - 5 * 60 * 1000)

  return (
    <ScribeHome
      analysis={analysis}
      segmentAnalyses={segmentAnalyses}
      plays={plays}
      details={PLAY_DETAIL}
      explorer={explorer}
      people={people}
      opportunities={opportunities}
      initialModal={first(params.modal)}
      initialPlayId={first(params.playId)}
      initialOpportunityId={first(params.opportunityId)}
      initialQuery={first(params.q)}
      sync={{
        gongAt: gongAt.toISOString(),
        salesforceAt: salesforceAt.toISOString(),
      }}
    />
  )
}
