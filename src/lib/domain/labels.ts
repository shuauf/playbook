import { normalizeLabel } from "@/lib/ids"

export function displayUndefinedLabel(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return "Untitled activity"
  return trimmed.replace(/\s+/g, " ")
}

export function undefinedLabelKey(value: string) {
  return normalizeLabel(displayUndefinedLabel(value))
}
