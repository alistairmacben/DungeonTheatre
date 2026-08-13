import { EventEmitter } from 'node:events'
import type {
  ConnectionStatus,
  DiscordUserId,
  SourceKind,
  VoiceChannelInfo,
  VoiceMember
} from '@shared/types'

export interface SpeakerSourceEvents {
  /** Connection lifecycle. `message` is shown verbatim in the UI. */
  status: [{ status: ConnectionStatus; message?: string | null }]
  /** Which Discord user is the local one — i.e. the GM running this app. */
  self: [DiscordUserId | null]
  /** The voice channel we are now following, or null when the user leaves. */
  channel: [VoiceChannelInfo | null]
  /** Full roster replacement. */
  members: [VoiceMember[]]
  /** One member joined or changed (mute/deafen/nickname). */
  memberUpsert: [VoiceMember]
  memberRemove: [DiscordUserId]
  /** The hot path: someone started or stopped talking. */
  speaking: [{ userId: DiscordUserId; speaking: boolean }]
}

/**
 * A backend that answers "who is talking right now".
 *
 * Implementations must be safe to `stop()` at any time, including mid-connect,
 * and must never throw out of an event handler — report problems via
 * `status` with `'error'` instead so the UI can show them.
 */
export abstract class SpeakerSource extends EventEmitter<SpeakerSourceEvents> {
  abstract readonly kind: SourceKind

  abstract start(): Promise<void>
  abstract stop(): Promise<void>

  protected setStatus(status: ConnectionStatus, message?: string | null): void {
    this.emit('status', { status, message: message ?? null })
  }
}
