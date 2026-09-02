import Link from "next/link"

import { PageIntro } from "@/components/page-intro"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NotFound() {
  return (
    <div>
      <PageIntro kicker="Not found" title="That page is not in the playbook">
        The route may be wrong, or the record no longer exists.
      </PageIntro>
      <Link href="/" className={cn(buttonVariants())}>
        Back to Playbook Health
      </Link>
    </div>
  )
}
