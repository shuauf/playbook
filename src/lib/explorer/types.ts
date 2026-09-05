export type ExplorerOpportunity = {
  id: string
  name: string
  account: string
  segment: string
  stage: string
  outcome: string
  seName: string
  aeName: string
  team: string
  createdAt: string
  closeDate: string | null
  activityCount: number
  playIds: string[]
  hasUndefined: boolean
}

export type ExplorerActivity = {
  id: string
  date: string
  opportunityId: string
  opportunityName: string
  account: string
  playId: string | null
  playName: string
  stageAtActivity: string
  seName: string
  team: string
  segment: string
  outcome: string
  captureKind: "defined" | "undefined"
  allPrerequisitesMet: boolean | null
  unmetCount: number | null
}

export type ExplorerPlayOption = {
  id: string
  name: string
}
