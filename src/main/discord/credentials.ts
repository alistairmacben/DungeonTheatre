import { app, safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'

/**
 * The OAuth client secret and access token never leave this machine. They are
 * encrypted with the OS keystore (DPAPI on Windows) when it is available, and
 * fall back to plain JSON only when it is not — which is flagged to the user.
 */

export interface DiscordCredentials {
  clientId: string
  clientSecret: string
}

export interface DiscordTokens {
  accessToken: string
  refreshToken: string | null
  /** Epoch ms. */
  expiresAt: number
}

interface StoredShape {
  clientId?: string
  clientSecretEnc?: string
  clientSecretPlain?: string
  tokensEnc?: string
  tokensPlain?: DiscordTokens
}

function file(): string {
  return join(app.getPath('userData'), 'discord-auth.json')
}

function read(): StoredShape {
  const path = file()
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as StoredShape
  } catch {
    return {}
  }
}

function write(data: StoredShape): void {
  const path = file()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2), { mode: 0o600 })
}

function encrypt(value: string): Pick<StoredShape, 'clientSecretEnc' | 'clientSecretPlain'> {
  if (safeStorage.isEncryptionAvailable()) {
    return { clientSecretEnc: safeStorage.encryptString(value).toString('base64') }
  }
  return { clientSecretPlain: value }
}

function decrypt(enc: string | undefined, plain: string | undefined): string | null {
  if (enc && safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(Buffer.from(enc, 'base64'))
    } catch {
      return null
    }
  }
  return plain ?? null
}

export function saveCredentials(creds: DiscordCredentials): void {
  const current = read()
  write({
    ...current,
    clientId: creds.clientId,
    clientSecretEnc: undefined,
    clientSecretPlain: undefined,
    ...encrypt(creds.clientSecret)
  })
}

export function loadCredentials(): DiscordCredentials | null {
  const stored = read()
  const secret = decrypt(stored.clientSecretEnc, stored.clientSecretPlain)
  if (!stored.clientId || !secret) return null
  return { clientId: stored.clientId, clientSecret: secret }
}

export function saveTokens(tokens: DiscordTokens): void {
  const current = read()
  const json = JSON.stringify(tokens)
  if (safeStorage.isEncryptionAvailable()) {
    write({ ...current, tokensEnc: safeStorage.encryptString(json).toString('base64'), tokensPlain: undefined })
  } else {
    write({ ...current, tokensPlain: tokens, tokensEnc: undefined })
  }
}

export function loadTokens(): DiscordTokens | null {
  const stored = read()
  if (stored.tokensEnc && safeStorage.isEncryptionAvailable()) {
    try {
      return JSON.parse(safeStorage.decryptString(Buffer.from(stored.tokensEnc, 'base64'))) as DiscordTokens
    } catch {
      return null
    }
  }
  return stored.tokensPlain ?? null
}

export function clearTokens(): void {
  const current = read()
  write({ ...current, tokensEnc: undefined, tokensPlain: undefined })
}

export function clearAll(): void {
  const path = file()
  if (existsSync(path)) rmSync(path)
}

export function credentialState(): { clientId: string | null; hasSecret: boolean; hasToken: boolean } {
  const stored = read()
  return {
    clientId: stored.clientId ?? null,
    hasSecret: !!(stored.clientSecretEnc ?? stored.clientSecretPlain),
    hasToken: !!(stored.tokensEnc ?? stored.tokensPlain)
  }
}
