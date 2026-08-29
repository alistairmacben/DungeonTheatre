// High Elf Wizard — the first caster.
//
// The reason this file is short is the point of the phase. Spellcasting added
// two pieces of character state and three stat paths; everything else a wizard
// needs already existed. The save DC below is three ordinary modifiers on an
// ordinary stat, which is why the wand further down raises it without anyone
// touching the resolver.

import type {
  ClassDefinition, ClassFeatureDefinition, EffectSource, ItemDefinition, Modifier,
  ProficiencyGrant, SpeciesDefinition, SubclassDefinition
} from '../rules/types.js'
import {
  abilityModifierPath, abilityScorePath, HP_MAX, PROFICIENCY_BONUS,
  SPELL_ATTACK, SPELL_SAVE_DC, SPELLS_PREPARED_MAX, speedPath
} from '../rules/statPaths.js'
import { SPELL_LISTS } from './spells.js'
import { fullCasterSlots } from './progression.js'

/** The Wizard table's slot columns, 1st through 9th. */
const WIZARD_SLOTS = fullCasterSlots('srd:class.wizard', 'wizard')

const V = '2014'
let n = 0
const id = () => `wz${++n}`

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

// ===========================================================================
// Species — High Elf
// ===========================================================================

export const ELF: SpeciesDefinition = {
  id: 'srd:species.elf', name: 'Elf', provenance: 'srd', contentVersion: 1,
  size: 'medium', baseWalkSpeed: 30,
  effects: source({
    id: 'srd:species.elf', name: 'Elf', kind: 'species',
    modifiers: [
      add(abilityScorePath('dex'), 2),
      { id: id(), channel: 'value', target: speedPath('walk'), op: 'base', value: 30, permanence: 'persistent' },
      {
        id: id(), channel: 'roll', rollOp: 'advantage',
        scope: { kinds: ['save'], againstTags: ['charm'] },
        permanence: 'persistent', note: 'Fey Ancestry'
      }
    ],
    proficiencies: [prof({ kind: 'skill', id: 'perception' })],
    narrative: [{
      text: 'Fey Ancestry also makes you immune to magical sleep, and Trance '
        + 'means you meditate for four hours rather than sleeping. Darkvision '
        + 'reaches 60 feet.',
      dmPromptable: false
    }]
  }),
  subspecies: [
    {
      id: 'srd:species.elf.high', name: 'High Elf',
      effects: source({
        id: 'srd:species.elf.high', name: 'High Elf', kind: 'species',
        modifiers: [add(abilityScorePath('int'), 1)],
        // An innate cantrip arrives through the same SpellGrant a whole class
        // list uses: a fixed id, always available, no slot group. Nothing about
        // the shape is racial.
        spells: [{
          spellIds: ['srd:spell.prestidigitation'],
          availability: 'always',
          ability: 'int'
        }],
        proficiencies: [prof({ kind: 'weapon', itemId: 'srd:weapon.longsword' })]
      })
    },
    {
      // SRD 5.1 defines only the high elf. Wood elf is a real 5e subrace but
      // is not in this ruleset's source text, so its distinguishing traits —
      // the Wisdom increase, the faster walking speed, weapon training, Mask
      // of the Wild — are not modelled here rather than guessed at. What
      // Fey Ancestry, Trance and the rest already give it is the base Elf
      // above; this subspecies exists so it can be chosen and flagged
      // honestly, not so it can pretend to be complete.
      id: 'srd:species.elf.wood', name: 'Wood Elf',
      effects: source({
        id: 'srd:species.elf.wood', name: 'Wood Elf', kind: 'species',
        narrative: [{
          text: 'The wood elf subrace is not present in SRD 5.1, which carries '
            + 'only the high elf. Its distinguishing traits — the Wisdom '
            + 'increase, the faster walking speed, weapon training and Mask of '
            + 'the Wild — must be supplied by the DM; nothing has been guessed '
            + 'in their place. Mechanically this is a base elf until they are.',
          dmPromptable: true
        }],
        completeness: 'partial'
      })
    }
  ]
}

// ===========================================================================
// The Wizard table (SRD p52), transcribed
// ===========================================================================

/** Cantrips Known: three, four from 4th, five from 10th. */
const WIZARD_CANTRIPS_KNOWN = [
  3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5
]

/**
 * The highest spell level the wizard can prepare, which is the top of their
 * slot ladder. Read off the Spell Slots columns rather than restated: a
 * wizard has 2nd-level slots from 3rd, 3rd from 5th, and so on to 9th at 17th.
 */
const WIZARD_MAX_SPELL_LEVEL = [
  1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9
]

/**
 * Spellbook growth. "At 1st level, you have a spellbook containing six
 * 1st-level wizard spells", then "each time you gain a wizard level, you can
 * add two wizard spells of your choice to your spellbook for free."
 *
 * A count, not a formula, so the six-then-two shape is visible on the page.
 */
const WIZARD_SPELLBOOK_ADDED = [
  6, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2
]

/** The wizard takes the standard five Ability Score Improvements. */
const WIZARD_ASI_LEVELS = [4, 8, 12, 16, 19]

/**
 * One level's worth of the Cantrips Known column, as the increase over the
 * level before. Spellbook additions are not modelled as selections: the SRD
 * lets a wizard add "wizard spells of your choice" of any level they have
 * slots for, and the content set has too few wizard spells to offer a real
 * pool at every level — see the narrative on Spellbook below.
 */
function cantripsKnownAtLevel(level: number, cantrips: number): ClassFeatureDefinition | undefined {
  if (cantrips <= 0) return undefined
  const fid = `srd:class.wizard.cantrips-known-${level}`
  return {
    id: fid, name: `Cantrips Known (level ${level})`,
    provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
    effects: source({
      id: fid, name: `Cantrips Known (level ${level})`,
      selections: [{
        id: 'cantrips', prompt: `Learn ${cantrips} more wizard cantrip${cantrips === 1 ? '' : 's'}`,
        kind: 'spellList', count: cantrips, from: WIZARD_CANTRIP_POOL
      }],
      spells: [{ selectionId: 'cantrips', availability: 'always', ability: 'int' }]
    })
  }
}

/**
 * Wizard cantrips in the content set, all genuinely on the SRD wizard list
 * (docs/srd/08-spell-lists.md). Short because the content set is, not
 * because the mechanism is — it grows as more spells carry srd:list.wizard.
 */
const WIZARD_CANTRIP_POOL = [
  'srd:spell.fire-bolt', 'srd:spell.ray-of-frost', 'srd:spell.prestidigitation',
  'srd:spell.chill-touch', 'srd:spell.poison-spray', 'srd:spell.acid-splash',
  'srd:spell.dancing-lights', 'srd:spell.light', 'srd:spell.mage-hand',
  'srd:spell.mending', 'srd:spell.message', 'srd:spell.minor-illusion',
  'srd:spell.shocking-grasp', 'srd:spell.true-strike'
]

const WIZARD_CANTRIP_FEATURES = WIZARD_CANTRIPS_KNOWN
  .map((known, i) => {
    const level = i + 1
    if (level === 1) return undefined // Granted by the Spellcasting feature itself.
    return cantripsKnownAtLevel(level, known - WIZARD_CANTRIPS_KNOWN[i - 1]!)
  })
  .filter((f): f is ClassFeatureDefinition => f !== undefined)

// ===========================================================================
// Class — Wizard, levels 1-20
// ===========================================================================

export const WIZARD: ClassDefinition = {
  id: 'srd:class.wizard', name: 'Wizard', provenance: 'srd', contentVersion: 1,
  hitDie: 6, savingThrowProficiencies: ['int', 'wis'],
  subclassSlot: { grantedAtLevel: 2, options: ['srd:subclass.evocation'] },
  asiLevels: WIZARD_ASI_LEVELS,
  features: [
    {
      id: 'srd:class.wizard.proficiencies', name: 'Wizard Proficiencies',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.wizard.proficiencies', name: 'Wizard Proficiencies',
        modifiers: [
          add(HP_MAX, {
            sum: [
              6, { product: [3, { sum: [{ characterLevel: true }, -1] }] },
              { product: [{ stat: abilityModifierPath('con') }, { characterLevel: true }] }
            ]
          }, { note: 'd6 hit die: 3 per level after the first, +6 at 1st, + CON per level' })
        ],
        proficiencies: [
          prof({ kind: 'save', ability: 'int' }),
          prof({ kind: 'save', ability: 'wis' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.dagger' }),
          prof({ kind: 'skill', id: 'arcana' }),
          prof({ kind: 'skill', id: 'investigation' })
        ]
      })
    },
    {
      id: 'srd:class.wizard.spellcasting', name: 'Spellcasting',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.wizard.spellcasting', name: 'Spellcasting',
        modifiers: [
          // "8 + your proficiency bonus + your Intelligence modifier", written
          // as three ordinary modifiers on one ordinary stat. Nothing special
          // resolves this, which is exactly why the wand can raise it.
          { id: id(), channel: 'value', target: SPELL_SAVE_DC, op: 'base', value: 8, permanence: 'persistent' },
          add(SPELL_SAVE_DC, { stat: PROFICIENCY_BONUS }),
          add(SPELL_SAVE_DC, { stat: abilityModifierPath('int') }, { note: 'Intelligence' }),
          add(SPELL_ATTACK, { stat: PROFICIENCY_BONUS }),
          add(SPELL_ATTACK, { stat: abilityModifierPath('int') }, { note: 'Intelligence' }),
          add(SPELLS_PREPARED_MAX, {
            max: [1, {
              sum: [
                { stat: abilityModifierPath('int') },
                { classLevel: 'srd:class.wizard' }
              ]
            }]
          }, { note: 'Intelligence modifier + wizard level, minimum 1' }),
          ...WIZARD_SLOTS.modifiers
        ],
        // The full ladder, 1st through 9th, read off the Wizard table rather
        // than frozen at one row. This is what a level-9 wizard needs to have
        // 5th-level slots at all.
        resources: WIZARD_SLOTS.resources,
        // Two grants, one type. Cantrips are always available; everything in
        // the spellbook must be prepared. The difference is data.
        selections: [{
          id: 'cantrips', prompt: 'Choose three wizard cantrips',
          kind: 'spellList', count: 3, from: WIZARD_CANTRIP_POOL
        }],
        spells: [
          // Three chosen cantrips, not three named ones. The old file picked
          // Fire Bolt, Ray of Frost and Prestidigitation for every wizard that
          // would ever exist.
          { selectionId: 'cantrips', availability: 'always', ability: 'int' },
          {
            // Prepared from the whole list, as high as the slot ladder reaches
            // — 1st at 1st level, 9th at 17th. Frozen at 3 before, which was
            // the level-5 row.
            fromList: {
              listId: SPELL_LISTS.WIZARD,
              maxLevel: {
                classLevelTable: {
                  classId: 'srd:class.wizard', values: WIZARD_MAX_SPELL_LEVEL
                }
              }
            },
            availability: 'prepared',
            slotGroup: 'wizard',
            ability: 'int'
          }
        ]
      })
    },
    {
      id: 'srd:class.wizard.arcane-recovery', name: 'Arcane Recovery',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.wizard.arcane-recovery', name: 'Arcane Recovery',
        resources: [{
          id: 'wizard.arcane-recovery', name: 'Arcane Recovery', max: 1,
          refresh: { kind: 'longRest' }, display: 'uses'
        }],
        actions: [{
          id: 'wizard.arcane-recovery.use', name: 'Arcane Recovery',
          cost: { minutes: 1 },
          description: 'Recover expended spell slots totalling half your wizard level, rounded up.',
          requirements: { resourceAtLeast: ['wizard.arcane-recovery', 1] },
          costs: { 'wizard.arcane-recovery': 1 }
        }],
        narrative: [{
          text: 'Once per day, on finishing a short rest. Which slots you recover '
            + 'is your choice, up to a combined level of half your wizard level '
            + 'rounded up, and none of 6th level or higher. Restore them from the '
            + 'resource list — the app tracks the use, not the arithmetic.',
          dmPromptable: true
        }],
        completeness: 'partial'
      })
    },

    // One feature per level the Cantrips Known column moves.
    ...WIZARD_CANTRIP_FEATURES,

    // --- 18th --------------------------------------------------------------
    {
      id: 'srd:class.wizard.spell-mastery', name: 'Spell Mastery',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 18,
      effects: source({
        id: 'srd:class.wizard.spell-mastery', name: 'Spell Mastery',
        completeness: 'partial',
        // "Cast at will without expending a slot" is a per-spell exemption from
        // the slot cost. A SpellGrant's cost is its slot group, set for the
        // whole grant — there is no way to say "this one spell, free".
        narrative: [{
          text: 'Choose a 1st-level and a 2nd-level wizard spell in your spellbook. '
            + 'You can cast them at their lowest level without expending a slot '
            + 'while they are prepared. The app cannot exempt one spell from its '
            + 'slot cost — cast them and decline to spend the slot.',
          dmPromptable: true
        }]
      })
    },

    // --- 20th --------------------------------------------------------------
    {
      id: 'srd:class.wizard.signature-spells', name: 'Signature Spells',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 20,
      effects: source({
        id: 'srd:class.wizard.signature-spells', name: 'Signature Spells',
        completeness: 'partial',
        narrative: [{
          text: 'Choose two 3rd-level wizard spells in your spellbook. They are '
            + 'always prepared, do not count against your prepared total, and each '
            + 'can be cast once at 3rd level per short or long rest without a slot. '
            + 'None of those three exemptions is expressible — track them yourself.',
          dmPromptable: true
        }]
      })
    }
  ]
}

// ===========================================================================
// Kit — the dagger already exists in srd.ts; only the wand is new
// ===========================================================================

/**
 * A wizard's staple, and the proof that the DC design paid off: `add` on two
 * stats, no new mechanism, no knowledge of what a spell is.
 */
export const WAND_OF_THE_WAR_MAGE: ItemDefinition = {
  id: 'srd:item.wand-of-the-war-mage', name: 'Wand of the War Mage +1',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'wondrous', rarity: 'uncommon', slot: 'offHand', requiresAttunement: true,
  effects: source({
    id: 'srd:item.wand-of-the-war-mage', name: 'Wand of the War Mage +1', kind: 'item',
    modifiers: [add(SPELL_ATTACK, 1), add(SPELL_SAVE_DC, 1)]
  })
}

// ===========================================================================
// Subclass — School of Evocation (SRD p54)
// ===========================================================================

/**
 * Every one of these five acts on somebody else — a creature's saving throw,
 * a creature's damage, a spell's effect on a target — which is why four are
 * partial and the fifth is pure narrative. The evoker's own numbers never
 * change; what changes is what happens at the other end of the spell, and
 * theatre-of-the-mind has no other end to reach.
 */
export const SCHOOL_OF_EVOCATION: SubclassDefinition = {
  id: 'srd:subclass.evocation', name: 'School of Evocation',
  provenance: 'srd', contentVersion: 1,
  classId: 'srd:class.wizard',
  features: [
    {
      id: 'srd:subclass.evocation.savant', name: 'Evocation Savant',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:subclass.evocation.savant', name: 'Evocation Savant',
        // Not partial: copying spells into a spellbook has no mechanics here to
        // be incomplete about. Halving a cost the app never charges is a table
        // matter, and saying so is the whole feature.
        narrative: [{
          text: 'The gold and time to copy an evocation spell into your spellbook '
            + 'is halved. Copying spells is a table matter, not something the app '
            + 'tracks.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.evocation.sculpt-spells', name: 'Sculpt Spells',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:subclass.evocation.sculpt-spells', name: 'Sculpt Spells',
        completeness: 'partial',
        narrative: [{
          text: 'When you cast an evocation spell that affects creatures you can '
            + 'see, choose 1 + the spell level of them: they automatically succeed '
            + 'on their saves against it, and take no damage where they would have '
            + 'taken half. Tell the DM who you spared.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.evocation.potent-cantrip', name: 'Potent Cantrip',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 6,
      effects: source({
        id: 'srd:subclass.evocation.potent-cantrip', name: 'Potent Cantrip',
        completeness: 'partial',
        narrative: [{
          text: 'A creature that succeeds on a saving throw against your cantrip '
            + 'still takes half its damage. The save is the DM roll, so this is '
            + 'theirs to apply.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.evocation.empowered-evocation', name: 'Empowered Evocation',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 10,
      effects: source({
        id: 'srd:subclass.evocation.empowered-evocation', name: 'Empowered Evocation',
        completeness: 'partial',
        // A damage bonus that names a school and applies once per cast. The
        // same wall warlock.ts recorded for Agonizing Blast: "damage bonuses
        // cannot yet name the spell they belong to."
        narrative: [{
          text: 'Add your Intelligence modifier to one damage roll of any wizard '
            + 'evocation spell you cast. A damage bonus cannot yet name the school '
            + 'it belongs to — add it yourself when you roll.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.evocation.overchannel', name: 'Overchannel',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 14,
      effects: source({
        id: 'srd:subclass.evocation.overchannel', name: 'Overchannel',
        completeness: 'partial',
        narrative: [{
          text: 'When you cast a wizard spell of 1st through 5th level that deals '
            + 'damage, you may deal maximum damage with it. The first use after a '
            + 'long rest is free; each use after that costs you 2d12 necrotic per '
            + 'spell level, rising by 1d12 each time. Neither maximising the damage '
            + 'nor the escalating cost is modelled — both are yours to track.',
          dmPromptable: true
        }]
      })
    }
  ]
}

/**
 * Columns nothing reads yet: the five levels a wizard takes an Ability Score
 * Improvement, and how many spells the spellbook gains each level.
 */
export const WIZARD_TABLE = {
  asiLevels: WIZARD_ASI_LEVELS,
  cantripsKnown: WIZARD_CANTRIPS_KNOWN,
  maxSpellLevel: WIZARD_MAX_SPELL_LEVEL,
  spellbookAdded: WIZARD_SPELLBOOK_ADDED
}

export const WIZARD_SUBCLASSES: SubclassDefinition[] = [SCHOOL_OF_EVOCATION]
export const WIZARD_SPECIES: SpeciesDefinition[] = [ELF]
export const WIZARD_CLASSES: ClassDefinition[] = [WIZARD]
export const WIZARD_ITEMS: ItemDefinition[] = [WAND_OF_THE_WAR_MAGE]
