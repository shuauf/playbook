import type { ReactNode } from "react"

export function AppShell({ children }: { children: ReactNode; workspaceName?: string; persistenceLabel?: string; isDemo?: boolean }) {
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/80">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-1 px-4 py-3 pl-16 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6 lg:pl-60">
          <p>See exactly what&apos;s happening. Know exactly what to fix.</p>
          <p>Track & iterate</p>
        </div>
      </footer>
    </div>
  )
}
