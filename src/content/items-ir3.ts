// Magic items, catalogue section I-R, part 3 (docs/srd/10-magic-items.md §10).
//
// Closes out Catalogue I-R: the Rings sub-table (twenty named rings — Ring
// of Protection was already authored in an earlier pass and isn't
// repeated), Robes, Rods, and the two Ropes.
//
// Ring of Free Action reuses Freedom of Movement's exact two modifiers
// rather than re-deriving them — the SRD text says "as freedom of
// movement's core clauses." Robe of the Archmagi is the sixth competing
// Armor Class base provider the doc source flags, built the same way
// Unarmored Defense already reads Dexterity conditioned on wearing no
// armor. Robe of Stars is the first item to use a dusk refresh — the only
// dusk-based refresh anywhere in the SRD.
//
// Checked against docs/srd/10-magic-items.md §10 (Catalogue: I-R).

import type { EffectSource, ItemDefinition, Modifier } from '../rules/types.js'
import {
  ARMOR_CLASS, ATTACK_ROLL, DAMAGE_WEAPON, movementCostPath,
  resistancePath, RESISTANCE_RESISTANT, SPELL_ATTACK, SPELL_SAVE_DC, speedPath
} from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `iir3${++n}`

function source(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'item',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

const add = (target: string, value: Modifier['value'], extra: Partial<Modifier> = {}): Modifier =>
  ({ id: id(), channel: 'value', target, op: 'add', value, permanence: 'persistent', ...extra })

// ===========================================================================
// Real modifiers, fully resolved
// ===========================================================================

export const RING_OF_FREE_ACTION: ItemDefinition = {
  id: 'srd:item.ring-of-free-action', name: 'Ring of Free Action',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', slot: 'ring1', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ring-of-free-action', name: 'Ring of Free Action',
    // "As freedom of movement's core clauses" — reusing that spell's
    // exact two real modifiers rather than re-deriving them.
    modifiers: [
      { id: id(), channel: 'value', target: movementCostPath('difficultTerrain'), op: 'set', value: 1, permanence: 'persistent', note: 'ring of free action: unaffected by difficult terrain' },
      { id: id(), channel: 'value', op: 'suppress', permanence: 'persistent', suppresses: { sourceIds: ['srd:condition.paralyzed', 'srd:condition.restrained'] }, note: 'ring of free action: immune to being paralyzed or restrained' }
    ]
  })
}

export const RING_OF_JUMPING: ItemDefinition = {
  id: 'srd:item.ring-of-jumping', name: 'Ring of Jumping',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'ring1', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ring-of-jumping', name: 'Ring of Jumping',
    spells: [{ spellIds: ['srd:spell.jump'], availability: 'always', ability: 'str' }],
    narrative: [{ text: 'Bonus action to cast jump on yourself at will, at no cost.', dmPromptable: false }]
  })
}

export const RING_OF_SWIMMING: ItemDefinition = {
  id: 'srd:item.ring-of-swimming', name: 'Ring of Swimming',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'ring1',
  effects: source({
    id: 'srd:item.ring-of-swimming', name: 'Ring of Swimming',
    modifiers: [{ id: id(), channel: 'value', target: speedPath('swim'), op: 'base', value: 40, permanence: 'persistent', note: 'ring of swimming' }]
  })
}

export const RING_OF_TELEKINESIS: ItemDefinition = {
  id: 'srd:item.ring-of-telekinesis', name: 'Ring of Telekinesis',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare', slot: 'ring1', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ring-of-telekinesis', name: 'Ring of Telekinesis',
    spells: [{ spellIds: ['srd:spell.telekinesis'], availability: 'always', ability: 'int' }],
    narrative: [{
      text: 'Cast telekinesis at will, at no cost — but on unattended '
        + 'objects only, not creatures.',
      dmPromptable: true
    }]
  })
}

export const RING_OF_WARMTH: ItemDefinition = {
  id: 'srd:item.ring-of-warmth', name: 'Ring of Warmth',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'ring1', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ring-of-warmth', name: 'Ring of Warmth',
    modifiers: [{ id: id(), channel: 'value', target: resistancePath('cold'), op: 'set', value: RESISTANCE_RESISTANT, permanence: 'persistent', note: 'ring of warmth' }],
    narrative: [{ text: 'You and your gear are unharmed down to -50°F.', dmPromptable: false }]
  })
}

export const RING_OF_RESISTANCE: ItemDefinition = {
  id: 'srd:item.ring-of-resistance', name: 'Ring of Resistance',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', slot: 'ring1', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ring-of-resistance', name: 'Ring of Resistance',
    // The type is fixed once, indicated by the gem set into the ring, not
    // chosen per encounter — the toggle stands in for that one-time fact.
    modifiers: [
      'acid', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'poison', 'psychic', 'radiant', 'thunder'
    ].map((t) => ({
      id: id(), channel: 'value', target: resistancePath(t), op: 'set',
      value: RESISTANCE_RESISTANT, condition: { playerToggle: `item.ring-of-resistance.${t}` },
      permanence: 'persistent', note: `ring of resistance: ${t}`
    })),
    narrative: [{
      text: 'The type is indicated by the gem (pearl acid, tourmaline '
        + 'cold, garnet fire, sapphire force, citrine lightning, jet '
        + 'necrotic, amethyst poison, jade psychic, topaz radiant, spinel '
        + 'thunder) — turn on the matching toggle.',
      dmPromptable: false
    }]
  })
}

export const ROBE_OF_STARS: ItemDefinition = {
  id: 'srd:item.robe-of-stars', name: 'Robe of Stars',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare', requiresAttunement: true,
  // The only dusk-based refresh anywhere in the SRD.
  charges: { id: 'item.robe-of-stars.stars', name: 'Robe of Stars', max: 6, refresh: { kind: 'dusk', amount: { count: 1, sides: 6 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.robe-of-stars', name: 'Robe of Stars',
    // The save bonus is real. Casting magic missile from a pulled star and
    // entering the Astral Plane have no `effect` field to preview.
    completeness: 'partial',
    modifiers: (['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((a) => add(`save.${a}`, 1, { note: 'robe of stars' })),
    narrative: [{
      text: 'Action to pull off a star and cast magic missile as a '
        + '5th-level spell. Action to enter the Astral Plane with '
        + 'everything you carry, and an action to return.',
      dmPromptable: true
    }]
  })
}

export const ROBE_OF_THE_ARCHMAGI: ItemDefinition = {
  id: 'srd:item.robe-of-the-archmagi', name: 'Robe of the Archmagi',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary', slot: 'armor', requiresAttunement: true,
  effects: source({
    id: 'srd:item.robe-of-the-archmagi', name: 'Robe of the Archmagi',
    // The unarmored AC base and the spell DC/attack bonus are real. The
    // alignment-locked attunement (the doc's own sixth competing AC-base
    // example) and advantage against spells specifically have no channel:
    // this content set tracks no alignment field, and there's no scope for
    // "saves against spells" narrower than "every save."
    completeness: 'partial',
    modifiers: [
      // Just 15 — the baseline already adds Dexterity up to the armour cap
      // on top of any 'base' value automatically, the same way Unarmored
      // Defense's own base of 10 + Constitution leaves Dexterity to that
      // baseline rather than summing it in twice.
      {
        id: id(), channel: 'value', target: ARMOR_CLASS, op: 'base',
        value: 15,
        condition: { not: { playerToggle: 'wearing-armor' } },
        permanence: 'persistent', note: '15 + Dexterity while wearing no armour'
      },
      add(SPELL_SAVE_DC, 2, { note: 'robe of the archmagi' }),
      add(SPELL_ATTACK, 2, { note: 'robe of the archmagi' })
    ],
    narrative: [{
      text: 'White for good, grey for neutral, black for evil — you '
        + "cannot attune to a robe that doesn't match your alignment, "
        + 'tracked by hand. Also advantage on saves against spells and '
        + 'other magical effects.',
      dmPromptable: true
    }]
  })
}

export const ROD_OF_ALERTNESS: ItemDefinition = {
  id: 'srd:item.rod-of-alertness', name: 'Rod of Alertness',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare', requiresAttunement: true,
  effects: source({
    id: 'srd:item.rod-of-alertness', name: 'Rod of Alertness',
    // The two roll-channel advantages are real. Casting detect spells and
    // the planted Protective Aura (its own separate +1 AC/+1 saves radius,
    // dawn-recharged) have no preview.
    completeness: 'partial',
    modifiers: [
      { id: id(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['check'], skills: ['perception'] }, permanence: 'persistent', note: 'rod of alertness' },
      { id: id(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['initiative'] }, permanence: 'persistent', note: 'rod of alertness' }
    ],
    narrative: [{
      text: 'Also action to cast detect evil and good, detect magic, '
        + 'detect poison and disease, or see invisibility. Once per dawn, '
        + 'plant it for a Protective Aura: bright light 60 feet in which '
        + 'you and friendly creatures gain +1 AC and +1 to saves and can '
        + 'sense invisible hostile creatures, lasting 10 minutes.',
      dmPromptable: true
    }]
  })
}

export const ROD_OF_LORDLY_MIGHT: ItemDefinition = {
  id: 'srd:item.rod-of-lordly-might', name: 'Rod of Lordly Might',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'legendary', slot: 'mainHand', requiresAttunement: true,
  effects: source({
    id: 'srd:item.rod-of-lordly-might', name: 'Rod of Lordly Might',
    // Its baseline mace form's +3 is real. The six buttons reshaping it
    // into other weapons and tools, and the three dawn-recharged powers,
    // have no channel for a shape-changing weapon or their own save-and-
    // damage effects.
    completeness: 'partial',
    modifiers: [
      add(ATTACK_ROLL, 3, { condition: { playerToggle: 'item.rod-of-lordly-might' }, note: 'rod of lordly might: turn off when not using it' }),
      add(DAMAGE_WEAPON, 3, { condition: { playerToggle: 'item.rod-of-lordly-might' }, note: 'rod of lordly might: turn off when not using it' })
    ],
    narrative: [{
      text: 'Six buttons, each a bonus action, reshape it: a flame '
        + 'tongue, a +3 battleaxe, a +3 spear, a 50-foot climbing pole, a '
        + 'battering ram granting +10 to Strength checks, or back to '
        + 'normal (indicating magnetic north and your depth or height). '
        + 'Three further dawn-recharged powers: Drain Life, Paralyze and '
        + 'Terrify.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// A real charge pool, everything else narrative
// ===========================================================================

export const RING_OF_ANIMAL_INFLUENCE: ItemDefinition = {
  id: 'srd:item.ring-of-animal-influence', name: 'Ring of Animal Influence',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  charges: { id: 'item.ring-of-animal-influence.charges', name: 'Ring of Animal Influence', max: 3, refresh: { kind: 'dawn', amount: { count: 1, sides: 3 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.ring-of-animal-influence', name: 'Ring of Animal Influence',
    completeness: 'partial',
    narrative: [{
      text: '1 charge to cast animal friendship (DC 13), fear (DC 13, '
        + 'beasts of Intelligence 3 or lower only), or speak with animals.',
      dmPromptable: true
    }]
  })
}

export const RING_OF_EVASION: ItemDefinition = {
  id: 'srd:item.ring-of-evasion', name: 'Ring of Evasion',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  charges: { id: 'item.ring-of-evasion.charges', name: 'Ring of Evasion', max: 3, refresh: { kind: 'dawn', amount: { count: 1, sides: 3 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.ring-of-evasion', name: 'Ring of Evasion',
    completeness: 'partial',
    narrative: [{ text: '1 charge, reaction to turn a failed Dexterity save into a success.', dmPromptable: true }]
  })
}

export const RING_OF_SHOOTING_STARS: ItemDefinition = {
  id: 'srd:item.ring-of-shooting-stars', name: 'Ring of Shooting Stars',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare',
  charges: { id: 'item.ring-of-shooting-stars.charges', name: 'Ring of Shooting Stars', max: 6, refresh: { kind: 'dawn', amount: { count: 1, sides: 6 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.ring-of-shooting-stars', name: 'Ring of Shooting Stars',
    completeness: 'partial',
    narrative: [{
      text: 'In dim light or darkness, dancing lights and light at will. '
        + '1 charge for faerie fire; 2 for Ball Lightning (one to four '
        + '3-foot spheres for up to a minute, discharging 2d4 to 4d12 '
        + 'lightning depending how many); 1-3 for Shooting Stars (a '
        + '15-foot cube, DC 15 Dexterity save, 5d4 fire, half on success, '
        + 'one mote per charge).',
      dmPromptable: true
    }]
  })
}

export const RING_OF_THE_RAM: ItemDefinition = {
  id: 'srd:item.ring-of-the-ram', name: 'Ring of the Ram',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  charges: { id: 'item.ring-of-the-ram.charges', name: 'Ring of the Ram', max: 3, refresh: { kind: 'dawn', amount: { count: 1, sides: 3 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.ring-of-the-ram', name: 'Ring of the Ram',
    completeness: 'partial',
    narrative: [{
      text: 'Action and 1-3 charges: an attack at +7 for 2d10 force and a '
        + '5-foot push per charge; or a Strength check at +5 per charge '
        + 'to break an unattended object within 60 feet.',
      dmPromptable: true
    }]
  })
}

export const RING_OF_THREE_WISHES: ItemDefinition = {
  id: 'srd:item.ring-of-three-wishes', name: 'Ring of Three Wishes',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary',
  charges: { id: 'item.ring-of-three-wishes.charges', name: 'Ring of Three Wishes', max: 3, refresh: { kind: 'never' }, display: 'uses' },
  effects: source({
    id: 'srd:item.ring-of-three-wishes', name: 'Ring of Three Wishes',
    completeness: 'partial',
    narrative: [{ text: 'Each charge casts wish; becomes nonmagical when all three are spent.', dmPromptable: true }]
  })
}

export const ROBE_OF_SCINTILLATING_COLORS: ItemDefinition = {
  id: 'srd:item.robe-of-scintillating-colors', name: 'Robe of Scintillating Colors',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare', requiresAttunement: true,
  charges: { id: 'item.robe-of-scintillating-colors.charges', name: 'Robe of Scintillating Colors', max: 3, refresh: { kind: 'dawn', amount: { count: 1, sides: 3 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.robe-of-scintillating-colors', name: 'Robe of Scintillating Colors',
    completeness: 'partial',
    narrative: [{
      text: 'Action and 1 charge for a display until the end of your '
        + 'next turn: creatures that can see you have disadvantage on '
        + 'attacks against you, and anyone in the bright light who could '
        + 'see you when it activated saves Wisdom (DC 15) or is stunned '
        + 'for the duration.',
      dmPromptable: true
    }]
  })
}

export const ROD_OF_RULERSHIP: ItemDefinition = {
  id: 'srd:item.rod-of-rulership', name: 'Rod of Rulership',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  charges: { id: 'item.rod-of-rulership.uses', name: 'Rod of Rulership', max: 1, refresh: { kind: 'dawn' }, display: 'uses' },
  effects: source({
    id: 'srd:item.rod-of-rulership', name: 'Rod of Rulership',
    completeness: 'partial',
    narrative: [{
      text: 'Action: chosen creatures within 120 feet save Wisdom (DC 15) '
        + 'or be charmed for 8 hours, regarding you as a trusted leader. '
        + 'Ends for any creature harmed by you or your companions.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// No roll, or a roll with no effect field to carry it — narrative only
// ===========================================================================

export const RING_OF_DJINNI_SUMMONING: ItemDefinition = {
  id: 'srd:item.ring-of-djinni-summoning', name: 'Ring of Djinni Summoning',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ring-of-djinni-summoning', name: 'Ring of Djinni Summoning',
    completeness: 'partial',
    narrative: [{
      text: 'Command word summons a particular djinni for as long as you '
        + 'concentrate, up to 1 hour; 24-hour cooldown. The ring dies if '
        + 'the djinni dies. This content set carries no creature '
        + 'statblock — narrate its actions by hand.',
      dmPromptable: true
    }]
  })
}

export const RING_OF_ELEMENTAL_COMMAND: ItemDefinition = {
  id: 'srd:item.ring-of-elemental-command', name: 'Ring of Elemental Command',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary', requiresAttunement: true,
  charges: { id: 'item.ring-of-elemental-command.charges', name: 'Ring of Elemental Command', max: 5, refresh: { kind: 'dawn', amount: { count: 1, sides: 4, modifier: 1 } }, display: 'uses' },
  effects: source({
    id: 'srd:item.ring-of-elemental-command', name: 'Ring of Elemental Command',
    // Unlocks new capabilities in response to a narrative achievement
    // (slaying an elemental of the linked plane) — an item with
    // progression this content set has no state for.
    completeness: 'partial',
    narrative: [{
      text: 'Linked to one Elemental Plane: advantage on attacks against '
        + 'its elementals and disadvantage for them against you; 2 '
        + 'charges to dominate monster an elemental of that type, plus an '
        + 'always-on plane-specific benefit. Helping slay an elemental of '
        + 'that plane unlocks a further tier of resistance, movement and '
        + 'spells — tracked by hand as the campaign progresses.',
      dmPromptable: true
    }]
  })
}

export const RING_OF_FEATHER_FALLING: ItemDefinition = {
  id: 'srd:item.ring-of-feather-falling', name: 'Ring of Feather Falling',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ring-of-feather-falling', name: 'Ring of Feather Falling',
    completeness: 'partial',
    narrative: [{ text: 'Descend 60 feet per round and take no falling damage.', dmPromptable: false }]
  })
}

export const RING_OF_INVISIBILITY: ItemDefinition = {
  id: 'srd:item.ring-of-invisibility', name: 'Ring of Invisibility',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ring-of-invisibility', name: 'Ring of Invisibility',
    // Points at the same Invisible condition the Invisibility spell
    // already proved out — no new modifier needed, just narrative.
    completeness: 'partial',
    narrative: [{
      text: 'Action to turn invisible, ending when the ring is removed, '
        + 'when you attack or cast a spell, or on a bonus action. Apply '
        + 'the Invisible condition.',
      dmPromptable: true
    }]
  })
}

export const RING_OF_MIND_SHIELDING: ItemDefinition = {
  id: 'srd:item.ring-of-mind-shielding', name: 'Ring of Mind Shielding',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ring-of-mind-shielding', name: 'Ring of Mind Shielding',
    completeness: 'partial',
    narrative: [{
      text: 'Immune to thought-reading, lie-detection, and alignment- or '
        + 'type-detection magic; telepathy only with your consent. If you '
        + 'die wearing it, your soul enters the ring.',
      dmPromptable: true
    }]
  })
}

export const RING_OF_REGENERATION: ItemDefinition = {
  id: 'srd:item.ring-of-regeneration', name: 'Ring of Regeneration',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ring-of-regeneration', name: 'Ring of Regeneration',
    completeness: 'partial',
    narrative: [{
      text: 'Regain 1d6 hit points every 10 minutes while above 0 HP; '
        + 'lost body parts regrow in 1d6+1 days.',
      dmPromptable: true
    }]
  })
}

export const RING_OF_SPELL_STORING: ItemDefinition = {
  id: 'srd:item.ring-of-spell-storing', name: 'Ring of Spell Storing',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ring-of-spell-storing', name: 'Ring of Spell Storing',
    // As the Ioun Stone of Reserve, at 5 levels instead of 3 — the same
    // second-character's-statistics-riding-along gap.
    completeness: 'partial',
    narrative: [{
      text: 'Stores up to 5 levels of spells (found with 1d6-1 already '
        + 'stored), of 1st-5th level. Any creature can cast a spell into '
        + 'it by touch. You can cast a stored spell using the original '
        + "caster's slot level, save DC, attack bonus and spellcasting ability.",
      dmPromptable: true
    }]
  })
}

export const RING_OF_SPELL_TURNING: ItemDefinition = {
  id: 'srd:item.ring-of-spell-turning', name: 'Ring of Spell Turning',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'legendary', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ring-of-spell-turning', name: 'Ring of Spell Turning',
    completeness: 'partial',
    narrative: [{
      text: 'Advantage on saves against any spell targeting only you. On '
        + 'a natural 20 against a spell of 7th level or lower, it instead '
        + "targets the caster, using the caster's own statistics.",
      dmPromptable: true
    }]
  })
}

export const RING_OF_WATER_WALKING: ItemDefinition = {
  id: 'srd:item.ring-of-water-walking', name: 'Ring of Water Walking',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.ring-of-water-walking', name: 'Ring of Water Walking',
    completeness: 'partial',
    narrative: [{ text: 'Walk on any liquid as though it were solid ground.', dmPromptable: false }]
  })
}

export const RING_OF_X_RAY_VISION: ItemDefinition = {
  id: 'srd:item.ring-of-x-ray-vision', name: 'Ring of X-ray Vision',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  effects: source({
    id: 'srd:item.ring-of-x-ray-vision', name: 'Ring of X-ray Vision',
    completeness: 'partial',
    narrative: [{
      text: 'Action and a command word: see through solid matter within '
        + '30 feet for 1 minute. Reusing it before a long rest requires a '
        + 'DC 15 Constitution save or a level of exhaustion.',
      dmPromptable: true
    }]
  })
}

export const ROBE_OF_EYES: ItemDefinition = {
  id: 'srd:item.robe-of-eyes', name: 'Robe of Eyes',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare', requiresAttunement: true,
  effects: source({
    id: 'srd:item.robe-of-eyes', name: 'Robe of Eyes',
    // A designed vulnerability, not a curse — light or daylight cast on it
    // blinds the wearer. No channel for either the all-directions sight
    // grant or its specific counter-trigger.
    completeness: 'partial',
    narrative: [{
      text: 'See in all directions; advantage on Perception checks that '
        + 'rely on sight; darkvision 120 feet; see invisible creatures '
        + "and into the Ethereal Plane to 120 feet. The robe's eyes "
        + "can't be closed — a light spell cast on it, or daylight "
        + 'within 5 feet, blinds you for 1 minute (repeatable Constitution save).',
      dmPromptable: true
    }]
  })
}

export const ROBE_OF_USEFUL_ITEMS: ItemDefinition = {
  id: 'srd:item.robe-of-useful-items', name: 'Robe of Useful Items',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.robe-of-useful-items', name: 'Robe of Useful Items',
    completeness: 'partial',
    narrative: [{
      text: 'Patches detach as an action and become real: always two '
        + 'each of a dagger, a lit bullseye lantern, a steel mirror, a '
        + '10-foot pole, 50 feet of rope, and a sack, plus 4d4 others '
        + 'rolled on a d100 table (gold, gems, a ladder, a rowboat, a '
        + 'spell scroll, and more). When the last patch is gone it is an '
        + 'ordinary garment.',
      dmPromptable: true
    }]
  })
}

export const ROD_OF_ABSORPTION: ItemDefinition = {
  id: 'srd:item.rod-of-absorption', name: 'Rod of Absorption',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare', requiresAttunement: true,
  charges: { id: 'item.rod-of-absorption.levels', name: 'Rod of Absorption', max: 50, refresh: { kind: 'never' }, display: 'pool' },
  effects: source({
    id: 'srd:item.rod-of-absorption', name: 'Rod of Absorption',
    completeness: 'partial',
    narrative: [{
      text: 'Reaction to absorb a spell targeting only you, cancelling '
        + "it and storing energy equal to its level. Lifetime capacity 50 "
        + 'levels, tracked here as a pool (a newly found rod already '
        + 'holds 1d10). A spellcaster may convert stored levels into '
        + 'spell slots, up to 5th level and never above their own '
        + 'maximum. Becomes nonmagical when full and empty.',
      dmPromptable: true
    }]
  })
}

export const ROD_OF_SECURITY: ItemDefinition = {
  id: 'srd:item.rod-of-security', name: 'Rod of Security',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'veryRare',
  effects: source({
    id: 'srd:item.rod-of-security', name: 'Rod of Security',
    completeness: 'partial',
    narrative: [{
      text: 'Action to transport you and up to 199 willing creatures to '
        + 'an extraplanar paradise of your design, with food and water. '
        + 'Each hour there restores hit points as though spending one Hit '
        + 'Die. Duration: 200 days divided by the number of creatures, '
        + 'rounded down. Ten-day cooldown.',
      dmPromptable: true
    }]
  })
}

export const ROPE_OF_CLIMBING: ItemDefinition = {
  id: 'srd:item.rope-of-climbing', name: 'Rope of Climbing',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon',
  effects: source({
    id: 'srd:item.rope-of-climbing', name: 'Rope of Climbing',
    completeness: 'partial',
    narrative: [{
      text: '60 feet, holds 3,000 lb. Action and a command word to '
        + 'animate; bonus action to send the far end toward a '
        + 'destination, moving 10 feet per turn. Can fasten, unfasten, '
        + 'knot or coil itself. Knotted it grants advantage on checks to '
        + 'climb it. AC 20, 20 HP, regaining 1 HP every 5 minutes.',
      dmPromptable: true
    }]
  })
}

export const ROPE_OF_ENTANGLEMENT: ItemDefinition = {
  id: 'srd:item.rope-of-entanglement', name: 'Rope of Entanglement',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'rare',
  effects: source({
    id: 'srd:item.rope-of-entanglement', name: 'Rope of Entanglement',
    completeness: 'partial',
    narrative: [{
      text: '30 feet. Action and a command word: a creature within 20 '
        + 'feet saves Dexterity (DC 15) or is restrained; a second '
        + "command word releases it. Escape: the target's choice of "
        + 'Strength or Dexterity, DC 15. Same AC 20 / 20 HP / 1 HP per 5 minutes.',
      dmPromptable: true
    }]
  })
}

// ===========================================================================
// Registration
// ===========================================================================

export const ALL_ITEMS_IR3: ItemDefinition[] = [
  RING_OF_FREE_ACTION, RING_OF_JUMPING, RING_OF_SWIMMING, RING_OF_TELEKINESIS,
  RING_OF_WARMTH, RING_OF_RESISTANCE, ROBE_OF_STARS, ROBE_OF_THE_ARCHMAGI,
  ROD_OF_ALERTNESS, ROD_OF_LORDLY_MIGHT,
  RING_OF_ANIMAL_INFLUENCE, RING_OF_EVASION, RING_OF_SHOOTING_STARS,
  RING_OF_THE_RAM, RING_OF_THREE_WISHES, ROBE_OF_SCINTILLATING_COLORS, ROD_OF_RULERSHIP,
  RING_OF_DJINNI_SUMMONING, RING_OF_ELEMENTAL_COMMAND, RING_OF_FEATHER_FALLING,
  RING_OF_INVISIBILITY, RING_OF_MIND_SHIELDING, RING_OF_REGENERATION,
  RING_OF_SPELL_STORING, RING_OF_SPELL_TURNING, RING_OF_WATER_WALKING,
  RING_OF_X_RAY_VISION, ROBE_OF_EYES, ROBE_OF_USEFUL_ITEMS, ROD_OF_ABSORPTION,
  ROD_OF_SECURITY, ROPE_OF_CLIMBING, ROPE_OF_ENTANGLEMENT
]
