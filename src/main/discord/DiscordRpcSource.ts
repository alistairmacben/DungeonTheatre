import { SpeakerSource } from './SpeakerSource'
import { RpcTransport } from './rpcTransport'
import {
  loadCredentials,
  loadTokens,
  saveTokens,
  clearTokens,
  type DiscordTokens
} from './credentials'
import type { SourceKind, VoiceChannelInfo, VoiceMember } from '@shared/types'

/**
 * `rpc` is a gated scope, but Discord always grants it to the application's
 * own owner (and to users added as testers). Since every GM registers their
 * own app, this is authorised on the first run and cached after that.
 */
const SCOPES = ['rpc', 'rpc.voice.read']

/**
 * Must match a redirect URI registered on the application. Nothing is ever
 * served here — the RPC flow hands us the code directly over the pipe — but
 * Discord still validates the value during the token exchange.
 */
const REDIRECT_URI = 'http://localhost'

const TOKEN_URL = 'https://discord.com/api/oauth2/token'

/** Per-channel events we need for a live roster plus talking state. */
const CHANNEL_EVENTS = [
  'VOICE_STATE_CREATE',
  'VOICE_STATE_UPDATE',
  'VOICE_STATE_DELETE',
  'SPEAKING_START',
  'SPEAKING_STOP'
] as const

interface RpcVoiceState {
  nick?: string | null
  mute?: boolean
  voice_state?: {
    mute?: boolean
    deaf?: boolean
    self_mute?: boolean
    self_deaf?: boolean
    suppress?: boolean
  }
  user: {
    id: string
    username: string
    global_name?: string | null
    discriminator?: string
    avatar?: string | null
    bot?: boolean
  }
}

export class DiscordRpcSource extends SpeakerSource {
  readonly kind: SourceKind = 'discord-rpc'

  private transport: RpcTransport | null = null
  private channelId: string | null = null
  private stopped = false

  async start(): Promise<void> {
    this.stopped = false
    const creds = loadCredentials()
    if (!creds) {
      this.setStatus(
        'error',
        'No Discord application configured. Add your Client ID and Client Secret in Settings.'
      )
      return
    }

    this.setStatus('connecting', 'Looking for the Discord desktop client…')

    const transport = new RpcTransport()
    this.transport = transport
    transport.on('close', ({ reason }) => {
      if (this.stopped) return
      this.channelId = null
      this.emit('members', [])
      this.emit('channel', null)
      this.setStatus('error', `Discord connection lost: ${reason}`)
    })
    transport.on('dispatch', ({ evt, data }) => this.onDispatch(evt, data))

    try {
      const ready = await transport.connect(creds.clientId)
      // READY tells us who is logged into this Discord client: that's the GM.
      const selfId = (ready as { user?: { id?: string } })?.user?.id ?? null
      this.emit('self', selfId)
    } catch (err) {
      this.setStatus('error', err instanceof Error ? err.message : String(err))
      return
    }
    if (this.stopped) return

    try {
      await this.authenticate(creds.clientId, creds.clientSecret)
    } catch (err) {
      this.setStatus('error', err instanceof Error ? err.message : String(err))
      return
    }
    if (this.stopped) return

    this.setStatus('connected', 'Listening to your Discord voice channel.')

    // Follow the user as they hop channels.
    await transport.request('SUBSCRIBE', undefined, { evt: 'VOICE_CHANNEL_SELECT' })
    await this.refreshChannel()
  }

  async stop(): Promise<void> {
    this.stopped = true
    const transport = this.transport
    this.transport = null
    this.channelId = null
    transport?.removeAllListeners()
    transport?.close()
    this.setStatus('disconnected')
  }

  // --- auth -----------------------------------------------------------------

  private async authenticate(clientId: string, clientSecret: string): Promise<void> {
    const cached = loadTokens()

    if (cached && cached.expiresAt > Date.now() + 60_000) {
      try {
        await this.transport!.request('AUTHENTICATE', { access_token: cached.accessToken })
        return
      } catch {
        // Token was revoked or is for a different app — fall through and redo.
        clearTokens()
      }
    }

    if (cached?.refreshToken) {
      try {
        const refreshed = await this.exchange(clientId, clientSecret, {
          grant_type: 'refresh_token',
          refresh_token: cached.refreshToken
        })
        saveTokens(refreshed)
        await this.transport!.request('AUTHENTICATE', { access_token: refreshed.accessToken })
        return
      } catch {
        clearTokens()
      }
    }

    this.setStatus(
      'awaiting-auth',
      'Discord is asking you to authorise Dungeon Stage — check your Discord window and click Authorize.'
    )

    // The user has two minutes to click Authorize in the Discord client.
    const authorized = await this.transport!.request(
      'AUTHORIZE',
      { client_id: clientId, scopes: SCOPES },
      { timeoutMs: 120_000 }
    )

    const code = (authorized as { code?: string })?.code
    if (!code) throw new Error('Discord did not return an authorization code.')

    const tokens = await this.exchange(clientId, clientSecret, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI
    })
    saveTokens(tokens)
    await this.transport!.request('AUTHENTICATE', { access_token: tokens.accessToken })
  }

  private async exchange(
    clientId: string,
    clientSecret: string,
    grant: Record<string, string>
  ): Promise<DiscordTokens> {
    const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...grant })
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(
        `Token exchange failed (${res.status}). Check the Client Secret, and that "${REDIRECT_URI}" is listed as a redirect URI on your Discord application. ${detail}`
      )
    }

    const json = (await res.json()) as {
      access_token: string
      refresh_token?: string
      expires_in: number
    }
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? null,
      expiresAt: Date.now() + json.expires_in * 1000
    }
  }

  // --- channel following ----------------------------------------------------

  private async refreshChannel(): Promise<void> {
    if (!this.transport || this.stopped) return

    let channel: any
    try {
      channel = await this.transport.request('GET_SELECTED_VOICE_CHANNEL')
    } catch (err) {
      this.setStatus('error', err instanceof Error ? err.message : String(err))
      return
    }

    await this.setChannel(channel)
  }

  private async setChannel(channel: any): Promise<void> {
    const nextId: string | null = channel?.id ?? null
    if (nextId === this.channelId) return

    if (this.channelId) await this.unsubscribeChannel(this.channelId)
    this.channelId = nextId

    if (!nextId) {
      this.emit('members', [])
      this.emit('channel', null)
      this.setStatus('connected', 'Join a voice channel in Discord and the stage will follow.')
      return
    }

    const info: VoiceChannelInfo = {
      id: nextId,
      name: channel?.name ?? 'Voice channel',
      guildId: channel?.guild_id ?? null
    }
    this.emit('channel', info)

    const states: RpcVoiceState[] = channel?.voice_states ?? []
    this.emit('members', states.map(toMember))

    await this.subscribeChannel(nextId)
    this.setStatus('connected', `Following #${info.name}.`)
  }

  private async subscribeChannel(channelId: string): Promise<void> {
    if (!this.transport) return
    for (const evt of CHANNEL_EVENTS) {
      try {
        await this.transport.request('SUBSCRIBE', { channel_id: channelId }, { evt })
      } catch (err) {
        this.setStatus(
          'error',
          `Could not subscribe to ${evt}: ${err instanceof Error ? err.message : String(err)}`
        )
      }
    }
  }

  private async unsubscribeChannel(channelId: string): Promise<void> {
    if (!this.transport) return
    for (const evt of CHANNEL_EVENTS) {
      // Best effort: the channel may already be gone.
      await this.transport.request('UNSUBSCRIBE', { channel_id: channelId }, { evt }).catch(() => {})
    }
  }

  // --- events ---------------------------------------------------------------

  private onDispatch(evt: string, data: any): void {
    switch (evt) {
      case 'SPEAKING_START':
        this.emit('speaking', { userId: data.user_id, speaking: true })
        break
      case 'SPEAKING_STOP':
        this.emit('speaking', { userId: data.user_id, speaking: false })
        break
      case 'VOICE_STATE_CREATE':
      case 'VOICE_STATE_UPDATE':
        this.emit('memberUpsert', toMember(data as RpcVoiceState))
        break
      case 'VOICE_STATE_DELETE':
        this.emit('memberRemove', (data as RpcVoiceState).user.id)
        break
      case 'VOICE_CHANNEL_SELECT':
        // Discord only gives us the id here, so re-fetch for the full roster.
        void this.refreshChannel()
        break
    }
  }
}

function toMember(state: RpcVoiceState): VoiceMember {
  const user = state.user
  const vs = state.voice_state ?? {}
  return {
    id: user.id,
    username: user.username,
    displayName: state.nick || user.global_name || user.username,
    avatarUrl: avatarUrl(user.id, user.avatar ?? null),
    speaking: false,
    muted: !!(vs.mute || vs.self_mute || vs.suppress),
    deafened: !!(vs.deaf || vs.self_deaf),
    bot: !!user.bot
  }
}

function avatarUrl(userId: string, hash: string | null): string {
  if (hash) {
    const ext = hash.startsWith('a_') ? 'gif' : 'png'
    return `https://cdn.discordapp.com/avatars/${userId}/${hash}.${ext}?size=128`
  }
  // Default avatars for the post-discriminator username system.
  const index = Number((BigInt(userId) >> 22n) % 6n)
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`
}
