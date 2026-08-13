// Minimal Electron surface so credentials.ts runs outside Electron.
import os from 'node:os'
import path from 'node:path'

export const app = {
  getPath: () => path.join(os.tmpdir(), 'dungeon-stage-test')
}

export const shell = {
  openExternal: async () => {}
}

export const dialog = {
  showOpenDialog: async () => ({ canceled: true, filePaths: [] })
}

export const safeStorage = {
  isEncryptionAvailable: () => false,
  encryptString: (s) => Buffer.from(s, 'utf8'),
  decryptString: (b) => b.toString('utf8')
}
