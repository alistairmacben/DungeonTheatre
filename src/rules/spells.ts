// Spellcasting.
//
// The design constraint that shaped this file: spellcasting must add as little
// new machinery as possible, because every mechanism added here is a mechanism
// that items, feats and DM content then have to know about.
//
// So it adds almost none. The save DC and the attack bonus are ordinary stats,
// which is why a Rod of the Pact Keeper needs no code — it is an `add`. Slots
// are ordinary resources, which is why Arcane Recovery is an ordinary restore.
// Access is a grant on EffectSource, which is why a tiefling's innate magic, a
// cleric's domain spells and a wizard's spellbook arrive by the same path.
//
// What genuinely is new: a spell must be *prepared* before some grants allow
// it, and concentration permits only one spell at a time. Both are properties
// of the character, not of any stat, so both are character state.

import type {
  Ability, ContentIndex, SpellDefinition, SpellGrant, StatValue
} from './types.js'
import type { Resolution } from './resolve.js'
import { resolveResources, type ResourceValue } from './resources.js'
import { SPELL_ATTACK, SPELL_SAVE_DC, SPELLS_PREPARED_MAX } from './statPaths.js'

/** A slot that could pay for a cast, with what is left in it. */
export interface SlotOption {
  resourceId: string
  label: string
  level: number
  remaining: number
}

export interface CastableSpell {
  spell: SpellDefinition
  /** Which source granted access — the wizard's spellbook, the tiefling's blood. */
  grantSourceId: string
  grantSourceName: string
  ability: Ability
  /**
   * Slots that can pay, cheapest first. A spell may be cast from any slot of
   * its level or higher, so this is a list rather than one answer, and the
   * higher entries are exactly what upcasting means.
   */
  slotOptions: SlotOption[]
  /** Fixed resource costs, for innate spells that bypass slots entirely. */
  costs: { resourceId: string; label: string; amount: number; remaining: number }[]
  /** False when the grant requires preparation and the spell is not prepared. */
  prepared: boolean
  /** True when preparation is not a question for this grant. */
  alwaysAvailable: boolean
  available: boolean
  unavailableReasons: string[]
}

export interface SpellcastingValue {
  /** False when the character has no spell access at all. */
  active: boolean
  saveDc: StatValue
  attackBonus: StatValue
  /** How many spells may be prepared, and how many are. */
  preparedMax: number
  preparedCount: number
  /** Everything the character has access to, castable or not. */
  accessible: CastableSpell[]
  /** The subset that could be cast right now. */
  castable: CastableSpell[]
  /** Every slot the character holds, ascending. */
  slots: SlotOption[]
  concentratingOn?: string
}

/**
 * Resolves the spell ids a single grant provides.
 *
 * The three routes — a fixed list, a player's selection, a whole class list —
 * are alternatives rather than a hierarchy, so a grant may combine them.
 */
function spellIdsOf(
  grant: SpellGrant, sourceId: string, r: Resolution, content: ContentIndex
): string[] {
  const ids = new Set<string>(grant.spellIds ?? [])

  if (grant.selectionId) {
    for (const id of r.selection(sourceId, grant.selectionId)) ids.add(id)
  }

  if (grant.fromList) {
    const maxLevel = r.evaluateValue(grant.fromList.maxLevel, sourceId)
    for (const [id, spell] of content.spells) {
      if (!spell.lists?.includes(grant.fromList.listId)) continue
      if (spell.level > maxLevel) continue
      // A cantrip is never prepared — that is what makes it a cantrip. A
      // whole-list grant with `availability: 'prepared'` stands in for a
      // spellbook or a prepared list, and neither holds cantrips; those come
      // from the class's own Cantrips Known column. Without this the wizard's
      // prepared grant swept up every cantrip on the list regardless of how
      // many the table says they know.
      if (grant.availability === 'prepared' && spell.level === 0) continue
      ids.add(id)
    }
  }

  return [...ids]
}

export function resolveSpellcasting(
  r: Resolution, content: ContentIndex
): SpellcastingValue {
  const saveDc = r.stat(SPELL_SAVE_DC)
  const attackBonus = r.stat(SPELL_ATTACK)
  const preparedMax = r.stat(SPELLS_PREPARED_MAX).total
  const prepared = new Set(r.character.spellsPrepared ?? [])
  const resources = resolveResources(r)

  const slots: SlotOption[] = []
  // Slot resources declare their level, so finding them is a lookup rather
  // than a guess at a naming convention.
  const slotsByGroup = new Map<string, SlotOption[]>()
  for (const source of r.sources.active) {
    for (const def of source.resources ?? []) {
      if (!def.spellSlot) continue
      const value = resources.find((x) => x.id === def.id)
      if (!value) continue
      // A full caster declares all nine tiers from 1st level so the ladder is
      // one table rather than nine conditional grants; the ones it has not
      // climbed to yet resolve to a maximum of 0 and are not slots it has.
      // Filtered on the maximum and not on what remains, because a wizard who
      // has burned every 1st-level slot still has 1st-level slots.
      if (value.maximum <= 0) continue
      const option: SlotOption = {
        resourceId: def.id, label: def.name,
        // Evaluated against the source that declared it, so a warlock's
        // `{ classLevelTable }` resolves the same way a resource maximum does.
        level: r.evaluateValue(def.spellSlot.level, source.id),
        remaining: value.remaining
      }
      slots.push(option)
      const list = slotsByGroup.get(def.spellSlot.group) ?? []
      list.push(option)
      slotsByGroup.set(def.spellSlot.group, list)
    }
  }
  slots.sort((a, b) => a.level - b.level)
  for (const list of slotsByGroup.values()) list.sort((a, b) => a.level - b.level)

  const canCast = r.capability('castSpells')
  const accessible: CastableSpell[] = []

  // A spell can be reachable by more than one grant: a cleric's domain spells
  // are also on the cleric list. It is one castable spell, and the *most
  // permissive* grant must win — a domain spell is always prepared even though
  // the list grant would have demanded preparation. Resolving this by source
  // order would make the answer depend on the order features happen to be
  // declared in, which is not a rule anyone wrote down.
  const best = new Map<string, { grant: SpellGrant; source: { id: string; name: string } }>()
  for (const source of r.sources.active) {
    for (const grant of source.spells ?? []) {
      for (const spellId of spellIdsOf(grant, source.id, r, content)) {
        if (!content.spells.has(spellId)) continue
        const held = best.get(spellId)
        if (!held || (held.grant.availability === 'prepared' && grant.availability === 'always')) {
          best.set(spellId, { grant, source: { id: source.id, name: source.name } })
        }
      }
    }
  }

  for (const [spellId, { grant, source }] of best) {
    const spell = content.spells.get(spellId)!

        const isPrepared = grant.availability === 'always' || prepared.has(spellId)
        const reasons: string[] = []
        if (!canCast.allowed) {
          // Name whatever revoked it — "Silenced: cannot cast spells" beats a
          // bare refusal, and the term already carries the source.
          const blocker = canCast.terms.find((t) => t.applied && t.op === 'revoke')
          reasons.push(blocker
            ? `${blocker.sourceName}: cannot cast spells`
            : 'you cannot cast spells')
        }
        if (!isPrepared) reasons.push('not prepared')

        // A cantrip costs nothing; everything else needs a slot of its level
        // or higher, and the higher ones are what upcasting spends.
        const slotOptions = spell.level === 0
          ? []
          : (grant.slotGroup ? slotsByGroup.get(grant.slotGroup) ?? [] : [])
            .filter((s) => s.level >= spell.level)
        if (spell.level > 0 && grant.slotGroup && !slotOptions.some((s) => s.remaining > 0)) {
          reasons.push(`no ${spell.level > 1 ? `level ${spell.level} or higher ` : ''}slot remaining`)
        }

        const costs = Object.entries(grant.costs ?? {}).map(([resourceId, amount]) => {
          const value = resources.find((x) => x.id === resourceId)
          return {
            resourceId, amount,
            label: `${amount} ${value?.name ?? resourceId}`,
            remaining: value?.remaining ?? 0
          }
        })
        for (const cost of costs) {
          if (cost.remaining < cost.amount) {
            reasons.push(`${value(resources, cost.resourceId)}: ${cost.remaining} remaining, needs ${cost.amount}`)
          }
        }

        accessible.push({
          spell,
          grantSourceId: source.id,
          grantSourceName: source.name,
          ability: grant.ability,
          slotOptions,
          costs,
          prepared: isPrepared,
          alwaysAvailable: grant.availability === 'always',
          available: reasons.length === 0,
          unavailableReasons: reasons
        })
  }

  accessible.sort((a, b) =>
    a.spell.level - b.spell.level || a.spell.name.localeCompare(b.spell.name))

  return {
    // A caster with no spells yet is still a caster. Keying this on the
    // accessible list alone meant a 5th-level sorcerer who had not answered
    // their Spells Known selections had four slot pools, a save DC and a spell
    // attack bonus, and the view showed none of it — the whole panel was
    // withheld because the list inside it was empty.
    //
    // Not the castSpells capability, which every creature has until something
    // revokes it: a fighter would then have a spell panel and a raging
    // barbarian would lose one they never had. Holding slots is the signal
    // that means "something granted this character magic".
    active: accessible.length > 0 || slots.length > 0,
    saveDc,
    attackBonus,
    preparedMax,
    // Only spells that had to be prepared count against the limit.
    preparedCount: accessible.filter((s) => !s.alwaysAvailable && s.prepared).length,
    accessible,
    castable: accessible.filter((s) => s.available),
    slots,
    ...(r.character.concentratingOn ? { concentratingOn: r.character.concentratingOn } : {})
  }
}

function value(resources: ResourceValue[], id: string): string {
  return resources.find((x) => x.id === id)?.name ?? id
}

/**
 * The slot a cast should spend when the player has not chosen one.
 *
 * The lowest slot that will do the job. Spending a 3rd-level slot on *magic
 * missile* is a decision, never a default.
 */
export function cheapestSlot(spell: CastableSpell): SlotOption | undefined {
  return spell.slotOptions.find((s) => s.remaining > 0)
}
