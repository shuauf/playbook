import { AdminView } from "@/components/admin-view"
import { getWorkspaceStatus } from "@/lib/workspace/status"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function AdminPage() {
  const status = await getWorkspaceStatus()
  return (
    <AdminView
      plays={status.plays}
      undefinedCount={status.undefinedLabels.filter((item) => item.status === "open").length}
    />
  )
}
