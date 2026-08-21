// Wood Elf Druid — the shape-changer, and the first class the vocabulary
// cannot finish.
//
// Everything a druid does with numbers is already ordinary: a d8 hit die, a
// WIS save DC, prepared casting from a whole class list, a two-use resource
// that comes back on a short rest. That part of this file looks exactly like
// the cleric's, which is the point.
//
// Wild Shape is the part that does not fit, and it does not fit in a way no
// amount of careful authoring repairs. The SRD replaces the character's
// statistics with a beast's; the pipeline in this codebase modifies a
// character's statistics. Those are different operations. Rather than
// approximate it — a `set` on Strength and a hopeful note — the feature below
// declares the resource and the action it genuinely has, hands the DM the
// substitution rules as narrative, and marks itself partial. See
// docs/srd/90-vocabulary-findings.md ("Wild Shape is entity substitution, not
// modification") and docs/srd/99-open-questions.md Q6, where the user already
// resolved this as v3, DM-supplied statblocks.

import type {
  ClassDefinition, EffectSource, ItemDefinition, Modifier, ProficiencyGrant,
  SpeciesDefinition, WeaponProfile
} from '../rules/types.js'
import {
  abilityModifierPath, HP_MAX, PROFICIENCY_BONUS,
  SPELL_ATTACK, SPELL_SAVE_DC, SPELLS_PREPARED_MAX
} from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `dr${++n}`

function source(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'feature',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

const add = (target: string, value: Modifier['value'], extra: Partial<Modifier> = {}): Modifier =>
  ({ id: id(), channel: 'value', target, op: 'add', value, permanence: 'persistent', ...extra })

const prof = (
  category: ProficiencyGrant['category'],
  level: ProficiencyGrant['level'] = 'proficient'
): ProficiencyGrant =>
  ({ id: id(), category, level, rounding: 'floor', grantsProficiency: true })

/**
 * The druid spell list.
 *
 * Declared here rather than imported because `SPELL_LISTS` in spells.ts carries
 * only wizard, cleric and sorcerer, and this file may not edit that one. The
 * grant below is therefore mechanically correct and currently empty: four
 * spells already in the content set — *cure wounds*, *detect magic*,
 * *longstrider* and *protection from energy* — are on the SRD druid list
 * (docs/srd/08-spell-lists.md) but do not carry this id in their `lists` array.
 * Adding it there is a one-word data edit, not an engine change.
 */
const DRUID_LIST = 'srd:list.druid'

// The pool a level-1 druid's "choose two cantrips" actually offers. Both
// spells are quote-checked and registered in spells.ts, tagged for this list.
const DRUID_CANTRIP_POOL = ['srd:spell.druidcraft', 'srd:spell.mending']

// ===========================================================================
// Class — Druid, levels 1-5
// ===========================================================================

export const DRUID: ClassDefinition = {
  id: 'srd:class.druid', name: 'Druid', provenance: 'srd', contentVersion: 1,
  hitDie: 8, savingThrowProficiencies: ['int', 'wis'],
  subclassSlot: { grantedAtLevel: 2, options: ['srd:subclass.circle-of-the-land'] },
  features: [
    {
      id: 'srd:class.druid.proficiencies', name: 'Druid Proficiencies',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.druid.proficiencies', name: 'Druid Proficiencies',
        modifiers: [
          add(HP_MAX, {
            sum: [
              8, { product: [5, { sum: [{ characterLevel: true }, -1] }] },
              { product: [{ stat: abilityModifierPath('con') }, { characterLevel: true }] }
            ]
          }, { note: 'd8 hit die: 5 per level after the first, +8 at 1st, + CON per level' })
        ],
        proficiencies: [
          prof({ kind: 'save', ability: 'int' }),
          prof({ kind: 'save', ability: 'wis' }),
          prof({ kind: 'armor', category: 'light' }),
          prof({ kind: 'armor', category: 'medium' }),
          prof({ kind: 'armor', category: 'shield' }),
          // Ten weapons named one by one, and deliberately not
          // `weaponCategory: 'simple'`. The SRD gives the druid a *list*, not a
          // category: the scimitar on it is martial, and four simple weapons
          // that are not on it (greatclub, handaxe, light hammer, light
          // crossbow, shortbow) would arrive free with a category grant. The
          // rogue's four named martial exceptions are the same problem read
          // from the other end.
          prof({ kind: 'weapon', itemId: 'srd:weapon.club' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.dagger' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.dart' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.javelin' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.mace' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.quarterstaff' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.scimitar' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.sickle' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.sling' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.spear' }),
          prof({ kind: 'tool', id: 'herbalism-kit' }),
          prof({ kind: 'skill', id: 'nature' }),
          prof({ kind: 'skill', id: 'animal-handling' })
        ],
        narrative: [{
          // The SRD states the taboo and states no penalty for breaking it. A
          // modifier here would be a house rule wearing SRD provenance.
          text: 'Druids will not wear armour or use shields made of metal. The '
            + 'SRD attaches no mechanical penalty to doing so, so none is applied '
            + 'here — it is a matter for the table.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:class.druid.druidic', name: 'Druidic',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.druid.druidic', name: 'Druidic',
        // A language is the one thing on a race or class entry that
        // ProficiencyCategory has no kind for — skill, tool, save, armour and
        // weapon are the whole list. So Druidic cannot be granted, only
        // described, and the DC 15 check to spot a hidden message has no
        // proficiency to hang off.
        narrative: [{
          text: 'You know Druidic, the secret language of druids, and can leave '
            + 'hidden messages in it. Another creature spots that a message is '
            + 'there only on a DC 15 Wisdom (Perception) check, and cannot read '
            + 'it without magic.',
          dmPromptable: true
        }],
        completeness: 'partial'
      })
    },
    {
      id: 'srd:class.druid.spellcasting', name: 'Spellcasting',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.druid.spellcasting', name: 'Spellcasting',
        modifiers: [
          // Identical in shape to the cleric's and the wizard's, differing only
          // in which ability modifier feeds it. That it is three modifiers on an
          // ordinary stat rather than a formula inside a caster is what lets an
          // item raise it later.
          { id: id(), channel: 'value', target: SPELL_SAVE_DC, op: 'base', value: 8, permanence: 'persistent' },
          add(SPELL_SAVE_DC, { stat: PROFICIENCY_BONUS }),
          add(SPELL_SAVE_DC, { stat: abilityModifierPath('wis') }, { note: 'Wisdom' }),
          add(SPELL_ATTACK, { stat: PROFICIENCY_BONUS }),
          add(SPELL_ATTACK, { stat: abilityModifierPath('wis') }, { note: 'Wisdom' }),
          add(SPELLS_PREPARED_MAX, {
            max: [1, {
              sum: [
                { stat: abilityModifierPath('wis') },
                { classLevel: 'srd:class.druid' }
              ]
            }]
          }, { note: 'Wisdom modifier + druid level, minimum 1' }),
          {
            id: id(), channel: 'capability', capability: 'castSpells',
            capOp: 'grant', permanence: 'persistent'
          }
        ],
        // The level-5 row of the druid table. A full caster's ladder is a
        // per-level lookup and `max` is a constant or a stat path, not a
        // ValueExpr, so the 1-5 slice states its top row exactly as the wizard,
        // cleric and sorcerer files do.
        resources: [
          {
            id: 'druid.slots.1', name: '1st-level Slots', max: 4,
            refresh: { kind: 'longRest' }, display: 'slots', group: 'Spell Slots',
            order: 1, spellSlot: { group: 'druid', level: 1 }
          },
          {
            id: 'druid.slots.2', name: '2nd-level Slots', max: 3,
            refresh: { kind: 'longRest' }, display: 'slots', group: 'Spell Slots',
            order: 2, spellSlot: { group: 'druid', level: 2 }
          },
          {
            id: 'druid.slots.3', name: '3rd-level Slots', max: 2,
            refresh: { kind: 'longRest' }, display: 'slots', group: 'Spell Slots',
            order: 3, spellSlot: { group: 'druid', level: 3 }
          }
        ],
        // Prepared casting from the whole class list, which is the cleric's
        // grant with one identifier changed. The druid's spellbook is the list
        // itself; nothing about "prepared" is class knowledge.
        spells: [{
          fromList: { listId: DRUID_LIST, maxLevel: 3 },
          availability: 'prepared', slotGroup: 'druid', ability: 'wis'
        }]
      })
    },
    {
      id: 'srd:class.druid.cantrips', name: 'Cantrips',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.druid.cantrips', name: 'Cantrips',
        // Split out of Spellcasting on purpose. Marking a source partial flags
        // every stat it touches as incomplete, and the save DC above is exact —
        // it must not inherit this feature's doubts.
        //
        // 'spellList' is a real SelectionDefinition kind — the bard grant next
        // door already uses it correctly. This used 'other' with no pool at
        // all, which made "choose two" unanswerable by construction. One doubt
        // remains, and it is genuine: `count` is a plain number, so the third
        // cantrip a druid learns at 4th level cannot be expressed as growth.
        // The count below is the 1st-level value and the clause says so.
        selections: [{
          id: 'cantrips-known',
          prompt: 'Which two druid cantrips do you know?',
          kind: 'spellList', count: 2, from: DRUID_CANTRIP_POOL
        }],
        spells: [{
          selectionId: 'cantrips-known', availability: 'always', ability: 'wis'
        }],
        narrative: [{
          text: 'You know two cantrips of your choice from the druid spell list, '
            + 'and learn a third at 4th level. The count here is fixed at two — '
            + 'add the third by hand at 4th level. Only two druid cantrips are '
            + 'in this content set so far, so that is also the full choice on '
            + 'offer; more arriving later widens it without touching this file.',
          dmPromptable: true
        }],
        completeness: 'partial'
      })
    },
    {
      id: 'srd:class.druid.wild-shape', name: 'Wild Shape',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.druid.wild-shape', name: 'Wild Shape',
        // What is genuinely expressible: a resource and two actions. Both uses
        // return on a short *or* long rest, which is the same wording Channel
        // Divinity already carries, and `shortRest` is how this file set spells
        // it — the shorter rest is the binding one.
        resources: [{
          id: 'druid.wild-shape', name: 'Wild Shape', max: 2,
          refresh: { kind: 'shortRest' }, display: 'uses', order: 20
        }],
        actions: [
          {
            id: 'druid.wild-shape.transform', name: 'Wild Shape', cost: 'action',
            kind: 'ability',
            description: 'Assume the form of a beast you have seen before.',
            requirements: { resourceAtLeast: ['druid.wild-shape', 1] },
            costs: { 'druid.wild-shape': 1 }
          },
          {
            // Reverting is free of the resource: the SRD spends a use on
            // entering the form, never on leaving it.
            id: 'druid.wild-shape.revert', name: 'Revert to Your True Form',
            cost: 'bonusAction', kind: 'ability',
            description: 'Return to your normal form.',
            requirements: { always: true }
          }
        ],
        // Everything below is narrative because the alternative is fiction.
        //
        // The pipeline in this codebase answers "what modifies this character's
        // statistics". Wild Shape asks "whose statistics are these" — the
        // druid's numbers are not adjusted, they are stood down and a beast's
        // are stood up in their place, with a named list of things that carry
        // across. That needs a form stack the engine does not have: a true form,
        // an active form, and fall-through rules per stat. `op: 'replace'`
        // overrides one declared path at the end of one resolution; it cannot
        // swap hit points, Hit Dice, size, senses and a set of attacks at once,
        // and hit points are character state rather than a stat path anyway, so
        // "excess damage carries over" has nowhere to live.
        //
        // And there is no beast to become: SRD 5.1 ships no bestiary, so both
        // the statblock and the challenge rating the level limits key off are
        // absent. docs/srd/99-open-questions.md Q6 settles this — the feature
        // spends its uses here and points at a DM-supplied statblock.
        narrative: [
          {
            text: 'You take on the form of a beast you have seen before. At 2nd '
              + 'level the beast may be challenge rating 1/4 or lower and may have '
              + 'neither a flying nor a swimming speed; at 4th level, CR 1/2 or '
              + 'lower with no flying speed. You stay in the form for hours equal '
              + 'to half your druid level rounded down, then revert — or revert '
              + 'earlier as a bonus action, and automatically if you fall '
              + 'unconscious, drop to 0 hit points, or die.',
            dmPromptable: true
          },
          {
            text: 'In the form your game statistics are replaced by the beast\'s, '
              + 'except that you keep your alignment, personality, Intelligence, '
              + 'Wisdom and Charisma. You keep all your skill and saving throw '
              + 'proficiencies as well as the beast\'s, and use whichever bonus is '
              + 'higher. You take on the beast\'s hit points and Hit Dice; when you '
              + 'revert you return to the hit points you had before, and any damage '
              + 'beyond what the beast\'s form could take carries over to you.',
            dmPromptable: true
          },
          {
            text: 'You cannot cast spells while transformed, though concentration '
              + 'on a spell already cast continues. You keep the benefit of any '
              + 'class, racial or other feature the new form is physically capable '
              + 'of using, and lose special senses such as darkvision unless the '
              + 'form has them. Your equipment falls to the ground, merges into the '
              + 'form, or is worn by it if the form can wear it; merged equipment '
              + 'has no effect until you revert.',
            dmPromptable: true
          },
          {
            text: 'The beast\'s statistics are not modelled. SRD 5.1 contains no '
              + 'bestiary, so neither the statblocks nor the challenge ratings the '
              + 'limits above key off exist in this content set, and the engine has '
              + 'no way to run a character from a second statblock. Run the form '
              + 'from a statblock at the table; the uses are tracked here.',
            dmPromptable: true
          }
        ],
        completeness: 'partial'
      })
    },
    {
      id: 'srd:class.druid.circle-of-the-land.bonus-cantrip', name: 'Bonus Cantrip',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.druid.circle-of-the-land.bonus-cantrip', name: 'Bonus Cantrip',
        // A subclass granting an extra cantrip is the Cantrips feature again
        // with a count of one, and inherits the same missing selection kind.
        selections: [{
          id: 'bonus-cantrip',
          prompt: 'Which additional druid cantrip do you learn?',
          kind: 'other', count: 1
        }],
        spells: [{
          selectionId: 'bonus-cantrip', availability: 'always', ability: 'wis'
        }],
        narrative: [{
          text: 'You learn one additional druid cantrip of your choice.',
          dmPromptable: false
        }],
        completeness: 'partial'
      })
    },
    {
      id: 'srd:class.druid.circle-of-the-land.natural-recovery', name: 'Natural Recovery',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.druid.circle-of-the-land.natural-recovery', name: 'Natural Recovery',
        // A resource whose spending restores another resource, and a choice of
        // which. Arcane Recovery has the identical shape and the identical gap:
        // `costs` names what an action spends, never what it gives back, so the
        // slots are restored by hand.
        resources: [{
          id: 'druid.natural-recovery', name: 'Natural Recovery', max: 1,
          refresh: { kind: 'longRest' }, display: 'uses', order: 21
        }],
        actions: [{
          id: 'druid.natural-recovery.use', name: 'Natural Recovery',
          cost: { minutes: 1 },
          kind: 'ability',
          description: 'On a short rest, recover expended spell slots totalling half your druid level, rounded up.',
          requirements: { resourceAtLeast: ['druid.natural-recovery', 1] },
          costs: { 'druid.natural-recovery': 1 }
        }],
        narrative: [{
          text: 'Choose expended spell slots to recover with a combined level '
            + 'equal to or less than half your druid level rounded up, none of '
            + 'them 6th level or higher. Restore them from the resource list. '
            + 'Once per long rest.',
          dmPromptable: true
        }],
        completeness: 'partial'
      })
    },
    {
      id: 'srd:class.druid.circle-of-the-land.circle-spells', name: 'Circle Spells',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 3,
      effects: source({
        id: 'srd:class.druid.circle-of-the-land.circle-spells', name: 'Circle Spells',
        // The land is a selection and the spells depend on it, which is the
        // exact thing a SpellGrant cannot say: it has no `condition`, and
        // `spellIds` is a fixed array with no way to branch on an answer. Even
        // if it could, docs/srd/02-classes.md records only that the sets differ
        // by land and not what they are, so there is nothing to branch to.
        //
        // The mechanism these spells need does exist and is proven — the
        // cleric's domain spells are `availability: 'always'` with a slot group,
        // which is precisely "always prepared and not counted against the
        // limit". It is only the selection-dependent membership that is missing.
        selections: [{
          id: 'land',
          prompt: 'Which land is your circle bound to?',
          kind: 'other', count: 1,
          from: ['arctic', 'coast', 'desert', 'forest', 'grassland', 'mountain', 'swamp']
        }],
        narrative: [{
          text: 'Your bond with the land gives you a set of spells at 3rd and 5th '
            + 'level, and again at 7th and 9th. They are always prepared and do '
            + 'not count against the number of spells you can prepare. The sets '
            + 'differ by land and are not listed in SRD 5.1 as extracted here, '
            + 'and a spell grant cannot yet vary with a chosen option — record '
            + 'the land above and add its spells as always-prepared by hand.',
          dmPromptable: true
        }],
        completeness: 'partial'
      })
    }
  ]
}

// ===========================================================================
// Kit
//
// The dagger already exists in srd.ts and the mace in party.ts. The other eight
// weapons on the druid's list do not, so they are defined here from the
// docs/srd/04-equipment.md weapons table.
// ===========================================================================

function weapon(wid: string, name: string, profile: WeaponProfile): ItemDefinition {
  return {
    id: wid, name, provenance: 'srd', contentVersion: 1, rulesetVersion: V,
    category: 'weapon', slot: 'mainHand', weapon: profile,
    effects: source({ id: wid, name, kind: 'item' })
  }
}

export const CLUB = weapon('srd:weapon.club', 'Club', {
  category: 'simple', reach: 'melee',
  damage: { count: 1, sides: 4 }, damageType: 'bludgeoning',
  properties: ['light']
})

export const DART = weapon('srd:weapon.dart', 'Dart', {
  // A ranged weapon with finesse, which reads oddly until you notice that
  // finesse is what lets a thrown dart use Dexterity at all.
  category: 'simple', reach: 'ranged',
  damage: { count: 1, sides: 4 }, damageType: 'piercing',
  properties: ['finesse', 'thrown'],
  normalRangeFeet: 20, longRangeFeet: 60
})

// Javelin lives in barbarian.ts, which registers an identical definition;
// duplicating it here would be a second source of truth for one SRD weapon.
export const QUARTERSTAFF = weapon('srd:weapon.quarterstaff', 'Quarterstaff', {
  category: 'simple', reach: 'melee',
  damage: { count: 1, sides: 6 }, damageType: 'bludgeoning',
  properties: ['versatile'], versatileDamage: { count: 1, sides: 8 }
})

export const SCIMITAR = weapon('srd:weapon.scimitar', 'Scimitar', {
  // The only martial weapon on the druid's list, and the reason that list is
  // ten named grants instead of one category grant.
  category: 'martial', reach: 'melee',
  damage: { count: 1, sides: 6 }, damageType: 'slashing',
  properties: ['finesse', 'light']
})

export const SICKLE = weapon('srd:weapon.sickle', 'Sickle', {
  category: 'simple', reach: 'melee',
  damage: { count: 1, sides: 4 }, damageType: 'slashing',
  properties: ['light']
})

export const SLING = weapon('srd:weapon.sling', 'Sling', {
  category: 'simple', reach: 'ranged',
  damage: { count: 1, sides: 4 }, damageType: 'bludgeoning',
  properties: ['ammunition'],
  normalRangeFeet: 30, longRangeFeet: 120
})

export const SPEAR = weapon('srd:weapon.spear', 'Spear', {
  category: 'simple', reach: 'melee',
  damage: { count: 1, sides: 6 }, damageType: 'piercing',
  properties: ['thrown', 'versatile'], versatileDamage: { count: 1, sides: 8 },
  normalRangeFeet: 20, longRangeFeet: 60
})

/**
 * A druidic focus.
 *
 * Carries no modifiers, and that is not an oversight. What a focus does is
 * stand in for the material components of a spell, and nothing in the
 * vocabulary models components at all: `SpellDefinition.components` records
 * them, but no effect can satisfy or waive one. So the item exists to be
 * carried and named, and says as much.
 */
export const DRUIDIC_FOCUS: ItemDefinition = {
  id: 'srd:item.druidic-focus', name: 'Druidic Focus (Sprig of Mistletoe)',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'gear', slot: 'offHand',
  effects: source({
    id: 'srd:item.druidic-focus', name: 'Druidic Focus (Sprig of Mistletoe)', kind: 'item',
    narrative: [{
      text: 'A sprig of mistletoe, a totem, a yew wand or a wooden staff. You '
        + 'can use it in place of the material components of a druid spell, '
        + 'except components that have a cost listed. Component substitution is '
        + 'not modelled, so this is a note rather than a rule.',
      dmPromptable: false
    }],
    completeness: 'partial'
  })
}

// Wood Elf lives on srd:species.elf's own subspecies array in wizard.ts —
// merged there rather than duplicated here, once every parallel content agent
// had finished and there was no longer a collision risk in editing that file.
export const DRUID_SPECIES: SpeciesDefinition[] = []
export const DRUID_CLASSES: ClassDefinition[] = [DRUID]
export const DRUID_ITEMS: ItemDefinition[] = [
  CLUB, DART, QUARTERSTAFF, SCIMITAR, SICKLE, SLING, SPEAR, DRUIDIC_FOCUS
]
