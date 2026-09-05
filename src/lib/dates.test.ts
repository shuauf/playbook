import { describe, expect, it } from "vitest"

import { hygieneUrgencyFill } from "@/lib/dates"
import { formatRelativeAgo } from "@/lib/format"

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

describe("relative timestamps", () => {
  it("formats minutes from a live date, not a fixed string", () => {
    const asOf = new Date("2026-09-05T12:00:00Z")
    expect(formatRelativeAgo(new Date("2026-09-05T11:56:00Z"), asOf)).toBe("4 min ago")
    expect(formatRelativeAgo(new Date("2026-09-05T11:58:00Z"), asOf)).toBe("2 min ago")
    expect(formatRelativeAgo(new Date("2026-09-03T12:00:00Z"), asOf)).toBe("2 days ago")
  })
})
