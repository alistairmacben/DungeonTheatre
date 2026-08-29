// Magic items, catalogue closer: Artifacts (docs/srd/10-magic-items.md §13).
//
// The SRD contains exactly one artifact — Orb of Dragonkind — and states its
// own random-property tables are absent from this edition, so there is
// nothing to roll for beyond what's printed. Its charge-fuelled spells are
// cast at the orb's own fixed DC 18, not the wielder's — the same
// item-carries-its-own-statistics problem Spell Scroll already hit, with no
// field on SpellGrant for a flat DC override — so, as with scrolls, the
// charge track is real state and which spells it buys stays narrative.
//
// Sentient magic items (§12) are not a catalogue of items to author at all:
// the SRD's own engine note calls them "genuinely multiplayer, DM-facing"
// and explicitly out of scope for a deterministic rules engine — DM
// narration plus a contested-check helper, not an ItemDefinition. Nothing
// in this file represents them; there is nothing here to represent.
//
// This closes the SRD magic-item catalogue.

import type { EffectSource, ItemDefinition } from '../rules/types.js'

const V = '2014'

function source(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'item',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

export const ORB_OF_DRAGONKIND: ItemDefinition = {
  id: 'srd:item.orb-of-dragonkind', name: 'Orb of Dragonkind',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'artifact', requiresAttunement: true,
  charges: { id: 'item.orb-of-dragonkind.charges', name: 'Orb of Dragonkind', max: 7, refresh: { kind: 'dawn', amount: { count: 1, sides: 4, modifier: 3 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.orb-of-dragonkind', name: 'Orb of Dragonkind',
    completeness: 'partial',
    narrative: [{
      text: 'Attuning requires speaking its command word and succeeding on '
        + 'a DC 15 Charisma check: success grants control of the orb for '
        + 'as long as you remain attuned. Failure charms you for as long as '
        + 'you remain attuned — while charmed you cannot voluntarily end '
        + 'attunement, and the orb can cast suggestion on you at will (DC '
        + '18). Random Properties: roll 2 minor beneficial, 1 minor '
        + 'detrimental, and 1 major detrimental property — the tables '
        + 'themselves are not included in this edition. 7 charges, '
        + 'regaining 1d4 + 3 daily at dawn, spell save DC 18: cure wounds '
        + 'at 5th level (3 charges), daylight (1), death ward (2), or '
        + 'scrying (3); detect magic costs no charge. Call Dragons: action '
        + 'to send a telepathic call up to 40 miles in all directions; '
        + 'evil dragons feel compelled to come by the most direct route '
        + '(deities excepted, and arrivals may be hostile), usable once '
        + 'per hour. Impervious to almost everything, including dragon '
        + 'attacks and breath weapons, but destroyed by disintegrate or by '
        + 'one good hit from a +3 magic weapon.',
      dmPromptable: true
    }]
  })
}

export const ALL_ITEMS_ARTIFACTS: ItemDefinition[] = [ORB_OF_DRAGONKIND]
