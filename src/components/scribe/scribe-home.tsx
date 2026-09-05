"use client"

import { useRouter } from "next/navigation"
import { FlaskConical, Layers, Monitor, Search, Users } from "lucide-react"
import type { ReactNode } from "react"

import { PlayPerformanceTable } from "@/components/health-table"
import { OutcomeChart } from "@/components/scribe/outcome-chart"
import {
  ExplorerModal,
  LogActivityModal,
  PlayModal,
  type OpportunityChoice,
  type PersonChoice,
  type PlayDefinition,
} from "@/components/scribe/modals"
import { PlaySignalSection } from "@/components/scribe/signal-charts"
import { daysUntil } from "@/lib/dates"
import { formatCount, pct, periodTitleLower, percentPoints } from "@/lib/format"
import type { PlayDetail } from "@/lib/db/catalog"
import type { HealthAnalysis } from "@/lib/analysis/types"
import type { ExplorerActivity, ExplorerOpportunity } from "@/lib/explorer/types"

const PLAY_ICONS: Record<string, ReactNode> = {
  "play-discovery": <Search className="size-5" />,
  "play-product-demo": <Monitor className="size-5" />,
  "play-architecture-review": <Layers className="size-5" />,
  "play-workshop": <Users className="size-5" />,
  "play-poc": <FlaskConical className="size-5" />,
}

type LookItem = {
  id: string
  title: string
  detail: string
  score: number
  scoreLabel: string
  tone: "amber" | "teal"
}

function ScoreRing({ value, tone }: { value: number; tone: "amber" | "teal" }) {
  const shown = Math.min(99, Math.max(0, Math.round(value)))
  const radius = 15
  const circumference = 2 * Math.PI * radius
  const dash = (shown / 100) * circumference
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

function needsALook(analysis: HealthAnalysis): LookItem[] {
  const items: LookItem[] = []
  for (const issue of analysis.hygiene.filter((item) => item.kind === "undefined")) {
    items.push({
      id: issue.id,
      title: issue.name,
      detail:
        issue.activityCount === 1
          ? "SCs logged this once outside the five standard plays. It is not in the playbook yet."
          : `SCs logged this ${issue.activityCount} times outside the five standard plays. It is not in the playbook yet.`,
      score: Math.min(99, issue.activityCount),
      scoreLabel: issue.activityCount === 1 ? "logged once" : "times logged",
      tone: "amber",
    })
  }
  for (const action of analysis.actions) {
    if (items.some((item) => item.title === action.subject)) continue
    const play = analysis.plays.find((item) => item.playId === action.playId)
    const signal = analysis.prerequisites.find(
      (item) => action.playId !== null && item.playId === action.playId && item.text === action.subject
    )
    const score =
      action.classification === "enforce" && play?.win.difference
        ? percentPoints(play.win.difference, 0)
        : action.classification === "enforce" && signal?.win.difference
          ? percentPoints(signal.win.difference, 0)
          : action.classification === "revisit" && signal?.unmetRate
            ? percentPoints(signal.unmetRate, 0)
            : action.classification === "define"
              ? action.sampleSize
              : action.classification === "investigate"
                ? action.sampleSize
                : play?.exceptionRate
                  ? percentPoints(play.exceptionRate, 0)
                  : 50
    items.push({
      id: action.id,
      title: action.subject,
      detail: action.evidence,
      score,
      scoreLabel:
        action.classification === "enforce"
          ? "win-rate drop"
          : action.classification === "revisit"
            ? "often skipped"
            : action.classification === "investigate"
              ? "closed deals"
              : action.classification === "define"
                ? "times logged"
                : "skipped share",
      tone: action.classification === "revisit" || action.classification === "monitor" ? "teal" : "amber",
    })
  }
  return items.slice(0, 4)
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
}) {
  const router = useRouter()
  const lookItems = needsALook(analysis)
  const windowLower = periodTitleLower(analysis.filters.period)
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
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-12 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div>
          <p className="font-heading text-xl leading-none">Scribe</p>
          <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Optimize</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs ring-1 ring-[#2B2A27]/10">
            <span className="size-2 rounded-full bg-[#D9893A]" />
            Gong
            <span className="text-muted-foreground">synced 4 min ago</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs ring-1 ring-[#2B2A27]/10">
            <span className="size-2 rounded-full bg-[#3D8B8B]" />
            Salesforce
            <span className="text-muted-foreground">synced 2 min ago</span>
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
        <h1 className="font-heading text-[2rem] leading-tight md:text-[2.35rem]">
          The <span className="text-[#D9893A]">playbook</span>
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Five standard plays. Click a card to see success signals, signs of success, and who should be in
          the room.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {plays.map((play) => {
            const meta = details[play.id]
            return (
              <button
                key={play.id}
                type="button"
                onClick={() => open("play", { playId: play.id })}
                className="cursor-pointer rounded-2xl bg-white px-4 py-4 text-left transition-shadow hover:bg-[#f7f7f5] hover:shadow-sm hover:ring-1 hover:ring-[#2B2A27]/10"
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-[#EBEDF1] text-[#2B2A27]">
                  {PLAY_ICONS[play.id]}
                </div>
                <p className="mt-3 font-medium">{play.name}</p>
                <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{play.description}</p>
                {meta ? (
                  <div className="mt-3 flex flex-wrap gap-1">
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

      <section className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <div>
          <h2 className="font-heading text-2xl">
            See <span className="text-[#D9893A]">exactly</span> what&apos;s happening
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Numbers below are for the {windowLower}. Know exactly what to fix — and scale the best ways of
            working.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-4xl font-medium tracking-tight">
                {adherence === null ? "—" : pct(adherence, 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                of calls in the {windowLower} followed every success signal
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-4xl font-medium tracking-tight">
                {lift === null ? "—" : `${percentPoints(lift, 0)}%`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {lift === null
                  ? `No supported win-rate comparison in the ${windowLower}`
                  : `higher win rate when success signals were present${liftPlay ? ` — strongest on ${liftPlay.playName}` : ""}`}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-4xl font-medium tracking-tight">{formatCount(analysis.totals.activities)}</p>
              <p className="mt-1 text-xs text-muted-foreground">calls logged in the {windowLower}</p>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl bg-[#2B2A27] px-4 py-4 text-[#f3f2ee]">
          <p className="text-[11px] tracking-[0.16em] text-white/50 uppercase">Needs a look</p>
          <p className="font-heading mt-1 text-xl">Know exactly what to fix</p>
          <div className="mt-3 divide-y divide-white/10">
            {lookItems.length === 0 ? (
              <p className="py-3 text-sm text-white/60">Nothing flagged in the {windowLower}.</p>
            ) : (
              lookItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <ScoreRing value={item.score} tone={item.tone} />
                    <span className="max-w-[4.5rem] text-center text-[9px] leading-tight text-white/45">
                      {item.scoreLabel}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-white/55">{item.detail}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>

      <PlaySignalSection analysis={analysis} details={details} />

      <section className="mt-8 rounded-2xl bg-white p-4">
        <h2 className="font-heading text-2xl">Win rate when the playbook is followed</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Closed deals in the {windowLower}. Teal is when every success signal was present. Amber is when at
          least one was missing. Hollow marks mean we do not have enough closed deals yet.
        </p>
        <OutcomeChart analysis={analysis} />
      </section>

      <section className="mt-8 rounded-2xl bg-white">
        <div className="px-4 pt-4">
          <h2 className="font-heading text-2xl">Sales play performance</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The same {windowLower} window. Click a play name to open its signals and signs of success.
          </p>
        </div>
        <div className="mt-2 overflow-x-auto">
          <PlayPerformanceTable
            plays={analysis.plays}
            onPlayClick={(playId) => open("play", { playId })}
          />
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-[#2B2A27] px-4 py-4 text-[#f3f2ee]">
        <h2 className="font-heading text-2xl">Playbook hygiene</h2>
        <p className="mt-1 text-sm text-white/55">
          Who owns each play, and how many days remain until the next scheduled review. Soonest first.
        </p>
        <div className="mt-4 divide-y divide-white/10">
          {hygieneRows.map(({ play, meta, countdown }) => (
            <button
              key={play.id}
              type="button"
              onClick={() => open("play", { playId: play.id })}
              className="flex w-full cursor-pointer items-center gap-3 py-3 text-left hover:bg-white/5"
            >
              <div className="flex flex-col items-center gap-0.5">
                <ScoreRing value={Math.min(99, countdown.days)} tone={countdown.days <= 45 ? "amber" : "teal"} />
                <span className="text-[9px] text-white/45">days left</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{play.name}</p>
                <p className="text-xs text-white/55">
                  Owned by {meta?.owner ?? "Solutions Engineering"}. {countdown.label}
                </p>
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
          onClose={close}
        />
      ) : null}
      {initialModal === "log" ? (
        <LogActivityModal opportunities={opportunities} plays={plays} people={people} onClose={close} />
      ) : null}
    </div>
  )
}
