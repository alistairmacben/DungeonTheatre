/** Channel names for main <-> renderer traffic. Keep this list tiny. */
export const IPC = {
  /** main -> renderer: full AppSnapshot on every change. */
  snapshot: 'dungeon:snapshot',
  /** renderer -> main: a Command. */
  command: 'dungeon:command',
  /** renderer -> main (invoke): request the current snapshot on mount. */
  requestSnapshot: 'dungeon:requestSnapshot',
  /**
   * main -> renderer: a dice roll to play. Rolls are transient events rather
   * than state, so they ride their own channel instead of bloating snapshots.
   */
  dice: 'dungeon:dice'
} as const
