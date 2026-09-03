"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { PRIMARY_NAV } from "@/lib/navigation"
import { cn } from "@/lib/utils"

export function AppShell({
  children,
  persistenceLabel,
  isDemo,
}: {
  children: ReactNode
  workspaceName?: string
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
      <header className="sticky top-0 z-40 border-b border-border/80 bg-[oklch(0.965_0.012_85)]/92 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1320px] items-center gap-4 px-4 py-2.5 md:px-6">
          <Link href="/" className="font-heading shrink-0 text-lg leading-none text-foreground">
            Playbook Iterator
          </Link>
          <nav aria-label="Primary" className="flex min-w-0 flex-1 items-center gap-1">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-card text-foreground shadow-[0_0_0_1px_oklch(0.85_0.03_175)]"
                      : "text-muted-foreground hover:bg-card/80 hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {isDemo ? (
              <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
                Demo data
              </span>
            ) : null}
            <span
              className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex"
              title={persistenceLabel}
            >
              <span className="size-1.5 rounded-full bg-[oklch(0.55_0.12_145)]" />
              {persistenceLabel}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-5 md:px-6 md:py-6">
        {children}
      </main>

      <footer className="border-t border-border/80">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-1 px-4 py-3 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <p>Exceptions are decisions, not automatic mistakes. The playbook is a set of hypotheses.</p>
          <Link href="/methodology" className="hover:text-foreground">
            Methodology
          </Link>
        </div>
      </footer>
    </div>
  )
}
