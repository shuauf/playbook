import { describe, expect, it } from "vitest"

import {
  explorerQuery,
  healthQuery,
  parseExplorerFilters,
  parseExplorerView,
  parseHealthFilters,
} from "@/lib/navigation"

describe("navigation parsers", () => {
  it("defaults Health filters to the last 90 days", () => {
    expect(parseHealthFilters({})).toMatchObject({
      period: "90",
      playId: "all",
      outcome: "all",
    })
  })

  it("keeps recognized filter values and rejects unknown periods", () => {
    expect(
      parseHealthFilters({
        period: "180",
        playId: "play-product-demo",
        outcome: "won",
        stage: "Evaluate",
      })
    ).toEqual({
      period: "180",
      playId: "play-product-demo",
      stage: "Evaluate",
      segment: "all",
      team: "all",
      se: "all",
      outcome: "won",
    })
    expect(parseHealthFilters({ period: "tomorrow" }).period).toBe("90")
    expect(healthQuery({ ...parseHealthFilters({}), period: "180", playId: "play-workshop" })).toBe(
      "period=180&playId=play-workshop"
    )
  })

  it("defaults the explorer to opportunities", () => {
    expect(parseExplorerView(undefined)).toBe("opportunities")
    expect(parseExplorerView("activities")).toBe("activities")
    expect(parseExplorerView("nope")).toBe("opportunities")
  })

  it("parses explorer search and omits default query params", () => {
    expect(parseExplorerFilters({ view: "activities", q: "northwind", capture: "undefined" })).toEqual({
      view: "activities",
      q: "northwind",
      outcome: "all",
      team: "all",
      se: "all",
      playId: "all",
      stage: "all",
      capture: "undefined",
    })
    expect(
      explorerQuery({
        view: "opportunities",
        q: "  maya  ",
        outcome: "all",
        team: "all",
        se: "all",
        playId: "all",
        stage: "all",
        capture: "all",
      })
    ).toBe("q=maya")
  })
})
