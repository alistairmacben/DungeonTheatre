import { app, dialog } from 'electron'
import { randomUUID, createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import {
  emptyCampaign,
  defaultScene,
  defaultStageSettings,
  CHARACTER_COLORS,
  type Campaign,
  type Character,
  type CharacterKind,
  type Scene,
  type StageSettings
} from '@shared/campaign'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Rewrites legacy `char-xxxxxxxx` / `scene-xxxxxxxx` ids to real UUIDs, and
 * repoints every reference to them.
 *
 * The point is that a local id can then be used verbatim as the cloud primary
 * key. The alternative — keeping a local-id to cloud-id mapping table — is a
 * second source of truth that drifts the moment a sync half-fails.
 *
 * Idempotent: ids that are already UUIDs are left alone.
 */
function normalizeIds(campaign: Campaign): Campaign {
  const remap = new Map<string, string>()
  const idFor = (old: string): string => {
    if (UUID_RE.test(old)) return old
    let next = remap.get(old)
    if (!next) {
      next = randomUUID()
      remap.set(old, next)
    }
    return next
  }

  const characters = campaign.characters.map((c) => ({ ...c, id: idFor(c.id) }))
  const scenes = campaign.scenes.map((s) => ({
    ...s,
    id: idFor(s.id),
    npcIds: s.npcIds.map(idFor)
  }))

  const casting: Record<string, string> = {}
  for (const [discordUserId, characterId] of Object.entries(campaign.casting)) {
    casting[discordUserId] = idFor(characterId)
  }

  return {
    ...campaign,
    characters,
    scenes,
    casting,
    activeSceneId: campaign.activeSceneId ? idFor(campaign.activeSceneId) : null,
    gmVoiceCharacterId: campaign.gmVoiceCharacterId ? idFor(campaign.gmVoiceCharacterId) : null
  }
}

/**
 * Fills in fields added after a campaign was first written, so upgrading the
 * app never loses or breaks an existing campaign.
 */
function migrate(raw: Partial<Campaign>): Campaign {
  const base = emptyCampaign()
  const scenes = (raw.scenes ?? base.scenes).map((scene) => ({
    ...defaultScene(scene.id, scene.name),
    ...scene
  }))
  return normalizeIds({
    ...base,
    ...raw,
    scenes,
    stage: { ...defaultStageSettings(), ...(raw.stage ?? {}) },
    cloud: { ...base.cloud, ...(raw.cloud ?? {}) }
  })
}

/**
 * A campaign is a folder: campaign.json plus an assets/ directory that owns
 * copies of every image the GM imports. Copying rather than referencing means
 * the folder is portable — zip it and it works on another machine.
 */

function root(): string {
  return join(app.getPath('userData'), 'campaign')
}

export function assetsDir(): string {
  return join(root(), 'assets')
}

function campaignFile(): string {
  return join(root(), 'campaign.json')
}

export class CampaignStore {
  private campaign: Campaign = emptyCampaign()
  private saveTimer: NodeJS.Timeout | null = null

  load(): Campaign {
    mkdirSync(assetsDir(), { recursive: true })
    const file = campaignFile()
    if (existsSync(file)) {
      try {
        this.campaign = migrate(JSON.parse(readFileSync(file, 'utf8')))
      } catch {
        // A corrupt file must not brick the app mid-session; start fresh but
        // leave the bad file on disk so it can be recovered by hand.
        this.campaign = emptyCampaign()
      }
    }
    return this.campaign
  }

  get(): Campaign {
    return this.campaign
  }

  /** Debounced so rapid edits (dragging a colour, typing a name) don't thrash disk. */
  private save(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null
      mkdirSync(root(), { recursive: true })
      writeFileSync(campaignFile(), JSON.stringify(this.campaign, null, 2))
    }, 400)
  }

  flush(): void {
    if (!this.saveTimer) return
    clearTimeout(this.saveTimer)
    this.saveTimer = null
    mkdirSync(root(), { recursive: true })
    writeFileSync(campaignFile(), JSON.stringify(this.campaign, null, 2))
  }
  /**
   * Called after any change to the campaign.
   *
   * Every mutation in this class funnels through `mutate`, so this is the one
   * place that can promise "something changed" without each new method having
   * to remember to say so.
   */
  onChanged: (() => void) | null = null


  private mutate(fn: (c: Campaign) => void): Campaign {
    fn(this.campaign)
    this.save()
    this.onChanged?.()
    return this.campaign
  }

  // --- characters -----------------------------------------------------------

  addCharacter(input: Partial<Character> & { name: string; kind: CharacterKind }): Character {
    const character: Character = {
      id: randomUUID(),
      name: input.name,
      kind: input.kind,
      title: input.title ?? null,
      portrait: input.portrait ?? null,
      color: input.color ?? CHARACTER_COLORS[this.campaign.characters.length % CHARACTER_COLORS.length]
    }
    this.mutate((c) => {
      c.characters.push(character)
    })
    return character
  }

  updateCharacter(id: string, patch: Partial<Character>): void {
    this.mutate((c) => {
      const target = c.characters.find((x) => x.id === id)
      if (target) Object.assign(target, patch, { id: target.id })
    })
  }

  removeCharacter(id: string): void {
    this.mutate((c) => {
      c.characters = c.characters.filter((x) => x.id !== id)
      for (const [userId, charId] of Object.entries(c.casting)) {
        if (charId === id) delete c.casting[userId]
      }
      for (const scene of c.scenes) scene.npcIds = scene.npcIds.filter((n) => n !== id)
      if (c.gmVoiceCharacterId === id) c.gmVoiceCharacterId = null
    })
  }

  // --- casting --------------------------------------------------------------

  cast(discordUserId: string, characterId: string | null): void {
    this.mutate((c) => {
      if (characterId) c.casting[discordUserId] = characterId
      else delete c.casting[discordUserId]
    })
  }

  setGmVoice(characterId: string | null): void {
    this.mutate((c) => {
      c.gmVoiceCharacterId = characterId
    })
  }

  // --- scenes ---------------------------------------------------------------

  addScene(name: string): Scene {
    const scene = defaultScene(randomUUID(), name)
    this.mutate((c) => {
      c.scenes.push(scene)
    })
    return scene
  }

  /** Remembers what the cloud gave us so the next sync is incremental. */
  recordCloudSync(campaignId: string, inviteCode: string, uploaded: string[]): void {
    this.mutate((c) => {
      c.cloud = {
        campaignId,
        inviteCode,
        uploadedAssets: [...new Set([...c.cloud.uploadedAssets, ...uploaded])]
      }
    })
    this.flush()
  }

  updateStageSettings(patch: Partial<StageSettings>): void {
    this.mutate((c) => {
      c.stage = { ...c.stage, ...patch }
    })
  }

  updateScene(id: string, patch: Partial<Scene>): void {
    this.mutate((c) => {
      const target = c.scenes.find((x) => x.id === id)
      if (target) Object.assign(target, patch, { id: target.id })
    })
  }

  removeScene(id: string): void {
    this.mutate((c) => {
      if (c.scenes.length <= 1) return
      c.scenes = c.scenes.filter((x) => x.id !== id)
      if (c.activeSceneId === id) c.activeSceneId = c.scenes[0]?.id ?? null
    })
  }

  setActiveScene(id: string): void {
    this.mutate((c) => {
      if (c.scenes.some((s) => s.id === id)) c.activeSceneId = id
    })
  }

  toggleNpcOnStage(sceneId: string, characterId: string): void {
    this.mutate((c) => {
      const scene = c.scenes.find((s) => s.id === sceneId)
      if (!scene) return
      scene.npcIds = scene.npcIds.includes(characterId)
        ? scene.npcIds.filter((n) => n !== characterId)
        : [...scene.npcIds, characterId]
    })
  }

  rename(name: string): void {
    this.mutate((c) => {
      c.name = name
    })
  }

  // --- assets ---------------------------------------------------------------

  /**
   * Opens a picker and copies the chosen image into the campaign folder.
   * Returns the relative path to store on a character or scene.
   */
  async importImage(purpose: 'portrait' | 'background'): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      title: purpose === 'portrait' ? 'Choose a portrait' : 'Choose a background',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'] }]
    })
    if (result.canceled || !result.filePaths[0]) return null
    return this.copyIntoAssets(result.filePaths[0])
  }

  copyIntoAssets(sourcePath: string): string {
    mkdirSync(assetsDir(), { recursive: true })
    // Hash the path so re-importing the same file doesn't pile up duplicates.
    const stamp = createHash('sha1').update(sourcePath).digest('hex').slice(0, 10)
    const ext = extname(sourcePath).toLowerCase() || '.png'
    const safeName = basename(sourcePath, extname(sourcePath))
      .replace(/[^a-z0-9-_]+/gi, '-')
      .slice(0, 40)
    const relative = `${safeName}-${stamp}${ext}`
    copyFileSync(sourcePath, join(assetsDir(), relative))
    return relative
  }
}
