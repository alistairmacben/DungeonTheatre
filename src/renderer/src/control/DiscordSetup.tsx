import { useState } from 'react'
import type { DiscordAuthState } from '@shared/types'
import { send } from '../shared/useSnapshot'

const STEPS = [
  'Open discord.com/developers/applications and hit New Application.',
  'Copy the Application ID from General Information — that is your Client ID.',
  'Go to OAuth2, add the redirect URI  http://localhost  and save.',
  'On the same page, Reset Secret and copy the Client Secret.',
  'Paste both below. You are the app owner, so Discord grants you the rpc scope automatically.'
]

export function DiscordSetup({ auth }: { auth: DiscordAuthState }): React.JSX.Element {
  const [clientId, setClientId] = useState(auth.clientId ?? '')
  const [clientSecret, setClientSecret] = useState('')
  const [saved, setSaved] = useState(false)

  const canSave = clientId.trim().length > 5 && clientSecret.trim().length > 5

  return (
    <div className="rounded-lg border border-ink-line bg-ink-soft p-4">
      <h3 className="text-sm font-semibold text-ember">Discord application</h3>

      <ol className="mt-2.5 space-y-1 text-xs leading-relaxed text-white/45">
        {STEPS.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-white/25">{i + 1}.</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      <div className="mt-3 space-y-2">
        <input
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value)
            setSaved(false)
          }}
          placeholder="Client ID"
          spellCheck={false}
          className="w-full rounded-md border border-ink-line bg-ink px-2.5 py-1.5 text-sm outline-none focus:border-ember/60"
        />
        <input
          value={clientSecret}
          onChange={(e) => {
            setClientSecret(e.target.value)
            setSaved(false)
          }}
          type="password"
          placeholder={auth.hasSecret ? 'Client Secret (saved — retype to replace)' : 'Client Secret'}
          spellCheck={false}
          className="w-full rounded-md border border-ink-line bg-ink px-2.5 py-1.5 text-sm outline-none focus:border-ember/60"
        />
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <button
          disabled={!canSave}
          onClick={() => {
            send({ type: 'discord:saveCredentials', clientId, clientSecret })
            setClientSecret('')
            setSaved(true)
          }}
          className="rounded-md bg-arcane/80 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-30 enabled:hover:bg-arcane"
        >
          Save
        </button>
        {auth.hasToken && (
          <button
            onClick={() => send({ type: 'discord:forgetAuth' })}
            className="rounded-md border border-ink-line px-3 py-1.5 text-xs text-white/60 hover:border-rose-400/50 hover:text-rose-300"
          >
            Sign out
          </button>
        )}
        {saved && <span className="text-xs text-emerald-300">Saved</span>}
        {auth.hasToken && !saved && (
          <span className="text-xs text-white/35">Authorised — connect won't re-prompt</span>
        )}
      </div>
    </div>
  )
}
