import type { RealtimeChannel } from '@supabase/supabase-js'
import type { AppSnapshot } from '@shared/types'
import { supabase } from './client'

/**
 * Pushes presentation state to the players.
 *
 * This is the latency path the whole feature is judged on, so it is kept as
 * thin as possible:
 *
 *  - It uses Realtime **Broadcast**, which relays through the edge and never
 *    touches Postgres. Writing a row per speaking event would add a database
 *    round trip to every syllable.
 *  - Only deltas go over the wire. A speaking event is two fields. Players
 *    already hold the campaign from the database and compose the stage
 *    locally, so nothing large is ever re-sent mid-sentence.
 *  - Nothing is awaited on the hot path; we fire and let the socket drain.
 */

/**
 * Enough about a person in the voice channel for the player app to draw them
 * even when the DM hasn't cast them to a character yet.
 */
export interface PresentationMember {
  id: string
  displayName: string
  avatarUrl: string | null
  muted: boolean
}

export interface PresentationState {
  activeSceneId: string | null
  gmVoiceCharacterId: string | null
  /**
   * The DM's own Discord id. Players need it because the stage decides which
   * card a GM-voiced NPC takes over from — without it, a voiced NPC would sit
   * on the players' stage and never light up when the DM speaks.
   */
  gmUserId: string | null
  /**
   * NPCs the DM has staged in the active scene. Staging is a live act — the
   * DM pushes an NPC on mid-conversation — so it rides the broadcast rather
   * than waiting for a database sync.
   */
  stagedNpcIds: string[]
  /** Discord user ids currently talking. The only thing sent at speech rate. */
  speaking: string[]
  /** Who is in the channel. Changes rarely, so it can afford the detail. */
  roster: PresentationMember[]
}

export const EVENT = {
  speaking: 'speaking',
  stage: 'stage',
  dice: 'dice',
  requestState: 'request_state',
  /** Tells players the campaign rows changed and they should refetch. */
  campaignUpdated: 'campaign_updated'
} as const

export class PresentationBroadcaster {
  private channel: RealtimeChannel | null = null
  private lastState: PresentationState | null = null

  /** Called when a player rolls, so the DM's stage and log see it too. */
  onDice: ((roll: unknown) => void) | null = null

  async connect(campaignId: string, snapshotFor: () => PresentationState): Promise<void> {
    await this.disconnect()

    const channel = supabase().channel(`campaign:${campaignId}`, {
      config: { broadcast: { self: false } }
    })

    // Players roll too. Without this the DM only ever sees their own dice.
    channel.on('broadcast', { event: EVENT.dice }, ({ payload }) => {
      if (payload) this.onDice?.(payload)
    })

    // A player opening the app mid-session has no idea who is talking, so they
    // ask and we answer. Cheaper and more reliable than a periodic heartbeat.
    channel.on('broadcast', { event: EVENT.requestState }, () => {
      this.sendState(snapshotFor())
    })

    await new Promise<void>((resolve, reject) => {
      channel.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') resolve()
        else if (status === 'CHANNEL_ERROR') reject(err ?? new Error('Realtime channel error'))
        else if (status === 'TIMED_OUT') reject(new Error('Realtime channel timed out'))
      })
    })

    this.channel = channel
    this.sendState(snapshotFor())
  }

  async disconnect(): Promise<void> {
    const channel = this.channel
    this.channel = null
    this.lastState = null
    if (channel) await supabase().removeChannel(channel)
  }

  get connected(): boolean {
    return this.channel !== null
  }

  /**
   * Called on every hub snapshot. Diffs against what players were last told
   * and sends only what changed, so an idle table generates no traffic.
   */
  publish(state: PresentationState): void {
    if (!this.channel) return
    const previous = this.lastState

    if (!previous) {
      this.sendState(state)
      return
    }

    const speakingChanged =
      previous.speaking.length !== state.speaking.length ||
      state.speaking.some((id) => !previous.speaking.includes(id))

    // Roster or scene changes are rare; speaking changes constantly. Splitting
    // them keeps the frequent message tiny.
    const stageChanged =
      previous.activeSceneId !== state.activeSceneId ||
      previous.gmVoiceCharacterId !== state.gmVoiceCharacterId ||
      previous.gmUserId !== state.gmUserId ||
      previous.stagedNpcIds.join(',') !== state.stagedNpcIds.join(',') ||
      rosterKey(previous) !== rosterKey(state)

    if (stageChanged) {
      this.send(EVENT.stage, {
        activeSceneId: state.activeSceneId,
        gmVoiceCharacterId: state.gmVoiceCharacterId,
        gmUserId: state.gmUserId,
        stagedNpcIds: state.stagedNpcIds,
        roster: state.roster
      })
    }
    if (speakingChanged) {
      this.send(EVENT.speaking, { speaking: state.speaking })
    }

    this.lastState = { ...state }
  }

  /** Full state, used on connect and when a player asks for it. */
  private sendState(state: PresentationState): void {
    this.lastState = { ...state }
    this.send(EVENT.stage, {
      activeSceneId: state.activeSceneId,
      gmVoiceCharacterId: state.gmVoiceCharacterId,
      roster: state.roster
    })
    this.send(EVENT.speaking, { speaking: state.speaking })
  }

  /** Relays a dice roll to the table. */
  sendDice(payload: unknown): void {
    this.send(EVENT.dice, payload)
  }

  /** Nudges players to refetch the campaign after a database sync. */
  sendCampaignUpdated(): void {
    this.send(EVENT.campaignUpdated, {})
  }

  private send(event: string, payload: unknown): void {
    // Deliberately not awaited: a speaking highlight must not wait on a
    // promise chain, and a dropped frame is harmless because the next state
    // change resends.
    void this.channel?.send({ type: 'broadcast', event, payload })
  }
}

/** Cheap comparison key so an unchanged roster doesn't re-broadcast. */
function rosterKey(state: PresentationState): string {
  return state.roster.map((m) => `${m.id}:${m.displayName}:${m.muted}`).join('|')
}

/** Derives what players need from the DM's full snapshot. */
export function presentationFrom(snapshot: AppSnapshot): PresentationState {
  const humans = snapshot.members.filter((m) => !m.bot)
  const activeScene = snapshot.campaign.scenes.find(
    (s) => s.id === snapshot.campaign.activeSceneId
  )
  return {
    activeSceneId: snapshot.campaign.activeSceneId,
    stagedNpcIds: activeScene?.npcIds ?? [],
    gmVoiceCharacterId: snapshot.campaign.gmVoiceCharacterId,
    gmUserId: snapshot.connection.selfUserId,
    speaking: humans.filter((m) => m.speaking).map((m) => m.id),
    roster: humans.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      avatarUrl: m.avatarUrl,
      muted: m.muted
    }))
  }
}
