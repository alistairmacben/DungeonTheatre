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

import React, { useMemo, useState } from 'react'
import { loadContent, type ContentIndex, type PlayerView, type RollSpec } from '@engine'
import { useServerGame } from '../../game/useServerGame'
import { DmPanel } from '../DmPanel'
import { LootBrowser } from './LootBrowser'
import { DmDice, type StageRoll } from './DmDice'

export interface RosterEntry {
  id: string
  name: string
  kind: string
  color: string
}

export function DmScreen({ campaignId, actorId, roster, onRollToStage, onClose }: {
  campaignId: string
  actorId: string | null
  roster: RosterEntry[]
  /** Sends a roll to the stage everyone is watching. */
  onRollToStage(roll: StageRoll): void
  onClose(): void
}): React.JSX.Element {
  // Players first: an NPC is scenery, and the DM reaches for a player's sheet
  // far more often than for anything else.
  const players = roster.filter((c) => c.kind === 'pc')
  const [selectedId, setSelectedId] = useState<string | null>(players[0]?.id ?? null)
  const [tab, setTab] = useState<'tools' | 'loot' | 'dice'>('tools')
  const [note, setNote] = useState<string | null>(null)
  // The whole catalogue, loaded once — the loot browser searches it and the
  // DM screen is the only place that needs it.
  const content = useMemo<ContentIndex>(() => loadContent(), [])
  // The open character's view, lifted so the dice tab can roll their saves.
  const [openView, setOpenView] = useState<PlayerView | null>(null)
  const [openRoll, setOpenRoll] = useState<((spec: RollSpec) => void) | null>(null)

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

      <nav className="flex gap-1 border-b border-white/10 px-4 py-2">
        {([['tools', 'Tools'], ['loot', 'Loot'], ['dice', 'Dice']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1 text-xs transition ${
              tab === id ? 'bg-ember/15 text-ember' : 'text-parchment/50 hover:text-parchment/80'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {note && (
        <p className="border-b border-white/10 px-4 py-2 text-[12px] text-parchment/70">{note}</p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'tools' && (selectedId
          ? (
            <DmCharacterTools
              key={selectedId}
              characterId={selectedId}
              campaignId={campaignId}
              actorId={actorId}
              onReady={(view, roll) => { setOpenView(view); setOpenRoll(() => roll) }}
            />
          )
          : <Note>Pick a player above.</Note>)}

        {tab === 'loot' && (
          <div className="p-4">
            <LootBrowser
              content={content}
              targets={players.map((p) => ({ id: p.id, name: p.name }))}
              onGranted={setNote}
            />
          </div>
        )}

        {tab === 'dice' && (
          <div className="p-4">
            <DmDice
              view={openView}
              onRollToStage={onRollToStage}
              onRollCharacter={(spec) => openRoll?.(spec)}
            />
          </div>
        )}
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
function DmCharacterTools({ characterId, campaignId, actorId, onReady }: {
  characterId: string
  campaignId: string
  actorId: string | null
  /**
   * Hands the loaded sheet up, so the Dice tab can roll this character's own
   * saves and skills. The view lives in a hook here and the tab that needs it
   * is a sibling, so it has to travel upward rather than be fetched twice —
   * two hooks on one sheet would mean two revisions of it.
   */
  onReady(view: PlayerView, roll: (spec: RollSpec) => void): void
}): React.JSX.Element {
  const game = useServerGame({
    characterId,
    campaignId,
    actorId,
    role: 'dm',
    viewer: { kind: 'dm' }
  })

  // A ref-free effect: report the view whenever it changes identity.
  React.useEffect(() => {
    if (game.view) {
      onReady(game.view, (spec) => { void game.dispatch({ ...spec.command, faces: [] } as never) })
    }
  }, [game.view])

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
