export const PLAY_STATUSES = ["active", "retired"] as const
export type PlayStatus = (typeof PLAY_STATUSES)[number]

export const OPPORTUNITY_OUTCOMES = ["open", "won", "lost"] as const
export type OpportunityOutcome = (typeof OPPORTUNITY_OUTCOMES)[number]

export const RECORD_SOURCES = ["demo", "import", "manual"] as const
export type RecordSource = (typeof RECORD_SOURCES)[number]

export const CAPTURE_KINDS = ["defined", "undefined"] as const
export type CaptureKind = (typeof CAPTURE_KINDS)[number]

export const PREREQUISITE_STATUSES = ["met", "not_met"] as const
export type PrerequisiteStatus = (typeof PREREQUISITE_STATUSES)[number]

export const UNDEFINED_LABEL_STATUSES = ["open", "mapped", "formalized", "leftover"] as const
export type UndefinedLabelStatus = (typeof UNDEFINED_LABEL_STATUSES)[number]

export const PERSON_ROLES = ["se", "ae"] as const
export type PersonRole = (typeof PERSON_ROLES)[number]

export const PIPELINE_STAGES = [
  "Qualify",
  "Evaluate",
  "Propose",
  "Validate",
  "Prove",
] as const
export type PipelineStage = (typeof PIPELINE_STAGES)[number]

export const SEGMENTS = ["SMB", "Mid-market", "Enterprise"] as const
export type Segment = (typeof SEGMENTS)[number]

export const TEAMS = ["West", "East", "Strategic"] as const
export type Team = (typeof TEAMS)[number]

export const ACTION_CLASSES = [
  "enforce",
  "revisit",
  "investigate",
  "define",
  "monitor",
] as const
export type ActionClass = (typeof ACTION_CLASSES)[number]

export const CONFIDENCE_LEVELS = ["insufficient", "directional", "supported"] as const
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number]

export type TypicalStages = PipelineStage[]
