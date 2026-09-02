import { ExplorerView } from "@/components/explorer-view"
import { parseExplorerView } from "@/lib/navigation"
import { listActivityPreviews, listOpportunityPreviews } from "@/lib/playbook/queries"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const [opportunities, activities] = await Promise.all([
    listOpportunityPreviews(30),
    listActivityPreviews(30),
  ])

  return (
    <ExplorerView
      view={parseExplorerView(params.view)}
      opportunities={opportunities}
      activities={activities}
    />
  )
}
