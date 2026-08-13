/** The persisted campaign model. Lives as JSON next to an assets folder. */

export type CharacterKind = 'pc' | 'npc'

export interface Character {
  id: string
  name: string
  kind: CharacterKind
  /** Subtitle on the nameplate, e.g. "Half-elf Rogue" or "Innkeeper". */
  title: string | null
  /**
   * Relative path inside the campaign assets folder, served over asset://.
   * Null falls back to the cast Discord user's avatar.
   */
  portrait: string | null
  /** Accent colour for the frame and nameplate. */
  color: string
  /**
   * Per-character size tweak, 0.6–1.4, multiplying the stage's character
   * height. Artwork rarely comes cropped consistently, so this nudges one
   * figure into scale with the rest without touching the global setting.
   */
  scale?: number
}

/** Weather and mood overlays. Kept subtle — dense particles wreck stream bitrate. */
export type SceneEffect =
  | 'none'
  | 'rain'
  | 'storm'
  | 'snow'
  | 'fog'
  | 'embers'
  | 'wind'
  | 'sunbeams'
  | 'gloom'

export const SCENE_EFFECTS: Array<{ id: SceneEffect; label: string }> = [
  { id: 'none', label: 'Clear' },
  { id: 'rain', label: 'Rain' },
  { id: 'storm', label: 'Storm' },
  { id: 'snow', label: 'Snow' },
  { id: 'fog', label: 'Fog' },
  { id: 'embers', label: 'Embers' },
  { id: 'wind', label: 'Wind' },
  { id: 'sunbeams', label: 'Sunbeams' },
  { id: 'gloom', label: 'Gloom' }
]

export interface Scene {
  id: string
  name: string
  /** Relative path inside the campaign assets folder. */
  background: string | null
  /** NPCs the GM has staged for this scene. PCs come from the voice channel. */
  npcIds: string[]
  effect: SceneEffect
  /** 0..1. Drives particle count and overlay opacity. */
  effectIntensity: number
}

/** How the stage draws itself. Global, not per scene. */
export interface StageSettings {
  /**
   * 'novel' stands cut-out characters on the scene like a visual novel.
   * 'cards' is the framed-portrait grid.
   */
  mode: 'novel' | 'cards'
  showNames: boolean
  showTitles: boolean
  /** 0..0.85. How far the background art is darkened behind the cast. */
  backgroundDim: number
  /** Fade and desaturate characters who aren't talking. */
  dimIdle: boolean
  /** How tall cut-outs stand, as a fraction of stage height. 0.4..0.95 */
  characterScale: number
  /** Hide the GM's own card while they are voicing an NPC. */
  hideGmCardWhileVoicing: boolean
}

export function defaultStageSettings(): StageSettings {
  return {
    mode: 'novel',
    showNames: true,
    showTitles: false,
    backgroundDim: 0.25,
    dimIdle: true,
    characterScale: 0.8,
    hideGmCardWhileVoicing: true
  }
}

export function defaultScene(id: string, name: string): Scene {
  return { id, name, background: null, npcIds: [], effect: 'none', effectIntensity: 0.5 }
}

/** Bookkeeping for the mirror of this campaign in Supabase. */
export interface CloudState {
  /** Cloud campaign id. Null until the DM has signed in and synced once. */
  campaignId: string | null
  /** Short code players type to join. */
  inviteCode: string | null
  /** Local asset filenames already uploaded, so we don't re-send them. */
  uploadedAssets: string[]
}

export function defaultCloudState(): CloudState {
  return { campaignId: null, inviteCode: null, uploadedAssets: [] }
}

export interface Campaign {
  name: string
  characters: Character[]
  scenes: Scene[]
  stage: StageSettings
  cloud: CloudState
  /** Discord user id -> character id. */
  casting: Record<string, string>
  activeSceneId: string | null
  /**
   * Which character the GM is currently voicing. When set, the GM's own
   * speaking lights up this NPC instead of their own character.
   */
  gmVoiceCharacterId: string | null
}

/** Frame colours that stay legible through Discord's stream compression. */
export const CHARACTER_COLORS = [
  '#e0a458',
  '#8b7ee8',
  '#5fb0d6',
  '#6fc08a',
  '#d96f6f',
  '#d68fc0',
  '#c9a227',
  '#7f9cc4'
] as const

export function emptyCampaign(): Campaign {
  // Ids are UUIDs so they can double as the cloud primary key.
  const opening = defaultScene(crypto.randomUUID(), 'Opening Scene')
  return {
    name: 'New Campaign',
    characters: [],
    scenes: [opening],
    stage: defaultStageSettings(),
    cloud: defaultCloudState(),
    casting: {},
    activeSceneId: opening.id,
    gmVoiceCharacterId: null
  }
}
