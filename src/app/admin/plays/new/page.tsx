import Link from "next/link"

import { ComingPanel } from "@/components/coming-panel"
import { PageIntro } from "@/components/page-intro"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NewPlayPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageIntro className="mb-0" kicker="Admin Console" title="Create a sales play">
          The play editor will capture a name, description, typical stages, and an ordered
          prerequisite list. Saving will create version 1.
        </PageIntro>
        <Link href="/admin" className={cn(buttonVariants({ variant: "outline" }))}>
          Back
        </Link>
      </div>
      <ComingPanel title="Editor arrives next">
        This route is reserved so Health alerts and the Admin list can already point here. The
        form itself is the next phase.
      </ComingPanel>
    </div>
  )
}
