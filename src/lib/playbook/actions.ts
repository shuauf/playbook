"use server"

import { revalidatePath } from "next/cache"

import { getDb } from "@/lib/db"
import { recordActivity, type RecordActivityInput } from "@/lib/playbook/activity-commands"
import { createPlay, savePlayVersion, setPlayStatus } from "@/lib/playbook/commands"
import type { PlayStatus } from "@/lib/domain/types"

function fail(error: unknown) {
  return {
    ok: false as const,
    error: error instanceof Error ? error.message : "Something went wrong.",
  }
}

async function refresh(playId?: string, opportunityId?: string) {
  revalidatePath("/")
  revalidatePath("/activity")
  revalidatePath("/activity/new")
  revalidatePath("/admin")
  revalidatePath("/admin/undefined")
  revalidatePath("/admin/plays/new")
  if (playId) {
    revalidatePath(`/admin/plays/${playId}`)
    revalidatePath(`/plays/${playId}`)
  }
  if (opportunityId) {
    revalidatePath(`/activity/opportunities/${opportunityId}`)
  }
}

export async function createPlayAction(input: {
  name: string
  description: string
  typicalStages: string[]
  prerequisites: Array<{ key?: string; text: string }>
}) {
  try {
    const id = await createPlay(await getDb(), input)
    await refresh(id)
    return { ok: true as const, id }
  } catch (error) {
    return fail(error)
  }
}

export async function savePlayAction(
  playId: string,
  input: {
    name: string
    description: string
    typicalStages: string[]
    prerequisites: Array<{ key?: string; text: string }>
  }
) {
  try {
    const result = await savePlayVersion(await getDb(), playId, input)
    await refresh(playId)
    return { ok: true as const, version: result.version, changed: result.changed }
  } catch (error) {
    return fail(error)
  }
}

export async function setPlayStatusAction(playId: string, status: PlayStatus) {
  try {
    await setPlayStatus(await getDb(), playId, status)
    await refresh(playId)
    return { ok: true as const }
  } catch (error) {
    return fail(error)
  }
}

export async function recordActivityAction(input: RecordActivityInput) {
  try {
    const result = await recordActivity(await getDb(), input)
    const playId = input.capture.kind === "defined" ? input.capture.playId : undefined
    await refresh(playId, result.opportunityId)
    revalidatePath(`/activity/activities/${result.id}`)
    return { ok: true as const, id: result.id, opportunityId: result.opportunityId }
  } catch (error) {
    return fail(error)
  }
}
