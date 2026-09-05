import { describe, expect, it } from "vitest"

import { hygieneUrgencyFill } from "@/lib/dates"
import { formatCycle, formatCycleDelta, formatRelativeAgo } from "@/lib/format"

describe("hygiene countdown ring", () => {
  it("fills as the review date approaches", () => {
    expect(hygieneUrgencyFill(90)).toBe(0)
    expect(hygieneUrgencyFill(0)).toBe(100)
    expect(hygieneUrgencyFill(-3)).toBe(100)
    expect(hygieneUrgencyFill(9)).toBe(90)
    expect(hygieneUrgencyFill(45)).toBe(50)
    expect(hygieneUrgencyFill(9)).toBeGreaterThan(hygieneUrgencyFill(80))
  })
})

describe("cycle time formatting", () => {
  it("uses months once a deal is longer than about six weeks", () => {
    expect(formatCycle(12)).toBe("12 days")
    expect(formatCycle(210)).toBe("6.9 months")
    expect(formatCycle(278)).toBe("9.1 months")
    expect(formatCycleDelta(36)).toBe("1.2 months slower")
    expect(formatCycleDelta(-62)).toBe("2 months faster")
  })
})

describe("relative timestamps", () => {
  it("formats minutes from a live date, not a fixed string", () => {
    const asOf = new Date("2026-09-05T12:00:00Z")
    expect(formatRelativeAgo(new Date("2026-09-05T11:56:00Z"), asOf)).toBe("4 min ago")
    expect(formatRelativeAgo(new Date("2026-09-05T11:58:00Z"), asOf)).toBe("2 min ago")
    expect(formatRelativeAgo(new Date("2026-09-03T12:00:00Z"), asOf)).toBe("2 days ago")
  })
})
