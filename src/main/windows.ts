import { BrowserWindow, shell } from 'electron'
import { join } from 'node:path'

const preload = join(__dirname, '../preload/index.js')
const devUrl = process.env['ELECTRON_RENDERER_URL']

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

export function toggleStageFullscreen(): void {
  if (stage && !stage.isDestroyed()) stage.setFullScreen(!stage.isFullScreen())
}

export function allWindows(): BrowserWindow[] {
  return [control, stage].filter((w): w is BrowserWindow => !!w && !w.isDestroyed())
}
