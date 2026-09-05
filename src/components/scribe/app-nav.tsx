"use client"

import { cn } from "@/lib/utils"

const TABS = [
  { id: "home", label: "Home" },
  { id: "team", label: "Team" },
  { id: "playbook-iteration", label: "Playbook Iteration", href: "/" },
  { id: "attainment", label: "Attainment, Coverage & Capacity" },
  { id: "coaching", label: "Coaching & Performance" },
  { id: "assets", label: "Assets & Enablement" },
  { id: "hiring", label: "Hiring & Onboarding" },
] as const

export function AppNav({ current = "playbook-iteration" }: { current?: (typeof TABS)[number]["id"] }) {
  return (
    <nav aria-label="Product areas" className="flex min-w-0 flex-1 items-stretch overflow-x-auto">
      {TABS.map((tab) => {
        const active = tab.id === current
        const ready = "href" in tab && Boolean(tab.href)
        const className = cn(
          "shrink-0 border-b-2 px-2.5 text-[13px] leading-none whitespace-nowrap",
          active
            ? "border-[#2B2A27] font-medium text-[#2B2A27]"
            : "border-transparent text-[#2B2A27]/38",
          ready && !active ? "hover:text-[#2B2A27]/70" : ""
        )
        if (!ready) {
          return (
            <span key={tab.id} className={cn(className, "inline-flex items-center")} title="Coming soon">
              {tab.label}
            </span>
          )
        }
        return (
          <a key={tab.id} href={tab.href} aria-current={active ? "page" : undefined} className={cn(className, "inline-flex items-center")}>
            {tab.label}
          </a>
        )
      })}
    </nav>
  )
}
