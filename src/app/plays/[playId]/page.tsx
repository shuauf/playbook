import { redirect } from "next/navigation"

export default async function PlayRedirect({
  params,
}: {
  params: Promise<{ playId: string }>
}) {
  const { playId } = await params
  redirect(`/?modal=play&playId=${encodeURIComponent(playId)}`)
}
