import type { ActionClass, ConfidenceLevel, OpportunityOutcome } from "@/lib/domain/types"
import type { HealthFilters } from "@/lib/navigation"

export type AnalysisOpportunity = {
  id: string
  name: string
  account: string
  segment: string
  stage: string
  outcome: OpportunityOutcome
  seName: string
  team: string
  createdAt: Date
  closeDate: Date | null
}

export type AnalysisActivity = {
  id: string
  opportunityId: string
  playId: string | null
  playName: string
  typicalStages: string[]
  captureKind: "defined" | "undefined"
  undefinedLabel: string | null
  activityDate: Date
  stageAtActivity: string
  seName: string
  evaluatedKeys: string[]
  unmetKeys: string[]
  snapshotCount: number
}

export type AnalysisPlay = {
  id: string
  name: string
  status: string
  typicalStages: string[]
}

export type AnalysisSnapshot = {
  opportunities: AnalysisOpportunity[]
  activities: AnalysisActivity[]
  plays: AnalysisPlay[]
}

export type PeriodWindow = {
  start: Date | null
  end: Date
}

export type RateComparison = {
  metRate: number | null
  unmetRate: number | null
  difference: number | null
  metN: number
  unmetN: number
  metWins: number
  unmetWins: number
  confidence: ConfidenceLevel
}

export type CycleComparison = {
  metDays: number | null
  unmetDays: number | null
  differenceDays: number | null
  metN: number
  unmetN: number
  confidence: ConfidenceLevel
}

export type PlayFinding = {
  playId: string
  playName: string
  activityCount: number
  opportunityCount: number
  closedOpportunityCount: number
  exceptionRate: number | null
  exceptionCount: number
  definedActivityCount: number
  win: RateComparison
  cycle: CycleComparison
}

export type PrerequisiteFinding = {
  playId: string
  playName: string
  key: string
  text: string
  activityCount: number
  closedOpportunityCount: number
  unmetRate: number | null
  win: RateComparison
  cycle: CycleComparison
}

export type SignalFrequency = {
  key: string
  label: string
  playName: string
  metRate: number
}

export type SignalTrendPoint = {
  label: string
  metRate: number
}

export type PerformanceTrendPoint = {
  label: string
  winRate: number | null
  exceptionRate: number | null
  cycleDays: number | null
  closedCount: number
  definedCount: number
}

export type StackingBucket = {
  key: "none" | "one" | "twoPlus"
  label: string
  opportunityCount: number
  closedCount: number
  winRate: number | null
  medianCycleDays: number | null
  wonCount: number
}

export type LookCloserItem = {
  id: string
  kind: "gap" | "gong" | "define"
  label: string
  body: string
  href: string
  playId?: string
  prerequisiteKey?: string
}

export type ActionItem = {
  id: string
  classification: ActionClass
  subject: string
  playId: string | null
  playName: string | null
  evidence: string
  sampleSize: number
  confidence: ConfidenceLevel
  href: string
}

export type HygieneIssue = {
  id: string
  kind: "undefined" | "off_stage" | "low_usage" | "missing_snapshots"
  name: string
  activityCount: number
  opportunityCount: number
  firstAt: string | null
  lastAt: string | null
  href: string
  action: string
}

export type PortfolioMetric = {
  id: string
  label: string
  value: string
  raw: number | null
  prior: string | null
  delta: number | null
  definition: string
  href: string
}

export type HealthAnalysis = {
  filters: HealthFilters
  window: PeriodWindow
  priorWindow: PeriodWindow | null
  pulse: string
  metrics: PortfolioMetric[]
  plays: PlayFinding[]
  prerequisites: PrerequisiteFinding[]
  signalFrequencies: SignalFrequency[]
  signalTrend: SignalTrendPoint[]
  performanceTrend: PerformanceTrendPoint[]
  performanceTrendByPlay: Record<string, PerformanceTrendPoint[]>
  stacking: StackingBucket[]
  stackingUseful: boolean
  actions: ActionItem[]
  lookCloser: LookCloserItem[]
  hygiene: HygieneIssue[]
  totals: {
    activities: number
    definedActivities: number
    exceptionActivities: number
    undefinedActivities: number
    opportunities: number
    closedOpportunities: number
  }
}
