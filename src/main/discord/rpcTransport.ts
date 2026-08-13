import net from 'node:net'
import { EventEmitter } from 'node:events'
import { randomUUID } from 'node:crypto'

/**
 * Low-level transport for Discord's local RPC server.
 *
 * We deliberately use the IPC pipe rather than the RPC WebSocket: the
 * WebSocket transport validates the connection's Origin header against the
 * application's registered `rpc_origins` and is restricted to Discord itself
 * plus a handful of partners. The IPC pipe sends no Origin, so that check is
 * bypassed and any valid client_id may connect. This is the same door the
 * official discord-rpc / pypresence libraries use.
 *
 * Framing is 4-byte little-endian opcode, 4-byte little-endian payload
 * length, then UTF-8 JSON.
 */

export const OP = {
  HANDSHAKE: 0,
  FRAME: 1,
  CLOSE: 2,
  PING: 3,
  PONG: 4
} as const

/** Discord tries pipes 0-9 in order; a second client instance takes the next. */
const PIPE_RANGE = 10

function pipePathsForPlatform(): string[] {
  const paths: string[] = []

  // An explicit override wins outright. Used by the test harness, and a way
  // out for sandboxed Discord installs that put the socket somewhere unusual.
  const override = process.env['DUNGEON_RPC_PIPE']
  if (override) return [override]

  if (process.platform === 'win32') {
    for (let i = 0; i < PIPE_RANGE; i++) paths.push(`\\\\?\\pipe\\discord-ipc-${i}`)
    return paths
  }

  // Unix: the socket lives in the runtime dir, with extra hops for sandboxed
  // Discord installs (Flatpak / Snap) that place it under their own prefix.
  const base =
    process.env['XDG_RUNTIME_DIR'] ??
    process.env['TMPDIR'] ??
    process.env['TMP'] ??
    process.env['TEMP'] ??
    '/tmp'

  const prefixes = ['', 'app/com.discordapp.Discord/', 'snap.discord/', '.flatpak/dev.vencord.Vesktop/xdg-run/']
  for (const prefix of prefixes) {
    for (let i = 0; i < PIPE_RANGE; i++) {
      paths.push(`${base.replace(/\/$/, '')}/${prefix}discord-ipc-${i}`)
    }
  }
  return paths
}

export interface RpcFrame {
  cmd: string
  evt: string | null
  nonce: string | null
  data: unknown
}

export interface RpcTransportEvents {
  /** Any DISPATCH frame (an event we subscribed to). */
  dispatch: [{ evt: string; data: any }]
  /** The pipe dropped. */
  close: [{ reason: string }]
}

interface Pending {
  resolve: (data: any) => void
  reject: (err: Error) => void
  timer: NodeJS.Timeout
}

export class RpcTransport extends EventEmitter<RpcTransportEvents> {
  private socket: net.Socket | null = null
  private buffer: Buffer = Buffer.alloc(0)
  private pending = new Map<string, Pending>()
  private closed = false

  /**
   * Opens the first Discord pipe that accepts us and completes the v1
   * handshake. Resolves with the READY payload (contains the local user).
   */
  async connect(clientId: string): Promise<any> {
    const candidates = pipePathsForPlatform()
    let lastError: Error | null = null

    for (const path of candidates) {
      try {
        this.socket = await openPipe(path)
        break
      } catch (err) {
        lastError = err as Error
      }
    }

    if (!this.socket) {
      throw new Error(
        `Could not reach the Discord desktop client. Make sure Discord is running and you are logged in. (${lastError?.message ?? 'no pipe found'})`
      )
    }

    this.socket.on('data', (chunk: Buffer) => this.onData(chunk))
    this.socket.on('close', () => this.handleClose('pipe closed'))
    this.socket.on('error', (err) => this.handleClose(err.message))

    const ready = new Promise<any>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Discord did not answer the handshake in time.')),
        10_000
      )
      this.pending.set('__ready__', { resolve, reject, timer })
    })

    this.write(OP.HANDSHAKE, { v: 1, client_id: clientId })
    return ready
  }

  /** Sends a command frame and waits for the matching nonce to come back. */
  request(cmd: string, args?: Record<string, unknown>, opts?: { evt?: string; timeoutMs?: number }): Promise<any> {
    if (!this.socket || this.closed) return Promise.reject(new Error('RPC transport is not connected.'))

    const nonce = randomUUID()
    const frame: Record<string, unknown> = { cmd, nonce }
    if (args) frame['args'] = args
    if (opts?.evt) frame['evt'] = opts.evt

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(nonce)
        reject(new Error(`Discord did not respond to ${cmd}${opts?.evt ? ` ${opts.evt}` : ''}.`))
      }, opts?.timeoutMs ?? 10_000)

      this.pending.set(nonce, { resolve, reject, timer })
      this.write(OP.FRAME, frame)
    })
  }

  close(): void {
    if (this.closed) return
    this.closed = true
    for (const p of this.pending.values()) {
      clearTimeout(p.timer)
      p.reject(new Error('RPC transport closed.'))
    }
    this.pending.clear()
    this.socket?.destroy()
    this.socket = null
  }

  // --- internals ------------------------------------------------------------

  private write(op: number, payload: unknown): void {
    if (!this.socket) return
    const body = Buffer.from(JSON.stringify(payload), 'utf8')
    const header = Buffer.alloc(8)
    header.writeInt32LE(op, 0)
    header.writeInt32LE(body.length, 4)
    this.socket.write(Buffer.concat([header, body]))
  }

  private onData(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk])

    // A single read can carry several frames, or half of one.
    while (this.buffer.length >= 8) {
      const op = this.buffer.readInt32LE(0)
      const length = this.buffer.readInt32LE(4)
      if (this.buffer.length < 8 + length) break

      const raw = this.buffer.subarray(8, 8 + length).toString('utf8')
      this.buffer = this.buffer.subarray(8 + length)

      let frame: RpcFrame
      try {
        frame = JSON.parse(raw)
      } catch {
        continue
      }

      if (op === OP.PING) {
        this.write(OP.PONG, frame)
        continue
      }
      if (op === OP.CLOSE) {
        this.handleClose(
          (frame.data as { message?: string } | undefined)?.message ?? 'Discord closed the connection'
        )
        continue
      }
      this.handleFrame(frame)
    }
  }

  private handleFrame(frame: RpcFrame): void {
    // The handshake reply is a DISPATCH/READY with no nonce.
    if (frame.cmd === 'DISPATCH' && frame.evt === 'READY') {
      const ready = this.pending.get('__ready__')
      if (ready) {
        clearTimeout(ready.timer)
        this.pending.delete('__ready__')
        ready.resolve(frame.data)
      }
      return
    }

    if (frame.cmd === 'DISPATCH') {
      if (frame.evt) this.emit('dispatch', { evt: frame.evt, data: frame.data })
      return
    }

    if (!frame.nonce) return
    const waiting = this.pending.get(frame.nonce)
    if (!waiting) return
    clearTimeout(waiting.timer)
    this.pending.delete(frame.nonce)

    if (frame.evt === 'ERROR') {
      const err = frame.data as { code?: number; message?: string }
      waiting.reject(new Error(err?.message ?? `Discord returned error ${err?.code ?? '?'}`))
    } else {
      waiting.resolve(frame.data)
    }
  }

  private handleClose(reason: string): void {
    if (this.closed) return
    this.closed = true
    for (const p of this.pending.values()) {
      clearTimeout(p.timer)
      p.reject(new Error(reason))
    }
    this.pending.clear()
    this.socket?.destroy()
    this.socket = null
    this.emit('close', { reason })
  }
}

function openPipe(path: string): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ path })
    const onError = (err: Error): void => {
      socket.destroy()
      reject(err)
    }
    socket.once('error', onError)
    socket.once('connect', () => {
      socket.off('error', onError)
      resolve(socket)
    })
  })
}
