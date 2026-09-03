import Link from "next/link"

import { PageIntro } from "@/components/page-intro"
import { PlayEditor } from "@/components/play-editor"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NewPlayPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageIntro className="mb-0" kicker="Admin Console" title="Create a sales play">
          Name the play, choose typical stages, and list the prerequisites that should be true
          before it runs. Saving creates version 1.
        </PageIntro>
        <Link href="/admin" className={cn(buttonVariants({ variant: "outline" }))}>
          Back
        </Link>
      </div>
      <PlayEditor
        initial={{
          name: "",
          description: "",
          typicalStages: ["Evaluate"],
          prerequisites: [{ text: "" }],
        }}
      />
    </div>
  )
}
