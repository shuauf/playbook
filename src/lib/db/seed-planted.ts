import { addDays } from "@/lib/dates"
import {
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
import type { OpportunityOutcome, PipelineStage, PrerequisiteStatus, Segment } from "@/lib/domain/types"

export const SEED_VERSION = "playbook-v2"
export const SEED_AS_OF = new Date(2026, 8, 3)
const DEMO_SOURCE = "demo"

export const SEED_CONTRACT = {
  version: SEED_VERSION,
  playCount: 5,
  personCount: DEMO_PEOPLE.length,
  minOpportunities: 98,
  maxOpportunities: 102,
  minActivities: 235,
  maxActivities: 265,
  enforcePlayId: "play-product-demo",
  enforcePrerequisiteKey: "demo-problem",
  enforceMetClosed: 40,
  enforceUnmetClosed: 40,
  enforceMetWon: 26,
  enforceUnmetWon: 16,
  revisitPrerequisiteKey: "demo-discovery",
  productDemoOpen: 8,
  repeatedOpportunityCount: 8,
  stackedUnmetOnSameActivity: 10,
  investigatePlayId: "play-workshop",
  investigateClosed: 8,
  undefinedLabel: UNDEFINED_SECURITY_LABEL,
  undefinedActivityCount: 22,
  briefingLabel: UNDEFINED_BRIEFING_LABEL,
  briefingActivityCount: 5,
  offStageDiscoveryCount: 8,
} as const

type CheckMap = Record<string, PrerequisiteStatus>

type PlannedOpportunity = {
  id: string
  externalId: string
  name: string
  account: string
  segment: Segment
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
  segment: Segment
  note: string | null
  captureKind: "defined" | "undefined"
  checks: CheckMap
}

const SES = DEMO_PEOPLE.filter((person) => person.role === "se")
const AES = DEMO_PEOPLE.filter((person) => person.role === "ae")
const NORA = SES.find((person) => person.name === "Nora Blake") ?? SES[0]!
const LENA = SES.find((person) => person.name === "Lena Hart") ?? SES[0]!
const MATEO = SES.find((person) => person.name === "Mateo Ruiz") ?? SES[1]!
const QUINN = SES.find((person) => person.name === "Quinn Adler") ?? SES[2]!
const RHEA = AES.find((person) => person.name === "Rhea Patel") ?? AES[0]!

const SEGMENT_BOOK: Record<Segment, { accounts: string[]; shapes: string[] }> = {
  Strategic: {
    accounts: [
      "Meridian Mutual",
      "Helix Industrials",
      "Atlas Payments Group",
      "Carewell Health",
      "Pinnacle Benefits",
      "Granite Underwriters",
      "Lumen Health Partners",
    ],
    shapes: [
      "enterprise playbook redesign · $320K ACV",
      "capture-to-production expansion · $275K ACV",
      "underwriting process intelligence · $290K ACV",
      "shared-services workflow map · $240K ACV",
    ],
  },
  "Mid-Market": {
    accounts: [
      "Northline Retail",
      "Harborline Logistics",
      "Oak & Iron Manufacturing",
      "Sterling Card Services",
      "Crestline Pharma Ops",
      "Blue Harbor Credit",
      "Ironclad Freight Co",
      "Weston Clinics",
      "Nimbus Mutual",
    ],
    shapes: [
      "product rollout · $210K ACV",
      "workflow visibility program · $180K ACV",
      "claims intake visibility · $195K ACV",
      "store operations playbook · $160K ACV",
      "automation opportunity assessment · $150K ACV",
    ],
  },
  SMB: {
    accounts: [
      "Rivermark Stores",
      "Vesper Components",
      "Sable Media Group",
      "Orchard Systems",
      "Fieldwork Retail",
      "Cobalt Outfitters",
      "Redwood Municipal",
      "Quill Learning",
      "Maple & Pine Goods",
    ],
    shapes: [
      "process intelligence expansion · $95K ACV",
      "workflow visibility program · $120K ACV",
      "store operations playbook · $110K ACV",
      "automation opportunity assessment · $135K ACV",
    ],
  },
}

function playById(id: string) {
  const play = DEMO_PLAYS.find((item) => item.id === id)
  if (!play) throw new Error(`Unknown demo play ${id}`)
  return play
}

export function pickSegment(index: number): Segment {
  const stripe = index % 10
  if (stripe < 2) return "Strategic"
  if (stripe < 7) return "Mid-Market"
  return "SMB"
}

function balancedSegment(_block: number, indexInBlock: number): Segment {
  const stripe = indexInBlock % 5
  if (stripe === 0) return "Strategic"
  if (stripe <= 3) return "Mid-Market"
  return "SMB"
}

function cycleDaysFor(segment: Segment, unmet: boolean, salt: number) {
  if (segment === "Strategic") return (unmet ? 318 : 278) + (salt % 36)
  if (segment === "Mid-Market") return (unmet ? 228 : 198) + (salt % 30)
  return (unmet ? 208 : 186) + (salt % 22)
}

function identity(index: number, segment: Segment) {
  const book = SEGMENT_BOOK[segment]
  const se =
    segment === "Strategic" ? NORA : index % 3 === 0 ? LENA : index % 3 === 1 ? MATEO : QUINN
  const ae = RHEA
  const account = book.accounts[index % book.accounts.length]!
  const shape = book.shapes[index % book.shapes.length]!
  return {
    seName: se.name,
    aeName: ae.name,
    team: se.team,
    segment,
    account,
    name: `${account} — ${shape}`,
  }
}

function makeOpportunity(input: {
  id: string
  index: number
  outcome: OpportunityOutcome
  segment: Segment
  cycleDays: number
  stage: string
  sinceClose?: number
  ageDays?: number
}): PlannedOpportunity {
  const who = identity(input.index, input.segment)
  const createdAt =
    input.outcome === "open"
      ? addDays(SEED_AS_OF, -(input.ageDays ?? 90 + (input.index % 80)))
      : addDays(SEED_AS_OF, -((input.sinceClose ?? 20) + input.cycleDays))
  const closeDate =
    input.outcome === "open" ? null : addDays(SEED_AS_OF, -(input.sinceClose ?? 20))
  return {
    id: input.id,
    externalId: input.id.replace(/^opp-/, "ext-"),
    name: who.name,
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
  date?: Date
  dayOffset?: number
  stageAtActivity: PipelineStage
  checks: CheckMap
  note?: string
}): PlannedActivity {
  const activityDate = input.date ?? addDays(input.opportunity.createdAt, input.dayOffset ?? 12)
  return {
    id: input.id,
    externalId: input.id.replace(/^act-/, "ext-"),
    opportunityId: input.opportunity.id,
    play: input.play,
    activityDate,
    stageAtActivity: input.stageAtActivity,
    seName: input.opportunity.seName,
    segment: input.opportunity.segment,
    note: input.note ?? null,
    captureKind: "defined",
    checks: input.checks,
  }
}

function addUndefined(input: {
  id: string
  opportunity: PlannedOpportunity
  label: string
  date: Date
  stageAtActivity: PipelineStage
  note: string
}): PlannedActivity {
  return {
    id: input.id,
    externalId: input.id.replace(/^act-/, "ext-"),
    opportunityId: input.opportunity.id,
    play: null,
    undefinedLabel: input.label,
    activityDate: input.date,
    stageAtActivity: input.stageAtActivity,
    seName: input.opportunity.seName,
    segment: input.opportunity.segment,
    note: input.note,
    captureKind: "undefined",
    checks: {},
  }
}

function championStatus(outcome: OpportunityOutcome, index: number): PrerequisiteStatus {
  if (outcome === "won") return index % 5 === 0 ? "not_met" : "met"
  return index % 5 < 3 ? "not_met" : "met"
}

function skipDiscovery(index: number) {
  const stripe = index % 10
  return stripe === 2 || stripe === 5 || stripe === 8
}

export function buildPlantedWorkspace() {
  const opps: PlannedOpportunity[] = []
  const activities: PlannedActivity[] = []
  const demo = playById("play-product-demo")
  const discovery = playById("play-discovery")
  const architecture = playById("play-architecture-review")
  const workshop = playById("play-workshop")
  const poc = playById("play-poc")

  const demoClosed: Array<{ outcome: OpportunityOutcome; problem: PrerequisiteStatus }> = [
    ...Array.from({ length: SEED_CONTRACT.enforceMetWon }, () => ({
      outcome: "won" as const,
      problem: "met" as const,
    })),
    ...Array.from({ length: SEED_CONTRACT.enforceMetClosed - SEED_CONTRACT.enforceMetWon }, () => ({
      outcome: "lost" as const,
      problem: "met" as const,
    })),
    ...Array.from({ length: SEED_CONTRACT.enforceUnmetWon }, () => ({
      outcome: "won" as const,
      problem: "not_met" as const,
    })),
    ...Array.from({ length: SEED_CONTRACT.enforceUnmetClosed - SEED_CONTRACT.enforceUnmetWon }, () => ({
      outcome: "lost" as const,
      problem: "not_met" as const,
    })),
  ]

  let stackedLeft = SEED_CONTRACT.stackedUnmetOnSameActivity
  const demoOpps: PlannedOpportunity[] = []

  demoClosed.forEach((row, index) => {
    const block =
      index < SEED_CONTRACT.enforceMetWon
        ? 0
        : index < SEED_CONTRACT.enforceMetClosed
          ? 1
          : index < SEED_CONTRACT.enforceMetClosed + SEED_CONTRACT.enforceUnmetWon
            ? 2
            : 3
    const start =
      block === 0
        ? 0
        : block === 1
          ? SEED_CONTRACT.enforceMetWon
          : block === 2
            ? SEED_CONTRACT.enforceMetClosed
            : SEED_CONTRACT.enforceMetClosed + SEED_CONTRACT.enforceUnmetWon
    const segment = balancedSegment(block, index - start)
    const unmetProblem = row.problem === "not_met"
    const stacked = unmetProblem && stackedLeft > 0 && index % 3 === 0
    if (stacked) stackedLeft -= 1
    const sinceClose = 3 + (index % 60)
    const cycleDays = cycleDaysFor(segment, unmetProblem, index)
    const opp = makeOpportunity({
      id: `opp-pd-${String(index + 1).padStart(3, "0")}`,
      index,
      outcome: row.outcome,
      segment,
      cycleDays,
      stage: "Evaluate",
      sinceClose,
    })
    opps.push(opp)
    demoOpps.push(opp)
    const demoAgo = Math.min(84, sinceClose + 6 + (index % 12))
    activities.push(
      addActivity({
        id: `act-${opp.id}`,
        opportunity: opp,
        play: demo,
        date: addDays(SEED_AS_OF, -demoAgo),
        stageAtActivity: "Evaluate",
        checks: {
          "demo-discovery": stacked ? "not_met" : "met",
          "demo-problem": row.problem,
          "demo-champion": unmetProblem ? championStatus(row.outcome, index) : "met",
        },
        note: stacked ? "Discovery and confirmed problem both skipped." : undefined,
      })
    )
    if (index % 10 !== 9) {
      activities.push(
        addActivity({
          id: `act-${opp.id}-disc`,
          opportunity: opp,
          play: discovery,
          dayOffset: 22 + (index % 16),
          stageAtActivity: index < SEED_CONTRACT.offStageDiscoveryCount ? "Validate" : "Qualify",
          checks: {
            "discovery-aligned": skipDiscovery(index) ? "not_met" : "met",
            "discovery-problem": index % 13 === 0 ? "not_met" : "met",
            "discovery-owner": "met",
          },
          note: index < SEED_CONTRACT.offStageDiscoveryCount ? "Used outside the play’s typical stage." : undefined,
        })
      )
    }
    const lateStage = index % 3 === 0 && (row.outcome === "won" || unmetProblem)
    if (lateStage) {
      activities.push(
        addActivity({
          id: `act-${opp.id}-arch`,
          opportunity: opp,
          play: architecture,
          date: addDays(SEED_AS_OF, -(10 + (index % 62))),
          stageAtActivity: "Validate",
          checks: {
            "arch-risks": index % 7 === 0 ? "not_met" : "met",
            "arch-stakeholder": "met",
            "arch-path": index % 19 === 0 ? "not_met" : "met",
          },
        })
      )
    }
    if (index % 4 === 0 && (row.outcome === "won" || (unmetProblem && index % 8 === 0))) {
      activities.push(
        addActivity({
          id: `act-${opp.id}-poc`,
          opportunity: opp,
          play: poc,
          date: addDays(SEED_AS_OF, -(7 + (index % 40))),
          stageAtActivity: "Prove",
          checks: {
            "poc-criteria": index % 5 === 0 ? "not_met" : "met",
            "poc-technical": index % 11 === 0 ? "not_met" : "met",
          },
        })
      )
    }
  })

  for (let index = 0; index < SEED_CONTRACT.productDemoOpen; index++) {
    const segment = pickSegment(80 + index)
    const opp = makeOpportunity({
      id: `opp-pd-open-${String(index + 1).padStart(3, "0")}`,
      index: 80 + index,
      outcome: "open",
      segment,
      cycleDays: 0,
      stage: "Evaluate",
      ageDays: 48 + (index % 110),
    })
    opps.push(opp)
    activities.push(
      addActivity({
        id: `act-${opp.id}`,
        opportunity: opp,
        play: demo,
        date: addDays(SEED_AS_OF, -(6 + index * 7)),
        stageAtActivity: "Evaluate",
        checks: {
          "demo-discovery": "met",
          "demo-problem": index % 4 === 0 ? "not_met" : "met",
          "demo-champion": index % 2 === 0 ? "met" : "not_met",
        },
      })
    )
    if (index < 6) {
      activities.push(
        addActivity({
          id: `act-${opp.id}-disc`,
          opportunity: opp,
          play: discovery,
          date: addDays(SEED_AS_OF, -(20 + index * 8)),
          stageAtActivity: "Qualify",
          checks: {
            "discovery-aligned": "met",
            "discovery-problem": "met",
            "discovery-owner": "met",
          },
        })
      )
    }
  }

  demoOpps.slice(0, SEED_CONTRACT.repeatedOpportunityCount).forEach((opp, index) => {
    const first = activities.find((item) => item.id === `act-${opp.id}`)
    if (!first || !first.play) return
    activities.push(
      addActivity({
        id: `act-${opp.id}-repeat`,
        opportunity: opp,
        play: first.play,
        date: addDays(first.activityDate, 14),
        stageAtActivity: "Evaluate",
        checks: first.checks,
        note: "Second Product Demo on the same opportunity. Outcome is counted once.",
      })
    )
    if (addDays(first.activityDate, 14) >= SEED_AS_OF) {
      activities[activities.length - 1]!.activityDate = addDays(SEED_AS_OF, -(2 + (index % 4)))
    }
  })

  for (let index = 0; index < SEED_CONTRACT.investigateClosed; index++) {
    const outcome: OpportunityOutcome = index < 3 ? "won" : "lost"
    const unmet = index >= 5
    const segment = pickSegment(200 + index)
    const opp = makeOpportunity({
      id: `opp-ws-${String(index + 1).padStart(3, "0")}`,
      index: 200 + index,
      outcome,
      segment,
      cycleDays: cycleDaysFor(segment, unmet, index + 17),
      stage: "Evaluate",
      sinceClose: 8 + index * 7,
    })
    opps.push(opp)
    activities.push(
      addActivity({
        id: `act-${opp.id}`,
        opportunity: opp,
        play: workshop,
        date: addDays(SEED_AS_OF, -(9 + index * 8)),
        stageAtActivity: "Evaluate",
        checks: {
          "workshop-agenda": unmet ? "not_met" : "met",
          "workshop-workflow": "met",
        },
      })
    )
  }

  for (let index = 0; index < 3; index++) {
    const segment = pickSegment(300 + index)
    const opp = makeOpportunity({
      id: `opp-disc-open-${String(index + 1).padStart(3, "0")}`,
      index: 300 + index,
      outcome: "open",
      segment,
      cycleDays: 0,
      stage: "Qualify",
      ageDays: 28 + index * 12,
    })
    opps.push(opp)
    activities.push(
      addActivity({
        id: `act-${opp.id}`,
        opportunity: opp,
        play: discovery,
        date: addDays(SEED_AS_OF, -(5 + index * 9)),
        stageAtActivity: "Qualify",
        checks: {
          "discovery-aligned": "met",
          "discovery-problem": index === 2 ? "not_met" : "met",
          "discovery-owner": "met",
        },
      })
    )
  }

  const undefOnly = makeOpportunity({
    id: "opp-undef-01",
    index: 400,
    outcome: "open",
    segment: "Mid-Market",
    cycleDays: 0,
    stage: "Validate",
    ageDays: 64,
  })
  opps.push(undefOnly)

  const undefHosts = [...demoOpps.slice(0, 21), undefOnly]
  for (let index = 0; index < SEED_CONTRACT.undefinedActivityCount; index++) {
    const opp = undefHosts[index] ?? undefOnly
    const recent = index < 12
    const date = addDays(SEED_AS_OF, recent ? -(4 + index * 3) : -(48 + (index % 30)))
    const activity = addUndefined({
      id: `act-undef-${String(index + 1).padStart(3, "0")}`,
      opportunity: opp,
      label: UNDEFINED_SECURITY_LABEL,
      date,
      stageAtActivity: "Validate",
      note: "Logged off-playbook. No recommended-prerequisite snapshot exists.",
    })
    if (recent && index < 8) activity.seName = NORA.name
    activities.push(activity)
  }

  for (let index = 0; index < SEED_CONTRACT.briefingActivityCount; index++) {
    const host = opps[index * 11] ?? opps[0]!
    activities.push(
      addUndefined({
        id: `act-brief-${String(index + 1).padStart(2, "0")}`,
        opportunity: host,
        label: UNDEFINED_BRIEFING_LABEL,
        date: addDays(SEED_AS_OF, -(18 + index * 11)),
        stageAtActivity: "Propose",
        note: "Process mining walkthrough outside the standard five plays.",
      })
    )
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
      segment: item.segment,
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
