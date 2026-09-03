// The DM's side of the table.
//
// Everything the `#solo` harness has always offered — damage, healing,
// conditions, effects — has existed only there. A real DM opening the app got
// the stage and nothing to run it with, because `DmPanel` was never wired into
// anything but the harness. This is that wiring, plus the roster it needs to
// be useful: a DM does not act on "the character", they act on whichever of
// four players just walked into the trap.
//
// It lives in the web app rather than the Electron control app on purpose.
// Auth, sheet loading, the command pipeline and the view model are all here
// already; Electron has none of them and rebuilding that stack there would be
// duplicating the hardest part of the product to no benefit. Electron stays
// what it is — the projector and the scene controller.
//
// RLS was already on our side: `sheets_select` and `sheets_update` both permit
// `is_campaign_dm(campaign_id)`, so a DM has always been allowed to read and
// write every sheet at their table. Nothing about the backend changed.

import React, { useState } from 'react'
import { useServerGame } from '../../game/useServerGame'
import { DmPanel } from '../DmPanel'

export interface RosterEntry {
  id: string
  name: string
  kind: string
  color: string
}

export function DmScreen({ campaignId, actorId, roster, onClose }: {
  campaignId: string
  actorId: string | null
  roster: RosterEntry[]
  onClose(): void
}): React.JSX.Element {
  // Players first: an NPC is scenery, and the DM reaches for a player's sheet
  // far more often than for anything else.
  const players = roster.filter((c) => c.kind === 'pc')
  const [selectedId, setSelectedId] = useState<string | null>(players[0]?.id ?? null)

  return (
    <div className="pointer-events-auto absolute inset-y-0 right-0 z-40 flex w-[26rem] flex-col border-l border-ember/30 bg-ink/95 shadow-2xl backdrop-blur">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h2 className="font-display text-lg text-ember">Dungeon Master</h2>
          <p className="text-[11px] text-parchment/45">
            {players.length} player{players.length === 1 ? '' : 's'} at this table
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-parchment/70 transition hover:border-white/30 hover:text-parchment"
        >
          Close
        </button>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-white/10 px-4 py-3">
        {players.length === 0 && (
          <p className="text-[12px] text-parchment/40">
            Nobody is cast yet. Cast a player to a character in the desktop app
            and they will appear here.
          </p>
        )}
        {players.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedId(c.id)}
            style={{ borderLeftColor: c.color }}
            className={`rounded-lg border border-l-[3px] px-2.5 py-1.5 text-xs transition ${
              c.id === selectedId
                ? 'border-ember/60 bg-ember/10 text-parchment'
                : 'border-white/10 text-parchment/55 hover:text-parchment/85'
            }`}
          >
            {c.name}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {selectedId
          ? <DmCharacterTools key={selectedId} characterId={selectedId} campaignId={campaignId} actorId={actorId} />
          : null}
      </div>
    </div>
  )
}

/**
 * One character's sheet, opened as the DM.
 *
 * Keyed on the character upstream so switching targets remounts rather than
 * reusing a hook still holding the previous sheet — the same reason the solo
 * harness keys on its selection.
 */
function DmCharacterTools({ characterId, campaignId, actorId }: {
  characterId: string
  campaignId: string
  actorId: string | null
}): React.JSX.Element {
  const game = useServerGame({
    characterId,
    campaignId,
    actorId,
    role: 'dm',
    viewer: { kind: 'dm' }
  })

  if (game.loading) return <Note>Opening their sheet…</Note>
  if (game.error || !game.view) {
    return <Note>{game.error ?? 'This character has no sheet yet.'}</Note>
  }

  return (
    <div className="p-1">
      <DmPanel
        view={game.view}
        dispatch={(c) => game.dispatch(c).then((r) => r.rejected)}
        // The panel is embedded here rather than floating, so its own close
        // button would be closing something that is not a window.
        onClose={() => undefined}
        embedded
      />
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <p className="px-4 py-6 text-[13px] text-parchment/45">{children}</p>
}
