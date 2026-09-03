import { EventEmitter } from 'node:events'
import type {
  AppSnapshot,
  ConnectionState,
  DiscordUserId,
  SourceKind,
  VoiceMember
} from '@shared/types'
import { SpeakerSource } from './discord/SpeakerSource'
import { MockSource } from './discord/MockSource'
import { DiscordRpcSource } from './discord/DiscordRpcSource'
import { clearTokens, credentialState, saveCredentials } from './discord/credentials'
import { CampaignStore } from './campaign/store'
import { CloudManager } from './cloud/manager'
import { isWhisper, type DiceRoll } from '@shared/dice'

/**
 * Discord drops SPEAKING_STOP the moment voice activity dips, which happens
 * constantly between words. Holding the "speaking" flag for a beat after the
 * stop event keeps portraits from strobing during normal speech.
 */
const SPEAKING_RELEASE_MS = 350

export interface HubEvents {
  snapshot: [AppSnapshot]
}

/**
 * Owns all application state. Renderers are pure views over the snapshots
 * this emits; every mutation funnels through here so the OBS output and any
 * future window get an identical picture for free.
 */
export class Hub extends EventEmitter<HubEvents> {
  private connection: ConnectionState = {
    kind: 'mock',
    status: 'disconnected',
    message: null,
    channel: null,
    selfUserId: null
  }

  private members = new Map<DiscordUserId, VoiceMember>()
  private releaseTimers = new Map<DiscordUserId, NodeJS.Timeout>()

  private source: SpeakerSource | null = null

  readonly campaign = new CampaignStore()
  readonly cloud = new CloudManager()

  /**
   * Recent rolls, newest first. Whisper rolls never enter this — that is the
   * whole point of them — so the log is safe to show to anyone at the table.
   */
  private rollLog: DiceRoll[] = []
  private static readonly LOG_LIMIT = 200

  /** Set by main so a player's roll can also be shown on the DM's stage. */
  onRemoteRoll: ((roll: DiceRoll) => void) | null = null

  recordRoll(roll: DiceRoll): void {
    if (isWhisper(roll.visibility)) return
    // Rolls can arrive twice if a client retries; keep the log honest.
    if (this.rollLog.some((r) => r.id === roll.id)) return
    this.rollLog = [roll, ...this.rollLog].slice(0, Hub.LOG_LIMIT)
    this.publish()
  }

  clearRollLog(): void {
    this.rollLog = []
    this.publish()
  }

  async init(): Promise<void> {
    const campaign = this.campaign.load()
    this.cloud.bindSnapshot(() => this.getSnapshot())
    this.cloud.on('changed', () => this.publish())

    // Auto-sync. A DM adding an NPC and then wondering why nobody can see it
    // was the single most confusing thing about running a table: the live
    // channel only ever carried WHICH scene is showing, while the scenes and
    // characters themselves went up only when somebody remembered a button.
    // Now every change schedules its own push.
    this.campaign.onChanged = () => this.scheduleCloudSync()
    // Player rolls arrive over the channel; route them into the DM's log.
    this.cloud.onRemoteDice = (roll) => this.onRemoteRoll?.(roll as DiceRoll)
    this.publish()

    // Restoring a cached session must never block the app from starting.
    await this.cloud.restore(campaign).catch(() => {})

    // Reopen the live channel so players reconnect without the DM doing anything.
    if (campaign.cloud.campaignId && this.cloud.getStatus().user) {
      await this.cloud.connectLive(campaign.cloud.campaignId).catch(() => {})
    }
  }

  getSnapshot(): AppSnapshot {
    return {
      connection: { ...this.connection },
      members: [...this.members.values()].map((m) => ({ ...m })),
      discordAuth: credentialState(),
      campaign: structuredClone(this.campaign.get()),
      cloud: this.cloud.getStatus(),
      rollLog: this.rollLog
    }
  }

  /** Call after any campaign mutation so every window redraws. */
  campaignChanged(): void {
    this.publish()
    this.scheduleAutoSync()
  }

  private publish(): void {
    const snapshot = this.getSnapshot()
    this.emit('snapshot', snapshot)
    // Players see the same state change the DM's own windows do. The
    // broadcaster diffs internally, so an idle table sends nothing.
    this.cloud.publish(snapshot)
  }

  private syncTimer: NodeJS.Timeout | null = null
  /** True while a sync is writing its own bookkeeping back into the store. */
  private syncing = false

  /**
   * Queues a push, coalescing a burst of edits into one.
   *
   * Debounced because renaming an NPC is a keystroke per mutation, and each
   * one would otherwise be a round trip. Skipped entirely until the campaign
   * has been synced once — before that there is no cloud campaign to push to,
   * and the first push is a deliberate act the DM takes.
   */
  private scheduleCloudSync(): void {
    // `syncToCloud` records the campaign id and uploaded assets, which is
    // itself a mutation; without this guard the sync would trigger a sync.
    if (this.syncing) return
    if (!this.campaign.get().cloud.campaignId) return

    if (this.syncTimer) clearTimeout(this.syncTimer)
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null
      void this.syncToCloud()
    }, 1500)
  }

  /** Pushes the campaign to the backend and stores the returned cloud ids. */
  async syncToCloud(): Promise<void> {
    // `finally`, not a trailing assignment: a network failure that left this
    // flag raised would disable auto-sync for the rest of the session, and it
    // would look like the feature was never built.
    this.syncing = true
    try {
      const result = await this.cloud.sync(this.campaign.get())
      if (result) {
        this.campaign.recordCloudSync(result.campaignId, result.inviteCode, result.uploaded)
        // Players hold the campaign locally, so tell them to refetch.
        this.cloud.sendCampaignUpdated()
      }
    } finally {
      this.syncing = false
      this.publish()
    }
  }

  /**
   * Content changes — a new NPC, a portrait, a renamed scene — live in the
   * database rather than the broadcast, so they need a sync before players see
   * them. Debounced so a burst of typing doesn't hammer the network.
   */
  private autoSyncTimer: NodeJS.Timeout | null = null

  private scheduleAutoSync(): void {
    if (!this.campaign.get().cloud.campaignId) return
    if (this.cloud.getStatus().status !== 'signed-in') return
    if (this.autoSyncTimer) clearTimeout(this.autoSyncTimer)
    this.autoSyncTimer = setTimeout(() => {
      this.autoSyncTimer = null
      void this.syncToCloud()
    }, 1500)
  }

  // --- source lifecycle -----------------------------------------------------

  selectSource(kind: SourceKind): void {
    if (this.connection.kind === kind) return
    void this.disconnect()
    this.connection = {
      kind,
      status: 'disconnected',
      message: null,
      channel: null,
      selfUserId: null
    }
    this.publish()
  }

  async connect(): Promise<void> {
    await this.disconnect()

    const source = this.createSource(this.connection.kind)
    this.source = source
    this.wire(source)

    try {
      await source.start()
    } catch (err) {
      this.connection.status = 'error'
      this.connection.message = err instanceof Error ? err.message : String(err)
      this.publish()
    }
  }

  async disconnect(): Promise<void> {
    const source = this.source
    this.source = null
    for (const timer of this.releaseTimers.values()) clearTimeout(timer)
    this.releaseTimers.clear()

    if (source) {
      source.removeAllListeners()
      try {
        await source.stop()
      } catch {
        // A source that fails to shut down cleanly must not block reconnecting.
      }
    }

    this.members.clear()
    this.connection.status = 'disconnected'
    this.connection.message = null
    this.connection.channel = null
    this.connection.selfUserId = null
    this.publish()
  }

  private createSource(kind: SourceKind): SpeakerSource {
    switch (kind) {
      case 'mock':
        return new MockSource()
      case 'discord-rpc':
        return new DiscordRpcSource()
    }
  }

  saveDiscordCredentials(clientId: string, clientSecret: string): void {
    saveCredentials({ clientId: clientId.trim(), clientSecret: clientSecret.trim() })
    this.publish()
  }

  forgetDiscordAuth(): void {
    clearTokens()
    this.publish()
  }

  private wire(source: SpeakerSource): void {
    source.on('status', ({ status, message }) => {
      this.connection.status = status
      this.connection.message = message ?? null
      this.publish()
    })

    source.on('self', (selfUserId) => {
      this.connection.selfUserId = selfUserId
      this.publish()
    })

    source.on('channel', (channel) => {
      this.connection.channel = channel
      if (!channel) this.members.clear()
      this.publish()
    })

    source.on('members', (members) => {
      // Copy: a source must never hold a reference into hub state, or its own
      // bookkeeping would silently mutate ours and defeat the release hold.
      this.members = new Map(members.map((m) => [m.id, { ...m }]))
      this.publish()
    })

    source.on('memberUpsert', (member) => {
      const existing = this.members.get(member.id)
      // Preserve live speaking state across roster refreshes.
      this.members.set(member.id, { ...member, speaking: existing?.speaking ?? member.speaking })
      this.publish()
    })

    source.on('memberRemove', (userId) => {
      this.members.delete(userId)
      this.clearRelease(userId)
      this.publish()
    })

    source.on('speaking', ({ userId, speaking }) => this.applySpeaking(userId, speaking))
  }

  // --- speaking with release hold ------------------------------------------

  private applySpeaking(userId: DiscordUserId, speaking: boolean): void {
    const member = this.members.get(userId)
    if (!member) return

    if (speaking) {
      this.clearRelease(userId)
      if (member.speaking) return
      member.speaking = true
      this.publish()
      return
    }

    // Debounce the stop so brief pauses between words don't flicker the stage.
    this.clearRelease(userId)
    this.releaseTimers.set(
      userId,
      setTimeout(() => {
        this.releaseTimers.delete(userId)
        const current = this.members.get(userId)
        if (!current || !current.speaking) return
        current.speaking = false
        this.publish()
      }, SPEAKING_RELEASE_MS)
    )
  }

  private clearRelease(userId: DiscordUserId): void {
    const timer = this.releaseTimers.get(userId)
    if (timer) {
      clearTimeout(timer)
      this.releaseTimers.delete(userId)
    }
  }

  // --- mock passthrough -----------------------------------------------------

  mockSetSpeaking(userId: DiscordUserId, speaking: boolean): void {
    if (this.source instanceof MockSource) this.source.setSpeaking(userId, speaking)
  }
}
