// A stand-in for the Discord desktop client's RPC pipe.
// Speaks the same 8-byte-header framing and the subset of commands we use.
import net from 'node:net'

const OP = { HANDSHAKE: 0, FRAME: 1, CLOSE: 2, PING: 3, PONG: 4 }

// Deliberately NOT discord-ipc-0: a real Discord client may own that pipe on
// the dev machine, and binding it would either fail or, worse, let the test
// talk to the real client instead of this stub.
export const PIPE =
  process.platform === 'win32'
    ? `\\\\.\\pipe\\dungeon-stage-test-${process.pid}`
    : `${process.env['TMPDIR'] ?? '/tmp'}/dungeon-stage-test-${process.pid}`

const CHANNEL = {
  id: '1122334455',
  name: 'The Rusty Flagon',
  guild_id: '999000',
  type: 2,
  voice_states: [
    {
      nick: 'Brenna Stormcloak',
      voice_state: { mute: false, deaf: false, self_mute: false, self_deaf: false },
      user: { id: '1001', username: 'brenna', global_name: 'Brenna', avatar: 'abc123', bot: false }
    },
    {
      nick: null,
      voice_state: { mute: true, deaf: false, self_mute: true, self_deaf: false },
      user: { id: '1002', username: 'kade', global_name: 'Kade', avatar: null, bot: false }
    }
  ]
}

function frame(socket, op, payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8')
  const header = Buffer.alloc(8)
  header.writeInt32LE(op, 0)
  header.writeInt32LE(body.length, 4)
  socket.write(Buffer.concat([header, body]))
}

const server = net.createServer((socket) => {
  let buffer = Buffer.alloc(0)
  console.log('[fake-discord] client connected')

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk])
    while (buffer.length >= 8) {
      const op = buffer.readInt32LE(0)
      const len = buffer.readInt32LE(4)
      if (buffer.length < 8 + len) break
      const msg = JSON.parse(buffer.subarray(8, 8 + len).toString('utf8'))
      buffer = buffer.subarray(8 + len)
      handle(socket, op, msg)
    }
  })
  socket.on('error', () => {})
})

function handle(socket, op, msg) {
  if (op === OP.HANDSHAKE) {
    console.log('[fake-discord] handshake for client', msg.client_id)
    frame(socket, OP.FRAME, {
      cmd: 'DISPATCH',
      evt: 'READY',
      nonce: null,
      data: { v: 1, user: { id: '1000', username: 'thedm', discriminator: '0' } }
    })
    return
  }

  const reply = (data) => frame(socket, OP.FRAME, { cmd: msg.cmd, evt: msg.evt ?? null, nonce: msg.nonce, data })

  switch (msg.cmd) {
    case 'AUTHENTICATE':
      console.log('[fake-discord] AUTHENTICATE token=', msg.args.access_token)
      reply({ user: { id: '1000', username: 'thedm' }, scopes: ['rpc', 'rpc.voice.read'] })
      break

    case 'SUBSCRIBE':
      console.log('[fake-discord] SUBSCRIBE', msg.evt, msg.args?.channel_id ?? '')
      reply({ evt: msg.evt })
      break

    case 'UNSUBSCRIBE':
      reply({ evt: msg.evt })
      break

    case 'GET_SELECTED_VOICE_CHANNEL':
      console.log('[fake-discord] GET_SELECTED_VOICE_CHANNEL')
      reply(CHANNEL)
      // Once the client is subscribed, start a little conversation.
      setTimeout(() => {
        const dispatch = (evt, data) => frame(socket, OP.FRAME, { cmd: 'DISPATCH', evt, nonce: null, data })
        dispatch('SPEAKING_START', { channel_id: CHANNEL.id, user_id: '1001' })
        setTimeout(() => dispatch('SPEAKING_STOP', { channel_id: CHANNEL.id, user_id: '1001' }), 150)
        setTimeout(() => dispatch('SPEAKING_START', { channel_id: CHANNEL.id, user_id: '1002' }), 300)
        setTimeout(
          () =>
            dispatch('VOICE_STATE_CREATE', {
              nick: 'Sorrel',
              voice_state: { mute: false, deaf: false, self_mute: false, self_deaf: false },
              user: { id: '1003', username: 'sorrel', global_name: 'Sorrel', avatar: null, bot: false }
            }),
          420
        )
      }, 120)
      break

    default:
      reply({})
  }
}

server.listen(PIPE, () => console.log('[fake-discord] listening on', PIPE))
