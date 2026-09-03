"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import { ConfidenceBadge } from "@/components/confidence-badge"
import { formatCount, pct, pp } from "@/lib/format"
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

export function PlayPerformanceTable({ plays }: { plays: PlayFinding[] }) {
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
        className="text-left font-medium hover:underline"
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
          <TableHead>{header("metRate", "Win rate followed")}</TableHead>
          <TableHead>{header("unmetRate", "Win rate exceptions")}</TableHead>
          <TableHead>{header("difference", "Difference")}</TableHead>
          <TableHead>{header("cycle", "Cycle difference")}</TableHead>
          <TableHead>{header("confidence", "Confidence")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((play) => (
          <TableRow key={play.playId} className={play.win.confidence === "insufficient" ? "opacity-70" : undefined}>
            <TableCell>
              <Link href={`/plays/${play.playId}`} className="font-medium hover:underline">
                {play.playName}
              </Link>
            </TableCell>
            <TableCell>{formatCount(play.activityCount)}</TableCell>
            <TableCell>{formatCount(play.opportunityCount)}</TableCell>
            <TableCell>{play.exceptionRate === null ? "—" : pct(play.exceptionRate)}</TableCell>
            <TableCell>
              {play.win.metRate === null ? "—" : pct(play.win.metRate)}
              <span className="ml-1 text-xs text-muted-foreground">n={play.win.metN}</span>
            </TableCell>
            <TableCell>
              {play.win.unmetRate === null ? "—" : pct(play.win.unmetRate)}
              <span className="ml-1 text-xs text-muted-foreground">n={play.win.unmetN}</span>
            </TableCell>
            <TableCell>{play.win.difference === null ? "—" : pp(play.win.difference, 0)}</TableCell>
            <TableCell>
              {play.cycle.differenceDays === null
                ? "—"
                : `${play.cycle.differenceDays > 0 ? "+" : ""}${Math.round(play.cycle.differenceDays)}d`}
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
