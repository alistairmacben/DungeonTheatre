// Integration test: DiscordRpcSource <-> fake Discord pipe.
// Covers framing, nonce matching, cached-token auth, channel hydration,
// subscription, and live speaking/roster dispatch.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const dir = path.join(os.tmpdir(), 'dungeon-stage-test')
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(
  path.join(dir, 'discord-auth.json'),
  JSON.stringify({
    clientId: '123456789012345678',
    clientSecretPlain: 'test-secret',
    tokensPlain: {
      accessToken: 'cached-access-token',
      refreshToken: 'cached-refresh-token',
      expiresAt: Date.now() + 3_600_000
    }
  })
)

const { PIPE } = await import('./fake-discord.mjs')
// Point the source at the stub instead of whatever real Discord is running.
process.env.DUNGEON_RPC_PIPE = PIPE
await new Promise((r) => setTimeout(r, 300))

const { DiscordRpcSource } = await import('./bundle/DiscordRpcSource.mjs')


const log = []
const source = new DiscordRpcSource()
source.on('status', (s) => log.push(['status', s.status, s.message]))
source.on('channel', (c) => log.push(['channel', c && c.name]))
source.on('members', (m) =>
  log.push(['members', m.map((x) => ({ name: x.displayName, muted: x.muted, avatar: x.avatarUrl }))])
)
source.on('memberUpsert', (m) => log.push(['memberUpsert', m.displayName, m.avatarUrl]))
source.on('speaking', (s) => log.push(['speaking', s.userId, s.speaking]))

await source.start()
await new Promise((r) => setTimeout(r, 1200))
await source.stop()

console.log('\n=== EVENT LOG ===')
for (const entry of log) console.log(' ', JSON.stringify(entry))

const flat = JSON.stringify(log)
const roster = log.find((e) => e[0] === 'members' && e[1].length > 0)?.[1] ?? []
const checks = [
  ['handshake + auth reached connected', log.some((e) => e[0] === 'status' && e[1] === 'connected')],
  ['channel hydrated', flat.includes('The Rusty Flagon')],
  // nick wins when present; global_name is the fallback when nick is null.
  ['nick used as display name', roster.some((m) => m.name === 'Brenna Stormcloak')],
  ['global_name fallback when nick null', roster.some((m) => m.name === 'Kade')],
  ['self_mute mapped to muted', roster.some((m) => m.name === 'Kade' && m.muted === true)],
  ['unmuted member not flagged', roster.some((m) => m.name === 'Brenna Stormcloak' && m.muted === false)],
  ['SPEAKING_START received', log.some((e) => e[0] === 'speaking' && e[1] === '1001' && e[2] === true)],
  ['SPEAKING_STOP received', log.some((e) => e[0] === 'speaking' && e[1] === '1001' && e[2] === false)],
  ['second speaker received', log.some((e) => e[0] === 'speaking' && e[1] === '1002' && e[2] === true)],
  ['VOICE_STATE_CREATE upserted', log.some((e) => e[0] === 'memberUpsert' && e[1] === 'Sorrel')],
  ['default avatar computed', flat.includes('embed/avatars/')],
  ['custom avatar computed', flat.includes('avatars/1001/abc123.png')]
]

console.log('\n=== CHECKS ===')
let failed = 0
for (const [name, ok] of checks) {
  console.log(` ${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) failed++
}
console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILED`)
process.exit(failed === 0 ? 0 : 1)
