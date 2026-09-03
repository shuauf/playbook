"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { PRIMARY_NAV } from "@/lib/navigation"
import { cn } from "@/lib/utils"

export function AppShell({
  children,
  workspaceName,
  persistenceLabel,
  isDemo,
}: {
  children: ReactNode
  workspaceName: string
  persistenceLabel: string
  isDemo: boolean
}) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/plays")
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-[oklch(0.965_0.012_85)]/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-4 md:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-medium tracking-[0.18em] text-[oklch(0.42_0.06_175)] uppercase">
                {workspaceName}
              </p>
              <Link href="/" className="font-heading text-[1.65rem] leading-none text-foreground">
                Playbook Iterator
              </Link>
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                Exceptions are decisions. The playbook evolves from evidence.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start">
              {isDemo ? (
                <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                  Demo data
                </span>
              ) : null}
              <span className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-[oklch(0.55_0.12_145)]" />
                {persistenceLabel}
              </span>
            </div>
          </div>

          <nav aria-label="Primary" className="grid gap-2 sm:grid-cols-3">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col rounded-xl border px-3.5 py-3 transition-colors",
                    active
                      ? "border-[oklch(0.75_0.05_175)] bg-card shadow-[0_1px_0_rgba(28,25,23,0.04)]"
                      : "border-transparent bg-card/50 hover:border-border hover:bg-card"
                  )}
                >
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.hint}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>

      <footer className="border-t border-border/80">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-1 px-4 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p>Exceptions are decisions, not automatic mistakes. The playbook is a set of hypotheses.</p>
          <Link href="/methodology" className="hover:text-foreground">
            Methodology
          </Link>
        </div>
      </footer>
    </div>
  )
}
