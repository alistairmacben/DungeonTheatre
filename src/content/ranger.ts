// Ranger, levels 1 to 20, and the Hunter.
//
// The only class in the SRD the content set has never had at all — every other
// one existed in some partial form and was extended. This is the first written
// from nothing, and it is the shortest class file for its size because almost
// everything it needs was built for someone else: `halfCasterSlots` for the
// paladin, `chosenProf` for the rogue, the fighting-style toggles for the
// fighter, and the standing roll-path modifiers that only started working last
// commit.
//
// The Hunter is unusual: every one of its four features is "choose one of
// these", which is four selections rather than four grants. Where an option is
// expressible it sits behind its own toggle, the way a fighting style does —
// a selection answer still cannot steer which modifier applies.
//
// Checked against docs/srd-source/classes.pdf p35-38.

import type {
  ClassDefinition, ClassFeatureDefinition, EffectSource, Modifier,
  ProficiencyGrant, SelectionDefinition, SubclassDefinition
} from '../rules/types.js'
import {
  abilityModifierPath, ARMOR_CLASS, ATTACK_ROLL, DAMAGE_WEAPON, HP_MAX,
  movementCostPath,
  PROFICIENCY_BONUS, skillPath, SPELL_ATTACK, SPELL_SAVE_DC
} from '../rules/statPaths.js'
import { halfCasterSlots, HALF_CASTER_MAX_SPELL_LEVEL } from './progression.js'

const RANGER_ID = 'srd:class.ranger'

let n = 0
const id = (): string => `rg${++n}`

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

const chosenProf = (kind: 'skill' | 'tool', selectionId: string): ProficiencyGrant => ({
  id: id(),
  category: { kind, selection: selectionId } as never,
  level: 'proficient', rounding: 'floor', grantsProficiency: true
})

// ---------------------------------------------------------------------------
// The Ranger table (SRD p35), transcribed
// ---------------------------------------------------------------------------

/** The ranger is a half caster, on the same table as the paladin. */
const RANGER_SLOTS = halfCasterSlots(RANGER_ID, 'ranger')

/**
 * Spells Known: none at 1st, two at 2nd, then one more every other level.
 *
 * The column moves on the odd levels from 3rd and holds on the even ones, so
 * exactly half of a ranger's level-ups teach a spell.
 */
const RANGER_SPELLS_KNOWN = [
  0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11
]

/** Favored Enemy: one at 1st, another at 6th, a third at 14th. */
const FAVORED_ENEMY_LEVELS = [1, 6, 14]

/** Natural Explorer: one terrain at 1st, another at 6th, a third at 10th. */
const FAVORED_TERRAIN_LEVELS = [1, 6, 10]

/** The ranger takes the standard five Ability Score Improvements. */
const RANGER_ASI_LEVELS = [4, 8, 12, 16, 19]

/** "Choose three from" — eight skills, and the ranger picks more than most. */
const RANGER_SKILLS = [
  'animal-handling', 'athletics', 'insight', 'investigation', 'nature',
  'perception', 'stealth', 'survival'
]

/** The thirteen creature types, plus the two-humanoid-races alternative. */
const FAVORED_ENEMIES = [
  'aberrations', 'beasts', 'celestials', 'constructs', 'dragons', 'elementals',
  'fey', 'fiends', 'giants', 'monstrosities', 'oozes', 'plants', 'undead',
  'two humanoid races'
]

/** The seven terrains, the same seven the Circle of the Land names. */
const FAVORED_TERRAINS = [
  'arctic', 'coast', 'desert', 'forest', 'grassland', 'mountain', 'swamp'
]

/**
 * The four Fighting Styles a ranger may take.
 *
 * A different four from the paladin's: the ranger gets Archery and Two-Weapon
 * Fighting and not Great Weapon Fighting or Protection. The toggles are the
 * fighter's own `fighter.style.<id>`, so a ranger/fighter has one switch per
 * decision rather than two.
 */
const RANGER_STYLES = ['archery', 'defense', 'dueling', 'two-weapon']

const styleToggle = (styleId: string): string => `fighter.style.${styleId}`

// ---------------------------------------------------------------------------
// Generated level-up features
// ---------------------------------------------------------------------------

/** One level-up's worth of the Spells Known column. */
function spellsKnownAt(level: number, count: number): ClassFeatureDefinition {
  const fid = `srd:class.ranger.spells-known.${level}`
  const name = `Ranger Spells Known (level ${level})`
  const selections: SelectionDefinition[] = [{
    id: 'spells',
    prompt: `Learn ${count} ranger spell${count === 1 ? '' : 's'} of a level you can cast`,
    kind: 'spellList', count, from: RANGER_SPELL_POOL
  }]
  return {
    id: fid, name, provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
    effects: source({
      id: fid, name,
      selections,
      // 'always', not 'prepared': a ranger knows a fixed repertoire, as the
      // bard, sorcerer and warlock do.
      spells: [{
        selectionId: 'spells', availability: 'always',
        slotGroup: 'ranger', ability: 'wis'
      }]
    })
  }
}

/**
 * The ranger's spell candidates.
 *
 * Genuinely on the SRD ranger list (docs/srd/08-spell-lists.md) and already in
 * the content set. Three is what the set has tagged, not a ceiling the
 * mechanism imposes — it grows the moment more spells carry `srd:list.ranger`.
 */
const RANGER_SPELL_POOL = [
  'srd:spell.cure-wounds', 'srd:spell.detect-magic', 'srd:spell.longstrider',
  'srd:spell.alarm', 'srd:spell.animal-friendship', 'srd:spell.detect-poison-and-disease',
  'srd:spell.fog-cloud', 'srd:spell.goodberry', 'srd:spell.hunters-mark',
  'srd:spell.jump', 'srd:spell.speak-with-animals',
  'srd:spell.animal-messenger', 'srd:spell.barkskin', 'srd:spell.darkvision',
  'srd:spell.find-traps', 'srd:spell.lesser-restoration', 'srd:spell.locate-animals-or-plants',
  'srd:spell.locate-object', 'srd:spell.pass-without-trace', 'srd:spell.silence',
  'srd:spell.spike-growth',
  'srd:spell.conjure-animals', 'srd:spell.daylight', 'srd:spell.nondetection',
  'srd:spell.plant-growth', 'srd:spell.speak-with-plants', 'srd:spell.water-breathing',
  'srd:spell.water-walk', 'srd:spell.wind-wall',
  'srd:spell.conjure-woodland-beings', 'srd:spell.freedom-of-movement',
  'srd:spell.locate-creature', 'srd:spell.stoneskin',
  'srd:spell.commune-with-nature', 'srd:spell.tree-stride'
]

const SPELLS_KNOWN_FEATURES = RANGER_SPELLS_KNOWN
  .map((known, i) => {
    const level = i + 1
    const delta = known - (RANGER_SPELLS_KNOWN[i - 1] ?? 0)
    return delta > 0 ? spellsKnownAt(level, delta) : undefined
  })
  .filter((f): f is ClassFeatureDefinition => f !== undefined)

/**
 * Favored Enemy, at 1st, 6th and 14th.
 *
 * The advantage is real and behind a toggle, because only the table knows
 * whether the thing being tracked is a favored enemy. The language learned is
 * not modelled — languages are not, anywhere.
 */
const FAVORED_ENEMY_FEATURES = FAVORED_ENEMY_LEVELS.map(
  (level, index): ClassFeatureDefinition => {
    const fid = `srd:class.ranger.favored-enemy.${level}`
    const name = index === 0 ? 'Favored Enemy' : `Favored Enemy (level ${level})`
    return {
      id: fid, name, provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
      effects: source({
        id: fid, name,
        completeness: 'partial',
        // Only the first grant carries the modifiers: the advantage does not
        // stack with itself, and three copies would put three identical lines
        // on the sheet for a bonus that applies once.
        modifiers: index > 0 ? [] : [
          {
            id: id(), channel: 'roll', rollOp: 'advantage',
            scope: { kinds: ['check'], skills: ['survival'] },
            condition: { playerToggle: 'ranger.favored-enemy' },
            permanence: 'persistent',
            note: 'Favored Enemy: tracking a favored enemy'
          },
          {
            id: id(), channel: 'roll', rollOp: 'advantage',
            scope: { kinds: ['check'], abilities: ['int'] },
            condition: { playerToggle: 'ranger.favored-enemy' },
            permanence: 'persistent',
            note: 'Favored Enemy: recalling information about a favored enemy'
          }
        ],
        selections: [{
          id: 'favored-enemy',
          prompt: index === 0
            ? 'Choose a favored enemy'
            : `Choose another favored enemy (level ${level})`,
          kind: 'other', count: 1, from: FAVORED_ENEMIES
        }],
        narrative: [{
          text: index === 0
            ? 'Turn this on when you are tracking a favored enemy or recalling '
              + 'information about one: advantage on Wisdom (Survival) and on '
              + 'Intelligence checks. You also learn one language spoken by them, '
              + 'which is not modelled.'
            : 'One more favored enemy, and one more of their languages. The '
              + 'advantage is the same switch as the first — it does not stack.',
          ...(index === 0 ? { toggleId: 'ranger.favored-enemy' } : {}),
          dmPromptable: true
        }]
      })
    }
  })

/**
 * Natural Explorer, at 1st, 6th and 10th.
 *
 * The doubled proficiency on Intelligence and Wisdom checks in favored terrain
 * is the Draconic Bloodline's Dragon Ancestor again: two `abilityCheck` grants
 * at expertise level, gated on a toggle. The travel benefits are about a
 * journey, which the app does not run.
 */
const NATURAL_EXPLORER_FEATURES = FAVORED_TERRAIN_LEVELS.map(
  (level, index): ClassFeatureDefinition => {
    const fid = `srd:class.ranger.natural-explorer.${level}`
    const name = index === 0 ? 'Natural Explorer' : `Natural Explorer (level ${level})`
    return {
      id: fid, name, provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
      effects: source({
        id: fid, name,
        completeness: 'partial',
        proficiencies: index > 0 ? [] : (['int', 'wis'] as const).map((ability) => ({
          id: id(),
          category: { kind: 'abilityCheck', ability } as never,
          level: 'expertise' as const, rounding: 'floor' as const,
          // "if you are using a skill that you're proficient in" — the SRD's
          // own condition, and the resolver's zero rule enforces it without a
          // rule of its own: multiplying a term that is 0 gives 0.
          grantsProficiency: false,
          condition: { playerToggle: 'ranger.favored-terrain' }
        })),
        selections: [{
          id: 'favored-terrain',
          prompt: index === 0
            ? 'Choose a favored terrain'
            : `Choose another favored terrain (level ${level})`,
          kind: 'other', count: 1, from: FAVORED_TERRAINS
        }],
        narrative: [
          {
            text: index === 0
              ? 'Turn this on while you are in your favored terrain: your '
                + 'proficiency bonus is doubled on Intelligence and Wisdom checks '
                + 'made with a skill you are proficient in.'
              : 'One more favored terrain. The doubled proficiency is the same '
                + 'switch as the first — it does not stack.',
            ...(index === 0 ? { toggleId: 'ranger.favored-terrain' } : {}),
            dmPromptable: true
          },
          ...(index === 0
            ? [{
              text: 'Travelling an hour or more in favored terrain: difficult '
                + 'terrain does not slow your group, you cannot become lost except '
                + 'by magic, you stay alert while foraging or navigating, you can '
                + 'move stealthily alone at a normal pace, you forage twice as '
                + 'much food, and tracking tells you a group\'s number, sizes and '
                + 'how long ago they passed. Travel is not modelled — that is all '
                + 'the DM\'s.',
              dmPromptable: true
            }]
            : [])
        ]
      })
    }
  })

// ===========================================================================
// Class — Ranger
// ===========================================================================

export const RANGER: ClassDefinition = {
  id: RANGER_ID, name: 'Ranger', provenance: 'srd', contentVersion: 1,
  hitDie: 10, savingThrowProficiencies: ['str', 'dex'],
  subclassSlot: { grantedAtLevel: 3, options: ['srd:subclass.hunter'] },
  asiLevels: RANGER_ASI_LEVELS,
  features: [
    {
      id: 'srd:class.ranger.proficiencies', name: 'Ranger Proficiencies',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.ranger.proficiencies', name: 'Ranger Proficiencies',
        modifiers: [
          add(HP_MAX, {
            sum: [
              10, { product: [6, { sum: [{ characterLevel: true }, -1] }] },
              { product: [{ stat: abilityModifierPath('con') }, { characterLevel: true }] }
            ]
          }, { note: 'd10 hit die: 6 per level after the first, +10 at 1st, + CON per level' })
        ],
        proficiencies: [
          prof({ kind: 'save', ability: 'str' }),
          prof({ kind: 'save', ability: 'dex' }),
          prof({ kind: 'armor', category: 'light' }),
          prof({ kind: 'armor', category: 'medium' }),
          prof({ kind: 'armor', category: 'shield' }),
          prof({ kind: 'weaponCategory', category: 'simple' }),
          prof({ kind: 'weaponCategory', category: 'martial' }),
          // Three, not two — the ranger picks more skills than any class but
          // the rogue and the bard.
          chosenProf('skill', 'skills')
        ],
        selections: [{
          id: 'skills', prompt: 'Choose three ranger skills', kind: 'skill', count: 3,
          from: RANGER_SKILLS
        }]
      })
    },
    ...FAVORED_ENEMY_FEATURES,
    ...NATURAL_EXPLORER_FEATURES,

    // --- 2nd -----------------------------------------------------------------
    {
      id: 'srd:class.ranger.fighting-style', name: 'Fighting Style',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.ranger.fighting-style', name: 'Fighting Style',
        // Three of the ranger's four are fully expressed. Two-Weapon Fighting
        // is not, and lives in its own gated source below so a ranger who took
        // Archery does not have their attack bonus flagged as unreliable.
        modifiers: [
          add(ATTACK_ROLL, 2, {
            condition: { playerToggle: styleToggle('archery') },
            note: 'Archery: +2 with ranged weapons — turn off when not using one'
          }),
          add(ARMOR_CLASS, 1, {
            condition: {
              all: [
                { playerToggle: styleToggle('defense') },
                { playerToggle: 'wearing-armor' }
              ]
            },
            note: 'Defense: +1 AC while wearing armour'
          }),
          add(DAMAGE_WEAPON, 2, {
            condition: { playerToggle: styleToggle('dueling') },
            note: 'Dueling: +2 damage with a single one-handed melee weapon'
          })
        ],
        selections: [{
          id: 'fighting-style', prompt: 'Choose a Fighting Style',
          kind: 'other', count: 1, from: RANGER_STYLES
        }],
        narrative: [
          {
            text: 'Archery: +2 on attack rolls with ranged weapons. Turn this on '
              + 'if it is the style you chose.',
            toggleId: styleToggle('archery'), dmPromptable: false
          },
          {
            text: 'Defense: +1 AC while you are wearing armour.',
            toggleId: styleToggle('defense'), dmPromptable: false
          },
          {
            text: 'Dueling: +2 damage while wielding one melee weapon in one hand '
              + 'and nothing in the other.',
            toggleId: styleToggle('dueling'), dmPromptable: false
          },
          {
            text: 'Two-Weapon Fighting: add your ability modifier to the damage of '
              + 'the second attack.',
            toggleId: styleToggle('two-weapon'), dmPromptable: false
          },
          {
            text: 'A ranger may not take Great Weapon Fighting or Protection. The '
              + 'engine cannot check that the toggle you turn on matches the style '
              + 'you chose, or that only one is on.',
            dmPromptable: true
          }
        ]
      })
    },
    {
      id: 'srd:class.ranger.fighting-style-manual', name: 'Fighting Style (manual)',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.ranger.fighting-style-manual', name: 'Fighting Style (manual)',
        completeness: 'partial',
        activation: { playerToggle: styleToggle('two-weapon') },
        narrative: [{
          text: 'Two-Weapon Fighting: the off-hand attack is not modelled, so '
            + 'neither is the modifier added to its damage. Roll it yourself.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:class.ranger.spellcasting', name: 'Spellcasting',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.ranger.spellcasting', name: 'Spellcasting',
        modifiers: [
          // Wisdom, "much as a druid does" — and structurally the same three
          // modifiers every other caster's DC is built from.
          { id: id(), channel: 'value', target: SPELL_SAVE_DC, op: 'base', value: 8, permanence: 'persistent' },
          add(SPELL_SAVE_DC, { stat: PROFICIENCY_BONUS }),
          add(SPELL_SAVE_DC, { stat: abilityModifierPath('wis') }, { note: 'Wisdom' }),
          add(SPELL_ATTACK, { stat: PROFICIENCY_BONUS }),
          add(SPELL_ATTACK, { stat: abilityModifierPath('wis') }, { note: 'Wisdom' }),
          {
            id: id(), channel: 'capability', capability: 'castSpells',
            capOp: 'grant', permanence: 'persistent'
          },
          ...RANGER_SLOTS.modifiers
        ],
        resources: RANGER_SLOTS.resources,
        narrative: [{
          text: 'You have no spell slots at 1st level — a ranger begins casting at '
            + '2nd, knows a fixed repertoire rather than preparing, and never '
            + 'gains a slot above 5th level. There are no ranger cantrips.',
          dmPromptable: false
        }]
      })
    },
    ...SPELLS_KNOWN_FEATURES,

    // --- 3rd -----------------------------------------------------------------
    {
      id: 'srd:class.ranger.primeval-awareness', name: 'Primeval Awareness',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 3,
      effects: source({
        id: 'srd:class.ranger.primeval-awareness', name: 'Primeval Awareness',
        // The slot is spent from the ordinary track; what it buys is knowledge
        // about the world, which the app does not hold.
        completeness: 'partial',
        actions: [{
          id: 'ranger.primeval-awareness', name: 'Primeval Awareness',
          kind: 'ability', cost: 'action',
          description: 'Expend a ranger spell slot to sense creature types within a mile.',
          requirements: { always: true }
        }],
        narrative: [{
          text: 'Expend one ranger spell slot. For a minute per slot level you '
            + 'sense whether aberrations, celestials, dragons, elementals, fey, '
            + 'fiends or undead are within 1 mile — 6 miles in your favored '
            + 'terrain. It does not reveal where or how many. Spend the slot from '
            + 'your track yourself; ask the DM what you sense.',
          dmPromptable: true
        }]
      })
    },

    // --- 5th -----------------------------------------------------------------
    {
      id: 'srd:class.ranger.extra-attack', name: 'Extra Attack',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 5,
      effects: source({
        id: 'srd:class.ranger.extra-attack', name: 'Extra Attack',
        completeness: 'partial',
        narrative: [{
          text: 'You can attack twice, instead of once, whenever you take the '
            + 'Attack action on your turn. Roll the second attack from the same '
            + 'weapon entry.',
          dmPromptable: false
        }]
      })
    },

    // --- 8th -----------------------------------------------------------------
    {
      id: 'srd:class.ranger.lands-stride', name: "Land's Stride",
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 8,
      effects: source({
        id: 'srd:class.ranger.lands-stride', name: "Land's Stride",
        // Word for word the Circle of the Land's, and modelled the same way:
        // difficult terrain has a declared movement-cost path, and "advantage
        // on saves against plants that impede movement" is a roll scope with a
        // tag. The plant-damage clause is the part that has nowhere to go.
        completeness: 'partial',
        modifiers: [
          {
            id: id(), channel: 'value', target: movementCostPath('difficultTerrain'),
            op: 'set', value: 1, permanence: 'persistent',
            note: 'nonmagical difficult terrain costs no extra movement'
          },
          {
            id: id(), channel: 'roll', rollOp: 'advantage',
            scope: { kinds: ['save'], againstTags: ['plant'] },
            permanence: 'persistent',
            note: "Land's Stride: against plants that impede movement"
          }
        ],
        narrative: [{
          text: 'You also pass through nonmagical plants without being slowed and '
            + 'without taking damage from thorns or spines. The engine does not '
            + 'distinguish magical difficult terrain from mundane.',
          dmPromptable: true
        }]
      })
    },

    // --- 10th ----------------------------------------------------------------
    {
      id: 'srd:class.ranger.hide-in-plain-sight', name: 'Hide in Plain Sight',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 10,
      effects: source({
        id: 'srd:class.ranger.hide-in-plain-sight', name: 'Hide in Plain Sight',
        // +10 to Stealth is an ordinary add on a declared skill path. The
        // conditions around it — a minute of camouflage, a solid surface, and
        // losing it the moment you move — are the toggle's job.
        modifiers: [
          add(skillPath('stealth'), 10, {
            condition: { playerToggle: 'ranger.hide-in-plain-sight' },
            note: 'Hide in Plain Sight: camouflaged and motionless'
          })
        ],
        actions: [{
          id: 'ranger.hide-in-plain-sight.camouflage', name: 'Create Camouflage',
          kind: 'ability', cost: { minutes: 1 },
          description: 'Spend a minute making camouflage from natural materials.',
          requirements: { always: true }
        }],
        narrative: [{
          text: 'Turn this on once you are camouflaged and pressed against a solid '
            + 'surface at least as tall and wide as you. Turn it off the moment '
            + 'you move or take an action or reaction — you must camouflage again '
            + 'to get it back.',
          toggleId: 'ranger.hide-in-plain-sight', dmPromptable: true
        }]
      })
    },

    // --- 14th ----------------------------------------------------------------
    {
      id: 'srd:class.ranger.vanish', name: 'Vanish',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 14,
      effects: source({
        id: 'srd:class.ranger.vanish', name: 'Vanish',
        actions: [{
          id: 'ranger.vanish.hide', name: 'Hide', kind: 'ability',
          cost: 'bonusAction',
          description: 'Take the Hide action as a bonus action.',
          requirements: { always: true }
        }],
        narrative: [{
          text: 'You also cannot be tracked by nonmagical means unless you choose '
            + 'to leave a trail.',
          dmPromptable: true
        }]
      })
    },

    // --- 18th ----------------------------------------------------------------
    {
      id: 'srd:class.ranger.feral-senses', name: 'Feral Senses',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 18,
      effects: source({
        id: 'srd:class.ranger.feral-senses', name: 'Feral Senses',
        // "Not seeing it does not impose disadvantage" is the removal of a
        // penalty nothing in the content set applies — the engine does not know
        // whether you can see your target. Suppression needs something to
        // suppress.
        completeness: 'partial',
        narrative: [{
          text: 'Attacking a creature you cannot see no longer imposes '
            + 'disadvantage on your attack rolls, and you know the location of any '
            + 'invisible creature within 30 feet that is not hidden from you, '
            + 'unless you are blinded or deafened.',
          dmPromptable: true
        }]
      })
    },

    // --- 20th ----------------------------------------------------------------
    {
      id: 'srd:class.ranger.foe-slayer', name: 'Foe Slayer',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 20,
      effects: source({
        id: 'srd:class.ranger.foe-slayer', name: 'Foe Slayer',
        // A standing modifier could add Wisdom to every attack roll, and that
        // is not what this says: it is once per turn, on an attack *or* a
        // damage roll, chosen after seeing the die. A toggle would be a
        // different rule wearing this one's name.
        completeness: 'partial',
        narrative: [{
          text: 'Once on each of your turns you may add your Wisdom modifier to '
            + 'the attack roll or the damage roll of an attack against a favored '
            + 'enemy — your choice, before or after the roll but before its '
            + 'effects. Add it yourself.',
          dmPromptable: true
        }]
      })
    }
  ]
}

// ===========================================================================
// Subclass — Hunter (SRD p37-38)
// ===========================================================================
//
// Four features, each of them "choose one of these". That makes the archetype
// four selections rather than four grants, and the options that *are*
// expressible sit behind their own toggles — the fighting-style pattern, for
// the same reason: no Predicate reads a selection's answer.

const HUNTER_CHOICES = [
  {
    level: 3, id: 'hunters-prey', name: "Hunter's Prey",
    options: [
      {
        id: 'colossus-slayer',
        text: 'Colossus Slayer: a creature you hit with a weapon attack takes an '
          + 'extra 1d8 damage if it is below its hit point maximum, once per turn. '
          + 'Extra damage dice are not something a feature can add to a roll — '
          + 'roll it alongside.'
      },
      {
        id: 'giant-killer',
        text: 'Giant Killer: when a Large or larger creature within 5 feet hits or '
          + 'misses you, use your reaction to attack it immediately.'
      },
      {
        id: 'horde-breaker',
        text: 'Horde Breaker: once on each of your turns, make another attack with '
          + 'the same weapon against a different creature within 5 feet of the '
          + 'original target and in range.'
      }
    ]
  },
  {
    level: 7, id: 'defensive-tactics', name: 'Defensive Tactics',
    options: [
      {
        id: 'escape-the-horde',
        text: 'Escape the Horde: opportunity attacks against you are made with '
          + 'disadvantage. The engine does not distinguish an opportunity attack '
          + 'from any other — tell the DM.'
      },
      {
        id: 'multiattack-defense',
        text: 'Multiattack Defense: when a creature hits you, you gain +4 AC '
          + 'against its later attacks for the rest of the turn.'
      },
      {
        id: 'steel-will',
        text: 'Steel Will: advantage on saving throws against being frightened. '
          + 'This one is applied — turn its toggle on once you have chosen it.'
      }
    ]
  },
  {
    level: 11, id: 'multiattack', name: 'Multiattack',
    options: [
      {
        id: 'volley',
        text: 'Volley: as an action, make a ranged attack against any number of '
          + 'creatures within 10 feet of a point you can see in range, one attack '
          + 'roll each.'
      },
      {
        id: 'whirlwind-attack',
        text: 'Whirlwind Attack: as an action, make a melee attack against any '
          + 'number of creatures within 5 feet of you, one attack roll each.'
      }
    ]
  },
  {
    level: 15, id: 'superior-defense', name: "Superior Hunter's Defense",
    options: [
      {
        id: 'evasion',
        text: 'Evasion: on a Dexterity save for half damage you take none on a '
          + 'success and half on a failure. The app does not halve incoming '
          + 'damage — tell the DM.'
      },
      {
        id: 'stand-against-the-tide',
        text: 'Stand Against the Tide: when a hostile creature misses you with a '
          + 'melee attack, use your reaction to force it to repeat the attack '
          + 'against another creature of your choice.'
      },
      {
        id: 'uncanny-dodge',
        text: 'Uncanny Dodge: halve the damage of one attack you can see hitting '
          + 'you, as a reaction.'
      }
    ]
  }
] as const

const HUNTER_FEATURES = HUNTER_CHOICES.map(
  ({ level, id: choiceId, name, options }): ClassFeatureDefinition => {
    const fid = `srd:subclass.hunter.${choiceId}`
    return {
      id: fid, name, provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
      effects: source({
        id: fid, name,
        completeness: 'partial',
        // Steel Will is the one option in all eleven that the vocabulary
        // reaches: advantage on saves against a named condition, which is the
        // halfling's Brave with frightened in place of frightened.
        modifiers: choiceId === 'defensive-tactics'
          ? [{
            id: id(), channel: 'roll', rollOp: 'advantage',
            scope: { kinds: ['save'], againstTags: ['frightened'] },
            condition: { playerToggle: 'ranger.steel-will' },
            permanence: 'persistent',
            note: 'Steel Will'
          }]
          : [],
        selections: [{
          id: choiceId, prompt: `Choose one ${name} option`,
          kind: 'other', count: 1, from: options.map((o) => o.id)
        }],
        narrative: options.map((o) => ({
          text: o.text,
          ...(o.id === 'steel-will' ? { toggleId: 'ranger.steel-will' } : {}),
          dmPromptable: true
        }))
      })
    }
  })

export const HUNTER: SubclassDefinition = {
  id: 'srd:subclass.hunter', name: 'Hunter',
  provenance: 'srd', contentVersion: 1,
  classId: RANGER_ID,
  features: HUNTER_FEATURES
}

/**
 * The columns nothing reads yet: the levels at which the ranger takes an
 * Ability Score Improvement, and the Spells Known column.
 *
 * Exported for the same reason MONK_TABLE and PALADIN_TABLE are — there is no
 * advancement flow to consume them.
 */
export const RANGER_TABLE = {
  asiLevels: RANGER_ASI_LEVELS,
  spellsKnown: RANGER_SPELLS_KNOWN,
  favoredEnemyLevels: FAVORED_ENEMY_LEVELS,
  favoredTerrainLevels: FAVORED_TERRAIN_LEVELS,
  fightingStyles: RANGER_STYLES,
  maxSpellLevel: HALF_CASTER_MAX_SPELL_LEVEL
}

export const RANGER_CLASSES: ClassDefinition[] = [RANGER]
export const RANGER_SUBCLASSES: SubclassDefinition[] = [HUNTER]
