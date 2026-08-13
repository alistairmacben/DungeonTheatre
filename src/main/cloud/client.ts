import { app, safeStorage } from 'electron'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * Supabase client for the Electron main process.
 *
 * supabase-js expects a browser `localStorage` to persist the session. In Node
 * there isn't one, so we hand it a file-backed store encrypted with the OS
 * keystore — the session token is a bearer credential and has no business
 * sitting in plaintext on disk.
 */

const SUPABASE_URL = process.env['VITE_SUPABASE_URL'] ?? 'https://sakzpiurgrbeewzhvvng.supabase.co'
const SUPABASE_KEY =
  process.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ?? 'sb_publishable_wwdi1z-02l9qdnBO5zpEtw_0lUXfDzL'

function sessionFile(): string {
  return join(app.getPath('userData'), 'cloud-session.json')
}

/** Minimal synchronous-ish storage shim matching what supabase-js expects. */
const fileStorage = {
  getItem(key: string): string | null {
    const path = sessionFile()
    if (!existsSync(path)) return null
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>
      const stored = raw[key]
      if (!stored) return null
      if (!safeStorage.isEncryptionAvailable()) return stored
      return safeStorage.decryptString(Buffer.from(stored, 'base64'))
    } catch {
      return null
    }
  },

  setItem(key: string, value: string): void {
    const path = sessionFile()
    mkdirSync(dirname(path), { recursive: true })
    let raw: Record<string, string> = {}
    if (existsSync(path)) {
      try {
        raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>
      } catch {
        raw = {}
      }
    }
    raw[key] = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(value).toString('base64')
      : value
    writeFileSync(path, JSON.stringify(raw), { mode: 0o600 })
  },

  removeItem(key: string): void {
    const path = sessionFile()
    if (!existsSync(path)) return
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>
      delete raw[key]
      writeFileSync(path, JSON.stringify(raw), { mode: 0o600 })
    } catch {
      rmSync(path, { force: true })
    }
  }
}

let client: SupabaseClient | null = null

export function supabase(): SupabaseClient {
  if (client) return client
  client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: fileStorage,
      persistSession: true,
      autoRefreshToken: true,
      // The main process has no URL bar to read a callback out of; we hand the
      // code to exchangeCodeForSession ourselves.
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
    realtime: { params: { eventsPerSecond: 40 } }
  })
  return client
}

export const CLOUD_URL = SUPABASE_URL

export function publicAssetUrl(path: string | null): string | null {
  if (!path) return null
  return `${SUPABASE_URL}/storage/v1/object/public/campaign-art/${path}`
}
