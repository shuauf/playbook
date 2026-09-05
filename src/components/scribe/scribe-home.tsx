"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { PlayPerformanceTable } from "@/components/health-table"
import { OutcomeChart } from "@/components/scribe/outcome-chart"
import { PerformanceTrendChart } from "@/components/scribe/performance-trend"
import {
  AddPlayModal,
  ExplorerModal,
  LogActivityModal,
  OffPlaybookModal,
  PlayModal,
  type OpportunityChoice,
  type PersonChoice,
  type PlayDefinition,
} from "@/components/scribe/modals"
import { PlaySidebar } from "@/components/scribe/play-sidebar"
import { PlaySignalSection } from "@/components/scribe/signal-charts"
import { portfolioWinLift } from "@/lib/analysis/compute"
import { daysUntil, hygieneUrgencyFill } from "@/lib/dates"
import { formatCount, formatRelativeAgo, pct, periodTitleLower, percentPoints } from "@/lib/format"
import type { PlayDetail } from "@/lib/db/catalog"
import type { HealthAnalysis, LookCloserItem } from "@/lib/analysis/types"
import type { ExplorerActivity, ExplorerOpportunity } from "@/lib/explorer/types"

function HygieneRing({ days }: { days: number }) {
  const fill = hygieneUrgencyFill(days)
  const shown = Math.min(99, Math.max(0, Math.round(days)))
  const radius = 15
  const circumference = 2 * Math.PI * radius
  const dash = (fill / 100) * circumference
  const tone = days <= 45 ? "amber" : "teal"
  const color = tone === "amber" ? "#D9893A" : "#3D8B8B"
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0" aria-hidden>
      <circle cx="20" cy="20" r={radius} fill="none" stroke="#3a3936" strokeWidth="3" />
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
      <text x="20" y="24" textAnchor="middle" fontSize="10" fill="#f3f2ee">
        {shown}
      </text>
    </svg>
  )
}

function LookCloserCard({
  items,
  period,
  onOpen,
}: {
  items: LookCloserItem[]
  period: string
  onOpen: (href: string) => void
}) {
  return (
    <aside className="rounded-2xl bg-[#2B2A27] px-4 py-3 text-[#f3f2ee]">
      <h2 className="font-heading text-xl leading-tight text-[#f3f2ee]">AI Observations</h2>
      <p className="mt-0.5 text-xs text-white/55">
        Patterns worth checking from logged activity and Gong in the {period}.
      </p>
      <div className="mt-3 divide-y divide-white/10">
        {items.length === 0 ? (
          <p className="py-2 text-sm text-white/60">Nothing stands out in this window yet.</p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.href)}
              className="flex w-full cursor-pointer flex-col py-2.5 text-left first:pt-0 last:pb-0 hover:bg-white/5"
            >
              <span className="text-[11px] tracking-[0.12em] text-white/45 uppercase">{item.label}</span>
              <span className="mt-0.5 text-sm leading-snug">{item.body}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  )
}

function hygieneCountdown(isoDate: string, asOf: Date) {
  const days = daysUntil(isoDate, asOf)
  if (days < 0) return { days: 0, label: "Review is overdue." }
  if (days === 0) return { days: 0, label: "Review is due today." }
  if (days === 1) return { days: 1, label: "1 day until the next scheduled review." }
  return { days, label: `${days} days until the next scheduled review.` }
}

export function ScribeHome({
  analysis,
  plays,
  details,
  explorer,
  people,
  opportunities,
  initialModal,
  initialPlayId,
  initialOpportunityId,
  initialQuery,
  sync,
}: {
  analysis: HealthAnalysis
  plays: PlayDefinition[]
  details: Record<string, PlayDetail>
  explorer: { activities: ExplorerActivity[]; opportunities: ExplorerOpportunity[] }
  people: PersonChoice[]
  opportunities: OpportunityChoice[]
  initialModal?: string
  initialPlayId?: string
  initialOpportunityId?: string
  initialQuery?: string
  sync: { gongAt: string; salesforceAt: string }
}) {
  const router = useRouter()
  const [playsOpen, setPlaysOpen] = useState(false)
  const windowLower = periodTitleLower(analysis.filters.period)
  const offPlaybook = analysis.hygiene.filter((item) => item.kind === "undefined")
  const adherence = analysis.totals.definedActivities
    ? 1 - analysis.totals.exceptionActivities / analysis.totals.definedActivities
    : null
  const lift = portfolioWinLift(analysis.plays)
  const selectedPlay = plays.find((play) => play.id === initialPlayId) ?? plays[0]
  const hygieneRows = plays
    .map((play) => {
      const meta = details[play.id]
      const countdown = meta ? hygieneCountdown(meta.nextReview, new Date()) : { days: 999, label: "No review scheduled." }
      return { play, meta, countdown }
    })
    .sort((a, b) => a.countdown.days - b.countdown.days)

  function open(modal: string, extra?: Record<string, string>) {
    const params = new URLSearchParams({ modal, ...extra })
    router.push(`/?${params.toString()}`)
  }

  function close() {
    router.push("/")
  }

  return (
    <div>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-border/80 bg-[#f7f7f5] px-4 md:px-6">
        <p className="font-heading text-xl leading-none">Playbook</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Track & iterate</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs ring-1 ring-[#2B2A27]/10">
            <span className="size-2 rounded-full bg-[#D9893A]" />
            Gong
            <span className="text-muted-foreground">synced {formatRelativeAgo(new Date(sync.gongAt))}</span>
          </span>
          <span className="hidden items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs ring-1 ring-[#2B2A27]/10 sm:inline-flex">
            <span className="size-2 rounded-full bg-[#3D8B8B]" />
            Salesforce
            <span className="text-muted-foreground">synced {formatRelativeAgo(new Date(sync.salesforceAt))}</span>
          </span>
          <button
            type="button"
            onClick={() => open("explorer")}
            className="cursor-pointer rounded-full border border-[#2B2A27]/20 bg-white px-4 py-1.5 text-sm hover:bg-[#EBEDF1]"
          >
            Activity explorer
          </button>
          <button
            type="button"
            onClick={() => open("log")}
            className="cursor-pointer rounded-full bg-[#2B2A27] px-4 py-1.5 text-sm text-white hover:bg-[#3a3936]"
          >
            Log activity
          </button>
        </div>
      </header>

      <PlaySidebar
        plays={plays}
        activePlayId={initialModal === "play" ? initialPlayId : undefined}
        offbookActive={initialModal === "offbook"}
        offbookCount={offPlaybook.length}
        drawerOpen={playsOpen}
        onToggleDrawer={() => setPlaysOpen((open) => !open)}
        onCloseDrawer={() => setPlaysOpen(false)}
        onSelect={(playId) => open("play", { playId })}
        onOffbook={() => open("offbook")}
        onAdd={() => open("add")}
      />

      <div className="pl-14 lg:pl-56">
        <div className="mx-auto w-full max-w-[1320px] px-4 pb-8 pt-5 md:px-6">
      <section className="grid gap-3 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7">
          <h2 className="font-heading text-xl leading-tight">Management view</h2>
          <p className="mt-0.5 max-w-md text-xs text-muted-foreground">
            Snapshot of defined-play activity in the {windowLower}.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white px-3 py-3">
              <p className="text-3xl font-medium tracking-tight tabular-nums">
                {adherence === null ? "—" : pct(adherence, 0)}
              </p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">
                of activities had every recommended prerequisite
              </p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3">
              <p className="text-3xl font-medium tracking-tight tabular-nums">
                {lift === null ? "—" : `${percentPoints(lift, 0)}%`}
              </p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">
                {lift === null
                  ? `No supported win-rate comparison`
                  : `higher win rate when recommended prerequisites were present`}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3">
              <p className="text-3xl font-medium tracking-tight tabular-nums">
                {formatCount(analysis.totals.activities)}
              </p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">activities logged</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 lg:pt-1">
          <LookCloserCard
            items={analysis.lookCloser}
            period={windowLower}
            onOpen={(href) => router.push(href)}
          />
        </div>
      </section>

      <section className="mt-6 grid gap-3 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-3">
          <h2 className="font-heading text-xl">Performance over time</h2>
          <p className="mb-2 text-xs text-muted-foreground">
            Win rate, exception rate, and cycle time across the {windowLower}.
          </p>
          <PerformanceTrendChart analysis={analysis} />
        </div>
        <div className="rounded-2xl bg-white p-3">
          <h2 className="font-heading text-xl">When plays are followed</h2>
          <p className="mb-2 text-xs text-muted-foreground">
            Closed deals in the {windowLower}. Teal: every recommended prerequisite present. Amber: at
            least one missing.
          </p>
          <OutcomeChart analysis={analysis} />
        </div>
      </section>

      <section className="mt-5 rounded-2xl bg-white">
        <div className="px-3 pt-3">
          <h2 className="font-heading text-xl">Sales play performance</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            How each defined play performed in the {windowLower}. Open a play for its recommended
            prerequisites and success criteria.
          </p>
        </div>
        <div className="mt-1 overflow-x-auto">
          <PlayPerformanceTable
            plays={analysis.plays}
            onPlayClick={(playId) => open("play", { playId })}
          />
        </div>
      </section>

      <PlaySignalSection analysis={analysis} details={details} />

      <section className="mt-5 rounded-2xl bg-[#2B2A27] px-3 py-3 text-[#f3f2ee]">
        <h2 className="font-heading text-xl">Play hygiene</h2>
        <p className="mt-0.5 text-xs text-white/55">
          A fuller ring means the next review is closer. The number is days left, soonest first.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {hygieneRows.map(({ play, meta, countdown }) => (
            <button
              key={play.id}
              type="button"
              onClick={() => open("play", { playId: play.id })}
              className="flex cursor-pointer items-start gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-white/5"
            >
              <div className="flex flex-col items-center gap-0.5">
                <HygieneRing days={countdown.days} />
                <span className="text-[9px] text-white/45">days left</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{play.name}</p>
                <p className="text-xs text-white/55">
                  {meta?.owner ?? "Solutions Engineering"}
                </p>
                <p className="mt-0.5 text-[11px] text-white/45">{countdown.label}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {initialModal === "play" && selectedPlay ? (
        <PlayModal play={selectedPlay} detail={details[selectedPlay.id]} onClose={close} />
      ) : null}
      {initialModal === "offbook" ? (
        <OffPlaybookModal
          items={offPlaybook}
          period={windowLower}
          onClose={close}
          onOpen={(query) => open("explorer", { q: query })}
        />
      ) : null}
      {initialModal === "add" ? <AddPlayModal onClose={close} /> : null}
      {initialModal === "explorer" ? (
        <ExplorerModal
          activities={explorer.activities}
          opportunities={explorer.opportunities}
          initialOpportunityId={initialOpportunityId}
          initialQuery={initialQuery}
          onClose={close}
        />
      ) : null}
      {initialModal === "log" ? (
        <LogActivityModal opportunities={opportunities} plays={plays} people={people} onClose={close} />
      ) : null}
        </div>
      </div>
    </div>
  )
}
