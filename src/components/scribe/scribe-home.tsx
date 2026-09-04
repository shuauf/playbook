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
import { SignalFrequencyChart, SignalTrendChart } from "@/components/scribe/signal-charts"
import { formatCount, pct, pp } from "@/lib/format"
import type { PlayHygiene } from "@/lib/db/catalog"
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
  tone: "amber" | "teal"
}

function ScoreRing({ value, tone }: { value: number; tone: "amber" | "teal" }) {
  const radius = 15
  const circumference = 2 * Math.PI * radius
  const dash = (Math.min(100, Math.max(0, value)) / 100) * circumference
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
        {Math.round(value)}
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
      detail: `Off-playbook · ${issue.activityCount === 1 ? "1 logged activity" : `${issue.activityCount} logged activities`}`,
      score: Math.min(96, 52 + issue.activityCount),
      tone: "amber",
    })
  }
  for (const action of analysis.actions) {
    if (items.some((item) => item.title === action.subject)) continue
    items.push({
      id: action.id,
      title: action.subject,
      detail: action.evidence,
      score:
        action.classification === "enforce"
          ? 88
          : action.classification === "define"
            ? 76
            : action.classification === "investigate"
              ? 64
              : 54,
      tone: action.classification === "revisit" || action.classification === "monitor" ? "teal" : "amber",
    })
  }
  return items.slice(0, 4)
}

function formatReview(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function ScribeHome({
  analysis,
  plays,
  hygiene,
  explorer,
  people,
  opportunities,
  initialModal,
  initialPlayId,
  initialOpportunityId,
}: {
  analysis: HealthAnalysis
  plays: PlayDefinition[]
  hygiene: Record<string, PlayHygiene>
  explorer: { activities: ExplorerActivity[]; opportunities: ExplorerOpportunity[] }
  people: PersonChoice[]
  opportunities: OpportunityChoice[]
  initialModal?: string
  initialPlayId?: string
  initialOpportunityId?: string
}) {
  const router = useRouter()
  const lookItems = needsALook(analysis)
  const adherence = analysis.totals.definedActivities
    ? 1 - analysis.totals.exceptionActivities / analysis.totals.definedActivities
    : null
  const liftPlay = analysis.plays
    .filter((play) => play.win.confidence !== "insufficient" && play.win.difference !== null)
    .slice()
    .sort((a, b) => (b.win.difference ?? -1) - (a.win.difference ?? -1))[0]
  const lift = liftPlay?.win.difference ?? null
  const selectedPlay = plays.find((play) => play.id === initialPlayId) ?? plays[0]

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
          <button
            type="button"
            onClick={() => open("explorer")}
            className="rounded-full border border-[#2B2A27]/20 bg-white px-4 py-1.5 text-sm"
          >
            Activity explorer
          </button>
          <button
            type="button"
            onClick={() => open("log")}
            className="rounded-full bg-[#2B2A27] px-4 py-1.5 text-sm text-white"
          >
            Log activity
          </button>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <div>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h1 className="font-heading text-[2rem] leading-tight md:text-[2.35rem]">
                See <span className="text-[#D9893A]">exactly</span> what&apos;s happening
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Know exactly what to fix — and scale the best ways of working.
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Gong · synced 4 min ago
              <span className="mx-2 text-[#c5c7cc]">·</span>
              Salesforce · synced 2 min ago
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-4xl font-medium tracking-tight">
                {adherence === null ? "—" : pct(adherence, 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Adherence this period</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-4xl font-medium tracking-tight">{lift === null ? "—" : pp(lift, 0)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Win-rate lift when signals are present</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-4xl font-medium tracking-tight">{formatCount(analysis.totals.activities)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Calls processed this period</p>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl bg-[#2B2A27] px-4 py-4 text-[#f3f2ee]">
          <p className="text-[11px] tracking-[0.16em] text-white/50 uppercase">Needs a look</p>
          <p className="font-heading mt-1 text-xl">Know exactly what to fix</p>
          <div className="mt-3 divide-y divide-white/10">
            {lookItems.length === 0 ? (
              <p className="py-3 text-sm text-white/60">Nothing flagged in this period.</p>
            ) : (
              lookItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-3">
                  <ScoreRing value={item.score} tone={item.tone} />
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

      <section className="mt-8">
        <h2 className="font-heading text-2xl">The playbook</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Five standard plays. Click a card to see success signals, criteria, and who owns the next refresh.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {plays.map((play) => (
            <button
              key={play.id}
              type="button"
              onClick={() => open("play", { playId: play.id })}
              className="rounded-2xl bg-white px-4 py-4 text-left transition-shadow hover:shadow-sm"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-[#EBEDF1] text-[#2B2A27]">
                {PLAY_ICONS[play.id]}
              </div>
              <p className="mt-3 font-medium">{play.name}</p>
              <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{play.description}</p>
              <p className="mt-3 text-[11px] text-muted-foreground">
                {hygiene[play.id]?.owner ?? "Solutions Engineering"}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-heading text-2xl">Gong-sourced success criteria</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Calls where these patterns were present tended to go better. Results are shown as if Gong call
          intelligence populated them — no live integration in this demo.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-4">
            <h3 className="text-sm font-medium">How often each criterion is met</h3>
            <p className="mb-3 text-[11px] text-muted-foreground">Recent defined calls in this period</p>
            <SignalFrequencyChart rows={analysis.signalFrequencies} />
          </div>
          <div className="rounded-2xl bg-white p-4">
            <h3 className="text-sm font-medium">Criteria-met rate over time</h3>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Share of calls where every success signal was present
            </p>
            <SignalTrendChart points={analysis.signalTrend} />
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-4">
        <h2 className="font-heading text-2xl">
          {analysis.plays.length > 0 ? "Win rate when the playbook is followed" : "Outcomes"}
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Closed opportunities only. Hollow marks mean insufficient data. Same comparison, sliced by play
          or missing signal, and by win rate or cycle time.
        </p>
        <OutcomeChart analysis={analysis} />
      </section>

      <section className="mt-8 rounded-2xl bg-white">
        <div className="px-4 pt-4">
          <h2 className="font-heading text-2xl">Sales play performance</h2>
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
          A brand-new playbook. Ownership and the next scheduled refresh — not analysis.
        </p>
        <div className="mt-4 divide-y divide-white/10">
          {plays.map((play) => {
            const meta = hygiene[play.id]
            const finding = analysis.plays.find((item) => item.playId === play.id)
            const score = Math.round((1 - (finding?.exceptionRate ?? 0)) * 100)
            return (
              <button
                key={play.id}
                type="button"
                onClick={() => open("play", { playId: play.id })}
                className="flex w-full items-center gap-3 py-3 text-left"
              >
                <ScoreRing value={score} tone={score < 75 ? "amber" : "teal"} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{play.name}</p>
                  <p className="text-xs text-white/55">
                    {meta?.owner ?? "Solutions Engineering"}
                    {meta ? ` · next refresh ${formatReview(meta.nextReview)}` : ""}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {initialModal === "play" && selectedPlay ? (
        <PlayModal play={selectedPlay} hygiene={hygiene[selectedPlay.id]} onClose={close} />
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
