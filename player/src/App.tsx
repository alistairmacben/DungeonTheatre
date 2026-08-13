import { useEffect, useState } from 'react'
import { StageView } from '@stage-ui/StageView'
import { DiceTray } from '@stage-ui/DiceTray'
import { supabase, storageUrl } from './supabase'
import { useMemberships, useSession } from './useSession'
import { useCampaignStage } from './useCampaignStage'
import { useDice } from './useDice'
import { usePlayerIdentity } from './usePlayerIdentity'

const LAST_CAMPAIGN_KEY = 'dungeon-stage:last-campaign'

export function App(): React.JSX.Element {
  const { session, ready } = useSession()
  const { memberships, loading: loadingMemberships, refresh } = useMemberships(session)
  const [campaignId, setCampaignId] = useState<string | null>(
    () => localStorage.getItem(LAST_CAMPAIGN_KEY)
  )

  // Drop straight back into the table you were last at.
  useEffect(() => {
    if (!campaignId && memberships.length === 1) setCampaignId(memberships[0]!.campaignId)
  }, [memberships, campaignId])

  useEffect(() => {
    if (campaignId) localStorage.setItem(LAST_CAMPAIGN_KEY, campaignId)
  }, [campaignId])

  if (!ready) return <Centered>Loading…</Centered>
  if (!session) return <SignIn />

  if (!campaignId) {
    return (
      <JoinScreen
        memberships={memberships}
        loading={loadingMemberships}
        onJoined={(id) => {
          refresh()
          setCampaignId(id)
        }}
        onPick={setCampaignId}
      />
    )
  }

  return (
    <Stage campaignId={campaignId} session={session} onLeave={() => setCampaignId(null)} />
  )
}

function Stage({
  campaignId,
  session,
  onLeave
}: {
  campaignId: string
  session: import('@supabase/supabase-js').Session
  onLeave: () => void
}): React.JSX.Element {
  const { snapshot, loading, error, live, campaignName } = useCampaignStage(campaignId)
  const identity = usePlayerIdentity(session, snapshot)
  const { roll, send } = useDice({
    campaignId,
    rollerId: identity.profileId,
    rollerName: identity.name,
    color: identity.color,
    characterId: identity.characterId
  })
  const [chromeVisible, setChromeVisible] = useState(true)
  const [trayOpen, setTrayOpen] = useState(false)

  // The stage is the point, so the UI gets out of the way on its own.
  useEffect(() => {
    if (!chromeVisible) return
    const timer = setTimeout(() => setChromeVisible(false), 4000)
    return () => clearTimeout(timer)
  }, [chromeVisible])

  if (error) {
    return (
      <Centered>
        <p className="text-rose-300">{error}</p>
        <button onClick={onLeave} className="mt-3 text-sm text-white/50 underline">
          Pick another campaign
        </button>
      </Centered>
    )
  }
  if (loading) return <Centered>Opening the stage…</Centered>

  return (
    <div className="relative h-full w-full" onMouseMove={() => setChromeVisible(true)}>
      <StageView
        snapshot={snapshot}
        resolveAsset={storageUrl}
        idleMessage={live ? 'The table is quiet…' : 'Waiting for your DM…'}
        roll={roll}
      />

      <header
        className={`pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/70 to-transparent p-3 transition-opacity duration-500 ${
          chromeVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="font-display text-sm tracking-wide text-ember">{campaignName}</span>
        <span
          className={`flex items-center gap-1 text-[11px] ${live ? 'text-emerald-300' : 'text-white/40'}`}
        >
          <span
            className={`size-1.5 rounded-full ${live ? 'animate-pulse bg-emerald-400' : 'bg-white/30'}`}
          />
          {live ? 'live' : 'connecting'}
        </span>

        <div className="pointer-events-auto ml-auto flex gap-2">
          <button
            onClick={() => {
              const el = document.documentElement
              if (document.fullscreenElement) void document.exitFullscreen()
              else void el.requestFullscreen()
            }}
            className="rounded border border-white/15 px-2 py-1 text-[11px] text-white/60 hover:border-ember/60 hover:text-ember"
          >
            fullscreen
          </button>
          <button
            onClick={onLeave}
            className="rounded border border-white/15 px-2 py-1 text-[11px] text-white/60 hover:border-ember/60 hover:text-ember"
          >
            switch
          </button>
        </div>
      </header>

      {/* Dice live in a drawer so the scene stays the focus until you need them. */}
      <button
        onClick={() => setTrayOpen((v) => !v)}
        className={`absolute bottom-4 right-4 z-40 grid size-14 place-items-center rounded-full border-2 text-2xl shadow-lg transition ${
          trayOpen
            ? 'border-ember bg-ember text-ink'
            : 'border-ember/50 bg-ink/85 text-ember backdrop-blur hover:border-ember'
        }`}
        title="Dice"
      >
        {trayOpen ? '×' : '⚄'}
      </button>

      <aside
        className={`absolute bottom-20 right-4 z-40 w-72 rounded-xl border border-ink-line bg-ink/95 p-4 shadow-2xl backdrop-blur transition-all ${
          trayOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <div className="mb-2 flex items-baseline gap-2">
          <span className="font-display text-sm text-ember">{identity.name}</span>
          {identity.characterId === null && (
            <span className="text-[10px] text-white/30">not cast yet</span>
          )}
        </div>
        <DiceTray
          compact
          allowSecret
          theme={identity.diceTheme}
          onThemeChange={identity.setDiceTheme}
          onRoll={(request) => {
            send(request, identity.diceTheme)
            setTrayOpen(false)
          }}
        />

        {identity.characterId && (
          <label className="mt-3 flex items-center gap-2 border-t border-ink-line pt-3">
            <span className="text-[10px] uppercase tracking-wider text-white/30">my size</span>
            <input
              type="range"
              min={0.6}
              max={1.4}
              step={0.05}
              value={identity.characterScale}
              onChange={(e) => identity.setCharacterScale(Number(e.target.value))}
              className="h-1 flex-1 accent-[var(--color-ember)]"
            />
            <span className="w-8 text-right text-[10px] tabular-nums text-white/35">
              {Math.round(identity.characterScale * 100)}%
            </span>
          </label>
        )}
      </aside>
    </div>
  )
}

function SignIn(): React.JSX.Element {
  const [busy, setBusy] = useState(false)

  return (
    <Centered>
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-3xl tracking-wide text-ember">Dungeon Stage</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50">
          Sign in with the same Discord account you play on. Your character is picked up
          automatically from your DM's casting.
        </p>
        <button
          disabled={busy}
          onClick={() => {
            setBusy(true)
            void supabase().auth.signInWithOAuth({
              provider: 'discord',
              options: { redirectTo: window.location.origin }
            })
          }}
          className="mt-6 w-full rounded-lg bg-[#5865F2] px-4 py-3 font-semibold text-white transition disabled:opacity-40 enabled:hover:brightness-110"
        >
          {busy ? 'Opening Discord…' : 'Sign in with Discord'}
        </button>
      </div>
    </Centered>
  )
}

function JoinScreen({
  memberships,
  loading,
  onJoined,
  onPick
}: {
  memberships: Array<{ campaignId: string; campaignName: string; role: string }>
  loading: boolean
  onJoined: (id: string) => void
  onPick: (id: string) => void
}): React.JSX.Element {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const join = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    const { data, error: rpcError } = await supabase().rpc('join_campaign', { code })
    setBusy(false)
    if (rpcError) setError(rpcError.message)
    else if (data) onJoined(data as string)
  }

  return (
    <Centered>
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-2xl tracking-wide text-ember">
          Join your table
        </h1>

        {!loading && memberships.length > 0 && (
          <ul className="mt-5 space-y-2">
            {memberships.map((m) => (
              <li key={m.campaignId}>
                <button
                  onClick={() => onPick(m.campaignId)}
                  className="w-full rounded-lg border border-ink-line bg-ink-soft px-3 py-2.5 text-left transition hover:border-ember/60"
                >
                  <span className="block text-sm">{m.campaignName}</span>
                  <span className="text-xs text-white/40">{m.role}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-center text-xs uppercase tracking-widest text-white/30">
          or enter an invite code
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && code && void join()}
          placeholder="ABCD1234"
          spellCheck={false}
          className="mt-2 w-full rounded-lg border border-ink-line bg-ink-soft px-3 py-3 text-center font-mono text-xl tracking-[0.3em] outline-none focus:border-ember/60"
        />
        <button
          disabled={!code || busy}
          onClick={() => void join()}
          className="mt-3 w-full rounded-lg bg-ember/90 px-4 py-2.5 font-semibold text-ink transition disabled:opacity-30 enabled:hover:bg-ember"
        >
          {busy ? 'Joining…' : 'Join'}
        </button>

        {error && <p className="mt-3 text-center text-sm text-rose-300">{error}</p>}

        <button
          onClick={() => void supabase().auth.signOut()}
          className="mt-6 w-full text-center text-xs text-white/30 hover:text-white/60"
        >
          sign out
        </button>
      </div>
    </Centered>
  )
}

function Centered({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <div className="grid h-full w-full place-items-center p-6">{children}</div>
}
