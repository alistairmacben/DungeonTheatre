import { useState } from 'react'
import type { ConnectionStatus, SourceKind } from '@shared/types'
import { send, useSnapshot } from '../shared/useSnapshot'
import { DiscordSetup } from './DiscordSetup'
import { CastPanel } from './CastPanel'
import { ScenesPanel } from './ScenesPanel'
import { StagePanel } from './StagePanel'
import { CloudPanel } from './CloudPanel'
import { DicePanel } from './DicePanel'
import { LogPanel } from './LogPanel'

const STATUS_STYLE: Record<ConnectionStatus, string> = {
  disconnected: 'bg-white/10 text-white/60',
  connecting: 'bg-amber-500/20 text-amber-200',
  'awaiting-auth': 'bg-arcane/25 text-arcane',
  connected: 'bg-emerald-500/20 text-emerald-300',
  error: 'bg-rose-500/20 text-rose-300'
}

const SOURCES: Array<{ kind: SourceKind; label: string; blurb: string }> = [
  {
    kind: 'discord-rpc',
    label: 'Discord (local client)',
    blurb: 'Reads your running Discord app over its local pipe. No bot needed.'
  },
  {
    kind: 'mock',
    label: 'Mock channel',
    blurb: 'Five fake players you can make talk by hand. For building scenes.'
  }
]

type Tab = 'cast' | 'scenes' | 'stage' | 'dice' | 'log'

export function ControlApp(): React.JSX.Element {
  const snapshot = useSnapshot()
  const { connection, campaign, discordAuth, cloud } = snapshot
  const [tab, setTab] = useState<Tab>('cast')

  const live = connection.status === 'connected'
  const busy = connection.status === 'connecting' || connection.status === 'awaiting-auth'
  const voicing = campaign.characters.find((c) => c.id === campaign.gmVoiceCharacterId)

  return (
    <div className="flex h-full flex-col bg-ink">
      <header className="flex items-center gap-3 border-b border-ink-line px-5 py-3">
        <h1 className="font-display text-lg tracking-wide text-ember">Dungeon Stage</h1>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[connection.status]}`}
        >
          {connection.status}
        </span>
        {connection.channel && (
          <span className="text-sm text-white/50">🔊 {connection.channel.name}</span>
        )}

        {voicing && (
          <button
            onClick={() => send({ type: 'gmVoice:set', characterId: null })}
            className="rounded-full bg-arcane/25 px-2.5 py-0.5 text-xs text-arcane hover:bg-arcane/40"
            title="Stop voicing this NPC"
          >
            voicing {voicing.name} ✕
          </button>
        )}

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => send({ type: 'stage:open' })}
            className="rounded-md border border-ink-line px-3 py-1.5 text-sm hover:border-ember/60 hover:text-ember"
          >
            Open Stage
          </button>
          <button
            onClick={() => send({ type: 'stage:toggleFullscreen' })}
            className="rounded-md border border-ink-line px-3 py-1.5 text-sm hover:border-ember/60 hover:text-ember"
          >
            Fullscreen
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[320px_1fr] overflow-hidden">
        <aside className="overflow-y-auto border-r border-ink-line p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
            Voice source
          </h2>
          <div className="space-y-2">
            {SOURCES.map((s) => (
              <button
                key={s.kind}
                onClick={() => send({ type: 'source:select', kind: s.kind })}
                className={`block w-full rounded-lg border p-3 text-left transition ${
                  connection.kind === s.kind
                    ? 'border-ember/60 bg-ember/10'
                    : 'border-ink-line hover:border-white/25'
                }`}
              >
                <div className="text-sm font-medium">{s.label}</div>
                <div className="mt-0.5 text-xs leading-snug text-white/45">{s.blurb}</div>
              </button>
            ))}
          </div>

          <button
            onClick={() => send({ type: live || busy ? 'source:disconnect' : 'source:connect' })}
            className={`mt-4 w-full rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              live || busy
                ? 'bg-rose-500/15 text-rose-200 hover:bg-rose-500/25'
                : 'bg-ember/90 text-ink hover:bg-ember'
            }`}
          >
            {live ? 'Disconnect' : busy ? 'Cancel' : 'Connect'}
          </button>

          {connection.message && (
            <p className="mt-3 rounded-md border border-ink-line bg-ink-soft p-2.5 text-xs leading-relaxed text-white/55">
              {connection.message}
            </p>
          )}

          {connection.kind === 'mock' && live && (
            <MockTalkPad snapshot={snapshot} />
          )}

          <div className="mt-4">
            <CloudPanel cloud={cloud} />
          </div>

          {connection.kind === 'discord-rpc' && (
            <div className="mt-4">
              <DiscordSetup auth={discordAuth} />
            </div>
          )}
        </aside>

        <main className="overflow-y-auto p-5">
          <nav className="mb-4 flex gap-1 border-b border-ink-line">
            {(['cast', 'scenes', 'stage', 'dice', 'log'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm capitalize transition ${
                  tab === t
                    ? 'border-ember text-ember'
                    : 'border-transparent text-white/45 hover:text-white/75'
                }`}
              >
                {t}
              </button>
            ))}
          </nav>

          {tab === 'cast' && <CastPanel snapshot={snapshot} />}
          {tab === 'scenes' && <ScenesPanel snapshot={snapshot} />}
          {tab === 'stage' && <StagePanel snapshot={snapshot} />}
          {tab === 'dice' && <DicePanel snapshot={snapshot} />}
          {tab === 'log' && <LogPanel snapshot={snapshot} />}
        </main>
      </div>
    </div>
  )
}

/** Press-and-hold buttons so the mock source can drive the stage by hand. */
function MockTalkPad({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }): React.JSX.Element {
  return (
    <div className="mt-4 rounded-lg border border-ink-line bg-ink-soft p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">
        Hold to talk
      </h3>
      <div className="space-y-1">
        {snapshot.members.map((m) => (
          <button
            key={m.id}
            onMouseDown={() => send({ type: 'mock:setSpeaking', userId: m.id, speaking: true })}
            onMouseUp={() => send({ type: 'mock:setSpeaking', userId: m.id, speaking: false })}
            onMouseLeave={() => send({ type: 'mock:setSpeaking', userId: m.id, speaking: false })}
            className={`block w-full rounded border px-2 py-1 text-left text-xs transition ${
              m.speaking
                ? 'border-emerald-400/70 bg-emerald-400/15 text-emerald-200'
                : 'border-ink-line text-white/55'
            }`}
          >
            {m.displayName}
          </button>
        ))}
      </div>
    </div>
  )
}
