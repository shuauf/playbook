import { HealthView } from "@/components/health-view"
import { parseHealthFilters } from "@/lib/navigation"
import { listPeople } from "@/lib/playbook/queries"
import { getWorkspaceStatus } from "@/lib/workspace/status"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function HealthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, status, people] = await Promise.all([
    searchParams,
    getWorkspaceStatus(),
    listPeople(),
  ])
  const seNames = people.filter((person) => person.role === "se").map((person) => person.name)

  return (
    <HealthView
      status={status}
      filters={parseHealthFilters(params)}
      seNames={seNames}
    />
  )
}
