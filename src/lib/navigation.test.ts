import { describe, expect, it } from "vitest"

import { parseExplorerView, parseHealthFilters } from "@/lib/navigation"

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
  })

  it("defaults the explorer to opportunities", () => {
    expect(parseExplorerView(undefined)).toBe("opportunities")
    expect(parseExplorerView("activities")).toBe("activities")
    expect(parseExplorerView("nope")).toBe("opportunities")
  })
})
