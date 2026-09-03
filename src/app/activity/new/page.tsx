import Link from "next/link"

import { AddActivityForm } from "@/components/add-activity-form"
import { PageIntro } from "@/components/page-intro"
import { buttonVariants } from "@/components/ui/button"
import { listOpportunityChoices, listPeople, listPlayDefinitions } from "@/lib/playbook/queries"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function NewActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, opportunities, plays, people] = await Promise.all([
    searchParams,
    listOpportunityChoices(),
    listPlayDefinitions(),
    listPeople(),
  ])
  const opportunityId = typeof params.opportunity === "string" ? params.opportunity : undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageIntro className="mb-0" kicker="Activity Explorer" title="Add activity">
          Record what happened. Defined plays require an explicit Met or Not Met for every
          prerequisite. Undefined types stay unevaluated.
        </PageIntro>
        <Link href="/activity" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to explorer
        </Link>
      </div>
      <AddActivityForm
        opportunities={opportunities}
        plays={plays}
        people={people}
        initialOpportunityId={opportunityId}
      />
    </div>
  )
}
