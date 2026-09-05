import { describe, expect, it } from "vitest"

import {
  filterActivities,
  filterOpportunities,
  matchesSearch,
  prerequisiteRollupLabel,
} from "@/lib/explorer/search"
import type { ExplorerActivity, ExplorerOpportunity } from "@/lib/explorer/types"
import { DEFAULT_EXPLORER_FILTERS } from "@/lib/navigation"

const opportunities: ExplorerOpportunity[] = [
  {
    id: "opp-1",
    name: "Northwind renewal",
    account: "Northwind Traders",
    segment: "Mid-market",
    stage: "Evaluate",
    outcome: "open",
    seName: "Maya Chen",
    aeName: "Alex Rivera",
    team: "West",
    createdAt: "Jan 2, 2026",
    closeDate: null,
    activityCount: 2,
    playIds: ["play-product-demo"],
    hasUndefined: false,
  },
  {
    id: "opp-2",
    name: "Contoso security review",
    account: "Contoso",
    segment: "Enterprise",
    stage: "Validate",
    outcome: "won",
    seName: "Priya Shah",
    aeName: "Dana Cho",
    team: "Strategic",
    createdAt: "Jan 4, 2026",
    closeDate: "Mar 1, 2026",
    activityCount: 1,
    playIds: [],
    hasUndefined: true,
  },
]

const activities: ExplorerActivity[] = [
  {
    id: "act-1",
    date: "Jan 12, 2026",
    opportunityId: "opp-1",
    opportunityName: "Northwind renewal",
    account: "Northwind Traders",
    playId: "play-product-demo",
    playName: "Product Demo",
    stageAtActivity: "Evaluate",
    seName: "Maya Chen",
    team: "West",
    outcome: "open",
    captureKind: "defined",
    allPrerequisitesMet: false,
    unmetCount: 1,
  },
  {
    id: "act-2",
    date: "Jan 18, 2026",
    opportunityId: "opp-2",
    opportunityName: "Contoso security review",
    account: "Contoso",
    playId: null,
    playName: "Security questionnaire walkthrough",
    stageAtActivity: "Validate",
    seName: "Priya Shah",
    team: "Strategic",
    outcome: "won",
    captureKind: "undefined",
    allPrerequisitesMet: null,
    unmetCount: null,
  },
]

describe("explorer search", () => {
  it("matches every token across forgiving fields", () => {
    expect(matchesSearch(["Northwind renewal", "Maya Chen"], "north maya")).toBe(true)
    expect(matchesSearch(["Northwind renewal", "Maya Chen"], "contoso")).toBe(false)
  })

  it("filters opportunities by search, owner, and play", () => {
    expect(
      filterOpportunities(opportunities, { ...DEFAULT_EXPLORER_FILTERS, q: "northwind" }).map(
        (row) => row.id
      )
    ).toEqual(["opp-1"])
    expect(
      filterOpportunities(opportunities, { ...DEFAULT_EXPLORER_FILTERS, se: "Priya Shah" }).map(
        (row) => row.id
      )
    ).toEqual(["opp-2"])
    expect(
      filterOpportunities(opportunities, {
        ...DEFAULT_EXPLORER_FILTERS,
        playId: "play-product-demo",
      }).map((row) => row.id)
    ).toEqual(["opp-1"])
    expect(
      filterOpportunities(opportunities, { ...DEFAULT_EXPLORER_FILTERS, playId: "undefined" }).map(
        (row) => row.id
      )
    ).toEqual(["opp-2"])
  })

  it("filters activities by undefined capture and play name search", () => {
    expect(
      filterActivities(activities, { ...DEFAULT_EXPLORER_FILTERS, capture: "undefined" }).map(
        (row) => row.id
      )
    ).toEqual(["act-2"])
    expect(
      filterActivities(activities, { ...DEFAULT_EXPLORER_FILTERS, q: "questionnaire" }).map(
        (row) => row.id
      )
    ).toEqual(["act-2"])
    expect(
      filterActivities(activities, { ...DEFAULT_EXPLORER_FILTERS, outcome: "open" }).map(
        (row) => row.id
      )
    ).toEqual(["act-1"])
  })

  it("labels prerequisite rollups without calling them signals", () => {
    expect(prerequisiteRollupLabel(true, 0)).toBe("All prerequisites present")
    expect(prerequisiteRollupLabel(false, 1)).toBe("1 prerequisite missing")
    expect(prerequisiteRollupLabel(false, 3)).toBe("3 prerequisites missing")
    expect(prerequisiteRollupLabel(null, null)).toBe("Off-playbook")
  })
})
