"use client"

import { CirclePlus, FlaskConical, Layers, Menu, Monitor, Plus, Search, Users, X } from "lucide-react"
import type { ReactNode } from "react"

import type { PlayDefinition } from "@/components/scribe/modals"
import { cn } from "@/lib/utils"

const PLAY_ICONS: Record<string, ReactNode> = {
  "play-discovery": <Search className="size-4" />,
  "play-product-demo": <Monitor className="size-4" />,
  "play-architecture-review": <Layers className="size-4" />,
  "play-workshop": <Users className="size-4" />,
  "play-poc": <FlaskConical className="size-4" />,
}

function iconFor(playId: string) {
  return PLAY_ICONS[playId] ?? <CirclePlus className="size-4" />
}

function SidebarList({
  plays,
  activePlayId,
  offbookActive,
  offbookCount,
  showNames,
  onSelect,
  onOffbook,
  onAdd,
}: {
  plays: PlayDefinition[]
  activePlayId?: string
  offbookActive: boolean
  offbookCount: number
  showNames: boolean
  onSelect: (playId: string) => void
  onOffbook: () => void
  onAdd: () => void
}) {
  const offbookLabel =
    offbookCount === 1
      ? "1 additional play not defined"
      : `${offbookCount} additional plays not defined`
  return (
    <>
      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {plays.map((play) => {
          const active = play.id === activePlayId
          return (
            <button
              key={play.id}
              type="button"
              title={play.name}
              onClick={() => onSelect(play.id)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-white",
                showNames ? "" : "justify-center px-0",
                active ? "bg-white shadow-sm ring-1 ring-[#2B2A27]/10" : ""
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EBEDF1] text-[#2B2A27]">
                {iconFor(play.id)}
              </span>
              {showNames ? <span className="truncate text-sm font-medium">{play.name}</span> : null}
            </button>
          )
        })}
        {offbookCount > 0 ? (
          <button
            type="button"
            title={offbookLabel}
            onClick={onOffbook}
            className={cn(
              "mt-1 flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-[#2B2A27]/20 bg-white/70 px-2 py-2 text-left text-[#2B2A27] hover:bg-white",
              showNames ? "" : "justify-center px-0",
              offbookActive ? "bg-white shadow-sm ring-1 ring-[#2B2A27]/10" : ""
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EBEDF1] text-sm font-medium text-[#2B2A27]/70">
              {offbookCount}
            </span>
            {showNames ? <span className="text-xs font-medium leading-snug text-[#2B2A27]/75">{offbookLabel}</span> : null}
          </button>
        ) : null}
      </nav>
      <div className="border-t border-border/80 p-2">
        <button
          type="button"
          title="Add play"
          onClick={onAdd}
          className={cn(
            "flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 text-left text-sm hover:bg-white",
            showNames ? "" : "justify-center px-0"
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2B2A27] text-white">
            <Plus className="size-4" />
          </span>
          {showNames ? <span className="font-medium">+ Add play</span> : null}
        </button>
      </div>
    </>
  )
}

export function PlaySidebar({
  plays,
  activePlayId,
  offbookActive,
  offbookCount,
  drawerOpen,
  onToggleDrawer,
  onCloseDrawer,
  onSelect,
  onOffbook,
  onAdd,
}: {
  plays: PlayDefinition[]
  activePlayId?: string
  offbookActive: boolean
  offbookCount: number
  drawerOpen: boolean
  onToggleDrawer: () => void
  onCloseDrawer: () => void
  onSelect: (playId: string) => void
  onOffbook: () => void
  onAdd: () => void
}) {
  return (
    <>
      <aside className="fixed top-14 bottom-0 left-0 z-20 hidden w-56 flex-col border-r border-border/80 bg-[#f3f2ee] lg:flex">
        <div className="px-3 pt-4 pb-1">
          <h1 className="font-heading text-xl leading-tight text-foreground">The plays</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Open a play for recommended prerequisites, success criteria, and who should be in the room.
          </p>
        </div>
        <SidebarList
          plays={plays}
          activePlayId={activePlayId}
          offbookActive={offbookActive}
          offbookCount={offbookCount}
          showNames
          onSelect={onSelect}
          onOffbook={onOffbook}
          onAdd={onAdd}
        />
      </aside>

      <aside className="fixed top-14 bottom-0 left-0 z-20 flex w-14 flex-col border-r border-border/80 bg-[#f3f2ee] lg:hidden">
        <button
          type="button"
          onClick={onToggleDrawer}
          className="mx-auto mt-2 flex size-8 cursor-pointer items-center justify-center rounded-lg hover:bg-white"
          aria-expanded={drawerOpen}
          aria-label={drawerOpen ? "Close the plays" : "Open the plays"}
        >
          <Menu className="size-4" />
        </button>
        <SidebarList
          plays={plays}
          activePlayId={activePlayId}
          offbookActive={offbookActive}
          offbookCount={offbookCount}
          showNames={false}
          onSelect={onSelect}
          onOffbook={onOffbook}
          onAdd={onAdd}
        />
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#2B2A27]/40"
            aria-label="Close the plays"
            onClick={onCloseDrawer}
          />
          <aside className="absolute top-14 bottom-0 left-0 flex w-56 flex-col bg-[#f3f2ee] shadow-xl">
            <div className="flex items-start justify-between gap-2 px-3 pt-4 pb-1">
              <div>
                <h1 className="font-heading text-xl leading-tight text-foreground">The plays</h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  Open a play for recommended prerequisites, success criteria, and who should be in the
                  room.
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseDrawer}
                className="mt-0.5 flex size-8 cursor-pointer items-center justify-center rounded-lg hover:bg-white"
                aria-label="Close the plays"
              >
                <X className="size-4" />
              </button>
            </div>
            <SidebarList
              plays={plays}
              activePlayId={activePlayId}
              offbookActive={offbookActive}
              offbookCount={offbookCount}
              showNames
              onSelect={(playId) => {
                onSelect(playId)
                onCloseDrawer()
              }}
              onOffbook={() => {
                onOffbook()
                onCloseDrawer()
              }}
              onAdd={() => {
                onAdd()
                onCloseDrawer()
              }}
            />
          </aside>
        </div>
      ) : null}
    </>
  )
}
