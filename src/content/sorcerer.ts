// Sorcerer, levels 1 to 20, and the Draconic Bloodline.
//
// It lived in classes-extra.ts, stopped at 2nd level's Font of Magic, had no
// Metamagic, no Sorcerous Restoration and no subclass slot — and, until the
// paladin turned it up, no spell save DC or attack bonus at all. A 5th-level
// sorcerer's DC was 0, which nothing noticed because the spell panel was
// withheld whenever the Spells Known selections were unanswered.
//
// The SRD does ship a Sorcerous Origin. An earlier note in this project said
// it did not; the Draconic Bloodline is on p44-45 and is authored here.
//
// Draconic Resilience is the interesting one: it is the third `base` modifier
// on armorClass in the content set, after the barbarian's and the monk's, and
// it competes in the same highest-wins contest as leather and half plate
// without the resolver knowing what a sorcerer is.
//
// Checked against docs/srd-source/classes.pdf p42-45.

import type {
  ClassDefinition, ClassFeatureDefinition, EffectSource, ItemDefinition,
  Modifier, ProficiencyGrant, SelectionDefinition, SubclassDefinition
} from '../rules/types.js'
import {
  abilityModifierPath, ARMOR_CLASS, declareResourceMax, HP_MAX,
  PROFICIENCY_BONUS, SPELL_ATTACK, SPELL_SAVE_DC, speedPath
} from '../rules/statPaths.js'
import { fullCasterSlots, ordinal } from './progression.js'

const SORCERER_ID = 'srd:class.sorcerer'
const V = '2014'

let n = 0
const id = (): string => `sc${++n}`

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
 * A proficiency the player picks. `expandSelections` turns one authored grant
 * into as many held proficiencies as the answer names.
 */
const chosenProf = (kind: 'skill' | 'tool', selectionId: string): ProficiencyGrant => ({
  id: id(),
  category: { kind, selection: selectionId } as never,
  level: 'proficient', rounding: 'floor', grantsProficiency: true
})

// ---------------------------------------------------------------------------
// The Sorcerer table (SRD p42), transcribed
// ---------------------------------------------------------------------------

const SORCERER_SLOTS = fullCasterSlots(SORCERER_ID, 'sorcerer')

/**
 * Cantrips Known and Spells Known.
 *
 * Neither column is a formula — cantrips sit at 4 for three levels, jump to 5,
 * hold six levels, then settle at 6; spells known climbs by exactly one most
 * levels but flatlines at 12, 14, 16, 18, 19 and 20. A table is the only
 * honest way to say that.
 */
const SORCERER_CANTRIPS_KNOWN = [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]
const SORCERER_SPELLS_KNOWN = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15]

/** Sorcery Points: none at 1st, then equal to sorcerer level. */
const SORCERY_POINTS = [
  0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
]

/** Metamagic options known: two at 3rd, a third at 10th, a fourth at 17th. */
const METAMAGIC_KNOWN = [
  0, 0, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4
]

/** The sorcerer takes the standard five Ability Score Improvements. */
const SORCERER_ASI_LEVELS = [4, 8, 12, 16, 19]

/** "Choose two from" — six skills, and the player picks which two. */
const SORCERER_SKILLS = [
  'arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'
]

/** The eight Metamagic options, and what each costs. */
const METAMAGIC_OPTIONS = [
  { id: 'careful', name: 'Careful Spell', cost: '1 sorcery point' },
  { id: 'distant', name: 'Distant Spell', cost: '1 sorcery point' },
  { id: 'empowered', name: 'Empowered Spell', cost: '1 sorcery point' },
  { id: 'extended', name: 'Extended Spell', cost: '1 sorcery point' },
  { id: 'heightened', name: 'Heightened Spell', cost: '3 sorcery points' },
  { id: 'quickened', name: 'Quickened Spell', cost: '2 sorcery points' },
  { id: 'subtle', name: 'Subtle Spell', cost: '1 sorcery point' },
  { id: 'twinned', name: 'Twinned Spell', cost: "the spell's level in sorcery points" }
] as const

/**
 * The Creating Spell Slots table (SRD p43). Not a formula — the cost jumps by
 * two between 2nd and 3rd level and by one everywhere else.
 */
const SLOT_CREATION_COST: Record<number, number> = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 }

/**
 * The sorcerer's cantrip and spell candidates.
 *
 * Genuinely on the SRD sorcerer list (docs/srd/08-spell-lists.md) and already
 * in the content set — nothing here is invented to fill the pool. Short for
 * the same reason the bard's is short: it grows the moment more spells carry
 * `srd:list.sorcerer`.
 */
const SORCERER_CANTRIP_POOL = [
  'srd:spell.fire-bolt', 'srd:spell.ray-of-frost', 'srd:spell.prestidigitation',
  'srd:spell.chill-touch', 'srd:spell.poison-spray', 'srd:spell.acid-splash',
  'srd:spell.dancing-lights', 'srd:spell.light', 'srd:spell.mage-hand',
  'srd:spell.mending', 'srd:spell.message', 'srd:spell.minor-illusion',
  'srd:spell.shocking-grasp', 'srd:spell.true-strike'
]
const SORCERER_SPELL_POOL = [
  'srd:spell.magic-missile', 'srd:spell.mage-armor', 'srd:spell.shield',
  'srd:spell.detect-magic', 'srd:spell.charm-person', 'srd:spell.burning-hands',
  'srd:spell.color-spray', 'srd:spell.comprehend-languages', 'srd:spell.disguise-self',
  'srd:spell.expeditious-retreat', 'srd:spell.false-life', 'srd:spell.feather-fall',
  'srd:spell.fog-cloud', 'srd:spell.jump', 'srd:spell.silent-image',
  'srd:spell.sleep', 'srd:spell.thunderwave'
]

const SORCERY_POINTS_MAX = declareResourceMax('sorceryPoints')

// ---------------------------------------------------------------------------
// Generated level-up features
// ---------------------------------------------------------------------------

/**
 * One level's worth of the Cantrips/Spells Known columns, as the increase over
 * the level before. Six levels in twenty add no new spell at all, and a
 * selection asking for zero of anything is not a choice — the integrity check
 * rejects one, correctly, so this never builds one.
 */
function sorcererKnownAtLevel(
  level: number, cantrips: number, spells: number
): ClassFeatureDefinition | undefined {
  if (cantrips === 0 && spells === 0) return undefined

  const fid = `srd:class.sorcerer.known-${level}`
  const selections: SelectionDefinition[] = []
  const grants: EffectSource['spells'] = []

  if (cantrips > 0) {
    selections.push({
      id: 'cantrips', prompt: `Learn ${cantrips} more sorcerer cantrip${cantrips === 1 ? '' : 's'}`,
      kind: 'spellList', count: cantrips, from: SORCERER_CANTRIP_POOL
    })
    grants.push({ selectionId: 'cantrips', availability: 'always', ability: 'cha' })
  }

  if (spells > 0) {
    selections.push({
      id: 'spells', prompt: `Learn ${spells} more sorcerer spell${spells === 1 ? '' : 's'}`,
      kind: 'spellList', count: spells, from: SORCERER_SPELL_POOL
    })
    // 'always', not 'prepared': a sorcerer knows a fixed repertoire and casts
    // any of it at will, spending only the slot — there is no daily choice of
    // which known spells are active the way a cleric or wizard has.
    grants.push({
      selectionId: 'spells', availability: 'always', slotGroup: 'sorcerer', ability: 'cha'
    })
  }

  return {
    id: fid, name: `Spells Known (level ${level})`,
    provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
    effects: source({ id: fid, name: `Spells Known (level ${level})`, selections, spells: grants })
  }
}

const SORCERER_KNOWN_FEATURES = SORCERER_CANTRIPS_KNOWN
  .map((cantrips, i) => {
    const level = i + 1
    const spells = SORCERER_SPELLS_KNOWN[i]! - (SORCERER_SPELLS_KNOWN[i - 1] ?? 0)
    const cantripDelta = level === 1 ? cantrips : cantrips - SORCERER_CANTRIPS_KNOWN[i - 1]!
    return sorcererKnownAtLevel(level, cantripDelta, spells)
  })
  .filter((f): f is ClassFeatureDefinition => f !== undefined)

/**
 * Metamagic, at 3rd, 10th and 17th.
 *
 * Every one of the eight options changes how a spell is cast — its range, its
 * duration, its components, how many creatures it hits, whose save has
 * disadvantage — and none of those is a stat the resolver holds. The choice is
 * recorded and the cost is stated; the effect is the table's.
 */
const METAMAGIC_FEATURES = METAMAGIC_KNOWN
  .map((known, i): ClassFeatureDefinition | undefined => {
    const level = i + 1
    const delta = known - (METAMAGIC_KNOWN[i - 1] ?? 0)
    if (delta <= 0) return undefined
    const fid = `srd:class.sorcerer.metamagic.${level}`
    const name = level === 3 ? 'Metamagic' : `Metamagic (level ${level})`
    return {
      id: fid, name, provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
      effects: source({
        id: fid, name,
        completeness: 'partial',
        selections: [{
          id: 'metamagic',
          prompt: `Choose ${delta} Metamagic option${delta === 1 ? '' : 's'}`,
          kind: 'other', count: delta, from: METAMAGIC_OPTIONS.map((o) => o.id)
        }],
        narrative: [{
          text: METAMAGIC_OPTIONS.map((o) => `${o.name} (${o.cost})`).join('; ')
            + '. Spend the points from your sorcery point track and apply the '
            + 'effect at the table — every one of these changes how a spell is '
            + 'cast rather than any number on your sheet. Only one Metamagic '
            + 'option per casting, except Empowered Spell.',
          dmPromptable: true
        }]
      })
    }
  })
  .filter((f): f is ClassFeatureDefinition => f !== undefined)

// ===========================================================================
// Class — Sorcerer
// ===========================================================================

export const SORCERER: ClassDefinition = {
  id: SORCERER_ID, name: 'Sorcerer', provenance: 'srd', contentVersion: 1,
  hitDie: 6, savingThrowProficiencies: ['con', 'cha'],
  subclassSlot: { grantedAtLevel: 1, options: ['srd:subclass.draconic-bloodline'] },
  features: [
    {
      id: 'srd:class.sorcerer.spellcasting', name: 'Spellcasting',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.sorcerer.spellcasting', name: 'Spellcasting',
        modifiers: [
          add(HP_MAX, {
            sum: [
              6, { product: [4, { sum: [{ characterLevel: true }, -1] }] },
              { product: [{ stat: abilityModifierPath('con') }, { characterLevel: true }] }
            ]
          }, { note: 'd6 hit die: 4 per level after the first, +6 at 1st, + CON per level' }),
          // The same three modifiers every other caster's DC is built from,
          // with Charisma. They were missing entirely until the paladin's
          // arrival made the empty spell panel visible.
          { id: id(), channel: 'value', target: SPELL_SAVE_DC, op: 'base', value: 8, permanence: 'persistent' },
          add(SPELL_SAVE_DC, { stat: PROFICIENCY_BONUS }),
          add(SPELL_SAVE_DC, { stat: abilityModifierPath('cha') }, { note: 'Charisma' }),
          add(SPELL_ATTACK, { stat: PROFICIENCY_BONUS }),
          add(SPELL_ATTACK, { stat: abilityModifierPath('cha') }, { note: 'Charisma' }),
          // Granting this capability is what satisfies "the ability to cast at
          // least one spell" for Elemental Adept, Spell Sniper and War Caster —
          // the same predicate, no class check.
          {
            id: id(), channel: 'capability', capability: 'castSpells',
            capOp: 'grant', permanence: 'persistent'
          },
          ...SORCERER_SLOTS.modifiers
        ],
        proficiencies: [
          prof({ kind: 'save', ability: 'con' }),
          prof({ kind: 'save', ability: 'cha' }),
          // "Daggers, darts, slings, quarterstaffs, light crossbows" — a list,
          // not a category. `weaponCategory: 'simple'` was here and handed the
          // sorcerer eleven weapons the SRD does not give it, the same mistake
          // the druid's list was written to avoid.
          prof({ kind: 'weapon', itemId: 'srd:weapon.dagger' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.dart' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.sling' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.quarterstaff' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.light-crossbow' }),
          // No armour at all: the sorcerer is the only class in the SRD with
          // none, which is what makes Draconic Resilience's unarmoured AC
          // worth having.
          chosenProf('skill', 'skills')
        ],
        selections: [{
          id: 'skills', prompt: 'Choose two sorcerer skills', kind: 'skill', count: 2,
          from: SORCERER_SKILLS
        }],
        resources: SORCERER_SLOTS.resources
      })
    },
    ...SORCERER_KNOWN_FEATURES,
    {
      id: 'srd:class.sorcerer.font-of-magic', name: 'Font of Magic',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.sorcerer.font-of-magic', name: 'Font of Magic',
        // The points are exact. Both halves of Flexible Casting are not:
        // `costs` says what an action spends and never what it gives back, so
        // neither creating a slot nor converting one can be completed by the
        // engine. The same wall Arcane Recovery, Natural Recovery and Eldritch
        // Master are behind.
        completeness: 'partial',
        modifiers: [
          add(SORCERY_POINTS_MAX,
            { classLevelTable: { classId: SORCERER_ID, values: SORCERY_POINTS } },
            { note: 'Sorcery Points column of the Sorcerer table' })
        ],
        resources: [{
          id: 'sorcerer.sorceryPoints', name: 'Sorcery Points',
          max: SORCERY_POINTS_MAX,
          refresh: { kind: 'longRest' }, display: 'pips', order: 10
        }],
        actions: [
          {
            id: 'sorcerer.create-slot', name: 'Create Spell Slot', kind: 'ability',
            description: 'Spend sorcery points to gain a spell slot: 2 for a 1st-level '
              + 'slot, 3 for a 2nd, 5 for a 3rd, 6 for a 4th, 7 for a 5th.',
            cost: 'bonusAction',
            requirements: { resourceAtLeast: ['sorcerer.sorceryPoints', 2] },
            // The cheapest slot's cost. Spending more for a higher slot is the
            // player's to deduct, because an action's cost is a fixed number.
            costs: { 'sorcerer.sorceryPoints': 2 },
            parameters: ['slotLevel']
          },
          {
            id: 'sorcerer.convert-slot', name: 'Convert a Slot to Sorcery Points',
            kind: 'ability', cost: 'bonusAction',
            description: 'Expend one spell slot to gain sorcery points equal to its level.',
            requirements: { always: true }
          }
        ],
        narrative: [{
          text: 'Creating a slot costs '
            + Object.entries(SLOT_CREATION_COST)
              .map(([lvl, cost]) => `${cost} for ${ordinal(Number(lvl))}`).join(', ')
            + ' — the button deducts 2, so deduct the rest by hand, and add the '
            + 'slot to your track yourself. Converting a slot works the same way '
            + 'in reverse. Slots you create vanish on a long rest, and you can '
            + 'never hold more points than your level.',
          dmPromptable: true
        }]
      })
    },
    ...METAMAGIC_FEATURES,

    // --- 20th ----------------------------------------------------------------
    {
      id: 'srd:class.sorcerer.sorcerous-restoration', name: 'Sorcerous Restoration',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 20,
      effects: source({
        id: 'srd:class.sorcerer.sorcerous-restoration', name: 'Sorcerous Restoration',
        // "Regain 4 sorcery points on a short rest" is a partial refresh, and
        // `refresh` is all-or-nothing: a resource comes back in full on its
        // rest or not at all. Changing the pool's refresh to `shortRest` would
        // hand a 20th-level sorcerer twenty points per short rest.
        completeness: 'partial',
        narrative: [{
          text: 'You regain 4 expended sorcery points whenever you finish a short '
            + 'rest. A resource refreshes in full or not at all here, so add the '
            + 'four back by hand — a short rest will not do it for you.',
          dmPromptable: true
        }]
      })
    }
  ]
}

// ===========================================================================
// Subclass — Draconic Bloodline (SRD p44-45)
// ===========================================================================

/** The Draconic Ancestry table: ten dragons, five damage types. */
const DRACONIC_ANCESTRY: Record<string, string> = {
  black: 'acid', blue: 'lightning', brass: 'fire', bronze: 'lightning',
  copper: 'acid', gold: 'fire', green: 'poison', red: 'fire',
  silver: 'cold', white: 'cold'
}

export const DRACONIC_BLOODLINE: SubclassDefinition = {
  id: 'srd:subclass.draconic-bloodline', name: 'Draconic Bloodline',
  provenance: 'srd', contentVersion: 1,
  classId: SORCERER_ID,
  features: [
    {
      id: 'srd:subclass.draconic-bloodline.dragon-ancestor', name: 'Dragon Ancestor',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:subclass.draconic-bloodline.dragon-ancestor', name: 'Dragon Ancestor',
        // The doubled proficiency on Charisma checks with dragons is wholly
        // expressible: `{ kind: 'abilityCheck', ability: 'cha' }` at expertise
        // level is the same grant the bard's Jack of All Trades uses at half,
        // and the highest-multiplier-wins rule does the rest. The toggle is
        // "am I talking to a dragon", which nothing else can know.
        //
        // What is not expressible is the ancestry's consequence: the damage
        // type feeds Elemental Affinity below, and no Predicate reads a
        // selection's answer.
        completeness: 'partial',
        proficiencies: [{
          id: id(),
          category: { kind: 'abilityCheck', ability: 'cha' } as never,
          level: 'expertise', rounding: 'floor', grantsProficiency: true,
          // Gated on the toggle, and the gate is the point: without it every
          // Charisma check a sorcerer ever made would carry double proficiency.
          // A ProficiencyGrant takes a Predicate like a modifier does.
          condition: { playerToggle: 'sorcerer.dragon-ancestor' }
        }],
        selections: [{
          id: 'ancestry', prompt: 'Choose your dragon ancestor', kind: 'other',
          count: 1, from: Object.keys(DRACONIC_ANCESTRY)
        }],
        narrative: [
          {
            text: 'Turn this on while you are interacting with a dragon: your '
              + 'proficiency bonus is doubled on Charisma checks against it.',
            toggleId: 'sorcerer.dragon-ancestor', dmPromptable: true
          },
          {
            text: 'Your ancestor sets the damage type your later features use: '
              + Object.entries(DRACONIC_ANCESTRY)
                .map(([dragon, type]) => `${dragon} → ${type}`).join(', ')
              + '. You also speak, read and write Draconic.',
            dmPromptable: false
          }
        ]
      })
    },
    {
      id: 'srd:subclass.draconic-bloodline.draconic-resilience', name: 'Draconic Resilience',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:subclass.draconic-bloodline.draconic-resilience', name: 'Draconic Resilience',
        // Both halves are exact, and the second is the third `base` modifier on
        // armorClass in the content set — after the barbarian's 10 + CON and
        // the monk's 10 + WIS. It joins the same highest-wins contest as
        // leather and half plate with the resolver knowing nothing about
        // dragons: 13 + DEX beats leather's 11 + DEX and loses to half plate.
        //
        // Only the 13 is declared. The Dexterity term is already a baseline
        // `add` capped by armorDexCap, so writing it again would double it.
        modifiers: [
          add(HP_MAX, { classLevel: SORCERER_ID },
            { note: 'Draconic Resilience: +1 hit point per sorcerer level' }),
          {
            id: id(), channel: 'value', target: ARMOR_CLASS, op: 'base', value: 13,
            condition: { not: { playerToggle: 'wearing-armor' } },
            permanence: 'persistent',
            note: '13 + Dexterity while wearing no armour'
          }
        ]
      })
    },
    {
      id: 'srd:subclass.draconic-bloodline.elemental-affinity', name: 'Elemental Affinity',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 6,
      effects: source({
        id: 'srd:subclass.draconic-bloodline.elemental-affinity', name: 'Elemental Affinity',
        // Both halves depend on the ancestry chosen above, and no Predicate
        // reads a selection's answer — the same wall the warlock's Pact Boon
        // and the Fiend's Fiendish Resilience are behind. Authoring ten gated
        // pairs of modifiers, one per dragon, would be worse than saying so.
        completeness: 'partial',
        narrative: [{
          text: 'When you cast a spell dealing your ancestry\'s damage type, add '
            + 'your Charisma modifier to one of its damage rolls. At the same '
            + 'time you may spend 1 sorcery point to gain resistance to that '
            + 'damage type for an hour. Both depend on the dragon you chose, '
            + 'which the engine cannot yet read back — apply them yourself.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.draconic-bloodline.dragon-wings', name: 'Dragon Wings',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 14,
      effects: source({
        id: 'srd:subclass.draconic-bloodline.dragon-wings', name: 'Dragon Wings',
        // "A flying speed equal to your current speed" is a stat reading
        // another stat, which the value language does exactly. Behind a toggle
        // because the wings are summoned and dismissed, and gated on being
        // unarmoured because the SRD gates it there.
        modifiers: [{
          id: id(), channel: 'value', target: speedPath('fly'), op: 'base',
          value: { stat: speedPath('walk') },
          condition: {
            all: [
              { playerToggle: 'sorcerer.dragon-wings' },
              { not: { playerToggle: 'wearing-armor' } }
            ]
          },
          permanence: 'persistent',
          note: 'Dragon Wings: fly at your walking speed'
        }],
        actions: [
          {
            id: 'sorcerer.dragon-wings.manifest', name: 'Manifest Dragon Wings',
            kind: 'ability', cost: 'bonusAction',
            description: 'Sprout wings and gain a flying speed equal to your speed.',
            requirements: { always: true }
          },
          {
            id: 'sorcerer.dragon-wings.dismiss', name: 'Dismiss Dragon Wings',
            kind: 'ability', cost: 'bonusAction',
            description: 'Put the wings away.',
            requirements: { playerToggle: 'sorcerer.dragon-wings' }
          }
        ],
        narrative: [{
          text: 'Turn this on while your wings are out. You cannot manifest them '
            + 'in armour unless it is made to accommodate them, so the toggle '
            + 'does nothing while you are wearing armour.',
          toggleId: 'sorcerer.dragon-wings', dmPromptable: false
        }]
      })
    },
    {
      id: 'srd:subclass.draconic-bloodline.draconic-presence', name: 'Draconic Presence',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 18,
      effects: source({
        id: 'srd:subclass.draconic-bloodline.draconic-presence', name: 'Draconic Presence',
        // The cost is exact and the aura is not: everything it does happens to
        // hostile creatures, and the save is against the sorcerer's own spell
        // save DC, which is already on the sheet.
        completeness: 'partial',
        actions: [{
          id: 'sorcerer.draconic-presence', name: 'Draconic Presence',
          kind: 'ability', cost: 'action',
          description: 'Spend 5 sorcery points to exude an aura of awe or fear to 60 feet '
            + 'for 1 minute.',
          requirements: { resourceAtLeast: ['sorcerer.sorceryPoints', 5] },
          costs: { 'sorcerer.sorceryPoints': 5 }
        }],
        narrative: [{
          text: 'Choose awe or fear. Each hostile creature starting its turn in '
            + 'the aura makes a Wisdom saving throw against your spell save DC '
            + 'or is charmed (awe) or frightened (fear) until the aura ends. It '
            + 'lasts a minute or until you lose concentration, and a creature '
            + 'that succeeds is immune for 24 hours. The DM runs it.',
          dmPromptable: true
        }]
      })
    }
  ]
}

// ===========================================================================
// Kit — the light crossbow, which the sorcerer and warlock both start with
// ===========================================================================

export const LIGHT_CROSSBOW: ItemDefinition = {
  id: 'srd:weapon.light-crossbow', name: 'Light Crossbow',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'common', slot: 'mainHand', costCp: 2500, weight: 5,
  weapon: {
    category: 'simple', reach: 'ranged', damage: { count: 1, sides: 8 },
    damageType: 'piercing', properties: ['ammunition', 'loading', 'two-handed'],
    normalRangeFeet: 80, longRangeFeet: 320
  },
  effects: source({ id: 'srd:weapon.light-crossbow', name: 'Light Crossbow', kind: 'item' })
}

/**
 * The columns nothing reads yet: the levels at which the sorcerer takes an
 * Ability Score Improvement, the Metamagic Known column, and the cost of
 * creating a spell slot.
 *
 * Exported for the same reason MONK_TABLE and BARBARIAN_TABLE are — there is
 * no advancement flow to consume the ASI levels, nothing counts how many
 * Metamagic options a sorcerer is holding, and no action can hand back a
 * resource.
 */
export const SORCERER_TABLE = {
  asiLevels: SORCERER_ASI_LEVELS,
  sorceryPoints: SORCERY_POINTS,
  cantripsKnown: SORCERER_CANTRIPS_KNOWN,
  spellsKnown: SORCERER_SPELLS_KNOWN,
  metamagicKnown: METAMAGIC_KNOWN,
  metamagicOptions: METAMAGIC_OPTIONS,
  slotCreationCost: SLOT_CREATION_COST,
  draconicAncestry: DRACONIC_ANCESTRY
}

export const SORCERER_CLASSES: ClassDefinition[] = [SORCERER]
export const SORCERER_SUBCLASSES: SubclassDefinition[] = [DRACONIC_BLOODLINE]
export const SORCERER_ITEMS: ItemDefinition[] = [LIGHT_CROSSBOW]
