import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc'
import type { AppSnapshot, Command } from '@shared/types'
import type { DiceRoll } from '@shared/dice'

const api = {
  /** Pull the current state once, on mount. */
  requestSnapshot: (): Promise<AppSnapshot> => ipcRenderer.invoke(IPC.requestSnapshot),
  /** Fire-and-forget command to the main process. */
  send: (command: Command): void => ipcRenderer.send(IPC.command, command),
  /** Subscribe to state pushes. Returns an unsubscribe function. */
  onSnapshot: (handler: (snapshot: AppSnapshot) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, snapshot: AppSnapshot): void =>
      handler(snapshot)
    ipcRenderer.on(IPC.snapshot, listener)
    return () => ipcRenderer.off(IPC.snapshot, listener)
  },
  /** Subscribe to dice rolls. Returns an unsubscribe function. */
  onDice: (handler: (roll: DiceRoll) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, roll: DiceRoll): void => handler(roll)
    ipcRenderer.on(IPC.dice, listener)
    return () => ipcRenderer.off(IPC.dice, listener)
  }
}

export type DungeonApi = typeof api

contextBridge.exposeInMainWorld('dungeon', api)
