import { readFileSync, existsSync } from 'node:fs'
import { join, parse } from 'node:path'
import sharp from 'sharp'
import type { Campaign } from '@shared/campaign'
import { supabase } from './client'
import { assetsDir } from '../campaign/store'

/**
 * Mirrors the DM's campaign into Supabase so players can read it.
 *
 * The DM keeps working against the local store — it stays instant and survives
 * a network blip mid-session — and every change is pushed up behind it. Local
 * ids are UUIDs precisely so they can be used verbatim as cloud primary keys;
 * that removes any id-mapping table that could drift out of sync.
 */

/** Stage art is never displayed above 1920px, so anything larger is waste. */
const MAX_EDGE = 1920
const WEBP_QUALITY = 82

export interface SyncResult {
  campaignId: string
  inviteCode: string
  uploaded: string[]
  characters: number
  scenes: number
}

/** Storage path for a local asset filename. Deterministic, so no lookup table. */
export function storagePathFor(campaignId: string, localName: string): string {
  return `${campaignId}/${parse(localName).name}.webp`
}

/**
 * Finds or creates the cloud campaign row for this DM. Idempotent: a campaign
 * id already recorded locally is reused rather than creating a duplicate.
 */
export async function ensureCampaign(
  campaign: Campaign,
  ownerId: string
): Promise<{ campaignId: string; inviteCode: string }> {
  const db = supabase()

  if (campaign.cloud.campaignId) {
    const { data } = await db
      .from('campaigns')
      .select('id, invite_code')
      .eq('id', campaign.cloud.campaignId)
      .maybeSingle()

    if (data) return { campaignId: data.id as string, inviteCode: data.invite_code as string }
    // The row is gone (deleted server-side); fall through and make a new one.
  }

  const { data, error } = await db
    .from('campaigns')
    .insert({ owner_id: ownerId, name: campaign.name })
    .select('id, invite_code')
    .single()

  if (error) throw new Error(`Could not create the cloud campaign: ${error.message}`)
  return { campaignId: data.id as string, inviteCode: data.invite_code as string }
}

/**
 * Uploads any local art not yet in storage, downscaled and converted to WebP.
 *
 * Backgrounds are fetched by every player on every scene change, so shipping a
 * 4MB PNG would stall the reveal and burn the storage quota. Returns the local
 * filenames that are now uploaded.
 */
export async function uploadAssets(
  campaign: Campaign,
  campaignId: string
): Promise<{ uploaded: string[]; failed: Array<{ name: string; reason: string }> }> {
  const wanted = new Set<string>()
  for (const c of campaign.characters) if (c.portrait) wanted.add(c.portrait)
  for (const s of campaign.scenes) if (s.background) wanted.add(s.background)

  const already = new Set(campaign.cloud.uploadedAssets)
  const uploaded: string[] = []
  const failed: Array<{ name: string; reason: string }> = []
  const storage = supabase().storage.from('campaign-art')

  for (const name of wanted) {
    if (already.has(name)) continue

    const source = join(assetsDir(), name)
    if (!existsSync(source)) {
      failed.push({ name, reason: 'file missing on disk' })
      continue
    }

    try {
      const original = readFileSync(source)
      const body = await sharp(original)
        .rotate()
        .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer()

      const { error } = await storage.upload(storagePathFor(campaignId, name), body, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '31536000'
      })

      if (error) failed.push({ name, reason: error.message })
      else uploaded.push(name)
    } catch (err) {
      failed.push({ name, reason: err instanceof Error ? err.message : String(err) })
    }
  }

  return { uploaded, failed }
}

/** Pushes characters, scenes and casting. Upserts, so it is safe to re-run. */
export async function pushCampaign(campaign: Campaign, campaignId: string): Promise<void> {
  const db = supabase()

  await db
    .from('campaigns')
    .update({
      name: campaign.name,
      stage_settings: campaign.stage,
      active_scene_id: campaign.activeSceneId,
      gm_voice_character_id: campaign.gmVoiceCharacterId
    })
    .eq('id', campaignId)

  if (campaign.characters.length) {
    const { error } = await db.from('characters').upsert(
      campaign.characters.map((c) => ({
        id: c.id,
        campaign_id: campaignId,
        name: c.name,
        title: c.title,
        kind: c.kind,
        color: c.color,
        scale: c.scale ?? 1,
        portrait_path: c.portrait ? storagePathFor(campaignId, c.portrait) : null
      })),
      { onConflict: 'id' }
    )
    if (error) throw new Error(`Could not sync characters: ${error.message}`)
  }

  if (campaign.scenes.length) {
    const { error } = await db.from('scenes').upsert(
      campaign.scenes.map((s, index) => ({
        id: s.id,
        campaign_id: campaignId,
        name: s.name,
        background_path: s.background ? storagePathFor(campaignId, s.background) : null,
        npc_ids: s.npcIds,
        effect: s.effect,
        effect_intensity: s.effectIntensity,
        sort_order: index
      })),
      { onConflict: 'id' }
    )
    if (error) throw new Error(`Could not sync scenes: ${error.message}`)
  }

  // Casting is small and the DM re-casts freely, so replace wholesale rather
  // than diffing — it keeps deletions correct for free.
  await db.from('casting').delete().eq('campaign_id', campaignId)
  const castRows = Object.entries(campaign.casting).map(([discordUserId, characterId]) => ({
    campaign_id: campaignId,
    discord_user_id: discordUserId,
    character_id: characterId
  }))
  if (castRows.length) {
    const { error } = await db.from('casting').insert(castRows)
    if (error) throw new Error(`Could not sync casting: ${error.message}`)
  }

  // Remove cloud rows for things the DM deleted locally.
  const characterIds = campaign.characters.map((c) => c.id)
  const sceneIds = campaign.scenes.map((s) => s.id)
  if (characterIds.length) {
    await db
      .from('characters')
      .delete()
      .eq('campaign_id', campaignId)
      .not('id', 'in', `(${characterIds.join(',')})`)
  }
  if (sceneIds.length) {
    await db
      .from('scenes')
      .delete()
      .eq('campaign_id', campaignId)
      .not('id', 'in', `(${sceneIds.join(',')})`)
  }
}
