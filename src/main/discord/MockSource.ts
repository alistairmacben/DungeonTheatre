import { SpeakerSource } from './SpeakerSource'
import type { DiscordUserId, SourceKind, VoiceMember } from '@shared/types'

const CAST: Array<Pick<VoiceMember, 'id' | 'username' | 'displayName'>> = [
  { id: 'mock-1', username: 'alistair', displayName: 'Alistair (DM)' },
  { id: 'mock-2', username: 'brenna', displayName: 'Brenna' },
  { id: 'mock-3', username: 'kade', displayName: 'Kade' },
  { id: 'mock-4', username: 'sorrel', displayName: 'Sorrel' },
  { id: 'mock-5', username: 'thorne', displayName: 'Thorne' }
]

/**
 * A fake voice channel so the stage can be built and demoed with no Discord
 * client running. Also the fallback we drop to when RPC auth fails.
 */
export class MockSource extends SpeakerSource {
  readonly kind: SourceKind = 'mock'

  private members = new Map<DiscordUserId, VoiceMember>()
  /** Speaking state belongs to the Hub; we only track it to debounce repeats. */
  private talking = new Set<DiscordUserId>()

  async start(): Promise<void> {
    this.setStatus('connecting')
    this.members = new Map(
      CAST.map((c) => [
        c.id,
        {
          ...c,
          avatarUrl: null,
          speaking: false,
          muted: false,
          deafened: false,
          bot: false
        }
      ])
    )
    this.emit('self', 'mock-1')
    this.emit('channel', { id: 'mock-vc', name: 'The Rusty Flagon (mock)', guildId: null })
    this.emit('members', [...this.members.values()])
    this.setStatus('connected', 'Mock source — click a name to make them talk')
  }

  async stop(): Promise<void> {
    this.members.clear()
    this.talking.clear()
    this.emit('members', [])
    this.emit('channel', null)
    this.setStatus('disconnected')
  }

  setSpeaking(userId: DiscordUserId, speaking: boolean): void {
    if (!this.members.has(userId)) return
    if (this.talking.has(userId) === speaking) return
    if (speaking) this.talking.add(userId)
    else this.talking.delete(userId)
    this.emit('speaking', { userId, speaking })
  }
}
