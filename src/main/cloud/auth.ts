import { shell } from 'electron'
import http from 'node:http'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './client'

/**
 * Discord sign-in for the DM app.
 *
 * Electron's main process has no address bar for Supabase to redirect into, so
 * we stand up a one-shot loopback server, send the user to Discord in their
 * real browser (where they are already logged in), and catch the PKCE code on
 * the way back.
 */

const CALLBACK_PORT = 7373
export const CALLBACK_URL = `http://localhost:${CALLBACK_PORT}/auth/callback`

/** Shown in the browser tab once Discord bounces back. */
const DONE_PAGE = `<!doctype html>
<meta charset="utf-8">
<title>Dungeon Stage</title>
<body style="margin:0;height:100vh;display:grid;place-items:center;background:#0b0a10;color:#e7e3f4;font-family:system-ui,sans-serif">
  <div style="text-align:center">
    <div style="font-size:44px">&#127922;</div>
    <h1 style="font-weight:600;letter-spacing:.02em">You're signed in</h1>
    <p style="color:#8d86a3">Close this tab and head back to Dungeon Stage.</p>
  </div>
</body>`

const FAIL_PAGE = `<!doctype html>
<meta charset="utf-8">
<title>Dungeon Stage</title>
<body style="margin:0;height:100vh;display:grid;place-items:center;background:#0b0a10;color:#e7e3f4;font-family:system-ui,sans-serif">
  <div style="text-align:center">
    <h1 style="font-weight:600">Sign-in failed</h1>
    <p style="color:#8d86a3">Head back to Dungeon Stage and try again.</p>
  </div>
</body>`

let pendingServer: http.Server | null = null

/** Resolves once the user has completed the Discord round trip. */
export async function signInWithDiscord(): Promise<Session> {
  // A second attempt must not collide with a server left over from the first.
  await cancelPendingSignIn()

  const codePromise = waitForCallbackCode()

  const { data, error } = await supabase().auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo: CALLBACK_URL, skipBrowserRedirect: true }
  })

  if (error || !data?.url) {
    await cancelPendingSignIn()
    throw new Error(error?.message ?? 'Supabase did not return a Discord sign-in URL.')
  }

  await shell.openExternal(data.url)

  const code = await codePromise
  const exchanged = await supabase().auth.exchangeCodeForSession(code)
  if (exchanged.error || !exchanged.data.session) {
    throw new Error(exchanged.error?.message ?? 'Could not complete the Discord sign-in.')
  }
  return exchanged.data.session
}

function waitForCallbackCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost:${CALLBACK_PORT}`)
      if (!url.pathname.startsWith('/auth/callback')) {
        res.writeHead(404).end()
        return
      }

      const code = url.searchParams.get('code')
      const errorDescription =
        url.searchParams.get('error_description') ?? url.searchParams.get('error')

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(code ? DONE_PAGE : FAIL_PAGE)

      // Let the response flush before tearing the listener down.
      setImmediate(() => closeServer(server))

      if (code) resolve(code)
      else reject(new Error(errorDescription ?? 'Discord did not return an authorization code.'))
    })

    server.on('error', (err) => reject(err))
    server.listen(CALLBACK_PORT, '127.0.0.1', () => {
      pendingServer = server
    })

    // Don't leave a listener open forever if the user abandons the browser tab.
    setTimeout(
      () => {
        if (pendingServer === server) {
          closeServer(server)
          reject(new Error('Sign-in timed out. Try again.'))
        }
      },
      5 * 60 * 1000
    ).unref()
  })
}

function closeServer(server: http.Server): void {
  if (pendingServer === server) pendingServer = null
  server.close()
}

export async function cancelPendingSignIn(): Promise<void> {
  if (!pendingServer) return
  const server = pendingServer
  pendingServer = null
  await new Promise<void>((resolve) => server.close(() => resolve()))
}

export async function currentUser(): Promise<User | null> {
  const { data } = await supabase().auth.getSession()
  return data.session?.user ?? null
}

export async function signOut(): Promise<void> {
  await supabase().auth.signOut()
}
