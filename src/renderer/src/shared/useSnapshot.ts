import { useEffect, useState } from 'react'
import { EMPTY_SNAPSHOT, type AppSnapshot, type Command } from '@shared/types'
import type { DungeonApi } from '../../../preload'
import { demoSnapshot } from './demoSnapshot'
import type { SceneEffect } from '@shared/campaign'

declare global {
  interface Window {
    dungeon?: DungeonApi
  }
}

/** `?demo=6&fx=rain` renders a fake party with no Electron bridge. Dev aid only. */
function demoCount(): number | null {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('demo')
  if (raw === null) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 4
}

function demoEffect(): SceneEffect {
  if (typeof window === 'undefined') return 'none'
  return (new URLSearchParams(window.location.search).get('fx') as SceneEffect) ?? 'none'
}

/** Live mirror of main-process state. Every window uses this. */
export function useSnapshot(): AppSnapshot {
  const demo = demoCount()
  const [snapshot, setSnapshot] = useState<AppSnapshot>(() =>
    demo !== null ? demoSnapshot(demo, demoEffect()) : EMPTY_SNAPSHOT
  )

  useEffect(() => {
    // Demo mode and plain-browser loads have no bridge to subscribe to.
    if (demo !== null || !window.dungeon) return

    let alive = true
    void window.dungeon.requestSnapshot().then((s) => {
      if (alive) setSnapshot(s)
    })
    const off = window.dungeon.onSnapshot(setSnapshot)
    return () => {
      alive = false
      off()
    }
  }, [demo])

  return snapshot
}

export function send(command: Command): void {
  window.dungeon?.send(command)
}
