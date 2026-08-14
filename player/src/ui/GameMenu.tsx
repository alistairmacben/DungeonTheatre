// The RPG menu.
//
// Four categories, not eight. Actions is one list with facets rather than
// separate Spells and Abilities tabs, because the engine already unified them
// as EffectSource → Action and splitting them here would force this file to
// classify game content — the coupling the whole architecture avoids.

import React, { useState } from 'react'
import type { ActionView, EffectView, ItemView, PlayerCommand, PlayerView } from '@engine'
import { BreakdownList, Value } from './Readouts'

export type MenuTab = 'character' | 'inventory' | 'actions' | 'effects'

const TABS: { id: MenuTab; label: string }[] = [
  { id: 'character', label: 'Character' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'actions', label: 'Actions' },
  { id: 'effects', label: 'Effects' }
]

export function GameMenu({
  view, tab, onTab, onClose, dispatch
}: {
  view: PlayerView
  tab: MenuTab
  onTab(tab: MenuTab): void
  onClose(): void
  dispatch(command: PlayerCommand): string[] | undefined
}): React.JSX.Element {
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-ink/70 backdrop-blur-sm">
      <div className="flex h-[82%] w-[86%] max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink/95 shadow-2xl">

        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg text-parchment">{view.meta.name}</h2>
            <p className="text-xs text-parchment/50">
              Level {view.progression.level} {view.progression.species.subspeciesLabel ?? view.progression.species.label}
              {' '}{view.progression.classes.map((c) => c.label).join(' / ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Resting is the other half of spending. Which resources come back
                is the refresh rule each one declares, not anything decided here. */}
            <button
              type="button"
              onClick={() => dispatch({ type: 'shortRest', characterId: view.meta.characterId })}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-parchment/70 transition hover:border-white/30 hover:text-parchment"
            >
              Short Rest
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'longRest', characterId: view.meta.characterId })}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-parchment/70 transition hover:border-white/30 hover:text-parchment"
            >
              Long Rest
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-parchment/70 transition hover:border-white/30 hover:text-parchment"
            >
              Close
            </button>
          </div>
        </header>

        <nav className="flex gap-1 border-b border-white/10 px-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTab(t.id)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm transition ${
                tab === t.id
                  ? 'border-arcane text-parchment'
                  : 'border-transparent text-parchment/50 hover:text-parchment/80'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'character' && <CharacterTab view={view} />}
          {tab === 'inventory' && <InventoryTab view={view} dispatch={dispatch} />}
          {tab === 'actions' && <ActionsTab view={view} dispatch={dispatch} />}
          {tab === 'effects' && <EffectsTab view={view} />}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <section className="mb-7">
      <h3 className="mb-3 text-[11px] uppercase tracking-widest text-parchment/40">{title}</h3>
      {children}
    </section>
  )
}

function CharacterTab({ view }: { view: PlayerView }): React.JSX.Element {
  return (
    <div>
      <Section title="Vitals">
        <div className="flex flex-wrap gap-8">
          <Stat label="Hit Points">
            <span className="text-3xl font-semibold tabular-nums text-parchment">
              {view.vitals.hitPoints.current}
            </span>
            <span className="ml-1 text-sm text-parchment/40">/ {view.vitals.hitPoints.max.display}</span>
          </Stat>
          <Stat label="Armour Class"><Value readout={view.vitals.armorClass} size="lg" /></Stat>
          <Stat label="Speed"><Value readout={view.vitals.speed} size="lg" /></Stat>
          <Stat label="Initiative"><Value readout={view.vitals.initiative} size="lg" /></Stat>
          <Stat label="Proficiency"><Value readout={view.progression.proficiencyBonus} size="lg" /></Stat>
        </div>
      </Section>

      <Section title="Abilities">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {view.abilities.map((a) => (
            <div key={a.ability} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-widest text-parchment/40">{a.label}</p>
              <div className="mt-1"><Value readout={a.modifier} /></div>
              <p className="mt-1 text-[11px] text-parchment/40">score {a.score.display}</p>
              <div className="mt-2 flex items-baseline gap-1 border-t border-white/5 pt-2">
                <span className="text-[10px] uppercase tracking-wide text-parchment/35">Save</span>
                <Value readout={a.save} size="sm" />
                {a.save.proficient && <span className="text-[9px] text-arcane">◆</span>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Skills">
        <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {view.skills.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-white/5 py-1.5">
              <span className="flex items-center gap-1.5 text-sm text-parchment/80">
                {s.proficiency !== 'none' && (
                  <span className="text-[9px] text-arcane" title={s.proficiency}>
                    {s.proficiency === 'expertise' ? '◆◆' : '◆'}
                  </span>
                )}
                {s.label}
                <span className="text-[10px] uppercase text-parchment/30">{s.ability}</span>
                {s.rollState !== 'normal' && (
                  <span
                    title={s.rollStateReasons.join(' · ')}
                    className={`text-[9px] ${s.rollState === 'advantage' ? 'text-verdigris' : 'text-ember'}`}
                  >
                    {s.rollState === 'advantage' ? '▲' : '▼'}
                  </span>
                )}
              </span>
              <Value readout={s.total} size="sm" />
            </div>
          ))}
        </div>
      </Section>

      {view.notices.length > 0 && (
        <Section title="Situational">
          <ul className="space-y-2">
            {view.notices.map((n) => (
              <li key={n.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
                <p className="text-parchment/80">{n.label}</p>
                <p className="mt-1 text-[13px] text-parchment/50">{n.text}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-widest text-parchment/40">{label}</p>
      <div className="flex items-baseline">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function InventoryTab({
  view, dispatch
}: { view: PlayerView; dispatch(c: PlayerCommand): string[] | undefined }): React.JSX.Element {
  const [error, setError] = useState<string | null>(null)

  const equip = (item: ItemView): void => {
    const command: PlayerCommand = item.equipped
      ? { type: 'unequipItem', characterId: view.meta.characterId, slot: item.slot! }
      : { type: 'equipItem', characterId: view.meta.characterId, instanceId: item.instanceId, slot: item.slot! }
    setError(dispatch(command)?.join(' · ') ?? null)
  }

  const groups: { id: ItemView['group']; label: string }[] = [
    { id: 'equipped', label: 'Equipped' },
    { id: 'carried', label: 'Carried' },
    { id: 'consumables', label: 'Consumables' },
    { id: 'valuables', label: 'Valuables' },
    { id: 'quest', label: 'Quest' }
  ]

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg border border-ember/40 bg-ember/10 px-3 py-2 text-sm text-ember">{error}</p>
      )}

      <Section title="Equipment Slots">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {view.equipment.map((s) => (
            <div key={s.slot} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-widest text-parchment/40">{s.label}</p>
              <p className="mt-1 truncate text-sm text-parchment">{s.itemLabel ?? '—'}</p>
              {s.effectSummary.length > 0 && (
                <p className="mt-1 text-[11px] text-parchment/45">{s.effectSummary.slice(0, 2).join(' · ')}</p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {groups.map(({ id, label }) => {
        const items = view.inventory.filter((i) => i.group === id)
        if (items.length === 0) return null
        return (
          <Section key={id} title={label}>
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li
                  key={item.instanceId}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  {/* Placeholder art slot — real item icons land in a later phase. */}
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-[10px] text-parchment/30">
                    {item.label.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm text-parchment">
                      {item.label}
                      {item.quantity > 1 && <span className="text-[11px] text-parchment/40">×{item.quantity}</span>}
                      {item.provenance === 'dm' && (
                        <span className="rounded bg-ember/20 px-1 text-[9px] uppercase tracking-wide text-ember">DM</span>
                      )}
                      {item.attuned && (
                        <span className="rounded bg-arcane/20 px-1 text-[9px] uppercase tracking-wide text-arcane">Attuned</span>
                      )}
                    </p>
                    {item.effectSummary.length > 0 && (
                      <p className="truncate text-[12px] text-parchment/45">{item.effectSummary.join(' · ')}</p>
                    )}
                    {item.weaponSummary && (
                      <p className="text-[12px] text-parchment/45">
                        {item.weaponSummary.damageLabel} {item.weaponSummary.damageType}
                        {item.weaponSummary.properties.length > 0 && ` · ${item.weaponSummary.properties.join(', ')}`}
                      </p>
                    )}
                  </div>

                  {item.slot && (
                    <button
                      type="button"
                      onClick={() => equip(item)}
                      className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs transition ${
                        item.equipped
                          ? 'border-white/15 text-parchment/70 hover:border-white/30'
                          : 'border-arcane/50 text-arcane hover:bg-arcane/10'
                      }`}
                    >
                      {item.equipped ? 'Unequip' : 'Equip'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------

const FACETS = [
  { id: 'all', label: 'All' },
  { id: 'attack', label: 'Attacks' },
  { id: 'cast', label: 'Spells' },
  { id: 'ability', label: 'Abilities' },
  { id: 'item', label: 'Items' },
  // Dash, Dodge, Hide and the rest. Every ActionKind needs a facet or its
  // actions are reachable only from All, which is a filter that hides things.
  { id: 'basic', label: 'Common' },
  { id: 'movement', label: 'Movement' }
] as const

function ActionsTab({ view, dispatch }: {
  view: PlayerView
  dispatch(command: PlayerCommand): string[] | undefined
}): React.JSX.Element {
  const [facet, setFacet] = useState<string>('all')
  const shown = facet === 'all'
    ? view.actions
    : view.actions.filter((a) => a.kind === facet)

  return (
    <div>
      <div className="mb-4 flex gap-1">
        {FACETS.map((f) => {
          const count = f.id === 'all'
            ? view.actions.length
            : view.actions.filter((a) => a.kind === f.id).length
          if (count === 0 && f.id !== 'all') return null
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFacet(f.id)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                facet === f.id
                  ? 'border-arcane/60 bg-arcane/10 text-parchment'
                  : 'border-white/10 text-parchment/50 hover:text-parchment/80'
              }`}
            >
              {f.label} <span className="text-parchment/30">{count}</span>
            </button>
          )
        })}
      </div>

      <ul className="space-y-2">
        {shown.map((a) => <ActionRow key={a.id} action={a} dispatch={dispatch} />)}
      </ul>
    </div>
  )
}

function ActionRow({ action, dispatch }: {
  action: ActionView
  dispatch(command: PlayerCommand): string[] | undefined
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [rejected, setRejected] = useState<string[] | null>(null)
  return (
    <li
      className={`rounded-xl border px-4 py-3 ${
        action.available ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 bg-transparent opacity-60'
      }`}
    >
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-start gap-3 text-left">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm text-parchment">
            {action.label}
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-parchment/45">
              {action.cost.label}
            </span>
          </p>
          {action.description && <p className="mt-0.5 text-[12px] text-parchment/50">{action.description}</p>}

          {action.costs.length > 0 && (
            <p className="mt-1 text-[12px] text-arcane/80">Costs {action.costs.map((c) => c.label).join(', ')}</p>
          )}

          {/* The engine says why. The UI never works it out. */}
          {!action.available && (
            <p className="mt-1 text-[12px] text-ember">
              Unavailable — {action.unavailableReasons.join(' · ')}
            </p>
          )}
        </div>

        {action.preview?.attackBonusDisplay && (
          <div className="shrink-0 text-right">
            <p className="text-sm tabular-nums text-parchment">{action.preview.attackBonusDisplay}</p>
            <p className="text-[11px] text-parchment/45">{action.preview.damageLabel}</p>
          </div>
        )}
      </button>

      {(action.available || rejected) && (
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            disabled={!action.available}
            onClick={() => setRejected(dispatch(action.command) ?? null)}
            className="rounded-lg border border-arcane/50 bg-arcane/10 px-3 py-1 text-xs text-parchment transition hover:bg-arcane/20 disabled:opacity-40"
          >
            Use
          </button>
          {/* A rejection is a result, not an error — it says why, like any
              unavailable action would have. */}
          {rejected && rejected.length > 0 && (
            <span className="text-[12px] text-ember">{rejected.join(' · ')}</span>
          )}
        </div>
      )}

      {open && action.breakdown && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <BreakdownList breakdown={action.breakdown} />
        </div>
      )}
    </li>
  )
}

// ---------------------------------------------------------------------------

function EffectsTab({ view }: { view: PlayerView }): React.JSX.Element {
  // What is happening to you now, and what is permanently true of you. The
  // split is the view's `kind`; the tab does not decide which is which.
  const active = view.effects.filter((e) => e.kind !== 'passive')
  const passive = view.effects.filter((e) => e.kind === 'passive')

  return (
    <div className="space-y-6">
      <Section title="Active">
        {active.length === 0
          ? <p className="text-sm text-parchment/45">Nothing is affecting you right now.</p>
          : <EffectList effects={active} />}
      </Section>
      {passive.length > 0 && (
        <Section title="Traits and features">
          <EffectList effects={passive} />
        </Section>
      )}
    </div>
  )
}

function EffectList({ effects }: { effects: EffectView[] }): React.JSX.Element {
  return (
    <ul className="space-y-2">
      {effects.map((e) => (
        <li key={e.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-parchment">
            {e.label}
            {e.instanceCount && e.instanceCount > 1 && (
              <span className="rounded bg-white/10 px-1.5 text-[10px] text-parchment/60">
                ×{e.instanceCount} sources
              </span>
            )}
            {e.durationLabel && <span className="text-[11px] text-parchment/40">{e.durationLabel}</span>}
          </p>

          {/* Consequences come from structured effect data, not hand-written copy. */}
          {e.effects.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {e.effects.map((line, i) => (
                <li key={i} className="text-[13px] text-parchment/60">· {line}</li>
              ))}
            </ul>
          )}
          {e.description && <p className="mt-2 text-[12px] italic text-parchment/40">{e.description}</p>}
        </li>
      ))}
    </ul>
  )
}
