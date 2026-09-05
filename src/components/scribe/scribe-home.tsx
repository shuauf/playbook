"use client"

import { useRouter } from "next/navigation"
import { FlaskConical, Layers, Monitor, Search, Users } from "lucide-react"
import type { ReactNode } from "react"

import { PlayPerformanceTable } from "@/components/health-table"
import { OutcomeChart } from "@/components/scribe/outcome-chart"
import { PerformanceTrendChart } from "@/components/scribe/performance-trend"
import {
  ExplorerModal,
  LogActivityModal,
  PlayModal,
  type OpportunityChoice,
  type PersonChoice,
  type PlayDefinition,
} from "@/components/scribe/modals"
import { PlaySignalSection } from "@/components/scribe/signal-charts"
import { daysUntil, hygieneUrgencyFill } from "@/lib/dates"
import { formatCount, formatRelativeAgo, pct, periodTitleLower, percentPoints } from "@/lib/format"
import type { PlayDetail } from "@/lib/db/catalog"
import type { HealthAnalysis, HygieneIssue } from "@/lib/analysis/types"
import type { ExplorerActivity, ExplorerOpportunity } from "@/lib/explorer/types"

const PLAY_ICONS: Record<string, ReactNode> = {
  "play-discovery": <Search className="size-4" />,
  "play-product-demo": <Monitor className="size-4" />,
  "play-architecture-review": <Layers className="size-4" />,
  "play-workshop": <Users className="size-4" />,
  "play-poc": <FlaskConical className="size-4" />,
}

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

function hygieneCountdown(isoDate: string, asOf: Date) {
  const days = daysUntil(isoDate, asOf)
  if (days < 0) return { days: 0, label: "Review is overdue." }
  if (days === 0) return { days: 0, label: "Review is due today." }
  if (days === 1) return { days: 1, label: "1 day until the next scheduled review." }
  return { days, label: `${days} days until the next scheduled review.` }
}

function OffPlaybookPanel({
  items,
  period,
  onOpen,
}: {
  items: HygieneIssue[]
  period: string
  onOpen: (query: string) => void
}) {
  return (
    <aside className="rounded-2xl bg-[#2B2A27] px-4 py-3 text-[#f3f2ee]">
      <p className="text-[11px] tracking-[0.16em] text-white/50 uppercase">Off-playbook activity</p>
      <p className="font-heading mt-0.5 text-lg leading-tight">Logged outside the standard plays</p>
      <p className="mt-1 text-[11px] text-white/50">
        Sales plays SCs recorded that are not in the five-play playbook. {period}.
      </p>
      <div className="mt-2 divide-y divide-white/10">
        {items.length === 0 ? (
          <p className="py-2 text-sm text-white/60">No off-playbook activity in the {period}.</p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.name)}
              className="flex w-full cursor-pointer items-start justify-between gap-3 py-2.5 text-left hover:bg-white/5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="mt-0.5 text-xs text-white/55">
                  {item.activityCount === 1
                    ? "1 call"
                    : `${formatCount(item.activityCount)} calls`}
                  {" · "}
                  {item.opportunityCount === 1
                    ? "1 opportunity"
                    : `${formatCount(item.opportunityCount)} opportunities`}
                  {item.lastAt ? ` · last ${item.lastAt}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-white/45">View</span>
            </button>
          ))
        )}
      </div>
    </aside>
  )
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
  const windowLower = periodTitleLower(analysis.filters.period)
  const offPlaybook = analysis.hygiene.filter((item) => item.kind === "undefined")
  const adherence = analysis.totals.definedActivities
    ? 1 - analysis.totals.exceptionActivities / analysis.totals.definedActivities
    : null
  const liftPlay = analysis.plays
    .filter((play) => play.win.confidence !== "insufficient" && play.win.difference !== null)
    .slice()
    .sort((a, b) => (b.win.difference ?? -1) - (a.win.difference ?? -1))[0]
  const lift = liftPlay?.win.difference ?? null
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
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-8 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-2 py-2.5">
        <div>
          <p className="font-heading text-xl leading-none">Playbook</p>
          <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Demo workspace</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs ring-1 ring-[#2B2A27]/10">
            <span className="size-2 rounded-full bg-[#D9893A]" />
            Gong
            <span className="text-muted-foreground">synced {formatRelativeAgo(new Date(sync.gongAt))}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs ring-1 ring-[#2B2A27]/10">
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

      <section>
        <h1 className="font-heading text-[1.75rem] leading-tight md:text-[2rem]">
          The <span className="text-[#D9893A]">playbook</span>
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Five standard plays. Click a card for success signals, signs of success, and who should be in the
          room.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {plays.map((play) => {
            const meta = details[play.id]
            return (
              <button
                key={play.id}
                type="button"
                onClick={() => open("play", { playId: play.id })}
                className="cursor-pointer rounded-2xl bg-white px-3 py-3 text-left transition-shadow hover:bg-[#f7f7f5] hover:shadow-sm hover:ring-1 hover:ring-[#2B2A27]/10"
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-[#EBEDF1] text-[#2B2A27]">
                    {PLAY_ICONS[play.id]}
                  </div>
                  <p className="font-medium">{play.name}</p>
                </div>
                {meta ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {meta.recommendedRoles.slice(0, 3).map((role) => (
                      <span key={role} className="rounded-full bg-[#EBEDF1] px-2 py-0.5 text-[10px]">
                        {role}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <div>
          <h2 className="font-heading text-xl">
            See <span className="text-[#D9893A]">exactly</span> what&apos;s happening
          </h2>
          <p className="mt-0.5 max-w-xl text-xs text-muted-foreground">
            Numbers below are for the {windowLower}.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white px-3 py-3">
              <p className="text-3xl font-medium tracking-tight">
                {adherence === null ? "—" : pct(adherence, 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                of calls followed every success signal
              </p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3">
              <p className="text-3xl font-medium tracking-tight">
                {lift === null ? "—" : `${percentPoints(lift, 0)}%`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {lift === null
                  ? `No supported win-rate comparison`
                  : `higher win rate when signals were present${liftPlay ? ` — ${liftPlay.playName}` : ""}`}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3">
              <p className="text-3xl font-medium tracking-tight">{formatCount(analysis.totals.activities)}</p>
              <p className="mt-1 text-xs text-muted-foreground">calls logged</p>
            </div>
          </div>
        </div>

        <OffPlaybookPanel
          items={offPlaybook}
          period={windowLower}
          onOpen={(query) => open("explorer", { q: query })}
        />
      </section>

      <PlaySignalSection analysis={analysis} details={details} />

      <section className="mt-5 grid gap-3 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-3">
          <h2 className="font-heading text-xl">Sales play performance over time</h2>
          <p className="mb-2 text-xs text-muted-foreground">
            Win rate, exception rate, and cycle time from the {windowLower} — not a static snapshot.
          </p>
          <PerformanceTrendChart analysis={analysis} />
        </div>
        <div className="rounded-2xl bg-white p-3">
          <h2 className="font-heading text-xl">When the playbook is followed</h2>
          <p className="mb-2 text-xs text-muted-foreground">
            Closed deals in the {windowLower}. Teal: every success signal present. Amber: at least one
            missing.
          </p>
          <OutcomeChart analysis={analysis} />
        </div>
      </section>

      <section className="mt-5 rounded-2xl bg-white">
        <div className="px-3 pt-3">
          <h2 className="font-heading text-xl">Sales play performance</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            The same {windowLower} window. Click a play name to open its signals.
          </p>
        </div>
        <div className="mt-1 overflow-x-auto">
          <PlayPerformanceTable
            plays={analysis.plays}
            onPlayClick={(playId) => open("play", { playId })}
          />
        </div>
      </section>

      <section className="mt-5 rounded-2xl bg-[#2B2A27] px-3 py-3 text-[#f3f2ee]">
        <h2 className="font-heading text-xl">Playbook hygiene</h2>
        <p className="mt-0.5 text-xs text-white/55">
          A fuller ring means the next review is closer. Number is days left. Soonest first.
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
  )
}
