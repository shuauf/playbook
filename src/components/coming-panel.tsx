import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"

export function ComingPanel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-[11px] font-medium tracking-[0.16em] text-[oklch(0.42_0.06_175)] uppercase">
          Next
        </p>
        <p className="font-heading mt-1 text-lg">{title}</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{children}</p>
      </CardContent>
    </Card>
  )
}
