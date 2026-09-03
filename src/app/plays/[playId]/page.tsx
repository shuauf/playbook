import { notFound } from "next/navigation"

import { PlayDefinitionView } from "@/components/play-definition-view"
import { getPlayDetail } from "@/lib/playbook/queries"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function PlayDetailPage({
  params,
}: {
  params: Promise<{ playId: string }>
}) {
  const { playId } = await params
  const play = await getPlayDetail(playId)
  if (!play) notFound()
  return <PlayDefinitionView play={play} mode="health" />
}
