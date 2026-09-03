import { describe, expect, it } from "vitest"

import { DEMO_PLAYS } from "@/lib/db/catalog"
import { buildPlantedWorkspace, SEED_CONTRACT } from "@/lib/db/seed-planted"

describe("planted development dataset", () => {
  const planted = buildPlantedWorkspace()
  const productDemo = DEMO_PLAYS.find((play) => play.id === "play-product-demo")!

  function closedDemoPairs() {
    const demoActivities = planted.activities.filter(
      (item) => item.captureKind === "defined" && item.play?.id === "play-product-demo"
    )
    const byOpp = new Map<string, typeof demoActivities>()
    for (const activity of demoActivities) {
      const list = byOpp.get(activity.opportunityId) ?? []
      list.push(activity)
      byOpp.set(activity.opportunityId, list)
    }
    return [...byOpp.entries()]
      .map(([opportunityId, activities]) => {
        const opp = planted.opportunities.find((item) => item.id === opportunityId)
        return { opp, activities }
      })
      .filter((row) => row.opp && row.opp.outcome !== "open")
  }

  it("plants hundreds of opportunities and activities", () => {
    expect(planted.opportunities.length).toBeGreaterThanOrEqual(SEED_CONTRACT.minOpportunities)
    expect(planted.activities.length).toBeGreaterThanOrEqual(SEED_CONTRACT.minActivities)
  })

  it("plants a supported-size win-rate gap for the business-problem prerequisite", () => {
    const pairs = closedDemoPairs()
    const met = pairs.filter((row) =>
      row.activities.every((activity) => activity.checks["demo-problem"] === "met")
    )
    const unmet = pairs.filter((row) =>
      row.activities.some((activity) => activity.checks["demo-problem"] === "not_met")
    )
    expect(met).toHaveLength(SEED_CONTRACT.enforceMetClosed)
    expect(unmet).toHaveLength(SEED_CONTRACT.enforceUnmetClosed)
    const metWin = met.filter((row) => row.opp?.outcome === "won").length / met.length
    const unmetWin = unmet.filter((row) => row.opp?.outcome === "won").length / unmet.length
    expect(metWin).toBeCloseTo(SEED_CONTRACT.enforceMetWon / SEED_CONTRACT.enforceMetClosed, 5)
    expect(unmetWin).toBeCloseTo(SEED_CONTRACT.enforceUnmetWon / SEED_CONTRACT.enforceUnmetClosed, 5)
    expect(metWin - unmetWin).toBeGreaterThan(0.2)
  })

  it("plants a frequently skipped prerequisite with little outcome difference", () => {
    const pairs = closedDemoPairs()
    const met = pairs.filter((row) =>
      row.activities.every((activity) => activity.checks["demo-champion"] === "met")
    )
    const unmet = pairs.filter((row) =>
      row.activities.some((activity) => activity.checks["demo-champion"] === "not_met")
    )
    expect(unmet.length).toBeGreaterThan(80)
    const metWin = met.filter((row) => row.opp?.outcome === "won").length / met.length
    const unmetWin = unmet.filter((row) => row.opp?.outcome === "won").length / unmet.length
    expect(Math.abs(metWin - unmetWin)).toBeLessThan(0.08)
  })

  it("keeps the Workshop pattern too small to be Supported", () => {
    const workshop = planted.activities.filter((item) => item.play?.id === "play-workshop")
    const closed = new Set(
      workshop
        .filter((activity) => {
          const opp = planted.opportunities.find((item) => item.id === activity.opportunityId)
          return opp && opp.outcome !== "open"
        })
        .map((item) => item.opportunityId)
    )
    expect(closed.size).toBe(SEED_CONTRACT.investigateClosed)
    expect(SEED_CONTRACT.investigateClosed).toBeLessThan(15)
  })

  it("does not invent prerequisite snapshots for undefined activities", () => {
    const undefinedActivities = planted.activities.filter((item) => item.captureKind === "undefined")
    const security = undefinedActivities.filter((item) => item.undefinedLabel === SEED_CONTRACT.undefinedLabel)
    expect(security).toHaveLength(SEED_CONTRACT.undefinedActivityCount)
    expect(undefinedActivities.every((item) => Object.keys(item.checks).length === 0)).toBe(true)
  })

  it("repeats Product Demo on the same opportunities without adding extra opportunities", () => {
    const repeats = planted.activities.filter((item) => item.id.endsWith("-repeat"))
    expect(repeats).toHaveLength(SEED_CONTRACT.repeatedOpportunityCount)
    expect(new Set(repeats.map((item) => item.opportunityId)).size).toBe(
      SEED_CONTRACT.repeatedOpportunityCount
    )
  })

  it("includes off-stage Discovery usage", () => {
    const offStage = planted.activities.filter(
      (item) =>
        item.captureKind === "defined" &&
        item.play?.id === "play-discovery" &&
        item.stageAtActivity !== "Qualify"
    )
    expect(offStage.length).toBeGreaterThanOrEqual(SEED_CONTRACT.offStageDiscoveryCount)
  })

  it("covers every catalog play with a first version", () => {
    expect(DEMO_PLAYS).toHaveLength(SEED_CONTRACT.playCount)
    expect(productDemo.prerequisites.map((item) => item.key)).toEqual([
      "demo-discovery",
      "demo-problem",
      "demo-champion",
    ])
  })
})
