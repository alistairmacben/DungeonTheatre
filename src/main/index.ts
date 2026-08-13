import { app, BrowserWindow, ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import type { AppSnapshot, Command } from '@shared/types'
import { Hub } from './hub'
import { registerAssetScheme, serveAssets } from './assetProtocol'
import { isWhisper } from '@shared/dice'
import {
  allWindows,
  createControlWindow,
  createStageWindow,
  toggleStageFullscreen
} from './windows'

const hub = new Hub()

hub.on('snapshot', (snapshot: AppSnapshot) => {
  for (const win of allWindows()) win.webContents.send(IPC.snapshot, snapshot)
  trace(snapshot)
})

// A readable trace of the connection and who is talking. Quiet by default:
// only transitions are printed, never the per-frame snapshot churn.
let lastLine = ''
let lastTalking = ''
function trace(snapshot: AppSnapshot): void {
  const { connection, members } = snapshot
  const line = [
    connection.kind,
    connection.status,
    `channel=${connection.channel?.name ?? '-'}`,
    `members=${members.length}`,
    connection.message ? `| ${connection.message}` : ''
  ].join(' ')
  if (line !== lastLine) {
    lastLine = line
    console.log('[dungeon]', line)
  }

  const talking = members
    .filter((m) => m.speaking)
    .map((m) => m.displayName)
    .join(', ')
  if (talking !== lastTalking) {
    lastTalking = talking
    console.log('[dungeon] speaking:', talking || '(silence)')
  }
}

ipcMain.handle(IPC.requestSnapshot, () => hub.getSnapshot())

// A player's roll should land on the DM's stage and in their log, exactly as
// their own rolls do.
hub.onRemoteRoll = (roll) => {
  for (const win of allWindows()) win.webContents.send(IPC.dice, roll)
  hub.recordRoll(roll)
}

ipcMain.on(IPC.command, (_event, command: Command) => {
  switch (command.type) {
    case 'source:select':
      hub.selectSource(command.kind)
      break
    case 'source:connect':
      void hub.connect()
      break
    case 'source:disconnect':
      void hub.disconnect()
      break
    case 'stage:open':
      createStageWindow()
      break
    case 'stage:toggleFullscreen':
      toggleStageFullscreen()
      break
    case 'mock:setSpeaking':
      hub.mockSetSpeaking(command.userId, command.speaking)
      break
    case 'discord:saveCredentials':
      hub.saveDiscordCredentials(command.clientId, command.clientSecret)
      break
    case 'discord:forgetAuth':
      hub.forgetDiscordAuth()
      break

    case 'character:add': {
      const created = hub.campaign.addCharacter({ name: command.name, kind: command.kind })
      // Casting straight from a Discord user seeds the portrait with their avatar.
      if (command.fromDiscordUserId) {
        const member = hub.getSnapshot().members.find((m) => m.id === command.fromDiscordUserId)
        if (member?.avatarUrl) hub.campaign.updateCharacter(created.id, { title: member.displayName })
        hub.campaign.cast(command.fromDiscordUserId, created.id)
      }
      hub.campaignChanged()
      break
    }
    case 'character:update':
      hub.campaign.updateCharacter(command.id, command.patch)
      hub.campaignChanged()
      break
    case 'character:remove':
      hub.campaign.removeCharacter(command.id)
      hub.campaignChanged()
      break
    case 'character:pickPortrait':
      void hub.campaign.importImage('portrait').then((relative) => {
        if (!relative) return
        hub.campaign.updateCharacter(command.id, { portrait: relative })
        hub.campaignChanged()
      })
      break
    case 'cast:set':
      hub.campaign.cast(command.discordUserId, command.characterId)
      hub.campaignChanged()
      break
    case 'gmVoice:set':
      hub.campaign.setGmVoice(command.characterId)
      hub.campaignChanged()
      break
    case 'scene:add':
      hub.campaign.addScene(command.name)
      hub.campaignChanged()
      break
    case 'scene:update':
      hub.campaign.updateScene(command.id, command.patch)
      hub.campaignChanged()
      break
    case 'scene:remove':
      hub.campaign.removeScene(command.id)
      hub.campaignChanged()
      break
    case 'scene:activate':
      hub.campaign.setActiveScene(command.id)
      hub.campaignChanged()
      break
    case 'scene:pickBackground':
      void hub.campaign.importImage('background').then((relative) => {
        if (!relative) return
        hub.campaign.updateScene(command.id, { background: relative })
        hub.campaignChanged()
      })
      break
    case 'scene:toggleNpc':
      hub.campaign.toggleNpcOnStage(command.sceneId, command.characterId)
      hub.campaignChanged()
      break
    case 'campaign:rename':
      hub.campaign.rename(command.name)
      hub.campaignChanged()
      break
    case 'stage:settings':
      hub.campaign.updateStageSettings(command.patch)
      hub.campaignChanged()
      break

    case 'cloud:signIn':
      void hub.cloud.signIn()
      break
    case 'cloud:signOut':
      void hub.cloud.signOut()
      break
    case 'cloud:sync':
      void hub.syncToCloud()
      break
    case 'dice:roll':
      // Whispers never touch the wire.
      if (!isWhisper(command.roll.visibility)) hub.cloud.sendDice(command.roll)
      // The DM always sees their own roll in full, whatever the visibility.
      for (const win of allWindows()) win.webContents.send(IPC.dice, command.roll)
      hub.recordRoll(command.roll)
      break
    case 'dice:clearLog':
      hub.clearRollLog()
      break
  }
})

// Must happen before the app is ready.
registerAssetScheme()

app.whenReady().then(() => {
  serveAssets()
  void hub.init()
  createControlWindow()

  // DUNGEON_DIAG_DICE=1 opens the stage and throws a roll at it unattended,
  // so the dice renderer can be diagnosed from the terminal without a human
  // clicking through the UI. Off unless explicitly asked for.
  if (process.env['DUNGEON_DIAG_DICE']) {
    setTimeout(() => {
      const stage = createStageWindow()
      stage.webContents.once('did-finish-load', () => {
        setTimeout(() => {
          stage.webContents.send(IPC.dice, {
            id: 'diag-roll',
            campaignId: 'diag',
            rollerId: null,
            characterId: null,
            rollerName: 'Diagnostic',
            color: '#e0a458',
            notation: '4d6',
            dice: [
              { sides: 6, value: 3 },
              { sides: 6, value: 5 },
              { sides: 6, value: 2 },
              { sides: 6, value: 6 }
            ],
            modifier: 0,
            total: 16,
            visibility: 'public',
            theme: 'obsidian',
            at: Date.now()
          })
        }, 4000)
      })
    }, 1500)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createControlWindow()
  })
})

app.on('window-all-closed', () => {
  void hub.disconnect()
  if (process.platform !== 'darwin') app.quit()
})

// Never lose campaign edits to a debounce timer on the way out.
app.on('before-quit', () => {
  hub.campaign.flush()
  void hub.cloud.shutdown()
})
