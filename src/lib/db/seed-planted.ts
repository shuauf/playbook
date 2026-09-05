import { addDays } from "@/lib/dates"
import {
  DEMO_ACCOUNTS,
  DEMO_DEAL_SHAPES,
  DEMO_PEOPLE,
  DEMO_PLAYS,
  UNDEFINED_BRIEFING_LABEL,
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

export const SEED_VERSION = "playbook-v1"
export const SEED_AS_OF = new Date(2026, 8, 3)
const DEMO_SOURCE = "demo"

export const SEED_CONTRACT = {
  version: SEED_VERSION,
  playCount: 5,
  personCount: DEMO_PEOPLE.length,
  minOpportunities: 800,
  minActivities: 1200,
  enforcePlayId: "play-product-demo",
  enforcePrerequisiteKey: "demo-problem",
  enforceMetClosed: 220,
  enforceUnmetClosed: 160,
  enforceMetWon: 143,
  enforceUnmetWon: 64,
  revisitPrerequisiteKey: "demo-champion",
  productDemoOpen: 140,
  repeatedOpportunityCount: 60,
  stackedUnmetOnSameActivity: 40,
  investigatePlayId: "play-workshop",
  investigateClosed: 12,
  discoveryClosed: 160,
  discoveryOpen: 36,
  offStageDiscoveryCount: 42,
  architectureClosed: 140,
  pocClosed: 90,
  undefinedLabel: UNDEFINED_SECURITY_LABEL,
  undefinedActivityCount: 110,
  briefingLabel: UNDEFINED_BRIEFING_LABEL,
  briefingActivityCount: 8,
} as const

type CheckMap = Record<string, PrerequisiteStatus>
type WindowKind = "current" | "prior" | "older"

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

const SES = DEMO_PEOPLE.filter((person) => person.role === "se")
const AES = DEMO_PEOPLE.filter((person) => person.role === "ae")

function playById(id: string) {
  const play = DEMO_PLAYS.find((item) => item.id === id)
  if (!play) throw new Error(`Unknown demo play ${id}`)
  return play
}

function windowFor(index: number, _total?: number): WindowKind {
  const stripe = index % 20
  if (stripe < 14) return "current"
  if (stripe < 19) return "prior"
  return "older"
}

function createdDaysAgo(kind: WindowKind, salt: number) {
  if (kind === "current") return 18 + (salt % 70)
  if (kind === "prior") return 100 + (salt % 70)
  return 210 + (salt % 140)
}

function identity(index: number) {
  const se = SES[index % SES.length]!
  const ae = AES[index % AES.length]!
  const segments = ["Enterprise", "Enterprise", "Mid-market"] as const
  const account = DEMO_ACCOUNTS[index % DEMO_ACCOUNTS.length]!
  const shape = DEMO_DEAL_SHAPES[index % DEMO_DEAL_SHAPES.length]!
  return {
    seName: se.name,
    aeName: ae.name,
    team: se.team,
    segment: segments[index % 3]!,
    account,
    name: `${account} — ${shape}`,
  }
}

function makeOpportunity(input: {
  id: string
  index: number
  outcome: OpportunityOutcome
  window: WindowKind
  cycleDays: number
  stage: string
  name?: string
}): PlannedOpportunity {
  const who = identity(input.index)
  const createdAt = addDays(SEED_AS_OF, -createdDaysAgo(input.window, input.index + input.id.length))
  const closeDate =
    input.outcome === "open" ? null : addDays(createdAt, input.cycleDays)
  return {
    id: input.id,
    externalId: input.id.replace(/^opp-/, "ext-"),
    name: input.name ?? who.name,
    account: who.account,
    segment: who.segment,
    stage: input.outcome === "won" ? "Closed Won" : input.outcome === "lost" ? "Closed Lost" : input.stage,
    outcome: input.outcome,
    seName: who.seName,
    aeName: who.aeName,
    team: who.team,
    createdAt,
    closeDate,
  }
}

function addActivity(input: {
  id: string
  opportunity: PlannedOpportunity
  play: DemoPlay
  dayOffset: number
  stageAtActivity: PipelineStage
  checks: CheckMap
  note?: string
}): PlannedActivity {
  const activityDate = addDays(input.opportunity.createdAt, input.dayOffset)
  return {
    id: input.id,
    externalId: input.id.replace(/^act-/, "ext-"),
    opportunityId: input.opportunity.id,
    play: input.play,
    activityDate,
    stageAtActivity: input.stageAtActivity,
    seName: input.opportunity.seName,
    note: input.note ?? null,
    captureKind: "defined",
    checks: input.checks,
  }
}

function closedOutcomes(won: number, lost: number) {
  return [
    ...Array.from({ length: won }, () => "won" as const),
    ...Array.from({ length: lost }, () => "lost" as const),
  ]
}

export function buildPlantedWorkspace() {
  const opps: PlannedOpportunity[] = []
  const activities: PlannedActivity[] = []
  const demo = playById("play-product-demo")
  const discovery = playById("play-discovery")
  const architecture = playById("play-architecture-review")
  const workshop = playById("play-workshop")
  const poc = playById("play-poc")

  const metWon = SEED_CONTRACT.enforceMetWon
  const metLost = SEED_CONTRACT.enforceMetClosed - metWon
  const unmetWon = SEED_CONTRACT.enforceUnmetWon
  const unmetLost = SEED_CONTRACT.enforceUnmetClosed - unmetWon
  const demoClosed = [
    ...closedOutcomes(metWon, metLost).map((outcome) => ({ outcome, problem: "met" as const })),
    ...closedOutcomes(unmetWon, unmetLost).map((outcome) => ({ outcome, problem: "not_met" as const })),
  ]

  demoClosed.forEach((row, index) => {
    const stacked = row.problem === "not_met" && index % 4 === 0 && index < demoClosed.length
    const stackedLimit =
      row.problem === "not_met" &&
      demoClosed.slice(0, index + 1).filter((item) => item.problem === "not_met").length <=
        SEED_CONTRACT.stackedUnmetOnSameActivity
    const stackedNow = stacked && stackedLimit
    const champion: PrerequisiteStatus = index % 5 === 0 || index % 5 === 1 ? "not_met" : "met"
    const window = windowFor(index, demoClosed.length)
    const cycle =
      row.problem === "not_met" ? 142 + (index % 28) : 98 + (index % 20)
    const opp = makeOpportunity({
      id: `opp-pd-${String(index + 1).padStart(3, "0")}`,
      index,
      outcome: row.outcome,
      window,
      cycleDays: cycle,
      stage: "Evaluate",
    })
    opps.push(opp)
    activities.push(
      addActivity({
        id: `act-${opp.id}`,
        opportunity: opp,
        play: demo,
        dayOffset: 12 + (index % 6),
        stageAtActivity: "Evaluate",
        checks: {
          "demo-discovery": stackedNow ? "not_met" : "met",
          "demo-problem": row.problem,
          "demo-champion": champion,
        },
        note: stackedNow ? "Discovery and confirmed problem both skipped." : undefined,
      })
    )
    if (index % 5 !== 0) {
      activities.push(
        addActivity({
          id: `act-${opp.id}-disc`,
          opportunity: opp,
          play: discovery,
          dayOffset: 6,
          stageAtActivity: index % 17 === 0 ? "Validate" : "Qualify",
          checks: {
            "discovery-aligned": index % 11 === 0 ? "not_met" : "met",
            "discovery-problem": index % 13 === 0 ? "not_met" : "met",
            "discovery-owner": "met",
          },
        })
      )
    }
    if (row.outcome === "won" && index % 3 === 0) {
      activities.push(
        addActivity({
          id: `act-${opp.id}-arch`,
          opportunity: opp,
          play: architecture,
          dayOffset: 28,
          stageAtActivity: "Validate",
          checks: {
            "arch-risks": index % 7 === 0 ? "not_met" : "met",
            "arch-stakeholder": "met",
            "arch-path": index % 19 === 0 ? "not_met" : "met",
          },
        })
      )
    }
    if (row.outcome === "won" && index % 6 === 0) {
      activities.push(
        addActivity({
          id: `act-${opp.id}-poc`,
          opportunity: opp,
          play: poc,
          dayOffset: 40,
          stageAtActivity: "Prove",
          checks: { "poc-criteria": "met", "poc-technical": "met" },
        })
      )
    }
  })

  for (let index = 0; index < SEED_CONTRACT.productDemoOpen; index++) {
    const opp = makeOpportunity({
      id: `opp-pd-open-${String(index + 1).padStart(3, "0")}`,
      index: 900 + index,
      outcome: "open",
      window: "current",
      cycleDays: 0,
      stage: "Evaluate",
    })
    opps.push(opp)
    activities.push(
      addActivity({
        id: `act-${opp.id}`,
        opportunity: opp,
        play: demo,
        dayOffset: 9,
        stageAtActivity: "Evaluate",
        checks: {
          "demo-discovery": "met",
          "demo-problem": index % 4 === 0 ? "not_met" : "met",
          "demo-champion": index % 2 === 0 ? "met" : "not_met",
        },
      })
    )
  }

  const repeatTargets = opps.filter((item) => item.id.startsWith("opp-pd-")).slice(0, SEED_CONTRACT.repeatedOpportunityCount)
  repeatTargets.forEach((opp) => {
    const first = activities.find((item) => item.id === `act-${opp.id}`)
    if (!first || !first.play) return
    activities.push(
      addActivity({
        id: `act-${opp.id}-repeat`,
        opportunity: opp,
        play: first.play,
        dayOffset: 24,
        stageAtActivity: "Evaluate",
        checks: first.checks,
        note: "Second Product Demo on the same opportunity. Outcome is counted once.",
      })
    )
  })

  function simpleCohort(input: {
    play: DemoPlay
    prefix: string
    closed: number
    won: number
    open?: number
    stage: PipelineStage
    cycle: number
    unmet: number
    startIndex: number
    offStage?: { count: number; stage: PipelineStage }
  }) {
    const total = input.closed + (input.open ?? 0)
    for (let index = 0; index < total; index++) {
      const outcome: OpportunityOutcome =
        index < input.won ? "won" : index < input.closed ? "lost" : "open"
      const window = outcome === "open" ? "current" : windowFor(index, input.closed)
      const opp = makeOpportunity({
        id: `opp-${input.prefix}-${String(index + 1).padStart(3, "0")}`,
        index: input.startIndex + index,
        outcome,
        window,
        cycleDays: input.cycle + (index % 9),
        stage: input.stage,
      })
      opps.push(opp)
      const unmet = index >= input.closed - input.unmet && index < input.closed
      const offStage = index < (input.offStage?.count ?? 0)
      activities.push(
        addActivity({
          id: `act-${opp.id}`,
          opportunity: opp,
          play: input.play,
          dayOffset: offStage ? 30 : 11,
          stageAtActivity: offStage ? input.offStage!.stage : input.stage,
          checks: { [input.play.prerequisites[0]!.key]: unmet ? "not_met" : "met" },
          note: offStage ? "Used outside the play’s typical stage." : undefined,
        })
      )
    }
  }

  simpleCohort({
    play: workshop,
    prefix: "ws",
    closed: 12,
    won: 4,
    stage: "Evaluate",
    cycle: 118,
    unmet: 6,
    startIndex: 1600,
  })
  simpleCohort({
    play: discovery,
    prefix: "disc",
    closed: 80,
    won: 46,
    open: 36,
    stage: "Qualify",
    cycle: 134,
    unmet: 18,
    startIndex: 1800,
    offStage: { count: 24, stage: "Validate" },
  })
  simpleCohort({
    play: architecture,
    prefix: "arch",
    closed: 70,
    won: 40,
    stage: "Validate",
    cycle: 126,
    unmet: 22,
    startIndex: 2100,
  })
  simpleCohort({
    play: poc,
    prefix: "poc",
    closed: 40,
    won: 31,
    open: 12,
    stage: "Prove",
    cycle: 168,
    unmet: 6,
    startIndex: 2300,
  })

  const hosts = opps.filter((item) => item.outcome !== "open").slice(0, 70)
  const extraUndef = SEED_CONTRACT.undefinedActivityCount - hosts.length
  for (let index = 0; index < extraUndef; index++) {
    const opp = makeOpportunity({
      id: `opp-undef-${String(index + 1).padStart(2, "0")}`,
      index: 2600 + index,
      outcome: index < 12 ? "won" : index < 22 ? "lost" : "open",
      window: windowFor(index, extraUndef),
      cycleDays: 112,
      stage: "Validate",
    })
    opps.push(opp)
  }
  const undefTargets = [...hosts, ...opps.filter((item) => item.id.startsWith("opp-undef-"))]
  undefTargets.slice(0, SEED_CONTRACT.undefinedActivityCount).forEach((opp, index) => {
    activities.push({
      id: `act-undef-${String(index + 1).padStart(3, "0")}`,
      externalId: `ext-undef-${String(index + 1).padStart(3, "0")}`,
      opportunityId: opp.id,
      play: null,
      undefinedLabel: UNDEFINED_SECURITY_LABEL,
      activityDate: addDays(opp.createdAt, 16),
      stageAtActivity: "Validate",
      seName: opp.seName,
      note: "Logged off-playbook. No success-signal snapshot exists.",
      captureKind: "undefined",
      checks: {},
    })
  })

  for (let index = 0; index < SEED_CONTRACT.briefingActivityCount; index++) {
    const host = opps[index * 17]!
    activities.push({
      id: `act-brief-${String(index + 1).padStart(2, "0")}`,
      externalId: `ext-brief-${String(index + 1).padStart(2, "0")}`,
      opportunityId: host.id,
      play: null,
      undefinedLabel: UNDEFINED_BRIEFING_LABEL,
      activityDate: addDays(host.createdAt, 20),
      stageAtActivity: "Propose",
      seName: host.seName,
      note: "Process mining walkthrough outside the standard five plays.",
      captureKind: "undefined",
      checks: {},
    })
  }

  return { opportunities: opps, activities }
}

async function insertChunks<T>(
  db: PlaybookDb,
  table: Parameters<PlaybookDb["insert"]>[0],
  rows: T[]
) {
  for (let index = 0; index < rows.length; index += 80) {
    await db.insert(table).values(rows.slice(index, index + 80) as never)
  }
}

export async function clearDemoWorkspace(db: PlaybookDb) {
  await db.delete(activityPrerequisiteSnapshots)
  await db.delete(salesActivities)
  await db.delete(opportunities)
  await db.delete(undefinedPlayLabels)
  await db.delete(playVersionPrerequisites)
  await db.delete(salesPlayVersions)
  await db.delete(salesPlays)
  await db.delete(people)
  await db.delete(appMeta)
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
  await insertChunks(
    db,
    playVersionPrerequisites,
    DEMO_PLAYS.flatMap((play) =>
      play.prerequisites.map((item, index) => ({
        id: `${play.id}-v1-${item.key}`,
        versionId: `${play.id}-v1`,
        prerequisiteKey: item.key,
        text: item.text,
        sortOrder: index,
      }))
    )
  )

  await db.insert(undefinedPlayLabels).values([
    {
      id: "label-executive-workflow-audit",
      normalizedLabel: undefinedLabelKey(UNDEFINED_SECURITY_LABEL),
      displayName: UNDEFINED_SECURITY_LABEL,
      description: "Repeated executive workflow audits that are not yet a formal sales play.",
      status: "open",
      mappedPlayId: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "label-process-mining-walkthrough",
      normalizedLabel: undefinedLabelKey(UNDEFINED_BRIEFING_LABEL),
      displayName: UNDEFINED_BRIEFING_LABEL,
      description: "Occasional process-mining walkthroughs without a defined play.",
      status: "open",
      mappedPlayId: null,
      createdAt: now,
      updatedAt: now,
    },
  ])

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
    if (activity.captureKind === "undefined" || !activity.play) return []
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
    { key: "demo_seed", value: SEED_VERSION },
    { key: "workspace_name", value: "Demo workspace" },
    { key: "data_source", value: "demo" },
  ])
}
