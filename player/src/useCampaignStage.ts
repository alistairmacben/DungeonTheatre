import { useEffect, useMemo, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { EMPTY_SNAPSHOT, type AppSnapshot, type VoiceMember } from '@shared/types'
import {
  defaultCloudState,
  defaultStageSettings,
  type Campaign,
  type Character,
  type Scene
} from '@shared/campaign'
import { supabase } from './supabase'

/**
 * Assembles the same AppSnapshot the DM's app produces, from two sources:
 *
 *  - the database, for the campaign itself (fetched once, refreshed on demand)
 *  - the live Broadcast channel, for who is talking right now
 *
 * Splitting it this way is what keeps the speaking highlight fast: the only
 * thing arriving at speech rate is a list of user ids.
 */

interface LiveState {
  activeSceneId: string | null
  gmVoiceCharacterId: string | null
  /** The DM's Discord id, so GM-voiced NPCs light up here exactly as they do
   *  on the DM's own stage. */
  gmUserId: string | null
  /** NPCs staged in the active scene, straight from the DM's live state. */
  stagedNpcIds: string[] | null
  speaking: string[]
  roster: Array<{ id: string; displayName: string; avatarUrl: string | null; muted: boolean }>
}

export interface CampaignStage {
  snapshot: AppSnapshot
  loading: boolean
  error: string | null
  /** True once the realtime channel is open. */
  live: boolean
  campaignName: string
  reload: () => void
}

export function useCampaignStage(campaignId: string | null): CampaignStage {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const [state, setState] = useState<LiveState>({
    activeSceneId: null,
    gmVoiceCharacterId: null,
    gmUserId: null,
    stagedNpcIds: null,
    speaking: [],
    roster: []
  })

  const channelRef = useRef<RealtimeChannel | null>(null)
  const loadedCampaignId = useRef<string | null>(null)

  // --- campaign from the database ------------------------------------------
  useEffect(() => {
    if (!campaignId) return
    let alive = true

    // Only block on the loading screen when actually switching campaigns.
    // A background refetch — the DM staged an NPC, renamed a scene — must
    // leave the stage mounted, or the canvas is torn down and rebuilt and the
    // players see a black flash mid-scene.
    if (loadedCampaignId.current !== campaignId) setLoading(true)

    void (async () => {
      const [campaignRes, charactersRes, scenesRes, castingRes] = await Promise.all([
        supabase().from('campaigns').select('*').eq('id', campaignId).maybeSingle(),
        supabase().from('characters').select('*').eq('campaign_id', campaignId),
        supabase().from('scenes').select('*').eq('campaign_id', campaignId).order('sort_order'),
        supabase().from('casting').select('*').eq('campaign_id', campaignId)
      ])

      if (!alive) return

      const failure =
        campaignRes.error ?? charactersRes.error ?? scenesRes.error ?? castingRes.error
      if (failure) {
        setError(failure.message)
        setLoading(false)
        return
      }
      if (!campaignRes.data) {
        setError('That campaign is no longer available.')
        setLoading(false)
        return
      }

      const row = campaignRes.data

      const characters: Character[] = (charactersRes.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        title: c.title,
        kind: c.kind,
        color: c.color,
        scale: c.scale == null ? 1 : Number(c.scale),
        portrait: c.portrait_path
      }))

      const scenes: Scene[] = (scenesRes.data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        background: s.background_path,
        npcIds: s.npc_ids ?? [],
        effect: s.effect,
        effectIntensity: Number(s.effect_intensity)
      }))

      const casting: Record<string, string> = {}
      for (const c of castingRes.data ?? []) casting[c.discord_user_id] = c.character_id

      setCampaign({
        name: row.name,
        characters,
        scenes,
        casting,
        stage: { ...defaultStageSettings(), ...(row.stage_settings ?? {}) },
        cloud: defaultCloudState(),
        activeSceneId: row.active_scene_id,
        gmVoiceCharacterId: row.gm_voice_character_id
      })

      // Seed from the database so there's a stage before the first broadcast.
      setState((prev) => ({
        ...prev,
        activeSceneId: prev.activeSceneId ?? row.active_scene_id,
        gmVoiceCharacterId: prev.gmVoiceCharacterId ?? row.gm_voice_character_id
      }))
      loadedCampaignId.current = campaignId
      setError(null)
      setLoading(false)
    })()

    return () => {
      alive = false
    }
  }, [campaignId, reloadKey])

  // --- live presentation channel -------------------------------------------
  useEffect(() => {
    if (!campaignId) return

    const channel = supabase().channel(`campaign:${campaignId}`, {
      config: { broadcast: { self: false } }
    })

    channel.on('broadcast', { event: 'speaking' }, ({ payload }) => {
      setState((prev) => ({ ...prev, speaking: payload?.speaking ?? [] }))
    })

    channel.on('broadcast', { event: 'stage' }, ({ payload }) => {
      setState((prev) => ({
        ...prev,
        activeSceneId: payload?.activeSceneId ?? prev.activeSceneId,
        gmVoiceCharacterId: payload?.gmVoiceCharacterId ?? null,
        gmUserId: payload?.gmUserId ?? prev.gmUserId,
        stagedNpcIds: payload?.stagedNpcIds ?? prev.stagedNpcIds,
        roster: payload?.roster ?? prev.roster
      }))
    })

    // The DM created a character, changed art, or renamed a scene. Those live
    // in the database rather than the broadcast, so refetch.
    channel.on('broadcast', { event: 'campaign_updated' }, () => {
      setReloadKey((k) => k + 1)
    })

    channel.subscribe((status) => {
      setLive(status === 'SUBSCRIBED')
      if (status === 'SUBSCRIBED') {
        // We may have joined mid-session, so ask the DM for current state
        // rather than waiting for the next thing to change.
        void channel.send({ type: 'broadcast', event: 'request_state', payload: {} })
      }
    })

    channelRef.current = channel
    return () => {
      channelRef.current = null
      void supabase().removeChannel(channel)
    }
  }, [campaignId])

  const snapshot = useMemo<AppSnapshot>(() => {
    if (!campaign) return EMPTY_SNAPSHOT

    const speaking = new Set(state.speaking)
    const members: VoiceMember[] = state.roster.map((m) => ({
      id: m.id,
      username: m.displayName,
      displayName: m.displayName,
      avatarUrl: m.avatarUrl,
      speaking: speaking.has(m.id),
      muted: m.muted,
      deafened: false,
      bot: false
    }))

    const activeSceneId = state.activeSceneId ?? campaign.activeSceneId

    // Staging arrives over the broadcast, so it applies instantly rather than
    // waiting for the next database sync.
    const scenes =
      state.stagedNpcIds === null
        ? campaign.scenes
        : campaign.scenes.map((s) =>
            s.id === activeSceneId ? { ...s, npcIds: state.stagedNpcIds! } : s
          )

    return {
      ...EMPTY_SNAPSHOT,
      connection: {
        ...EMPTY_SNAPSHOT.connection,
        status: live ? 'connected' : 'disconnected',
        // Players have no Discord pipe of their own; the DM's voice identity
        // arrives over the broadcast instead. computeStage needs it to know
        // whose card a GM-voiced NPC replaces.
        selfUserId: state.gmUserId
      },
      members,
      campaign: {
        ...campaign,
        scenes,
        activeSceneId,
        gmVoiceCharacterId: state.gmVoiceCharacterId
      }
    }
  }, [campaign, state, live])

  return {
    snapshot,
    loading,
    error,
    live,
    campaignName: campaign?.name ?? '',
    reload: () => setReloadKey((k) => k + 1)
  }
}
