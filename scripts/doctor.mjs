// Checks the things that stop Dungeon Stage from reaching Discord.
// Run with: npm run doctor
import { execSync } from 'node:child_process'
import net from 'node:net'
import { readdirSync } from 'node:fs'

const ok = (m) => console.log(`  \x1b[32mOK\x1b[0m    ${m}`)
const bad = (m) => console.log(`  \x1b[31mFAIL\x1b[0m  ${m}`)
const info = (m) => console.log(`        ${m}`)

console.log('\nDungeon Stage — Discord connection check\n')

// 1. Is the Discord desktop client actually running as the client?
let updaterOnly = false
let anyDiscord = false
if (process.platform === 'win32') {
  try {
    const raw = execSync(
      'powershell -NoProfile -Command "Get-Process -Name Discord -ErrorAction SilentlyContinue | Select-Object -ExpandProperty MainWindowTitle"',
      { encoding: 'utf8' }
    )
    const titles = raw.split('\n').map((t) => t.trim()).filter(Boolean)
    anyDiscord = titles.length > 0 || raw.trim().length > 0
    updaterOnly = titles.length > 0 && titles.every((t) => /updat/i.test(t))
  } catch {
    // Discord not running at all.
  }
}

// 2. Is the RPC pipe there?
const pipes = []
if (process.platform === 'win32') {
  try {
    for (const name of readdirSync('\\\\.\\pipe\\')) {
      if (name.startsWith('discord-ipc-')) pipes.push(name)
    }
  } catch {
    // Pipe directory listing is best effort.
  }
} else {
  const base =
    process.env['XDG_RUNTIME_DIR'] ?? process.env['TMPDIR'] ?? process.env['TMP'] ?? '/tmp'
  try {
    for (const name of readdirSync(base)) {
      if (name.startsWith('discord-ipc-')) pipes.push(name)
    }
  } catch {
    // Best effort.
  }
}

if (pipes.length) {
  ok(`Discord RPC pipe found: ${pipes.join(', ')}`)
} else {
  bad('No Discord RPC pipe found.')
  if (updaterOnly) {
    info('Discord is running, but only its UPDATER window is open.')
    info('The RPC server does not start until the real client is up and logged in.')
    info('Let the update finish (or fully quit Discord from the tray and reopen it).')
  } else if (anyDiscord) {
    info('Discord is running but has not opened its RPC pipe yet.')
    info('Make sure you are logged in, then re-run this check.')
  } else {
    info('Discord does not appear to be running. Start the DESKTOP app and log in.')
    info('The browser version of Discord has no RPC pipe and cannot be used.')
  }
}

// 3. Can we actually open it?
if (pipes.length) {
  const path = `\\\\?\\pipe\\${pipes[0]}`
  await new Promise((resolve) => {
    const socket = net.createConnection({ path })
    socket.once('connect', () => {
      ok('Pipe accepted a connection.')
      socket.destroy()
      resolve()
    })
    socket.once('error', (err) => {
      bad(`Pipe refused the connection: ${err.message}`)
      resolve()
    })
  })
}

// 4. Is the configured application ID real and RPC-capable?
const appId = process.argv[2]
if (appId) {
  try {
    const res = await fetch(`https://discord.com/api/v10/applications/${appId}/rpc`)
    if (res.ok) {
      const app = await res.json()
      ok(`Application "${app.name}" exists and has RPC enabled.`)
    } else {
      bad(`Application ${appId} lookup failed (HTTP ${res.status}). Check the Client ID.`)
    }
  } catch (err) {
    bad(`Could not reach Discord's API: ${err.message}`)
  }
} else {
  info('')
  info('Tip: pass your Client ID to also validate it — npm run doctor -- <clientId>')
}

console.log('')
