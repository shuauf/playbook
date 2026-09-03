import { ExplorerView } from "@/components/explorer-view"
import { parseExplorerFilters } from "@/lib/navigation"
import { listExplorerData, listPeople, listPlayDefinitions } from "@/lib/playbook/queries"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, records, plays, people] = await Promise.all([
    searchParams,
    listExplorerData(),
    listPlayDefinitions(),
    listPeople(),
  ])

  return (
    <ExplorerView
      initialFilters={parseExplorerFilters(params)}
      opportunities={records.opportunities}
      activities={records.activities}
      plays={plays.map((play) => ({ id: play.id, name: play.name }))}
      seNames={people.filter((person) => person.role === "se").map((person) => person.name)}
    />
  )
}
