"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PIPELINE_STAGES, type PrerequisiteStatus } from "@/lib/domain/types"
import { matchesSearch } from "@/lib/explorer/search"
import { formatIsoDate } from "@/lib/dates"
import { recordActivityAction } from "@/lib/playbook/actions"
import { cn } from "@/lib/utils"

type OpportunityChoice = {
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

type PlayChoice = {
  id: string
  status: string
  name: string
  typicalStages: string[]
  prerequisites: Array<{ key: string; text: string }>
}

type PersonChoice = {
  id: string
  name: string
  role: string
}

const UNDEFINED_PLAY = "undefined"

export function AddActivityForm({
  opportunities,
  plays,
  people,
  initialOpportunityId,
}: {
  opportunities: OpportunityChoice[]
  plays: PlayChoice[]
  people: PersonChoice[]
  initialOpportunityId?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [opportunityQuery, setOpportunityQuery] = useState("")
  const [opportunityId, setOpportunityId] = useState(initialOpportunityId ?? "")
  const [playId, setPlayId] = useState(plays.find((play) => play.status === "active")?.id ?? UNDEFINED_PLAY)
  const [undefinedName, setUndefinedName] = useState("")
  const [undefinedDescription, setUndefinedDescription] = useState("")
  const [activityDate, setActivityDate] = useState(formatIsoDate(new Date()))
  const initialOpportunity = opportunities.find((item) => item.id === initialOpportunityId)
  const [stage, setStage] = useState(
    initialOpportunity && (PIPELINE_STAGES as readonly string[]).includes(initialOpportunity.stage)
      ? initialOpportunity.stage
      : ""
  )
  const [seName, setSeName] = useState(initialOpportunity?.seName ?? "")
  const [note, setNote] = useState("")
  const [checks, setChecks] = useState<Record<string, PrerequisiteStatus | "">>({})
  const [error, setError] = useState<string | null>(null)

  const selectedOpportunity = opportunities.find((item) => item.id === opportunityId)
  const selectedPlay = plays.find((item) => item.id === playId)
  const sePeople = people.filter((person) => person.role === "se")
  const activePlays = plays.filter((play) => play.status === "active")
  const isUndefined = playId === UNDEFINED_PLAY

  const opportunityMatches = useMemo(() => {
    return opportunities
      .filter((item) =>
        matchesSearch([item.name, item.account, item.seName, item.aeName, item.team], opportunityQuery)
      )
      .slice(0, 12)
  }, [opportunities, opportunityQuery])

  function selectOpportunity(id: string) {
    const opportunity = opportunities.find((item) => item.id === id)
    setOpportunityId(id)
    setOpportunityQuery("")
    if (!opportunity) return
    if (!seName) setSeName(opportunity.seName)
    if (!stage && (PIPELINE_STAGES as readonly string[]).includes(opportunity.stage)) {
      setStage(opportunity.stage)
    }
  }

  function setCheck(key: string, status: PrerequisiteStatus) {
    setChecks((current) => ({ ...current, [key]: status }))
  }

  function submit() {
    setError(null)
    if (!selectedOpportunity) {
      setError("Select an opportunity.")
      return
    }
    if (isUndefined && !undefinedName.trim()) {
      setError("Name the undefined activity type.")
      return
    }
    if (!isUndefined && selectedPlay) {
      const missing = selectedPlay.prerequisites.some((item) => !checks[item.key])
      if (missing) {
        setError("Mark every recommended prerequisite as Met or Not Met.")
        return
      }
    }

    startTransition(async () => {
      const result = await recordActivityAction({
        opportunityId: selectedOpportunity.id,
        activityDate,
        stageAtActivity: stage,
        seName: seName || selectedOpportunity.seName,
        note,
        capture: isUndefined
          ? { kind: "undefined", name: undefinedName, description: undefinedDescription }
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
      router.push(`/activity/activities/${result.id}`)
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>1. Opportunity</CardTitle>
          <CardDescription>
            Find the account or opportunity this sales activity belongs to.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedOpportunity ? (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <p className="font-medium">{selectedOpportunity.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedOpportunity.account} · {selectedOpportunity.seName} with{" "}
                  {selectedOpportunity.aeName} · {selectedOpportunity.team} ·{" "}
                  {selectedOpportunity.stage}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpportunityId("")}>
                Change
              </Button>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="opportunity-search">Look up opportunity</Label>
              <Input
                id="opportunity-search"
                value={opportunityQuery}
                onChange={(event) => setOpportunityQuery(event.target.value)}
                placeholder="Account, opportunity, SE, or AE"
              />
              <ul className="divide-y rounded-lg border border-border">
                {opportunityMatches.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground">No matching opportunities.</li>
                ) : (
                  opportunityMatches.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-muted/60"
                        onClick={() => selectOpportunity(item.id)}
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.account} · {item.seName} · {item.outcome}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>2. What happened</CardTitle>
          <CardDescription>
            Use a defined sales play, or log an undefined type. Undefined work is not evaluated
            against recommended prerequisites.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="play">Sales play</Label>
            <select
              id="play"
              value={playId}
              onChange={(event) => {
                const nextPlayId = event.target.value
                setPlayId(nextPlayId)
                setChecks({})
                if (!stage) {
                  const play = plays.find((item) => item.id === nextPlayId)
                  if (play?.typicalStages[0]) setStage(play.typicalStages[0])
                }
              }}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {activePlays.map((play) => (
                <option key={play.id} value={play.id}>
                  {play.name}
                </option>
              ))}
              <option value={UNDEFINED_PLAY}>This is not a defined play</option>
            </select>
          </div>

          {isUndefined ? (
            <div className="space-y-3 rounded-lg border border-border bg-card/60 p-3">
              <p className="text-sm text-muted-foreground">
                There are no recommended prerequisites to evaluate. This non-standard play will
                surface under Off-playbook activity. Mapping it later will not invent historical
                snapshots.
              </p>
              <div className="grid gap-2">
                <Label htmlFor="undefined-name">Activity type</Label>
                <Input
                  id="undefined-name"
                  value={undefinedName}
                  onChange={(event) => setUndefinedName(event.target.value)}
                  placeholder="Executive workflow audit"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="undefined-description">Description (optional)</Label>
                <Textarea
                  id="undefined-description"
                  value={undefinedDescription}
                  onChange={(event) => setUndefinedDescription(event.target.value)}
                  placeholder="What this activity is, when people use it."
                />
              </div>
            </div>
          ) : (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Recommended prerequisites</legend>
              <p className="text-sm text-muted-foreground">
                Every recommended prerequisite needs an explicit answer. An unchecked box is not a Not
                Met.
              </p>
              {(selectedPlay?.prerequisites ?? []).map((item) => {
                const value = checks[item.key] ?? ""
                return (
                  <div key={item.key} className="rounded-lg border border-border p-3">
                    <p className="text-sm">{item.text}</p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={value === "met" ? "default" : "outline"}
                        aria-pressed={value === "met"}
                        onClick={() => setCheck(item.key, "met")}
                      >
                        Met
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={value === "not_met" ? "default" : "outline"}
                        aria-pressed={value === "not_met"}
                        onClick={() => setCheck(item.key, "not_met")}
                      >
                        Not Met
                      </Button>
                    </div>
                  </div>
                )
              })}
            </fieldset>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>3. When and who</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="activity-date">Activity date</Label>
              <Input
                id="activity-date"
                type="date"
                value={activityDate}
                onChange={(event) => setActivityDate(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stage">Stage at activity</Label>
              <select
                id="stage"
                value={stage}
                onChange={(event) => setStage(event.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
          <div className="grid gap-2">
            <Label htmlFor="se">Sales engineer</Label>
            <select
              id="se"
              value={seName}
              onChange={(event) => setSeName(event.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Use opportunity owner</option>
              {selectedOpportunity &&
              !sePeople.some((person) => person.name === selectedOpportunity.seName) ? (
                <option value={selectedOpportunity.seName}>{selectedOpportunity.seName}</option>
              ) : null}
              {sePeople.map((person) => (
                <option key={person.id} value={person.name}>
                  {person.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Defaults to the opportunity owner. Override if someone else ran this activity.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Context that belongs with this execution, not a reason library."
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button onClick={submit} disabled={pending} className={cn(pending && "opacity-80")}>
            Save activity
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
