import { ScribeHome } from "@/components/scribe/scribe-home"
import { analyzeHealth } from "@/lib/analysis/dashboard"
import { loadAnalysisSnapshot } from "@/lib/analysis/load"
import { PLAY_HYGIENE } from "@/lib/db/catalog"
import { parseHealthFilters } from "@/lib/navigation"
import {
  listExplorerData,
  listOpportunityChoices,
  listPeople,
  listPlayDefinitions,
} from "@/lib/playbook/queries"

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
  const analysis = analyzeHealth(snapshot, filters, new Date())

  return (
    <ScribeHome
      analysis={analysis}
      plays={plays}
      hygiene={PLAY_HYGIENE}
      explorer={explorer}
      people={people}
      opportunities={opportunities}
      initialModal={first(params.modal)}
      initialPlayId={first(params.playId)}
      initialOpportunityId={first(params.opportunityId)}
    />
  )
}
