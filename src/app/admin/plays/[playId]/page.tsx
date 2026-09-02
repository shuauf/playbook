import { notFound } from "next/navigation"

import { PlayDefinitionView } from "@/components/play-definition-view"
import { PlayEditor } from "@/components/play-editor"
import { getPlayDetail } from "@/lib/playbook/queries"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function AdminPlayPage({
  params,
}: {
  params: Promise<{ playId: string }>
}) {
  const { playId } = await params
  const play = await getPlayDetail(playId)
  if (!play) notFound()
  return (
    <div className="space-y-6">
      <PlayDefinitionView play={play} mode="admin" />
      <PlayEditor
        playId={play.id}
        status={play.status === "retired" ? "retired" : "active"}
        version={play.currentVersion?.version}
        initial={{
          name: play.currentVersion?.name ?? "",
          description: play.currentVersion?.description ?? "",
          typicalStages: play.currentVersion?.typicalStages ?? [],
          prerequisites: play.prerequisites.map((item) => ({
            key: item.key,
            text: item.text,
          })),
        }}
      />
    </div>
  )
}
