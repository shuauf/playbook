"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PIPELINE_STAGES } from "@/lib/domain/types"
import {
  createPlayAction,
  savePlayAction,
  setPlayStatusAction,
} from "@/lib/playbook/actions"

type DraftPrerequisite = { key?: string; text: string }

export function PlayEditor({
  playId,
  status,
  version,
  initial,
}: {
  playId?: string
  status?: "active" | "retired"
  version?: number
  initial: {
    name: string
    description: string
    typicalStages: string[]
    prerequisites: DraftPrerequisite[]
  }
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [typicalStages, setTypicalStages] = useState(initial.typicalStages)
  const [prerequisites, setPrerequisites] = useState(
    initial.prerequisites.length > 0 ? initial.prerequisites : [{ text: "" }]
  )
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function toggleStage(stage: string) {
    setTypicalStages((current) =>
      current.includes(stage) ? current.filter((item) => item !== stage) : [...current, stage]
    )
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...prerequisites]
    const swap = index + direction
    if (swap < 0 || swap >= next.length) return
    ;[next[index], next[swap]] = [next[swap]!, next[index]!]
    setPrerequisites(next)
  }

  function submit() {
    setError(null)
    setMessage(null)
    const input = {
      name,
      description,
      typicalStages,
      prerequisites: prerequisites.filter((item) => item.text.trim()),
    }
    startTransition(async () => {
      const result = playId
        ? await savePlayAction(playId, input)
        : await createPlayAction(input)
      if (!result.ok) {
        setError(result.error)
        return
      }
      if ("id" in result && result.id) {
        router.push(`/admin/plays/${result.id}`)
        return
      }
      if ("changed" in result && result.changed === false) {
        setMessage("No changes to save.")
        return
      }
      setMessage(`Saved version ${"version" in result ? result.version : ""}`.trim())
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{playId ? "Edit play" : "New play"}</CardTitle>
        <CardDescription>
          {playId
            ? `Saving writes a new version for future activities. Version ${version ?? 1} stays attached to historical records.`
            : "This becomes version 1 of the playbook definition."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2">
          <Label htmlFor="play-name">Name</Label>
          <Input
            id="play-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Product Demo"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="play-description">Description</Label>
          <Textarea
            id="play-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="When this play is used, and what good looks like."
          />
        </div>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Typical stages</legend>
          <div className="flex flex-wrap gap-2">
            {PIPELINE_STAGES.map((stage) => {
              const checked = typicalStages.includes(stage)
              return (
                <label
                  key={stage}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStage(stage)}
                  />
                  {stage}
                </label>
              )
            })}
          </div>
        </fieldset>
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <Label>Prerequisites</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPrerequisites((current) => [...current, { text: "" }])}
            >
              Add
            </Button>
          </div>
          <ol className="space-y-2">
            {prerequisites.map((item, index) => (
              <li key={`${item.key ?? "new"}-${index}`} className="flex items-start gap-2">
                <span className="mt-2 w-5 text-xs text-muted-foreground">{index + 1}</span>
                <Input
                  value={item.text}
                  onChange={(event) =>
                    setPrerequisites((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, text: event.target.value } : entry
                      )
                    )
                  }
                  placeholder="What should be true before this play runs?"
                />
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(index, -1)}>
                    ↑
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(index, 1)}>
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setPrerequisites((current) => current.filter((_, entryIndex) => entryIndex !== index))
                    }
                  >
                    ×
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button onClick={submit} disabled={pending || status === "retired"}>
            {playId ? "Save new version" : "Create play"}
          </Button>
          {playId && status === "active" ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await setPlayStatusAction(playId, "retired")
                  if (!result.ok) setError(result.error)
                  else router.refresh()
                })
              }
            >
              Retire
            </Button>
          ) : null}
          {playId && status === "retired" ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await setPlayStatusAction(playId, "active")
                  if (!result.ok) setError(result.error)
                  else router.refresh()
                })
              }
            >
              Reactivate
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
