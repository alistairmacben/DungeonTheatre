import { EventEmitter } from 'node:events'
import type { Campaign } from '@shared/campaign'
import type { AppSnapshot, CloudStatus } from '@shared/types'
import { currentUser, signInWithDiscord, signOut } from './auth'
import { PresentationBroadcaster, presentationFrom } from './broadcast'
import { ensureCampaign, pushCampaign, uploadAssets } from './sync'

export interface CloudManagerEvents {
  changed: []
}

/**
 * Owns the DM's relationship with the backend: who is signed in, which cloud
 * campaign this maps to, and the live channel players listen on.
 */
export class CloudManager extends EventEmitter<CloudManagerEvents> {
  private status: CloudStatus = {
    status: 'signed-out',
    user: null,
    campaignId: null,
    inviteCode: null,
    message: null,
    live: false,
    lastSyncAt: null
  }

  private broadcaster = new PresentationBroadcaster()
  private latestSnapshot: (() => AppSnapshot) | null = null

  /** Set by the hub so player rolls reach the DM's windows and log. */
  set onRemoteDice(handler: (roll: unknown) => void) {
    this.broadcaster.onDice = handler
  }

  getStatus(): CloudStatus {
    return { ...this.status, live: this.broadcaster.connected }
  }

  private update(patch: Partial<CloudStatus>): void {
    this.status = { ...this.status, ...patch }
    this.emit('changed')
  }

  /** Restores a cached session on launch so the DM isn't asked every time. */
  async restore(campaign: Campaign): Promise<void> {
    const user = await currentUser().catch(() => null)
    if (!user) return

    this.update({
      status: 'signed-in',
      user: {
        id: user.id,
        name:
          (user.user_metadata?.['full_name'] as string) ??
          (user.user_metadata?.['name'] as string) ??
          'Dungeon Master',
        avatarUrl: (user.user_metadata?.['avatar_url'] as string) ?? null
      },
      campaignId: campaign.cloud.campaignId,
      inviteCode: campaign.cloud.inviteCode
    })
  }

  async signIn(): Promise<void> {
    this.update({ status: 'signing-in', message: 'Finish signing in with Discord in your browser…' })
    try {
      const session = await signInWithDiscord()
      const meta = session.user.user_metadata ?? {}
      this.update({
        status: 'signed-in',
        message: null,
        user: {
          id: session.user.id,
          name: (meta['full_name'] as string) ?? (meta['name'] as string) ?? 'Dungeon Master',
          avatarUrl: (meta['avatar_url'] as string) ?? null
        }
      })
    } catch (err) {
      this.update({
        status: 'error',
        message: err instanceof Error ? err.message : String(err)
      })
    }
  }

  async signOut(): Promise<void> {
    await this.broadcaster.disconnect()
    await signOut().catch(() => {})
    this.update({
      status: 'signed-out',
      user: null,
      campaignId: null,
      inviteCode: null,
      message: null,
      live: false
    })
  }

  /**
   * Pushes the campaign up and opens the live channel.
   *
   * Returns the cloud bookkeeping the caller should persist locally, or null
   * if the sync failed. Asset upload failures are reported but do not abort
   * the sync — a missing portrait should not stop the table from playing.
   */
  async sync(
    campaign: Campaign
  ): Promise<{ campaignId: string; inviteCode: string; uploaded: string[] } | null> {
    const user = this.status.user
    if (!user) {
      this.update({ status: 'error', message: 'Sign in with Discord before syncing.' })
      return null
    }

    this.update({ status: 'syncing', message: 'Uploading campaign…' })

    try {
      const { campaignId, inviteCode } = await ensureCampaign(campaign, user.id)

      const { uploaded, failed } = await uploadAssets(campaign, campaignId)
      await pushCampaign(campaign, campaignId)

      await this.connectLive(campaignId)

      const note = failed.length
        ? `Synced, but ${failed.length} image(s) failed: ${failed.map((f) => f.name).join(', ')}`
        : null

      this.update({
        status: 'signed-in',
        campaignId,
        inviteCode,
        message: note,
        lastSyncAt: Date.now()
      })

      return { campaignId, inviteCode, uploaded }
    } catch (err) {
      this.update({
        status: 'error',
        message: err instanceof Error ? err.message : String(err)
      })
      return null
    }
  }

  async connectLive(campaignId: string): Promise<void> {
    if (!this.latestSnapshot) return
    const snapshotFor = this.latestSnapshot
    await this.broadcaster.connect(campaignId, () => presentationFrom(snapshotFor()))
    this.emit('changed')
  }

  /** Wires the hub's snapshot accessor so we can answer state requests. */
  bindSnapshot(getSnapshot: () => AppSnapshot): void {
    this.latestSnapshot = getSnapshot
  }

  /** Called on every hub snapshot. Cheap: diffs and sends only changes. */
  publish(snapshot: AppSnapshot): void {
    this.broadcaster.publish(presentationFrom(snapshot))
  }

  sendDice(payload: unknown): void {
    this.broadcaster.sendDice(payload)
  }

  sendCampaignUpdated(): void {
    this.broadcaster.sendCampaignUpdated()
  }

  async shutdown(): Promise<void> {
    await this.broadcaster.disconnect()
  }
}
