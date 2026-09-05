"use client"

import { useMemo, useState } from "react"

import { ConfidenceBadge } from "@/components/confidence-badge"
import { formatCount, pct, winRateCompare } from "@/lib/format"
import type { PlayFinding } from "@/lib/analysis/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type SortKey =
  | "playName"
  | "activityCount"
  | "opportunityCount"
  | "exceptionRate"
  | "metRate"
  | "unmetRate"
  | "difference"
  | "cycle"
  | "confidence"

export function PlayPerformanceTable({
  plays,
  onPlayClick,
}: {
  plays: PlayFinding[]
  onPlayClick?: (playId: string) => void
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "activityCount",
    dir: "desc",
  })

  const rows = useMemo(() => {
    const value = (play: PlayFinding): number | string => {
      switch (sort.key) {
        case "playName":
          return play.playName
        case "activityCount":
          return play.activityCount
        case "opportunityCount":
          return play.opportunityCount
        case "exceptionRate":
          return play.exceptionRate ?? -1
        case "metRate":
          return play.win.metRate ?? -1
        case "unmetRate":
          return play.win.unmetRate ?? -1
        case "difference":
          return play.win.difference ?? -99
        case "cycle":
          return play.cycle.differenceDays ?? -99
        case "confidence":
          return play.win.confidence
      }
    }
    return plays.slice().sort((a, b) => {
      const av = value(a)
      const bv = value(b)
      const cmp = typeof av === "string" ? av.localeCompare(String(bv)) : Number(av) - Number(bv)
      return sort.dir === "asc" ? cmp : -cmp
    })
  }, [plays, sort])

  function header(key: SortKey, label: string) {
    return (
      <button
        type="button"
        className="cursor-pointer text-left font-medium hover:underline"
        onClick={() =>
          setSort((current) => ({
            key,
            dir: current.key === key && current.dir === "desc" ? "asc" : "desc",
          }))
        }
      >
        {label}
      </button>
    )
  }

  if (plays.every((play) => play.activityCount === 0)) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">No sales play activity matches these filters.</p>
  }

  return (
    <Table>
      <TableHeader className="sticky top-0 bg-card">
        <TableRow>
          <TableHead>{header("playName", "Sales play")}</TableHead>
          <TableHead>{header("activityCount", "Activities")}</TableHead>
          <TableHead>{header("opportunityCount", "Opportunities")}</TableHead>
          <TableHead>{header("exceptionRate", "Exception rate")}</TableHead>
          <TableHead>{header("metRate", "Win rate when signals present")}</TableHead>
          <TableHead>{header("unmetRate", "Win rate when signals missing")}</TableHead>
          <TableHead>{header("difference", "Difference")}</TableHead>
          <TableHead>{header("cycle", "Cycle difference")}</TableHead>
          <TableHead>{header("confidence", "Confidence")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((play) => (
          <TableRow key={play.playId} className={play.win.confidence === "insufficient" ? "opacity-70" : undefined}>
            <TableCell>
              {onPlayClick ? (
                <button
                  type="button"
                  className="cursor-pointer font-medium hover:underline"
                  onClick={() => onPlayClick(play.playId)}
                >
                  {play.playName}
                </button>
              ) : (
                <span className="font-medium">{play.playName}</span>
              )}
            </TableCell>
            <TableCell>{formatCount(play.activityCount)}</TableCell>
            <TableCell>{formatCount(play.opportunityCount)}</TableCell>
            <TableCell>{play.exceptionRate === null ? "—" : pct(play.exceptionRate)}</TableCell>
            <TableCell>
              {play.win.metRate === null
                ? play.win.confidence === "insufficient"
                  ? "Insufficient data"
                  : "—"
                : pct(play.win.metRate)}
            </TableCell>
            <TableCell>
              {play.win.unmetRate === null
                ? play.win.confidence === "insufficient"
                  ? "Insufficient data"
                  : "—"
                : pct(play.win.unmetRate)}
            </TableCell>
            <TableCell>
              {play.win.difference === null ? "—" : `${winRateCompare(play.win.difference)} when signals are present`}
            </TableCell>
            <TableCell>
              {play.cycle.differenceDays === null
                ? "—"
                : play.cycle.differenceDays === 0
                  ? "about the same"
                  : `${Math.round(Math.abs(play.cycle.differenceDays))} days ${play.cycle.differenceDays > 0 ? "slower" : "faster"} when a signal is missing`}
            </TableCell>
            <TableCell>
              <ConfidenceBadge level={play.win.confidence} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
