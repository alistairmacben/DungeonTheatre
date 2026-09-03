// The DM's treasure.
//
// 323 items in the catalogue, so this is a search box before it is anything
// else — a DM mid-session has no patience for a taxonomy. Picking one arms the
// grant; granting it emits `ItemGranted`, which the table's event stream
// already carries, so the recipient's own stage shows them what they got
// without this file knowing anything about splashes.
//
// Scrolls are how a spell becomes a gift: the SRD's spell scrolls are items
// like any other, so "give them Fireball" is `srd:item.spell-scroll-...` and
// needs no separate concept.

import React, { useMemo, useState } from 'react'
import type { ContentIndex } from '@engine'
import { sendAsDm } from '../../game/dmActions'
import { itemIcon } from '../icons'
import { Inspect, InspectPanel } from '../Inspect'

export interface LootTarget {
  id: string
  name: string
}

interface Entry {
  id: string
  name: string
  category: string
  rarity?: string
  attunement: boolean
}

export function LootBrowser({ content, targets, onGranted }: {
  content: ContentIndex
  /** Everyone who could receive this. Usually the whole party. */
  targets: LootTarget[]
  onGranted(summary: string): void
}): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Entry | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)

  const catalogue = useMemo<Entry[]>(() => [...content.items.values()].map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    ...(('rarity' in i && typeof i.rarity === 'string') ? { rarity: i.rarity } : {}),
    attunement: Boolean(i.requiresAttunement)
  })).sort((a, b) => a.name.localeCompare(b.name)), [content])

  // Unfiltered, this is 323 rows of nothing in particular. A DM knows what
  // they are looking for, so the list stays closed until they say.
  const q = query.trim().toLowerCase()
  const matches = q.length < 2
    ? []
    : catalogue.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 40)

  const give = async (target: LootTarget): Promise<void> => {
    if (!picked) return
    setBusy(true)
    const result = await sendAsDm(target.id, {
      type: 'dmGrantItem', characterId: target.id, itemId: picked.id, quantity
    })
    setBusy(false)
    onGranted(result.ok
      ? `gave ${picked.name}${quantity > 1 ? ` ×${quantity}` : ''} to ${target.name}`
      : result.error ?? 'that did not go through')
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${catalogue.length} items — potions, weapons, scrolls…`}
        className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-[13px] text-parchment placeholder:text-parchment/30 focus:border-ember/50 focus:outline-none"
      />

      {q.length >= 2 && matches.length === 0 && (
        <p className="text-[12px] text-parchment/40">Nothing matches “{query}”.</p>
      )}

      {matches.length > 0 && (
        <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
          {matches.map((item) => (
            <li key={item.id}>
              <Inspect
                side="left"
                panel={(
                  <InspectPanel
                    title={item.name}
                    subtitle={[item.rarity, item.category].filter(Boolean).join(' · ')}
                    footer={item.attunement ? ['Requires attunement'] : undefined}
                  />
                )}
              >
                <button
                  type="button"
                  onClick={() => setPicked(item)}
                  className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition ${
                    picked?.id === item.id
                      ? 'border-ember/60 bg-ember/10 text-parchment'
                      : 'border-white/10 text-parchment/70 hover:border-white/25 hover:text-parchment'
                  }`}
                >
                  {itemIcon({ label: item.name }) && (
                    <img src={itemIcon({ label: item.name })} alt="" className="h-6 w-6 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[13px]">{item.name}</span>
                  {item.attunement && (
                    <span className="shrink-0 text-[9px] uppercase tracking-wide text-arcane">att</span>
                  )}
                </button>
              </Inspect>
            </li>
          ))}
        </ul>
      )}

      {picked && (
        <div className="space-y-2 rounded-xl border border-ember/30 bg-ember/[0.06] p-3">
          <div className="flex items-center gap-2">
            {itemIcon({ label: picked.name }) && (
              <img src={itemIcon({ label: picked.name })} alt="" className="h-8 w-8" />
            )}
            <span className="min-w-0 flex-1 truncate text-[13px] text-parchment">{picked.name}</span>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-14 rounded border border-white/15 bg-black/30 px-2 py-1 text-right text-[12px] text-parchment"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {targets.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={busy}
                onClick={() => { void give(t) }}
                className="rounded-lg border border-ember/50 bg-ember/10 px-2.5 py-1 text-[12px] text-parchment transition hover:bg-ember/20 disabled:opacity-40"
              >
                {busy ? '…' : `Give to ${t.name}`}
              </button>
            ))}
            {targets.length === 0 && (
              <p className="text-[12px] text-parchment/40">Nobody is cast to receive it.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
