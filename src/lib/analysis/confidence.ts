import type { ConfidenceLevel } from "@/lib/domain/types"

export const CONFIDENCE_RULES = {
  insufficientMax: 14,
  directionalMax: 39,
  supportedMin: 40,
  zCritical: 1.96,
} as const

export function twoProportionSignificant(
  n1: number,
  successes1: number,
  n2: number,
  successes2: number
) {
  if (n1 <= 0 || n2 <= 0) return false
  const p1 = successes1 / n1
  const p2 = successes2 / n2
  const pooled = (successes1 + successes2) / (n1 + n2)
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2))
  if (!Number.isFinite(se) || se === 0) return false
  return Math.abs(p1 - p2) / se >= CONFIDENCE_RULES.zCritical
}

export function classifyConfidence(
  nMet: number,
  nUnmet: number,
  options: { metWins?: number; unmetWins?: number } = {}
): ConfidenceLevel {
  if (nMet <= CONFIDENCE_RULES.insufficientMax || nUnmet <= CONFIDENCE_RULES.insufficientMax) {
    return "insufficient"
  }
  const bothSupportedSize =
    nMet >= CONFIDENCE_RULES.supportedMin && nUnmet >= CONFIDENCE_RULES.supportedMin
  if (
    bothSupportedSize &&
    options.metWins !== undefined &&
    options.unmetWins !== undefined &&
    twoProportionSignificant(nMet, options.metWins, nUnmet, options.unmetWins)
  ) {
    return "supported"
  }
  if (bothSupportedSize && options.metWins === undefined) {
    return "supported"
  }
  return "directional"
}

export function median(values: number[]) {
  if (values.length === 0) return null
  const sorted = values.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2
  }
  return sorted[mid]!
}
