import { WorkspaceStatusView } from "@/components/workspace-status"
import { getWorkspaceStatus } from "@/lib/workspace/status"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function HomePage() {
  const status = await getWorkspaceStatus()
  return <WorkspaceStatusView status={status} />
}
