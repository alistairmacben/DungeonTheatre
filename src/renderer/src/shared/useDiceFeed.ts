import { useEffect, useState } from 'react'
import type { DiceRoll } from '@shared/dice'

/** Rolls relayed from the main process, for the DM's own windows. */
export function useDiceFeed(): DiceRoll | null {
  const [roll, setRoll] = useState<DiceRoll | null>(null)

  useEffect(() => {
    if (!window.dungeon?.onDice) return
    return window.dungeon.onDice(setRoll)
  }, [])

  return roll
}
