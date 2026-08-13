import type { Character } from './campaign'
import type { AppSnapshot, DiscordUserId } from './types'

/**
 * Turns a stored asset path into something the host can load.
 *
 * The DM app serves art over its private `asset://` scheme; the player app
 * loads the same art from Supabase Storage over https. The stage itself must
 * not know or care which, so the host supplies this.
 */
export type AssetResolver = (path: string | null) => string | null

/** One card on the stage. */
export interface StagePresence {
  /** Stable React key. */
  key: string
  characterId: string | null
  /** Discord user backing this card, when there is one. */
  userId: DiscordUserId | null
  name: string
  title: string | null
  portraitUrl: string | null
  color: string
  speaking: boolean
  muted: boolean
  /** True when this card is an NPC the GM is currently voicing. */
  gmVoiced: boolean
  /** Per-character size multiplier, 1 when untouched. */
  scale: number
}

const DEFAULT_COLOR = '#8b7ee8'

/**
 * Works out who should be on stage right now.
 *
 * Three sources feed in, in priority order:
 *  1. The NPC the GM is voicing, which takes over the GM's own slot.
 *  2. NPCs the GM has staged in the active scene.
 *  3. Everyone in the voice channel, shown as their cast character when there
 *     is one and as their plain Discord identity when there isn't — so the
 *     app is useful before any casting has been done.
 */
export function computeStage(
  snapshot: AppSnapshot,
  resolveAsset: AssetResolver
): StagePresence[] {
  const { campaign, members, connection } = snapshot
  const byId = new Map(campaign.characters.map((c) => [c.id, c]))
  const presences: StagePresence[] = []
  const placed = new Set<string>()

  const gmId = connection.selfUserId
  const gmMember = gmId ? members.find((m) => m.id === gmId) : undefined
  const gmVoiced = campaign.gmVoiceCharacterId
    ? (byId.get(campaign.gmVoiceCharacterId) ?? null)
    : null

  // 1. The NPC the GM is speaking through.
  if (gmVoiced) {
    presences.push(
      fromCharacter(gmVoiced, gmMember?.speaking ?? false, false, gmId, true, resolveAsset)
    )
    placed.add(gmVoiced.id)
  }

  // 2. NPCs staged into the current scene.
  const scene = campaign.scenes.find((s) => s.id === campaign.activeSceneId)
  for (const npcId of scene?.npcIds ?? []) {
    if (placed.has(npcId)) continue
    const character = byId.get(npcId)
    if (!character) continue
    presences.push(fromCharacter(character, false, false, null, false, resolveAsset))
    placed.add(npcId)
  }

  // 3. The voice channel.
  for (const member of members) {
    if (member.bot) continue
    // Optionally the GM's own card steps aside for the NPC they're voicing.
    if (gmVoiced && member.id === gmId && campaign.stage.hideGmCardWhileVoicing) continue

    const characterId = campaign.casting[member.id]
    const character = characterId ? byId.get(characterId) : undefined

    if (character) {
      if (placed.has(character.id)) {
        // Already on stage as a staged NPC — let the live speaker state win.
        const existing = presences.find((p) => p.characterId === character.id)
        if (existing) {
          existing.speaking = member.speaking
          existing.muted = member.muted
          existing.userId = member.id
        }
        continue
      }
      presences.push(
        fromCharacter(character, member.speaking, member.muted, member.id, false, resolveAsset)
      )
      placed.add(character.id)
      continue
    }

    // Uncast: fall back to their Discord identity so the stage still works.
    presences.push({
      key: `user-${member.id}`,
      characterId: null,
      userId: member.id,
      name: member.displayName,
      title: null,
      portraitUrl: member.avatarUrl,
      color: DEFAULT_COLOR,
      speaking: member.speaking,
      muted: member.muted,
      gmVoiced: false,
      scale: 1
    })
  }

  return presences
}

function fromCharacter(
  character: Character,
  speaking: boolean,
  muted: boolean,
  userId: DiscordUserId | null,
  gmVoiced: boolean,
  resolveAsset: AssetResolver
): StagePresence {
  return {
    key: `char-${character.id}`,
    characterId: character.id,
    userId,
    name: character.name,
    title: character.title,
    portraitUrl: resolveAsset(character.portrait),
    color: character.color,
    speaking,
    muted,
    gmVoiced,
    scale: character.scale ?? 1
  }
}
