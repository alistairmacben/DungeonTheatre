// Half-Orc Barbarian — the activated-state test.
//
// Rage is one switch driving five unrelated mechanics: a damage bonus, three
// damage resistances, advantage on two roll scopes, and the loss of two
// capabilities. Nothing here is a "rage system": the switch is an ordinary
// `playerToggle` predicate and each consequence is an ordinary modifier gated
// on it, so every one of them appears in the breakdown as applied-or-not with
// the same reason attached.
//
// Unarmoured Defense is the other reason this class was chosen. It is a `base`
// modifier on armorClass carrying a formula, which puts it in the same
// highest-wins contest as leather, half plate and chain mail without anyone
// teaching the resolver what a barbarian is.
//
// Levels 1-20 and the Path of the Berserker, checked against
// docs/srd-source/classes.pdf p8-10.

import type {
  ActionOption, ClassDefinition, EffectSource, ItemDefinition, Modifier,
  ClassFeatureDefinition, Predicate, ProficiencyGrant, SpeciesDefinition,
  SubclassDefinition
} from '../rules/types.js'
import {
  abilityMaxPath, abilityModifierPath, abilityScorePath, ARMOR_CLASS, ARMOR_DEX_CAP,
  DAMAGE_WEAPON, declareFeatureDc, declareResourceMax, HP_MAX,
  resistancePath, RESISTANCE_RESISTANT, speedPath
} from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `bb${++n}`

const BARB = 'srd:class.barbarian'

// ---------------------------------------------------------------------------
// The Barbarian table (SRD p8), transcribed
// ---------------------------------------------------------------------------

/**
 * Rages: 2 at 1st, 3 at 3rd, 4 at 6th, 5 at 12th, 6 at 17th.
 *
 * The 20th-level row reads "Unlimited", which a column of numbers cannot say.
 * It holds at 6 here and Primal Champion states the real answer, because a
 * resource maximum is a number and there is no value that means "no ceiling".
 */
const RAGES = [
  2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6
]

/** Rage Damage: +2, then +3 from 9th, +4 from 16th. */
const RAGE_DAMAGE = [
  2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4
]

/** Brutal Critical: one extra die at 9th, two at 13th, three at 17th. */
const BRUTAL_CRITICAL_DICE = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3
]

/** The barbarian takes the standard five Ability Score Improvements. */
const BARBARIAN_ASI_LEVELS = [4, 8, 12, 16, 19]

/** "Choose two from" — six skills, and the player picks which two. */
const BARBARIAN_SKILLS = [
  'animal-handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'
]

// The rage count is a derived stat like any other, so the player view can
// explain where "3 rages" came from instead of showing a stored number.
const RAGES_MAX = declareResourceMax('barbarianRages')

/** Intimidating Presence: 8 + proficiency bonus + Charisma modifier. */
const INTIMIDATING_PRESENCE_DC = declareFeatureDc('barbarian.intimidating-presence', 'cha')

function source(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'feature',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

const add = (target: string, value: Modifier['value'], extra: Partial<Modifier> = {}): Modifier =>
  ({ id: id(), channel: 'value', target, op: 'add', value, permanence: 'persistent', ...extra })

const setTo = (target: string, value: Modifier['value'], extra: Partial<Modifier> = {}): Modifier =>
  ({ id: id(), channel: 'value', target, op: 'set', value, permanence: 'persistent', ...extra })

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
// The player toggles this file relies on
// ---------------------------------------------------------------------------
//
// `wearing-armor` and `wearing-heavy-armor` already exist — the Defense
// fighting style and Heavy Armor Master use them — so the barbarian reuses them
// rather than inventing a parallel pair the player would have to keep in sync.
// Rage and Reckless Attack add one each of their own.

const RAGE_TOGGLE = 'barbarian.rage'
const RECKLESS_TOGGLE = 'barbarian.reckless-attack'

/**
 * Raging is a state, not an event.
 *
 * Both halves of the SRD's condition are here: the player has declared rage,
 * and they are not wearing heavy armour. Expressing the armour clause as a gate
 * on every rage benefit rather than as a check inside the rage action means a
 * barbarian who puts on chain mail mid-rage silently loses the benefits and the
 * breakdown says exactly why.
 */
const WHILE_RAGING: Predicate = {
  all: [
    { playerToggle: RAGE_TOGGLE },
    { not: { playerToggle: 'wearing-heavy-armor' } }
  ]
}

// ===========================================================================
// Species — Half-Orc
// ===========================================================================

export const HALF_ORC: SpeciesDefinition = {
  id: 'srd:species.half-orc', name: 'Half-Orc', provenance: 'srd', contentVersion: 1,
  size: 'medium', baseWalkSpeed: 30,
  effects: source({
    id: 'srd:species.half-orc', name: 'Half-Orc', kind: 'species',
    modifiers: [
      add(abilityScorePath('str'), 2),
      add(abilityScorePath('con'), 1),
      { id: id(), channel: 'value', target: speedPath('walk'), op: 'base', value: 30, permanence: 'persistent' }
    ],
    proficiencies: [prof({ kind: 'skill', id: 'intimidation' })],
    narrative: [
      {
        // Relentless Endurance intercepts damage after it has been applied,
        // which is a step the damage pipeline does not expose to content: there
        // is no vocabulary for "instead of dropping to 0, drop to 1". The
        // once-per-long-rest budget below is real and spendable, so the table
        // tracks the use even though the engine cannot perform the save.
        text: 'Relentless Endurance: when you are reduced to 0 hit points but '
          + 'not killed outright, you can drop to 1 hit point instead. Once per '
          + 'long rest — spend the use below and set your hit points to 1. '
          + 'Whether the blow killed you outright is the instant-death rule, '
          + 'which the table adjudicates.',
        dmPromptable: true
      },
      {
        // Savage Attacks adds to the *critical* damage specifically, and the
        // crit step takes its extra dice from the roll authority rather than
        // from any modifier — so there is nothing to attach this to.
        text: 'Savage Attacks: when you score a critical hit with a melee '
          + 'weapon attack, roll one of the weapon’s damage dice one additional '
          + 'time and add it to the extra critical damage.',
        dmPromptable: false
      },
      {
        text: 'Darkvision reaches 60 feet; you speak Common and Orc.',
        dmPromptable: false
      }
    ],
    resources: [{
      id: 'half-orc.relentless-endurance', name: 'Relentless Endurance',
      max: 1, refresh: { kind: 'longRest' }, display: 'uses', order: 20
    }],
    // Two of the three traits are mechanics the vocabulary cannot carry, so the
    // species says so rather than approximating them.
    completeness: 'partial'
  })
}

/**
 * Rage damage, as an elected option rather than a standing modifier.
 *
 * The SRD's bonus is automatic, and this is the one place the file cannot say
 * so. A value-channel modifier may not carry a RollScope — validateModifier
 * rejects it — so `+2 damage, melee weapon attacks using Strength only` has no
 * standing form: an unscoped `add` on damage.weapon would also feed a longbow.
 *
 * Declared exactly like Great Weapon Master's power attack, which is the shape
 * the attack resolver already reads, so the bonus lands in the damage breakdown
 * with its own line. `requirements` records that it is only available while
 * raging even though nothing evaluates an option's requirements yet.
 *
 * +2 is the Rage Damage column for levels 1-8, so it is a constant across every
 * level this file authors.
 */
const RAGE_DAMAGE_OPTION: ActionOption = {
  id: 'barbarian.rage.damage',
  // The label carries no number. It used to read "+2", which is the Rage
  // Damage column's first row and wrong for any barbarian past 8th level; the
  // amount now comes from the modifier, which the view resolves and shows.
  label: 'Rage damage (melee Strength attacks)',
  requirements: WHILE_RAGING,
  scope: { kinds: ['attack'] },
  modifiers: [{
    id: id(), channel: 'value', target: DAMAGE_WEAPON, op: 'add',
    value: { classLevelTable: { classId: BARB, values: RAGE_DAMAGE } },
    permanence: 'temporary', note: 'Rage damage'
  }]
}

// ===========================================================================
// Class — Barbarian, levels 1-5
// ===========================================================================

export const BARBARIAN: ClassDefinition = {
  id: 'srd:class.barbarian', name: 'Barbarian', provenance: 'srd', contentVersion: 1,
  hitDie: 12, savingThrowProficiencies: ['str', 'con'],
  subclassSlot: { grantedAtLevel: 3, options: ['srd:subclass.berserker'] },
  asiLevels: BARBARIAN_ASI_LEVELS,
  features: [
    {
      id: 'srd:class.barbarian.proficiencies', name: 'Barbarian Proficiencies',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.barbarian.proficiencies', name: 'Barbarian Proficiencies',
        modifiers: [
          add(HP_MAX, {
            sum: [
              12, { product: [7, { sum: [{ characterLevel: true }, -1] }] },
              { product: [{ stat: abilityModifierPath('con') }, { characterLevel: true }] }
            ]
          }, { note: 'd12 hit die: 7 per level after the first, +12 at 1st, + CON per level' })
        ],
        proficiencies: [
          prof({ kind: 'save', ability: 'str' }),
          prof({ kind: 'save', ability: 'con' }),
          prof({ kind: 'armor', category: 'light' }),
          prof({ kind: 'armor', category: 'medium' }),
          prof({ kind: 'armor', category: 'shield' }),
          // No heavy armour: the SRD grants light, medium and shields only,
          // which is what makes Rage's heavy-armour clause reachable at all —
          // it can only bite when another source grants heavy proficiency.
          prof({ kind: 'weaponCategory', category: 'simple' }),
          prof({ kind: 'weaponCategory', category: 'martial' }),
          // "Choose two from Animal Handling, Athletics, Intimidation, Nature,
          // Perception, Survival." Two of six, and which two is the player's.
          // This used to be Athletics and Intimidation for every barbarian who
          // would ever exist.
          chosenProf('skill', 'skills')
        ],
        selections: [{
          id: 'skills', prompt: 'Choose two barbarian skills', kind: 'skill', count: 2,
          from: BARBARIAN_SKILLS
        }]
      })
    },
    {
      id: 'srd:class.barbarian.unarmored-defense', name: 'Unarmored Defense',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.barbarian.unarmored-defense', name: 'Unarmored Defense',
        modifiers: [
          /**
           * "10 + your Dexterity modifier + your Constitution modifier."
           *
           * Only 10 + CON is declared here. The Dexterity term is already a
           * baseline `add` on armorClass, capped by armorDexCap — so writing it
           * again would double it. What is left is a `base`, and `base` is
           * highest-wins, which is precisely the comparison the SRD asks for:
           * a CON 16 barbarian's 13 loses to half plate's 15 and beats
           * leather's 11, with the loser shown in the breakdown as "lower base
           * than …" rather than vanishing.
           *
           * The gate is the SRD's "while you are wearing no armor". Without it
           * the base would still lose to good armour, but a high-CON barbarian
           * in half plate would win the base contest while the armour continued
           * to cap Dexterity at 2 — a state the rules never produce.
           */
          {
            id: id(), channel: 'value', target: ARMOR_CLASS, op: 'base',
            value: { sum: [10, { stat: abilityModifierPath('con') }] },
            condition: { not: { playerToggle: 'wearing-armor' } },
            permanence: 'persistent',
            note: '10 + Constitution while wearing no armour'
          }
        ],
        narrative: [{
          // The SRD calls the shield out explicitly, and it needs no rule here:
          // a shield contributes `add`, never `base`, so it stacks onto
          // whichever base won.
          text: 'You can use a shield and still gain this benefit. Turn off the '
            + '"wearing armour" toggle whenever you are unarmoured.',
          toggleId: 'wearing-armor', dmPromptable: false
        }]
      })
    },
    {
      id: 'srd:class.barbarian.rage', name: 'Rage',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: 'srd:class.barbarian.rage', name: 'Rage',
        modifiers: [
          // The Rages column of the class table, transcribed. The 20th-level
          // row reads "Unlimited", which a column of numbers cannot say — it
          // holds at 6 here, and Primal Champion below is where the real
          // answer belongs once resources can be uncapped.
          add(RAGES_MAX, { classLevelTable: { classId: BARB, values: RAGES } },
            { note: 'Rages column of the Barbarian table' }),

          // Advantage on Strength checks and Strength saving throws. Two
          // scopes, not one: a check and a save are different roll kinds even
          // when they name the same ability.
          {
            id: id(), channel: 'roll', rollOp: 'advantage',
            scope: { kinds: ['check'], abilities: ['str'] },
            condition: WHILE_RAGING, permanence: 'persistent',
            note: 'Rage: advantage on Strength checks'
          },
          {
            id: id(), channel: 'roll', rollOp: 'advantage',
            scope: { kinds: ['save'], abilities: ['str'] },
            condition: WHILE_RAGING, permanence: 'persistent',
            note: 'Rage: advantage on Strength saving throws'
          },

          // Resistance is a value on an ordinary path, so rage resistance and a
          // dwarf's poison resistance are the same kind of thing.
          ...(['bludgeoning', 'piercing', 'slashing'] as const).map((t) =>
            setTo(resistancePath(t), RESISTANCE_RESISTANT, {
              condition: WHILE_RAGING,
              note: `Rage: resistance to ${t} damage`
            })),

          // "You can't cast spells or concentrate on them while raging." A
          // prohibition, so it is a revoke — and because revoke beats grant,
          // a raging barbarian/wizard loses casting without either feature
          // knowing the other exists.
          {
            id: id(), channel: 'capability', capability: 'castSpells', capOp: 'revoke',
            condition: WHILE_RAGING, permanence: 'persistent',
            note: 'Rage: you cannot cast spells'
          },
          {
            id: id(), channel: 'capability', capability: 'concentrate', capOp: 'revoke',
            condition: WHILE_RAGING, permanence: 'persistent',
            note: 'Rage: you cannot concentrate on spells'
          }
        ],
        resources: [{
          id: 'barbarian.rages', name: 'Rages', max: RAGES_MAX,
          refresh: { kind: 'longRest' }, display: 'pips', order: 1
        }],
        actions: [
          {
            id: 'barbarian.rage.enter', name: 'Rage', kind: 'ability', cost: 'bonusAction',
            description: 'Enter a rage for 1 minute.',
            requirements: {
              all: [
                { resourceAtLeast: ['barbarian.rages', 1] },
                { not: { playerToggle: 'wearing-heavy-armor' } }
              ]
            },
            costs: { 'barbarian.rages': 1 }
          },
          {
            id: 'barbarian.rage.end', name: 'End Rage', kind: 'ability', cost: 'bonusAction',
            description: 'End your rage early.',
            requirements: { playerToggle: RAGE_TOGGLE }
          }
        ],
        options: [RAGE_DAMAGE_OPTION],
        narrative: [
          {
            text: 'Rage lasts 1 minute. It ends early if you are knocked '
              + 'unconscious, if you end your turn without having attacked a '
              + 'hostile creature since your last turn and without having taken '
              + 'damage since then, or if you end it as a bonus action. Whether '
              + 'that happened is a judgement about the fiction, so rage is a '
              + 'toggle the table turns off rather than a timer the engine runs.',
            toggleId: RAGE_TOGGLE, dmPromptable: true
          },
          {
            text: 'The rage damage bonus applies only to melee weapon attacks '
              + 'that use Strength. Elect "Rage damage" on the attack; it is '
              + 'not added to a ranged or Dexterity attack. It is +2, rising to '
              + '+3 at 9th level and +4 at 16th.',
            dmPromptable: false
          }
        ],
        // Two admissions. The duration and its early end are narrative by
        // design, but the damage bonus being *elected* rather than automatic is
        // a vocabulary gap: a value-channel modifier cannot carry a RollScope,
        // so there is no way to say "+2 to damage, but only on melee Strength
        // attacks" as a standing modifier.
        completeness: 'partial'
      })
    },
    {
      id: 'srd:class.barbarian.reckless-attack', name: 'Reckless Attack',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.barbarian.reckless-attack', name: 'Reckless Attack',
        modifiers: [
          // The two halves have different lifetimes in the SRD — the advantage
          // is "on this turn", the exposure is "until your next turn" — but
          // both are on while the declaration stands, so one toggle carries
          // both and no arithmetic drifts between them.
          {
            id: id(), channel: 'roll', rollOp: 'advantage',
            // Strength narrows it to the attacks the feature covers; the
            // within-5-feet activity tag, which resolveAttack supplies from the
            // range band, is the closest the scope vocabulary comes to "melee
            // weapon attack". A Strength thrown weapon used at 5 feet would
            // also match — the residue is small and is not silently hidden.
            scope: { kinds: ['attack'], abilities: ['str'], activityTags: ['within-5-feet'] },
            condition: { playerToggle: RECKLESS_TOGGLE }, permanence: 'persistent',
            note: 'Reckless Attack: advantage on melee Strength attacks'
          },
          {
            id: id(), channel: 'roll', rollOp: 'advantage',
            scope: { kinds: ['attack'] },
            // The price. It lives on the barbarian and is read by whoever
            // attacks them, which is why no attacker needs to know the feature
            // exists. Authored the way the SRD conditions author it — prone,
            // blinded, paralyzed and restrained all carry this exact shape — so
            // it stays correct when the roll resolver learns to skip
            // `attackersAgainstSelf` modifiers on the owner's own rolls.
            appliesTo: 'attackersAgainstSelf',
            condition: { playerToggle: RECKLESS_TOGGLE }, permanence: 'persistent',
            note: 'Reckless Attack: attacks against you have advantage'
          }
        ],
        actions: [{
          id: 'barbarian.reckless-attack.declare', name: 'Attack Recklessly',
          kind: 'ability', cost: 'free',
          description: 'Declared on your first attack of the turn: advantage on melee '
            + 'Strength attacks, and attacks against you have advantage until your next turn.',
          requirements: { always: true }
        }],
        narrative: [{
          text: 'Reckless Attack is declared on the first attack of your turn '
            + 'and lasts until the start of your next turn. Turn it off then.',
          toggleId: RECKLESS_TOGGLE, dmPromptable: false
        }]
      })
    },
    {
      id: 'srd:class.barbarian.danger-sense', name: 'Danger Sense',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: 'srd:class.barbarian.danger-sense', name: 'Danger Sense',
        modifiers: [{
          id: id(), channel: 'roll', rollOp: 'advantage',
          // "against effects that you can see" is `requiresSenses`, which the
          // caller declares on the roll — a save against a trap you never
          // noticed simply does not carry the sight tag and so does not match.
          scope: { kinds: ['save'], abilities: ['dex'], requiresSenses: ['sight'] },
          // "To gain this benefit you can't be blinded, deafened or
          // incapacitated" — three conditions, read directly, no new primitive.
          condition: {
            not: {
              any: [
                { hasCondition: 'srd:condition.blinded' },
                { hasCondition: 'srd:condition.deafened' },
                { hasCondition: 'srd:condition.incapacitated' }
              ]
            }
          },
          permanence: 'persistent',
          note: 'Danger Sense: advantage on Dexterity saves against effects you can see'
        }]
      })
    },
    {
      id: 'srd:class.barbarian.extra-attack', name: 'Extra Attack',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 5,
      effects: source({
        id: 'srd:class.barbarian.extra-attack', name: 'Extra Attack',
        narrative: [{
          // There is no stat for how many attacks the Attack action buys, so
          // there is nothing to add 1 to. Inventing a path here would put the
          // number somewhere the fighter, monk, paladin and ranger could not
          // reach it.
          text: 'You can attack twice, instead of once, whenever you take the '
            + 'Attack action on your turn. Roll the second attack from the same '
            + 'weapon entry.',
          dmPromptable: false
        }],
        completeness: 'partial'
      })
    },
    {
      id: 'srd:class.barbarian.fast-movement', name: 'Fast Movement',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 5,
      effects: source({
        id: 'srd:class.barbarian.fast-movement', name: 'Fast Movement',
        modifiers: [
          // Same heavy-armour gate as Rage, same toggle. Note this is an `add`
          // and not a `base`: it raises whatever speed the species established
          // rather than competing with it.
          add(speedPath('walk'), 10, {
            condition: { not: { playerToggle: 'wearing-heavy-armor' } },
            note: 'Fast Movement: +10 feet while not in heavy armour'
          })
        ]
      })
    },

    // --- 7th ---------------------------------------------------------------
    {
      id: 'srd:class.barbarian.feral-instinct', name: 'Feral Instinct',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 7,
      effects: source({
        id: 'srd:class.barbarian.feral-instinct', name: 'Feral Instinct',
        // Initiative is a roll kind, so the first half is an ordinary roll
        // modifier and needs nothing new. The second half - acting while
        // surprised, but only if you rage first - is about turn order, which
        // the app does not run.
        completeness: 'partial',
        modifiers: [{
          id: id(), channel: 'roll', rollOp: 'advantage',
          scope: { kinds: ['initiative'] }, permanence: 'persistent',
          note: 'Feral Instinct: advantage on initiative'
        }],
        narrative: [{
          text: 'If you are surprised at the start of combat and are not '
            + 'incapacitated, you may act normally on your first turn — but only '
            + 'if you enter your rage before doing anything else.',
          dmPromptable: true
        }]
      })
    },

    // --- 9th, 13th, 17th ---------------------------------------------------
    ...[9, 13, 17].map((level): ClassFeatureDefinition => {
      const dice = BRUTAL_CRITICAL_DICE[level - 1]!
      const fid = `srd:class.barbarian.brutal-critical-${level}`
      const name = `Brutal Critical (${dice} ${dice === 1 ? 'die' : 'dice'})`
      return {
        id: fid, name, provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
        effects: source({
          id: fid, name,
          // The same wall Sneak Attack and Divine Strike hit: there is no way
          // to say "add N dice to a damage roll", only to add a flat amount.
          // Three separate features rather than one that scales, so the sheet
          // names the number the table names.
          completeness: 'partial',
          narrative: [{
            text: `Roll ${dice} additional weapon damage ${dice === 1 ? 'die' : 'dice'} `
              + 'when determining the extra damage of a critical hit with a melee '
              + 'attack. The app doubles the weapon dice on a crit but does not add '
              + 'these — roll them alongside.',
            dmPromptable: true
          }]
        })
      }
    }),

    // --- 11th --------------------------------------------------------------
    {
      id: 'srd:class.barbarian.relentless-rage', name: 'Relentless Rage',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 11,
      effects: source({
        id: 'srd:class.barbarian.relentless-rage', name: 'Relentless Rage',
        // A save the character makes against a DC that climbs with each use
        // and resets on a rest. The DC is not a stat of the character - it is
        // state belonging to one feature between rests - and nothing in the
        // vocabulary holds that.
        completeness: 'partial',
        narrative: [{
          text: 'If you drop to 0 hit points while raging and do not die outright, '
            + 'make a DC 10 Constitution saving throw; on a success you drop to 1 '
            + 'hit point instead. Each use after the first raises the DC by 5, and '
            + 'the DC resets to 10 when you finish a short or long rest. Track the '
            + 'current DC at the table.',
          dmPromptable: true
        }]
      })
    },

    // --- 15th --------------------------------------------------------------
    {
      id: 'srd:class.barbarian.persistent-rage', name: 'Persistent Rage',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 15,
      effects: source({
        id: 'srd:class.barbarian.persistent-rage', name: 'Persistent Rage',
        // Rage's duration is already narrative - a toggle the table turns off
        // rather than a timer - so this removes two of the reasons to turn it
        // off rather than changing any number.
        narrative: [{
          text: 'Your rage now ends early only if you fall unconscious or choose '
            + 'to end it. Ending your turn without having attacked or taken damage '
            + 'no longer ends it.',
          dmPromptable: true
        }]
      })
    },

    // --- 18th --------------------------------------------------------------
    {
      id: 'srd:class.barbarian.indomitable-might', name: 'Indomitable Might',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 18,
      effects: source({
        id: 'srd:class.barbarian.indomitable-might', name: 'Indomitable Might',
        // `op: 'min'` puts a floor under a *stat*. This puts a floor under a
        // roll total, which includes the d20 - and no stat path holds a roll
        // total, by design.
        completeness: 'partial',
        narrative: [{
          text: 'If your total for a Strength check is less than your Strength '
            + 'score, you may use the score instead. Read the roll and take the '
            + 'higher of the two yourself.',
          dmPromptable: true
        }]
      })
    },

    // --- 20th --------------------------------------------------------------
    {
      id: 'srd:class.barbarian.primal-champion', name: 'Primal Champion',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 20,
      effects: source({
        id: 'srd:class.barbarian.primal-champion', name: 'Primal Champion',
        // All three halves are real. The +4s are ordinary adds and flow through
        // every derived stat that reads them - hit points, Athletics, Strength
        // saves, Unarmoured Defense - and the raised ceiling is a `set` on
        // ability.<a>.max, which the resolver already clamps scores against.
        // Without it the +4 would be swallowed by the default 20.
        //
        // What is left is the Rages column's 20th row, which reads
        // "Unlimited": a resource maximum is a number and there is no number
        // that means no ceiling.
        completeness: 'partial',
        modifiers: [
          add(abilityScorePath('str'), 4, { note: 'Primal Champion' }),
          add(abilityScorePath('con'), 4, { note: 'Primal Champion' }),
          setTo(abilityMaxPath('str'), 24, { note: 'Primal Champion raises the ceiling' }),
          setTo(abilityMaxPath('con'), 24, { note: 'Primal Champion raises the ceiling' })
        ],
        narrative: [{
          text: 'Your rages are now unlimited. The pip track still shows six, '
            + 'which is the 19th-level row — a resource maximum is a number and '
            + 'there is no number that means "no ceiling", so ignore the track '
            + 'from here.',
          dmPromptable: false
        }]
      })
    }
  ]
}

// ===========================================================================
// Subclass - Path of the Berserker (SRD p9-10)
// ===========================================================================

export const BERSERKER: SubclassDefinition = {
  id: 'srd:subclass.berserker', name: 'Path of the Berserker',
  provenance: 'srd', contentVersion: 1,
  classId: BARB,
  features: [
    {
      id: 'srd:subclass.berserker.frenzy', name: 'Frenzy',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 3,
      effects: source({
        id: 'srd:subclass.berserker.frenzy', name: 'Frenzy',
        actions: [{
          id: 'barbarian.frenzy.attack', name: 'Frenzy: Bonus Attack',
          kind: 'attack', cost: 'bonusAction',
          description: 'Make a single melee weapon attack as a bonus action on each of '
            + 'your turns while raging.',
          requirements: { playerToggle: RAGE_TOGGLE },
          targets: { selector: 'creature', count: 1, rangeFeet: 5 }
        }],
        narrative: [{
          // Exhaustion is character state with its own level counter, and no
          // modifier op writes to it. The cost is real, so it is stated rather
          // than dropped.
          text: 'When your rage ends after frenzying you suffer one level of '
            + 'exhaustion. Raise the exhaustion level by hand when the rage ends.',
          dmPromptable: true
        }],
        completeness: 'partial'
      })
    },
    {
      id: 'srd:subclass.berserker.mindless-rage', name: 'Mindless Rage',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 6,
      effects: source({
        id: 'srd:subclass.berserker.mindless-rage', name: 'Mindless Rage',
        // Suppression by source id, gated on raging. Every modifier the two
        // conditions apply stops applying and says why in the breakdown, which
        // is what "the effect is suspended for the duration" means. The
        // condition chip stays on the sheet - it is still there when the rage
        // ends - and that is the honest reading, not a gap.
        modifiers: [{
          id: id(), channel: 'value', op: 'suppress', permanence: 'persistent',
          suppresses: {
            sourceIds: ['srd:condition.charmed', 'srd:condition.frightened']
          },
          condition: WHILE_RAGING,
          note: 'Mindless Rage: charmed and frightened are suspended while you rage'
        }],
        narrative: [{
          text: 'You cannot be charmed or frightened while raging. If you are '
            + 'already charmed or frightened when you rage, the effect is '
            + 'suspended for the duration — the condition stays on your sheet but '
            + 'does nothing.',
          dmPromptable: false
        }]
      })
    },
    {
      id: 'srd:subclass.berserker.intimidating-presence', name: 'Intimidating Presence',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 10,
      effects: source({
        id: 'srd:subclass.berserker.intimidating-presence', name: 'Intimidating Presence',
        // The DC is wholly expressible - 8 + proficiency + Charisma is the same
        // formula the monk's Stunning Strike uses, so it is the same declared
        // stat and explains itself in a breakdown. What lands on the target is
        // not: the app has no other creature to frighten.
        completeness: 'partial',
        modifiers: [
          add(INTIMIDATING_PRESENCE_DC, 0)
        ],
        actions: [{
          id: 'barbarian.berserker.intimidating-presence',
          name: 'Intimidating Presence', kind: 'ability', cost: 'action',
          description: 'One creature within 30 feet that can see or hear you makes a '
            + 'Wisdom save or is frightened of you until the end of your next turn.',
          requirements: { always: true },
          targets: { selector: 'creature', count: 1, rangeFeet: 30 }
        }],
        narrative: [{
          text: 'The target makes a Wisdom saving throw against your Intimidating '
            + 'Presence DC. On subsequent turns you can spend your action to extend '
            + 'it. The effect ends if the creature ends its turn out of sight or '
            + 'more than 60 feet away, and a creature that succeeds is immune for '
            + '24 hours — all of which the DM tracks.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.berserker.retaliation', name: 'Retaliation',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 14,
      effects: source({
        id: 'srd:subclass.berserker.retaliation', name: 'Retaliation',
        actions: [{
          id: 'barbarian.berserker.retaliation', name: 'Retaliation',
          kind: 'attack', cost: 'reaction',
          description: 'When you take damage from a creature within 5 feet, make a '
            + 'melee weapon attack against it.',
          requirements: { always: true },
          targets: { selector: 'creature', count: 1, rangeFeet: 5 }
        }]
      })
    }
  ]
}

// ===========================================================================
// Kit — the handaxe already exists in srd.ts; the greataxe and javelin do not
// ===========================================================================

export const GREATAXE: ItemDefinition = {
  id: 'srd:weapon.greataxe', name: 'Greataxe',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'common', slot: 'mainHand',
  weapon: {
    category: 'martial', reach: 'melee', damage: { count: 1, sides: 12 },
    damageType: 'slashing', properties: ['heavy', 'two-handed']
  },
  effects: source({ id: 'srd:weapon.greataxe', name: 'Greataxe', kind: 'item' })
}

export const JAVELIN: ItemDefinition = {
  id: 'srd:weapon.javelin', name: 'Javelin',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'common', slot: 'mainHand',
  weapon: {
    category: 'simple', reach: 'melee', damage: { count: 1, sides: 6 },
    damageType: 'piercing', properties: ['thrown'],
    normalRangeFeet: 30, longRangeFeet: 120
  },
  effects: source({ id: 'srd:weapon.javelin', name: 'Javelin', kind: 'item' })
}

/**
 * Hide armour: the medium armour a barbarian is proficient with and the one
 * that makes the Unarmoured Defense contest interesting. Base 12 with a Dex cap
 * of 2 loses to Unarmoured Defense from Constitution 15 upward, which is the
 * comparison every barbarian player makes at character creation.
 */
export const HIDE_ARMOR: ItemDefinition = {
  id: 'srd:armor.hide', name: 'Hide Armor',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'armor', rarity: 'common', slot: 'armor',
  armor: { category: 'medium', baseAc: 12, dexCap: 2 },
  effects: source({
    id: 'srd:armor.hide', name: 'Hide Armor', kind: 'item',
    modifiers: [
      { id: id(), channel: 'value', target: ARMOR_CLASS, op: 'base', value: 12, permanence: 'persistent' },
      setTo(ARMOR_DEX_CAP, 2, { note: 'medium armour Dex cap' })
    ]
  })
}

/**
 * The columns nothing reads yet: the levels at which the barbarian takes an
 * Ability Score Improvement, and the Brutal Critical dice.
 *
 * Exported rather than left as prose in a comment, for the same reason
 * MONK_TABLE and ROGUE_TABLE are - there is no advancement flow to consume the
 * ASI levels, and no way to add dice to a damage roll already made.
 */
export const BARBARIAN_TABLE = {
  asiLevels: BARBARIAN_ASI_LEVELS,
  rages: RAGES,
  rageDamage: RAGE_DAMAGE,
  brutalCriticalDice: BRUTAL_CRITICAL_DICE
}

export const BARBARIAN_SUBCLASSES: SubclassDefinition[] = [BERSERKER]
export const BARBARIAN_SPECIES: SpeciesDefinition[] = [HALF_ORC]
export const BARBARIAN_CLASSES: ClassDefinition[] = [BARBARIAN]
export const BARBARIAN_ITEMS: ItemDefinition[] = [GREATAXE, JAVELIN, HIDE_ARMOR]
