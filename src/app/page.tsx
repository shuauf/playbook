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

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function latest(dates: Array<Date | null | undefined>) {
  let max: Date | null = null
  for (const date of dates) {
    if (!date) continue
    if (!max || date > max) max = date
  }
  return max
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
  const gongAt = latest(snapshot.activities.map((item) => item.activityDate)) ?? new Date()
  const salesforceAt =
    latest(
      snapshot.opportunities.flatMap((item) => [item.closeDate, item.createdAt])
    ) ?? gongAt

  return (
    <ScribeHome
      analysis={analysis}
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
