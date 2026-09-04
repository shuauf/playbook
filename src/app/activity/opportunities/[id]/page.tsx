import { redirect } from "next/navigation"

export default async function OpportunityRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/?modal=explorer&opportunityId=${encodeURIComponent(id)}`)
}
