import { describe, expect, it } from "vitest"

import { classifyConfidence, twoProportionSignificant } from "@/lib/analysis/confidence"
import { ACTION_RULES, rankActions } from "@/lib/analysis/actions"
import {
  activityHasException,
  filterActivities,
  opportunityPlayPairs,
  playFindings,
  portfolioStats,
  rateComparison,
} from "@/lib/analysis/compute"
import { analyzeHealth } from "@/lib/analysis/dashboard"
import { periodWindow } from "@/lib/analysis/period"
import { assemblePulse } from "@/lib/analysis/pulse"
import type { AnalysisActivity, AnalysisOpportunity, AnalysisSnapshot } from "@/lib/analysis/types"
import { DEFAULT_HEALTH_FILTERS } from "@/lib/navigation"
import { buildPlantedWorkspace, SEED_AS_OF, SEED_CONTRACT } from "@/lib/db/seed-planted"

function snapshotFromPlanted(): AnalysisSnapshot {
  const planted = buildPlantedWorkspace()
  const opportunities: AnalysisOpportunity[] = planted.opportunities.map((item) => ({
    id: item.id,
    name: item.name,
    account: item.account,
    segment: item.segment,
    stage: item.stage,
    outcome: item.outcome,
    seName: item.seName,
    team: item.team,
    createdAt: item.createdAt,
    closeDate: item.closeDate,
  }))
  const activities: AnalysisActivity[] = planted.activities.map((item) => {
    const evaluatedKeys = item.play?.prerequisites.map((prereq) => prereq.key) ?? []
    return {
      id: item.id,
      opportunityId: item.opportunityId,
      playId: item.play?.id ?? null,
      playName: item.play?.name ?? item.undefinedLabel ?? "Undefined",
      typicalStages: item.play?.typicalStages ?? [],
      captureKind: item.captureKind,
      undefinedLabel: item.undefinedLabel ?? null,
      activityDate: item.activityDate,
      stageAtActivity: item.stageAtActivity,
      seName: item.seName,
      evaluatedKeys,
      unmetKeys: evaluatedKeys.filter((key) => item.checks[key] === "not_met"),
      snapshotCount: item.captureKind === "undefined" ? 0 : evaluatedKeys.length,
    }
  })
  return {
    opportunities,
    activities,
    plays: [
      { id: "play-discovery", name: "Discovery", status: "active", typicalStages: ["Qualify"] },
      { id: "play-product-demo", name: "Product Demo", status: "active", typicalStages: ["Evaluate"] },
      {
        id: "play-architecture-review",
        name: "Architecture Review",
        status: "active",
        typicalStages: ["Validate"],
      },
      { id: "play-workshop", name: "Workshop", status: "active", typicalStages: ["Evaluate", "Propose"] },
      { id: "play-poc", name: "Proof of Concept", status: "active", typicalStages: ["Prove"] },
    ],
  }
}

describe("analysis engine", () => {
  const snapshot = snapshotFromPlanted()
  const allTime = analyzeHealth(snapshot, { ...DEFAULT_HEALTH_FILTERS, period: "all" }, SEED_AS_OF)
  const current = analyzeHealth(snapshot, DEFAULT_HEALTH_FILTERS, SEED_AS_OF)

  it("does not count repeated executions as extra opportunity outcomes", () => {
    const demoActivities = snapshot.activities.filter((item) => item.playId === "play-product-demo")
    const pairs = opportunityPlayPairs(snapshot, demoActivities)
    const repeats = demoActivities.filter((item) => item.id.endsWith("-repeat"))
    expect(repeats.length).toBe(SEED_CONTRACT.repeatedOpportunityCount)
    expect(pairs.length).toBeLessThan(demoActivities.length)
    expect(pairs.every((pair) => pair.activities.length >= 1)).toBe(true)
  })

  it("classifies an activity as an exception only when a defined snapshot is unmet", () => {
    const defined = snapshot.activities.find(
      (item) => item.captureKind === "defined" && item.unmetKeys.length > 0
    )
    const clean = snapshot.activities.find(
      (item) => item.captureKind === "defined" && item.unmetKeys.length === 0
    )
    const undefinedActivity = snapshot.activities.find((item) => item.captureKind === "undefined")
    expect(activityHasException(defined!)).toBe(true)
    expect(activityHasException(clean!)).toBe(false)
    expect(activityHasException(undefinedActivity!)).toBe(false)
  })

  it("computes win rate from unique closed opportunity-play pairs", () => {
    const demo = allTime.plays.find((item) => item.playId === "play-product-demo")
    expect(demo?.win.metN).toBeGreaterThanOrEqual(40)
    expect(demo?.win.unmetN).toBeGreaterThanOrEqual(40)
    expect(demo?.win.difference).toBeGreaterThan(0.08)
    expect(demo?.win.confidence).toBe("supported")
    const problem = allTime.prerequisites.find((item) => item.key === "demo-problem")
    expect(problem?.win.metN).toBe(SEED_CONTRACT.enforceMetClosed)
    expect(problem?.win.unmetN).toBe(SEED_CONTRACT.enforceUnmetClosed)
    expect(problem?.win.difference).toBeGreaterThan(0.2)
  })

  it("uses won opportunities only for cycle-time comparison", () => {
    const demo = allTime.plays.find((item) => item.playId === "play-product-demo")
    expect(demo?.cycle.metN).toBeGreaterThan(0)
    expect(demo?.cycle.unmetN).toBeGreaterThan(0)
    expect((demo?.cycle.metN ?? 0) + (demo?.cycle.unmetN ?? 0)).toBe(
      SEED_CONTRACT.enforceMetWon + SEED_CONTRACT.enforceUnmetWon
    )
    expect(demo?.cycle.differenceDays).toBeGreaterThan(10)
  })

  it("classifies confidence from sample size and significance", () => {
    expect(classifyConfidence(10, 40, { metWins: 8, unmetWins: 10 })).toBe("insufficient")
    expect(classifyConfidence(20, 20, { metWins: 14, unmetWins: 10 })).toBe("directional")
    expect(twoProportionSignificant(200, 130, 160, 64)).toBe(true)
    expect(classifyConfidence(200, 160, { metWins: 130, unmetWins: 64 })).toBe("supported")
  })

  it("compares the current period against the immediately preceding window", () => {
    expect(current.priorWindow).toBeTruthy()
    expect(current.metrics.every((item) => item.value.length > 0)).toBe(true)
    expect(current.totals.activities).toBeGreaterThan(200)
    expect(current.totals.closedOpportunities).toBeGreaterThan(150)
    const demo = current.plays.find((item) => item.playId === "play-product-demo")
    expect(demo?.win.confidence).toBe("supported")
    expect(demo?.win.difference).toBeGreaterThan(0.08)
    expect(current.actions.some((item) => item.classification === "enforce")).toBe(true)
  })

  it("ranks deterministic actions from the planted story", () => {
    const classes = allTime.actions.map((item) => item.classification)
    expect(classes).toContain("enforce")
    expect(classes).toContain("revisit")
    expect(classes).toContain("define")
    expect(classes).toContain("investigate")
    expect(allTime.actions.length).toBeLessThanOrEqual(ACTION_RULES.maxItems)
    expect(allTime.actions[0]?.classification).toBe("enforce")
  })

  it("excludes undefined activities from exception rate", () => {
    const stats = portfolioStats(snapshot, snapshot.activities)
    expect(stats.undefinedActivities).toBeGreaterThan(0)
    expect(stats.definedActivities + stats.undefinedActivities).toBe(snapshot.activities.length)
    expect(stats.exceptionActivities).toBeLessThanOrEqual(stats.definedActivities)
  })

  it("keeps open opportunities out of win-rate denominators", () => {
    const open = snapshot.opportunities.filter((item) => item.outcome === "open")
    const closed = snapshot.opportunities.filter((item) => item.outcome !== "open")
    const comparison = rateComparison(closed, [])
    expect(comparison.metN).toBe(closed.length)
    expect(open.length).toBeGreaterThan(0)
    expect(allTime.totals.closedOpportunities).toBeLessThan(snapshot.opportunities.length)
  })

  it("applies filters without inventing undefined compliance", () => {
    const window = periodWindow("all", SEED_AS_OF)
    const filtered = filterActivities(
      snapshot,
      { ...DEFAULT_HEALTH_FILTERS, period: "all", playId: "undefined" },
      window
    )
    expect(filtered.every((item) => item.captureKind === "undefined")).toBe(true)
    const findings = playFindings(snapshot, filtered)
    expect(findings.every((item) => item.exceptionRate === null || item.definedActivityCount === 0)).toBe(
      true
    )
  })

  it("falls back when a slice has no closed opportunities", () => {
    const pulse = assemblePulse({
      exceptionRate: 0.3,
      definedActivities: 12,
      closedOpportunities: 0,
      plays: [],
      actions: [],
    })
    expect(pulse).toMatch(/not yet enough closed-opportunity data/)
  })

  it("builds a pulse from computed findings", () => {
    expect(allTime.pulse).toMatch(/exception/i)
    expect(allTime.pulse).not.toMatch(/\bAI\b|chatbot|future analysis/i)
  })

  it("ranks enforce above dramatic low-volume findings", () => {
    const ranked = rankActions({
      plays: allTime.plays,
      prerequisites: allTime.prerequisites,
      hygiene: allTime.hygiene,
    })
    const enforceIndex = ranked.findIndex((item) => item.classification === "enforce")
    const investigateIndex = ranked.findIndex((item) => item.classification === "investigate")
    expect(enforceIndex).toBeGreaterThanOrEqual(0)
    if (investigateIndex >= 0) expect(enforceIndex).toBeLessThan(investigateIndex)
  })
})
