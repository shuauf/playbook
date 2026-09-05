"use client"

import { useMemo, useState, useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatIsoDate } from "@/lib/dates"
import { PIPELINE_STAGES, type PrerequisiteStatus } from "@/lib/domain/types"
import type { ExplorerActivity, ExplorerOpportunity } from "@/lib/explorer/types"
import { matchesSearch, prerequisiteRollupLabel } from "@/lib/explorer/search"
import { recordActivityAction, savePlayAction } from "@/lib/playbook/actions"
import type { PlayDetail } from "@/lib/db/catalog"
import { cn } from "@/lib/utils"

export type PlayDefinition = {
  id: string
  status: string
  name: string
  description: string
  typicalStages: string[]
  prerequisites: Array<{ key: string; text: string }>
}

export type PersonChoice = {
  id: string
  name: string
  role: string
}

export type OpportunityChoice = {
  id: string
  name: string
  account: string
  stage: string
  outcome: string
  seName: string
  aeName: string
  team: string
  segment: string
}

function ModalShell({
  title,
  subtitle,
  onClose,
  wide,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#2B2A27]/40 p-4 pt-10">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "mx-auto rounded-2xl bg-white shadow-xl ring-1 ring-black/5",
          wide ? "max-w-5xl" : "max-w-2xl"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-heading text-2xl leading-tight">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

function RoleChips({ roles }: { roles: string[] }) {
  if (roles.length === 0) {
    return <p className="text-sm text-muted-foreground">No recommended roles yet.</p>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <span key={role} className="rounded-full bg-[#EBEDF1] px-2.5 py-1 text-xs text-[#2B2A27]">
          {role}
        </span>
      ))}
    </div>
  )
}

export function PlayModal({
  play,
  detail,
  onClose,
}: {
  play: PlayDefinition
  detail?: PlayDetail
  onClose: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(play.name)
  const [description, setDescription] = useState(play.description)
  const [signals, setSignals] = useState(play.prerequisites)
  const [signs, setSigns] = useState(detail?.signsOfSuccess.map((item) => item.text) ?? [""])
  const [rolesText, setRolesText] = useState((detail?.recommendedRoles ?? []).join(", "))
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const roles = rolesText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

  function submit() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await savePlayAction(play.id, {
        name,
        description,
        typicalStages: play.typicalStages,
        prerequisites: signals.filter((item) => item.text.trim()),
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMessage(result.changed ? "Saved a new play version for future activities." : "Saved.")
      router.refresh()
    })
  }

  return (
    <ModalShell
      title={play.name}
      subtitle="Two lists: what we think helps the play work, and what tells us it actually did."
      onClose={onClose}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[#EBEDF1] px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Owner</p>
          <p className="text-sm font-medium">{detail?.owner ?? "Solutions Engineering"}</p>
        </div>
        <div className="rounded-xl bg-[#EBEDF1] px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Next refresh</p>
          <p className="text-sm font-medium">
            {detail
              ? new Date(`${detail.nextReview}T00:00:00`).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[11px] text-muted-foreground">Recommended roles in the meeting</p>
        <div className="mt-1.5">
          <RoleChips roles={roles} />
        </div>
        <Input
          className="mt-2"
          value={rolesText}
          onChange={(event) => setRolesText(event.target.value)}
          placeholder="AE, SC, Champion"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">Type names separated by commas. Each one becomes its own tag.</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="play-name">Name</Label>
        <Input id="play-name" value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className="mt-3 grid gap-2">
        <Label htmlFor="play-description">Description</Label>
        <Textarea
          id="play-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-border p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <Label>Success signals</Label>
            <p className="text-[11px] text-muted-foreground">
              Things we believe make the play likely to succeed — not requirements to gate on.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSignals((current) => [...current, { key: "", text: "" }])}
          >
            Add signal
          </Button>
        </div>
        <ol className="space-y-2">
          {signals.map((item, index) => (
            <li key={`${item.key}-${index}`} className="flex items-start gap-2">
              <Input
                value={item.text}
                onChange={(event) =>
                  setSignals((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, text: event.target.value } : entry
                    )
                  )
                }
                placeholder="The business problem is understood"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setSignals((current) => current.filter((_, entryIndex) => entryIndex !== index))}
              >
                ×
              </Button>
            </li>
          ))}
        </ol>
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="rounded-full bg-[#EBEDF1] px-2 py-0.5">detected via Gong</span>
          Shown as if Gong tagged whether each signal was present.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-border p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <Label>Signs of success</Label>
            <p className="text-[11px] text-muted-foreground">
              Outcome indicators — signs the play actually went well, not preconditions to start it.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setSigns((current) => [...current, ""])}>
            Add sign
          </Button>
        </div>
        <ol className="space-y-2">
          {signs.map((item, index) => (
            <li key={`sign-${index}`} className="flex items-start gap-2">
              <Input
                value={item}
                onChange={(event) =>
                  setSigns((current) =>
                    current.map((entry, entryIndex) => (entryIndex === index ? event.target.value : entry))
                  )
                }
                placeholder="Customer articulated their own definition of the problem back to us"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setSigns((current) => current.filter((_, entryIndex) => entryIndex !== index))}
              >
                ×
              </Button>
            </li>
          ))}
        </ol>
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      <div className="mt-4">
        <Button onClick={submit} disabled={pending}>
          Save new version
        </Button>
      </div>
    </ModalShell>
  )
}

export function ExplorerModal({
  activities,
  opportunities,
  initialOpportunityId,
  onClose,
}: {
  activities: ExplorerActivity[]
  opportunities: ExplorerOpportunity[]
  initialOpportunityId?: string
  onClose: () => void
}) {
  const [view, setView] = useState<"all" | "opportunity">("all")
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<string | null>(initialOpportunityId ?? null)

  const filteredActivities = useMemo(
    () =>
      activities
        .filter((row) =>
          matchesSearch([row.opportunityName, row.account, row.playName, row.seName], query)
        )
        .slice(0, 80),
    [activities, query]
  )

  const grouped = useMemo(() => {
    const byOpp = new Map<string, ExplorerActivity[]>()
    for (const activity of filteredActivities) {
      const list = byOpp.get(activity.opportunityId) ?? []
      list.push(activity)
      byOpp.set(activity.opportunityId, list)
    }
    return opportunities
      .filter((opportunity) => byOpp.has(opportunity.id))
      .slice(0, 50)
      .map((opportunity) => ({
        opportunity,
        activities: byOpp.get(opportunity.id) ?? [],
      }))
  }, [filteredActivities, opportunities])

  return (
    <ModalShell
      title="Activity explorer"
      subtitle="See exactly what's happening across logged plays and opportunities."
      onClose={onClose}
      wide
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-border bg-white p-0.5">
          <button
            type="button"
            className={cn(
              "rounded-full px-3 py-1 text-xs",
              view === "all" ? "bg-[#2B2A27] text-white" : "cursor-pointer text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setView("all")}
          >
            All activities
          </button>
          <button
            type="button"
            className={cn(
              "rounded-full px-3 py-1 text-xs",
              view === "opportunity" ? "bg-[#2B2A27] text-white" : "cursor-pointer text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setView("opportunity")}
          >
            By opportunity
          </button>
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search account, play, or SC"
          className="max-w-xs"
        />
      </div>

      {view === "all" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Opportunity</th>
                <th className="pb-2 font-medium">Play</th>
                <th className="pb-2 font-medium">SC</th>
                <th className="pb-2 font-medium">Signals</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredActivities.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 whitespace-nowrap">{row.date}</td>
                  <td className="py-2">{row.opportunityName}</td>
                  <td className="py-2">{row.playName}</td>
                  <td className="py-2">{row.seName}</td>
                  <td className="py-2 text-muted-foreground">
                    {prerequisiteRollupLabel(row.allPrerequisitesMet, row.unmetCount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="divide-y">
          {grouped.map(({ opportunity, activities: rows }) => {
            const open = expanded === opportunity.id
            return (
              <div key={opportunity.id}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between gap-3 py-3 text-left hover:bg-[#EBEDF1]"
                  onClick={() => setExpanded(open ? null : opportunity.id)}
                >
                  <div>
                    <p className="font-medium">{opportunity.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {opportunity.account} · {opportunity.seName} · {opportunity.outcome}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{rows.length} plays</span>
                </button>
                {open ? (
                  <ul className="mb-3 ml-4 space-y-1 border-l border-border pl-4">
                    {rows.map((row) => (
                      <li key={row.id} className="text-sm">
                        <span className="font-medium">{row.playName}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {row.date} · {prerequisiteRollupLabel(row.allPrerequisitesMet, row.unmetCount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </ModalShell>
  )
}

const OTHER_PLAY = "other"

export function LogActivityModal({
  opportunities,
  plays,
  people,
  onClose,
}: {
  opportunities: OpportunityChoice[]
  plays: PlayDefinition[]
  people: PersonChoice[]
  onClose: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [opportunityQuery, setOpportunityQuery] = useState("")
  const [opportunityId, setOpportunityId] = useState("")
  const [playId, setPlayId] = useState(plays.find((play) => play.status === "active")?.id ?? OTHER_PLAY)
  const [otherName, setOtherName] = useState("")
  const [loggedBy, setLoggedBy] = useState("")
  const [activityDate, setActivityDate] = useState(formatIsoDate(new Date()))
  const [stage, setStage] = useState("")
  const [checks, setChecks] = useState<Record<string, PrerequisiteStatus | "">>({})
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)

  const selectedOpportunity = opportunities.find((item) => item.id === opportunityId)
  const selectedPlay = plays.find((item) => item.id === playId)
  const isOther = playId === OTHER_PLAY
  const sePeople = people.filter((person) => person.role === "se")
  const matches = useMemo(
    () =>
      opportunities
        .filter((item) =>
          matchesSearch([item.name, item.account, item.seName, item.aeName], opportunityQuery)
        )
        .slice(0, 10),
    [opportunities, opportunityQuery]
  )

  function submit() {
    setError(null)
    if (!selectedOpportunity) {
      setError("Select an opportunity.")
      return
    }
    if (isOther && !otherName.trim()) {
      setError("Name the non-standard play.")
      return
    }
    if (isOther && !loggedBy.trim()) {
      setError("Say who logged this non-standard play.")
      return
    }
    if (!isOther && selectedPlay) {
      const missing = selectedPlay.prerequisites.some((item) => !checks[item.key])
      if (missing) {
        setError("Mark every success signal as Met or Not Met.")
        return
      }
    }

    startTransition(async () => {
      const result = await recordActivityAction({
        opportunityId: selectedOpportunity.id,
        activityDate,
        stageAtActivity: stage || selectedOpportunity.stage,
        seName: isOther ? loggedBy : loggedBy || selectedOpportunity.seName,
        note,
        capture: isOther
          ? {
              kind: "undefined",
              name: otherName,
              description: `Non-standard play logged by ${loggedBy}.`,
            }
          : {
              kind: "defined",
              playId,
              checks: (selectedPlay?.prerequisites ?? []).map((item) => ({
                key: item.key,
                status: checks[item.key] ?? "",
              })),
            },
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <ModalShell
      title="Log activity"
      subtitle="Record a play against an opportunity. Non-standard plays surface in Needs a look."
      onClose={onClose}
    >
      {selectedOpportunity ? (
        <div className="mb-4 rounded-xl border border-border px-3 py-2">
          <p className="font-medium">{selectedOpportunity.name}</p>
          <p className="text-xs text-muted-foreground">
            {selectedOpportunity.account} · {selectedOpportunity.outcome} · {selectedOpportunity.seName}
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setOpportunityId("")}>
            Change
          </Button>
        </div>
      ) : (
        <div className="mb-4 grid gap-2">
          <Label htmlFor="opp-search">Opportunity</Label>
          <Input
            id="opp-search"
            value={opportunityQuery}
            onChange={(event) => setOpportunityQuery(event.target.value)}
            placeholder="Account or opportunity"
          />
          <ul className="divide-y rounded-xl border border-border">
            {matches.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-[#EBEDF1]"
                  onClick={() => {
                    setOpportunityId(item.id)
                    if (!loggedBy) setLoggedBy(item.seName)
                    if (!stage) setStage(item.stage)
                  }}
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.account} · {item.outcome}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="play">Play</Label>
          <select
            id="play"
            value={playId}
            onChange={(event) => {
              setPlayId(event.target.value)
              setChecks({})
            }}
            className="h-8 rounded-full border border-input bg-white px-3 text-sm"
          >
            {plays
              .filter((play) => play.status === "active")
              .map((play) => (
                <option key={play.id} value={play.id}>
                  {play.name}
                </option>
              ))}
            <option value={OTHER_PLAY}>Other / non-standard</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="logged-by">SC / rep</Label>
          <select
            id="logged-by"
            value={loggedBy}
            onChange={(event) => setLoggedBy(event.target.value)}
            className="h-8 rounded-full border border-input bg-white px-3 text-sm"
          >
            <option value="">Select who logged it</option>
            {sePeople.map((person) => (
              <option key={person.id} value={person.name}>
                {person.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isOther ? (
        <div className="mt-3 grid gap-2">
          <Label htmlFor="other-name">Non-standard play name</Label>
          <Input
            id="other-name"
            value={otherName}
            onChange={(event) => setOtherName(event.target.value)}
            placeholder="Executive workflow audit"
          />
        </div>
      ) : (
        <fieldset className="mt-4 space-y-2">
          <legend className="text-sm font-medium">Success signals</legend>
          <p className="text-xs text-muted-foreground">
            Mark whether each observed pattern was present. These are not requirements to gate on.
          </p>
          {(selectedPlay?.prerequisites ?? []).map((item) => {
            const value = checks[item.key] ?? ""
            return (
              <div key={item.key} className="rounded-xl border border-border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm">{item.text}</p>
                  <span className="rounded-full bg-[#EBEDF1] px-2 py-0.5 text-[10px] text-muted-foreground">
                    detected via Gong
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={value === "met" ? "default" : "outline"}
                    onClick={() => setChecks((current) => ({ ...current, [item.key]: "met" }))}
                  >
                    Met
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={value === "not_met" ? "default" : "outline"}
                    onClick={() => setChecks((current) => ({ ...current, [item.key]: "not_met" }))}
                  >
                    Not met
                  </Button>
                </div>
              </div>
            )
          })}
        </fieldset>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="activity-date">Date</Label>
          <Input
            id="activity-date"
            type="date"
            value={activityDate}
            onChange={(event) => setActivityDate(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="stage">Stage</Label>
          <select
            id="stage"
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            className="h-8 rounded-full border border-input bg-white px-3 text-sm"
          >
            <option value="">Select stage</option>
            {PIPELINE_STAGES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedOpportunity ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Opportunity outcome: {selectedOpportunity.outcome}
          {selectedOpportunity.outcome === "open" ? " — still in cycle." : " — already closed."}
        </p>
      ) : null}

      <div className="mt-3 grid gap-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea id="note" value={note} onChange={(event) => setNote(event.target.value)} />
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <div className="mt-4">
        <Button onClick={submit} disabled={pending}>
          Save activity
        </Button>
      </div>
    </ModalShell>
  )
}
