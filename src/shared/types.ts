/**
 * Types shared between the Electron main process and every renderer.
 * The main process is the single source of truth; renderers receive
 * immutable snapshots and send back commands.
 */

import {
  emptyCampaign,
  type Campaign,
  type Character,
  type CharacterKind,
  type Scene,
  type StageSettings
} from './campaign'
import type { DiceRoll } from './dice'

export type DiscordUserId = string

/** Which backend is supplying "who is talking" events. */
export type SourceKind = 'mock' | 'discord-rpc'

export type ConnectionStatus =
  | 'disconnected'
  /** Opening the pipe / handshaking. */
  | 'connecting'
  /** Waiting for the user to click Authorize in the Discord client. */
  | 'awaiting-auth'
  | 'connected'
  | 'error'

export interface VoiceChannelInfo {
  id: string
  name: string
  guildId: string | null
}

export interface VoiceMember {
  id: DiscordUserId
  /** Discord username, e.g. "alistair". */
  username: string
  /** Server nickname or global display name, whichever Discord gives us. */
  displayName: string
  avatarUrl: string | null
  speaking: boolean
  muted: boolean
  deafened: boolean
  bot: boolean
}

export interface ConnectionState {
  kind: SourceKind
  status: ConnectionStatus
  /** Human-readable detail for the status pill (error text, hints). */
  message: string | null
  channel: VoiceChannelInfo | null
  /** The local Discord user — the GM. Lets us route their voice to an NPC. */
  selfUserId: DiscordUserId | null
}

/** What the GM has configured for the Discord app. Secrets never cross IPC. */
export interface DiscordAuthState {
  clientId: string | null
  hasSecret: boolean
  /** A cached access token exists, so connecting won't re-prompt. */
  hasToken: boolean
}

/** The DM's link to the backend players read from. */
export interface CloudStatus {
  status: 'signed-out' | 'signing-in' | 'signed-in' | 'syncing' | 'error'
  user: { id: string; name: string; avatarUrl: string | null } | null
  campaignId: string | null
  /** Short code players type to join. */
  inviteCode: string | null
  message: string | null
  /** True when the live presentation channel is open. */
  live: boolean
  lastSyncAt: number | null
}

/** Everything a renderer needs to draw itself. */
export interface AppSnapshot {
  connection: ConnectionState
  members: VoiceMember[]
  discordAuth: DiscordAuthState
  campaign: Campaign
  cloud: CloudStatus
  /** Recent rolls, newest first. Never contains whisper rolls. */
  rollLog: DiceRoll[]
}

/** Commands renderers may send to the main process. */
export type Command =
  | { type: 'source:select'; kind: SourceKind }
  | { type: 'source:connect' }
  | { type: 'source:disconnect' }
  | { type: 'stage:open' }
  | { type: 'stage:toggleFullscreen' }
  /** Mock-source only: flip a fake member's speaking state. */
  | { type: 'mock:setSpeaking'; userId: DiscordUserId; speaking: boolean }
  | { type: 'discord:saveCredentials'; clientId: string; clientSecret: string }
  /** Drop the cached token so the next connect re-prompts for authorisation. */
  | { type: 'discord:forgetAuth' }
  // --- campaign ---
  | { type: 'character:add'; name: string; kind: CharacterKind; fromDiscordUserId?: DiscordUserId }
  | { type: 'character:update'; id: string; patch: Partial<Character> }
  | { type: 'character:remove'; id: string }
  /** Opens a file picker in the main process and stores the copied image. */
  | { type: 'character:pickPortrait'; id: string }
  | { type: 'cast:set'; discordUserId: DiscordUserId; characterId: string | null }
  | { type: 'gmVoice:set'; characterId: string | null }
  | { type: 'scene:add'; name: string }
  | { type: 'scene:update'; id: string; patch: Partial<Scene> }
  | { type: 'scene:remove'; id: string }
  | { type: 'scene:activate'; id: string }
  | { type: 'scene:pickBackground'; id: string }
  | { type: 'scene:toggleNpc'; sceneId: string; characterId: string }
  | { type: 'campaign:rename'; name: string }
  | { type: 'stage:settings'; patch: Partial<StageSettings> }
  | { type: 'cloud:signIn' }
  | { type: 'cloud:signOut' }
  | { type: 'cloud:sync' }
  /** Relay a roll the DM made to the table. */
  | { type: 'dice:roll'; roll: DiceRoll }
  | { type: 'dice:clearLog' }

export const EMPTY_SNAPSHOT: AppSnapshot = {
  connection: {
    kind: 'mock',
    status: 'disconnected',
    message: null,
    channel: null,
    selfUserId: null
  },
  members: [],
  discordAuth: { clientId: null, hasSecret: false, hasToken: false },
  campaign: emptyCampaign(),
  cloud: {
    status: 'signed-out',
    user: null,
    campaignId: null,
    inviteCode: null,
    message: null,
    live: false,
    lastSyncAt: null
  },
  rollLog: []
}
