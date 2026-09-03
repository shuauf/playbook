import { HealthView } from "@/components/health-view"
import { analyzeHealth } from "@/lib/analysis/dashboard"
import { loadAnalysisSnapshot } from "@/lib/analysis/load"
import { parseHealthFilters } from "@/lib/navigation"
import { listPeople } from "@/lib/playbook/queries"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function HealthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, snapshot, people] = await Promise.all([
    searchParams,
    loadAnalysisSnapshot(),
    listPeople(),
  ])
  const filters = parseHealthFilters(params)
  const analysis = analyzeHealth(snapshot, filters, new Date())
  const seNames = people.filter((person) => person.role === "se").map((person) => person.name)

  return (
    <HealthView
      analysis={analysis}
      plays={snapshot.plays.map((play) => ({ id: play.id, name: play.name }))}
      seNames={seNames}
    />
  )
}
