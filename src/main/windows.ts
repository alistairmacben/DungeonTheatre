import { BrowserWindow, shell } from 'electron'
import { join } from 'node:path'

const preload = join(__dirname, '../preload/index.js')
const devUrl = process.env['ELECTRON_RENDERER_URL']

/**
 * Where the player app lives.
 *
 * The DM's table — sheets, damage, loot, dice — is that same app in DM mode,
 * because that is where auth, the character sheets and the rules engine
 * already are. Opening it as a window here is what makes this the one place
 * a DM launches everything from, without duplicating the engine into Electron
 * where it would immediately start drifting from the real one.
 *
 * Dev serves it on 5273 (`npm run dev:player`). A packaged build needs the
 * deployed address, which is per-deployment and so has to be configured.
 */
const PLAYER_APP_URL = process.env['PLAYER_APP_URL']
  ?? (devUrl ? 'http://localhost:5273' : '')

/**
 * Renderer console output does not reach the terminal by default, which makes
 * anything failing inside a window invisible when running headless or when the
 * window is on another screen. Forwarding warnings and errors costs nothing and
 * turns "it just doesn't work" into an actual message.
 */
function forwardConsole(win: BrowserWindow, page: string): void {
  win.webContents.on('console-message', (event) => {
    const { level, message, lineNumber, sourceId } = event
    if (level !== 'warning' && level !== 'error') return
    const where = sourceId ? ` (${sourceId.split('/').pop()}:${lineNumber})` : ''
    console.log(`[${page}:${level}] ${message}${where}`)
  })
}

function load(win: BrowserWindow, page: 'control' | 'stage'): void {
  if (devUrl) {
    void win.loadURL(`${devUrl}/${page}.html`)
  } else {
    void win.loadFile(join(__dirname, `../renderer/${page}.html`))
  }
}

let control: BrowserWindow | null = null
let stage: BrowserWindow | null = null
let table: BrowserWindow | null = null

export function createControlWindow(): BrowserWindow {
  if (control && !control.isDestroyed()) {
    control.focus()
    return control
  }

  control = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 600,
    show: false,
    title: 'Dungeon Stage — GM Screen',
    backgroundColor: '#0b0a10',
    autoHideMenuBar: true,
    webPreferences: { preload, sandbox: false }
  })

  control.on('ready-to-show', () => control?.show())
  control.on('closed', () => {
    control = null
  })
  control.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  forwardConsole(control, 'control')
  load(control, 'control')
  return control
}

export function createStageWindow(): BrowserWindow {
  if (stage && !stage.isDestroyed()) {
    stage.focus()
    return stage
  }

  stage = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    title: 'Dungeon Stage',
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    webPreferences: { preload, sandbox: false }
  })

  stage.on('ready-to-show', () => stage?.show())
  stage.on('closed', () => {
    stage = null
  })

  forwardConsole(stage, 'stage')
  load(stage, 'stage')
  return stage
}

/**
 * The DM's table, in its own window.
 *
 * Deliberately a plain browser window: no preload, no IPC. It is the web app,
 * and it signs in through Discord exactly as a player's browser would — the
 * moment it could reach into Electron it would stop being the same app and
 * start being a fork.
 */
export function createTableWindow(): BrowserWindow {
  if (table && !table.isDestroyed()) {
    table.focus()
    return table
  }

  table = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    title: 'Dungeon Stage — DM Table',
    backgroundColor: '#0b0a10',
    autoHideMenuBar: true
  })

  table.on('ready-to-show', () => table?.show())
  table.on('closed', () => {
    table = null
  })

  forwardConsole(table, 'table')

  if (PLAYER_APP_URL) {
    void table.loadURL(PLAYER_APP_URL)
  } else {
    // A blank window would read as a crash. Say what is missing instead.
    void table.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
      <body style="background:#0b0a10;color:#e8e2d6;font:14px system-ui;padding:3rem;line-height:1.6">
        <h2 style="color:#e0a458">The DM table needs an address</h2>
        <p>This build does not know where the player app is deployed.</p>
        <p>Set <code style="color:#8b7ee8">PLAYER_APP_URL</code> to your site's
        address before launching, or run <code style="color:#8b7ee8">npm run dev:player</code>
        and use the development build.</p>
      </body>`))
  }
  return table
}

export function toggleStageFullscreen(): void {
  if (stage && !stage.isDestroyed()) stage.setFullScreen(!stage.isFullScreen())
}

export function allWindows(): BrowserWindow[] {
  return [control, stage, table].filter((w): w is BrowserWindow => !!w && !w.isDestroyed())
}
