import { addDays } from "@/lib/dates"
import {
  DEMO_PEOPLE,
  DEMO_PLAYS,
  UNDEFINED_SECURITY_LABEL,
  type DemoPlay,
} from "@/lib/db/catalog"
import {
  activityPrerequisiteSnapshots,
  appMeta,
  opportunities,
  people,
  playVersionPrerequisites,
  salesActivities,
  salesPlayVersions,
  salesPlays,
  undefinedPlayLabels,
} from "@/lib/db/schema"
import type { PlaybookDb } from "@/lib/db/types"
import { undefinedLabelKey } from "@/lib/domain/labels"
import type { OpportunityOutcome, PipelineStage, PrerequisiteStatus } from "@/lib/domain/types"

const BASE = new Date(2026, 0, 12)
const DEMO_SOURCE = "demo"

export const SEED_CONTRACT = {
  playCount: 5,
  personCount: 6,
  enforcePlayId: "play-product-demo",
  enforcePrerequisiteKey: "demo-problem",
  enforceMetClosed: 65,
  enforceUnmetClosed: 45,
  revisitPrerequisiteKey: "demo-champion",
  revisitMetClosed: 68,
  revisitUnmetClosed: 42,
  productDemoOpen: 12,
  repeatedOpportunityCount: 12,
  stackedUnmetOnSameActivity: 8,
  investigatePlayId: "play-workshop",
  investigateClosed: 10,
  discoveryClosed: 20,
  discoveryOpen: 4,
  offStageDiscoveryCount: 6,
  architectureClosed: 16,
  pocClosed: 16,
  undefinedLabel: UNDEFINED_SECURITY_LABEL,
  undefinedActivityCount: 18,
} as const

type CheckMap = Record<string, PrerequisiteStatus>

type PlannedOpportunity = {
  id: string
  externalId: string
  name: string
  account: string
  segment: "SMB" | "Mid-market" | "Enterprise"
  stage: string
  outcome: OpportunityOutcome
  seName: string
  aeName: string
  team: "West" | "East" | "Strategic"
  createdAt: Date
  closeDate: Date | null
}

type PlannedActivity = {
  id: string
  externalId: string
  opportunityId: string
  play: DemoPlay | null
  undefinedLabel?: string
  activityDate: Date
  stageAtActivity: PipelineStage
  seName: string
  note: string | null
  captureKind: "defined" | "undefined"
  checks: CheckMap
}

const ACCOUNTS = [
  "Harborline",
  "Northwind Health",
  "Cedar Analytics",
  "Brightfield",
  "Summit Ledger",
  "Kite & Co",
  "Riverstone",
  "Aperture Labs",
  "Fieldwork",
  "Orchard Systems",
]

function pair(index: number) {
  const se = DEMO_PEOPLE.filter((person) => person.role === "se")[index % 3]!
  const ae = DEMO_PEOPLE.filter((person) => person.role === "ae")[index % 3]!
  const segments = ["SMB", "Mid-market", "Enterprise"] as const
  return {
    seName: se.name,
    aeName: ae.name,
    team: se.team,
    segment: segments[index % 3]!,
    account: `${ACCOUNTS[index % ACCOUNTS.length]} ${Math.floor(index / ACCOUNTS.length) + 1}`,
  }
}

function at(days: number) {
  return addDays(BASE, days)
}

function playById(id: string) {
  const play = DEMO_PLAYS.find((item) => item.id === id)
  if (!play) throw new Error(`Unknown demo play ${id}`)
  return play
}

function opportunity(input: {
  id: string
  index: number
  name: string
  outcome: OpportunityOutcome
  createdOffset: number
  cycleDays?: number
  stage: string
}): PlannedOpportunity {
  const identity = pair(input.index)
  const createdAt = at(input.createdOffset)
  const closeDate =
    input.outcome === "open" ? null : addDays(createdAt, input.cycleDays ?? 62)
  return {
    id: input.id,
    externalId: input.id.replace(/^opp-/, "ext-"),
    name: input.name,
    account: identity.account,
    segment: identity.segment,
    stage: input.outcome === "won" ? "Closed Won" : input.outcome === "lost" ? "Closed Lost" : input.stage,
    outcome: input.outcome,
    seName: identity.seName,
    aeName: identity.aeName,
    team: identity.team,
    createdAt,
    closeDate,
  }
}

function definedActivity(input: {
  id: string
  opportunity: PlannedOpportunity
  play: DemoPlay
  dayOffset: number
  stageAtActivity: PipelineStage
  checks: CheckMap
  note?: string
}): PlannedActivity {
  return {
    id: input.id,
    externalId: input.id.replace(/^act-/, "ext-"),
    opportunityId: input.opportunity.id,
    play: input.play,
    activityDate: addDays(input.opportunity.createdAt, input.dayOffset),
    stageAtActivity: input.stageAtActivity,
    seName: input.opportunity.seName,
    note: input.note ?? null,
    captureKind: "defined",
    checks: input.checks,
  }
}

function buildProductDemoCohort() {
  const play = playById("play-product-demo")
  const opps: PlannedOpportunity[] = []
  const activities: PlannedActivity[] = []

  const cohortA = [
    ...Array.from({ length: 26 }, (_, i) => ({ outcome: "won" as const, champion: "met" as const, i })),
    ...Array.from({ length: 14 }, (_, i) => ({ outcome: "lost" as const, champion: "met" as const, i })),
    ...Array.from({ length: 16 }, (_, i) => ({ outcome: "won" as const, champion: "not_met" as const, i })),
    ...Array.from({ length: 9 }, (_, i) => ({ outcome: "lost" as const, champion: "not_met" as const, i })),
  ]
  const cohortB = [
    ...Array.from({ length: 6 }, (_, i) => ({ outcome: "won" as const, champion: "met" as const, i })),
    ...Array.from({ length: 22 }, (_, i) => ({ outcome: "lost" as const, champion: "met" as const, i })),
    ...Array.from({ length: 4 }, (_, i) => ({ outcome: "won" as const, champion: "not_met" as const, i })),
    ...Array.from({ length: 13 }, (_, i) => ({ outcome: "lost" as const, champion: "not_met" as const, i })),
  ]

  cohortA.forEach((row, index) => {
    const id = `opp-pd-a-${String(index + 1).padStart(2, "0")}`
    const opp = opportunity({
      id,
      index,
      name: `Product Demo ${row.outcome === "won" ? "won" : "lost"} A${index + 1}`,
      outcome: row.outcome,
      createdOffset: 4 + index * 2,
      cycleDays: 58 + (index % 12),
      stage: "Evaluate",
    })
    opps.push(opp)
    activities.push(
      definedActivity({
        id: `act-${id}`,
        opportunity: opp,
        play,
        dayOffset: 16 + (index % 8),
        stageAtActivity: "Evaluate",
        checks: {
          "demo-discovery": "met",
          "demo-problem": "met",
          "demo-champion": row.champion,
        },
      })
    )
  })

  cohortB.forEach((row, index) => {
    const id = `opp-pd-b-${String(index + 1).padStart(2, "0")}`
    const stackedDiscovery = index < SEED_CONTRACT.stackedUnmetOnSameActivity
    const opp = opportunity({
      id,
      index: index + 80,
      name: `Product Demo ${row.outcome === "won" ? "won" : "lost"} B${index + 1}`,
      outcome: row.outcome,
      createdOffset: 8 + index * 2,
      cycleDays: 70 + (index % 14),
      stage: "Evaluate",
    })
    opps.push(opp)
    activities.push(
      definedActivity({
        id: `act-${id}`,
        opportunity: opp,
        play,
        dayOffset: 18 + (index % 6),
        stageAtActivity: "Evaluate",
        checks: {
          "demo-discovery": stackedDiscovery ? "not_met" : "met",
          "demo-problem": "not_met",
          "demo-champion": row.champion,
        },
        note: stackedDiscovery ? "Stacked exception: discovery and problem both skipped." : undefined,
      })
    )
  })

  for (let index = 0; index < SEED_CONTRACT.productDemoOpen; index++) {
    const id = `opp-pd-open-${String(index + 1).padStart(2, "0")}`
    const opp = opportunity({
      id,
      index: index + 160,
      name: `Open Product Demo ${index + 1}`,
      outcome: "open",
      createdOffset: 140 + index * 3,
      stage: "Evaluate",
    })
    opps.push(opp)
    activities.push(
      definedActivity({
        id: `act-${id}`,
        opportunity: opp,
        play,
        dayOffset: 12,
        stageAtActivity: "Evaluate",
        checks: {
          "demo-discovery": "met",
          "demo-problem": index % 3 === 0 ? "not_met" : "met",
          "demo-champion": index % 2 === 0 ? "met" : "not_met",
        },
      })
    )
  }

  const repeatTargets = [
    ...opps.filter((item) => item.id.startsWith("opp-pd-a-")).slice(0, 8),
    ...opps.filter((item) => item.id.startsWith("opp-pd-b-")).slice(0, 4),
  ]
  repeatTargets.forEach((opp, index) => {
    const first = activities.find((item) => item.opportunityId === opp.id)
    if (!first) return
    activities.push(
      definedActivity({
        id: `act-${opp.id}-repeat`,
        opportunity: opp,
        play,
        dayOffset: 28,
        stageAtActivity: "Evaluate",
        checks: first.checks,
        note: "Second Product Demo on the same opportunity. Outcome is counted once.",
      })
    )
    void index
  })

  return { opps, activities }
}

function buildSimplePlay(input: {
  playId: string
  prefix: string
  closed: number
  won: number
  open?: number
  stage: PipelineStage
  createdBase: number
  cycleDays: number
  unmetCount: number
  offStageCount?: number
  offStage?: PipelineStage
}) {
  const play = playById(input.playId)
  const prereq = play.prerequisites[0]
  if (!prereq) throw new Error(`${play.name} needs a prerequisite`)
  const opps: PlannedOpportunity[] = []
  const activities: PlannedActivity[] = []
  const totalClosed = input.closed
  const openCount = input.open ?? 0

  for (let index = 0; index < totalClosed + openCount; index++) {
    const outcome: OpportunityOutcome =
      index < input.won ? "won" : index < totalClosed ? "lost" : "open"
    const id = `opp-${input.prefix}-${String(index + 1).padStart(2, "0")}`
    const opp = opportunity({
      id,
      index: input.createdBase + index,
      name: `${play.name} ${outcome} ${index + 1}`,
      outcome,
      createdOffset: input.createdBase + index * 3,
      cycleDays: input.cycleDays + (index % 7),
      stage: input.stage,
    })
    opps.push(opp)
    const unmet = index >= totalClosed - input.unmetCount && index < totalClosed
    const offStage = index < (input.offStageCount ?? 0)
    activities.push(
      definedActivity({
        id: `act-${id}`,
        opportunity: opp,
        play,
        dayOffset: offStage ? 36 : 14,
        stageAtActivity: offStage ? (input.offStage ?? "Validate") : input.stage,
        checks: { [prereq.key]: unmet ? "not_met" : "met" },
        note: offStage ? "Used outside the play’s typical stage." : undefined,
      })
    )
  }

  return { opps, activities }
}

function buildUndefined(existing: PlannedOpportunity[]) {
  const opps: PlannedOpportunity[] = []
  const activities: PlannedActivity[] = []
  const hosts = existing.slice(0, 10)
  const extraCount = SEED_CONTRACT.undefinedActivityCount - hosts.length

  for (let index = 0; index < extraCount; index++) {
    const id = `opp-undef-${String(index + 1).padStart(2, "0")}`
    opps.push(
      opportunity({
        id,
        index: 240 + index,
        name: `Ad hoc security review ${index + 1}`,
        outcome: index < 3 ? "won" : index < 6 ? "lost" : "open",
        createdOffset: 90 + index * 4,
        cycleDays: 48,
        stage: "Validate",
      })
    )
  }

  const targets = [...hosts, ...opps]
  targets.forEach((opp, index) => {
    activities.push({
      id: `act-undef-${String(index + 1).padStart(2, "0")}`,
      externalId: `ext-undef-${String(index + 1).padStart(2, "0")}`,
      opportunityId: opp.id,
      play: null,
      undefinedLabel: UNDEFINED_SECURITY_LABEL,
      activityDate: addDays(opp.createdAt, 22),
      stageAtActivity: "Validate",
      seName: opp.seName,
      note: "Logged as an undefined activity. No prerequisite snapshot exists.",
      captureKind: "undefined",
      checks: {},
    })
  })

  return { opps, activities }
}

export function buildPlantedWorkspace() {
  const productDemo = buildProductDemoCohort()
  const workshop = buildSimplePlay({
    playId: "play-workshop",
    prefix: "ws",
    closed: 10,
    won: 5,
    stage: "Evaluate",
    createdBase: 200,
    cycleDays: 44,
    unmetCount: 5,
  })
  const discovery = buildSimplePlay({
    playId: "play-discovery",
    prefix: "disc",
    closed: 20,
    won: 12,
    open: 4,
    stage: "Qualify",
    createdBase: 20,
    cycleDays: 88,
    unmetCount: 4,
    offStageCount: 6,
    offStage: "Validate",
  })
  const architecture = buildSimplePlay({
    playId: "play-architecture-review",
    prefix: "arch",
    closed: 16,
    won: 9,
    stage: "Validate",
    createdBase: 60,
    cycleDays: 40,
    unmetCount: 5,
  })
  const poc = buildSimplePlay({
    playId: "play-poc",
    prefix: "poc",
    closed: 16,
    won: 13,
    stage: "Prove",
    createdBase: 110,
    cycleDays: 24,
    unmetCount: 2,
  })

  const baseOpps = [
    ...productDemo.opps,
    ...workshop.opps,
    ...discovery.opps,
    ...architecture.opps,
    ...poc.opps,
  ]
  const undefinedPlay = buildUndefined(baseOpps)

  return {
    opportunities: [...baseOpps, ...undefinedPlay.opps],
    activities: [
      ...productDemo.activities,
      ...workshop.activities,
      ...discovery.activities,
      ...architecture.activities,
      ...poc.activities,
      ...undefinedPlay.activities,
    ],
  }
}

async function insertChunks<T>(
  db: PlaybookDb,
  table: Parameters<PlaybookDb["insert"]>[0],
  rows: T[]
) {
  for (let index = 0; index < rows.length; index += 40) {
    await db.insert(table).values(rows.slice(index, index + 40) as never)
  }
}

export async function seedPlantedWorkspace(db: PlaybookDb, now = new Date()) {
  await insertChunks(
    db,
    people,
    DEMO_PEOPLE.map((person) => ({
      id: person.id,
      name: person.name,
      role: person.role,
      team: person.team,
      createdAt: now,
    }))
  )

  const versionRows = DEMO_PLAYS.map((play) => ({
    id: `${play.id}-v1`,
    playId: play.id,
    version: 1,
    name: play.name,
    description: play.description,
    typicalStages: JSON.stringify(play.typicalStages),
    createdAt: now,
  }))

  await insertChunks(
    db,
    salesPlays,
    DEMO_PLAYS.map((play) => ({
      id: play.id,
      status: "active",
      currentVersionId: `${play.id}-v1`,
      createdAt: now,
      updatedAt: now,
      retiredAt: null,
    }))
  )
  await insertChunks(db, salesPlayVersions, versionRows)

  const prerequisiteRows = DEMO_PLAYS.flatMap((play) =>
    play.prerequisites.map((item, index) => ({
      id: `${play.id}-v1-${item.key}`,
      versionId: `${play.id}-v1`,
      prerequisiteKey: item.key,
      text: item.text,
      sortOrder: index,
    }))
  )
  await insertChunks(db, playVersionPrerequisites, prerequisiteRows)

  await db.insert(undefinedPlayLabels).values({
    id: "label-security-questionnaire",
    normalizedLabel: undefinedLabelKey(UNDEFINED_SECURITY_LABEL),
    displayName: UNDEFINED_SECURITY_LABEL,
    description: "Repeated ad hoc security reviews that are not yet a formal sales play.",
    status: "open",
    mappedPlayId: null,
    createdAt: now,
    updatedAt: now,
  })

  const planted = buildPlantedWorkspace()

  await insertChunks(
    db,
    opportunities,
    planted.opportunities.map((item) => ({
      id: item.id,
      externalId: item.externalId,
      name: item.name,
      account: item.account,
      segment: item.segment,
      stage: item.stage,
      outcome: item.outcome,
      seName: item.seName,
      aeName: item.aeName,
      team: item.team,
      createdAt: item.createdAt,
      closeDate: item.closeDate,
      updatedAt: now,
      source: DEMO_SOURCE,
    }))
  )

  await insertChunks(
    db,
    salesActivities,
    planted.activities.map((item) => ({
      id: item.id,
      externalId: item.externalId,
      opportunityId: item.opportunityId,
      playId: item.play?.id ?? null,
      playVersionId: item.play ? `${item.play.id}-v1` : null,
      undefinedLabel: item.undefinedLabel ?? null,
      mappedPlayId: null,
      activityDate: item.activityDate,
      stageAtActivity: item.stageAtActivity,
      seName: item.seName,
      note: item.note,
      source: DEMO_SOURCE,
      captureKind: item.captureKind,
      createdAt: now,
    }))
  )

  const snapshotRows = planted.activities.flatMap((activity) => {
    if (activity.captureKind === "undefined") return []
    if (!activity.play) return []
    return activity.play.prerequisites.map((prereq) => ({
      id: `${activity.id}-${prereq.key}`,
      activityId: activity.id,
      prerequisiteKey: prereq.key,
      textAtCapture: prereq.text,
      status: activity.checks[prereq.key] ?? "met",
      createdAt: now,
    }))
  })
  await insertChunks(db, activityPrerequisiteSnapshots, snapshotRows)

  await db.insert(appMeta).values([
    { key: "demo_seed", value: "northstar-v1" },
    { key: "workspace_name", value: "Northstar SE" },
    { key: "data_source", value: "demo" },
  ])
}
