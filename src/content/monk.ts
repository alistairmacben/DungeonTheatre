// Monk, levels 1 to 20 — and the reference for every class file after it.
//
// THIS FILE IS THE PATTERN. Eleven more classes get authored against it, so
// what it does here is what they should do, and what it refuses to do here is
// what they should refuse to do.
//
// The five things it is demonstrating:
//
//  1. EVERY LEVEL, 1 TO 20. Features are declared at the level the table says,
//     whether or not anything can reach that level yet. `grantedAtLevel` is
//     already read by the resolver, so a 14th-level feature works the moment a
//     14th-level character exists.
//
//  2. TABLES ARE TRANSCRIBED, NOT DERIVED. The Ki Points and Unarmored
//     Movement columns are copied from the page as columns. Nobody should be
//     reverse-engineering a formula out of "+10, +15, +20, +25, +30" — see
//     progression.ts on why.
//
//  3. THE VOCABULARY IS NEVER INVENTED. Where an existing modifier, resource
//     or proficiency grant expresses the rule, it is used. Where none does,
//     the feature is marked `completeness: 'partial'` and says in narrative
//     exactly what a human has to adjudicate. It is never quietly approximated
//     into something that resolves to a plausible wrong number.
//
//  4. THE SOURCE IS CITED AND CHECKED. Everything below was read out of
//     docs/srd-source/classes.pdf (SRD pages 26-29), not recalled. Where the
//     monk's version of a rule differs from another class's — its Unarmored
//     Defense forbids a shield where the barbarian's permits one — the
//     difference is called out rather than copied across.
//
//  5. PARTIAL IS A FIRST-CLASS OUTCOME. Nine of the monk's features cannot be
//     fully expressed today. That is a fact about the vocabulary, and burying
//     it would make the sheet lie. Each one degrades to something visible.

import type {
  ClassDefinition, EffectSource, Modifier, Predicate, ProficiencyGrant, SubclassDefinition
} from '../rules/types.js'
import {
  abilityModifierPath, ARMOR_CLASS, declareFeatureDc, declareResourceMax,
  HP_MAX, resistanceBypassPath, resistancePath, RESISTANCE_IMMUNE, speedPath
} from '../rules/statPaths.js'

const MONK = 'srd:class.monk'
const V = '2014'
let n = 0
const id = (): string => `mk${++n}`

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

// ---------------------------------------------------------------------------
// Stats this class introduces
// ---------------------------------------------------------------------------

const KI_MAX = declareResourceMax('monk.ki')

/** "Ki save DC = 8 + your proficiency bonus + your Wisdom modifier." */
const KI_SAVE_DC = declareFeatureDc('monk.ki', 'wis')

/** Way of the Open Hand's once-a-long-rest self-heal. */
const WHOLENESS_MAX = declareResourceMax('monk.wholeness-of-body')

// ---------------------------------------------------------------------------
// The Monk table (SRD p26), transcribed
// ---------------------------------------------------------------------------

/**
 * Ki Points. The column prints "—" at 1st level, which is 0 — the monk has no
 * ki at all until 2nd — and equals the monk's level from there on. Written out
 * rather than as `{ classLevel }` with a gate, because the column is the
 * source of truth and a reader should be able to check it against the page
 * without also having to reason about a predicate.
 */
const KI_POINTS = [
  0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
]

/** Unarmored Movement, in feet. "—" at 1st, then +10 rising to +30. */
const UNARMORED_MOVEMENT = [
  0, 10, 10, 10, 10, 15, 15, 15, 15, 20, 20, 20, 20, 25, 25, 25, 25, 30, 30, 30
]

/**
 * The Martial Arts die: d4, then d6 at 5th, d8 at 11th, d10 at 17th.
 *
 * Recorded here as die sizes even though nothing consumes it yet — see
 * Martial Arts below for why it cannot be applied, and so that whoever adds
 * the mechanism does not have to go back to the PDF for the numbers.
 */
const MARTIAL_ARTS_DIE = [
  4, 4, 4, 4, 6, 6, 6, 6, 6, 6, 8, 8, 8, 8, 8, 8, 10, 10, 10, 10
]

/** Ability Score Improvement levels. The monk takes the standard five. */
const ASI_LEVELS = [4, 8, 12, 16, 19]

/** While unarmoured and unshielded, which is most of what a monk does. */
const UNARMOURED: Predicate = {
  all: [
    { not: { playerToggle: 'wearing-armor' } },
    { not: { playerToggle: 'wielding-shield' } }
  ]
}

/** The toggles the two conditions above read, explained once. */
const UNARMOURED_NARRATIVE = {
  text: 'Monk features that need you unarmoured stop applying if either toggle '
    + 'is on. Unlike a barbarian, a monk loses these benefits for carrying a '
    + 'shield as well as for wearing armour.',
  toggleId: 'wearing-armor',
  dmPromptable: false
}

// ---------------------------------------------------------------------------
// The class
// ---------------------------------------------------------------------------

export const MONK_CLASS: ClassDefinition = {
  id: MONK, name: 'Monk', provenance: 'srd', contentVersion: 1,
  hitDie: 8,
  savingThrowProficiencies: ['str', 'dex'],
  subclassSlot: { grantedAtLevel: 3, options: ['srd:subclass.open-hand'] },
  features: [
    // --- 1st ---------------------------------------------------------------
    {
      id: `${MONK}.proficiencies`, name: 'Monk Proficiencies',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: `${MONK}.proficiencies`, name: 'Monk Proficiencies',
        modifiers: [
          // d8 hit die: 5 per level after the first, the full 8 at 1st, plus
          // Constitution every level. Same shape the fighter uses, with the
          // monk's smaller die.
          add(HP_MAX, {
            sum: [
              { product: [{ characterLevel: true }, 5] },
              { product: [{ characterLevel: true }, { stat: abilityModifierPath('con') }] },
              3
            ]
          }, { note: 'd8 hit die: 5 per level after the first, +3 at 1st, + CON per level' })
        ],
        proficiencies: [
          prof({ kind: 'save', ability: 'str' }),
          prof({ kind: 'save', ability: 'dex' }),
          prof({ kind: 'weaponCategory', category: 'simple' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.shortsword' })
          // Armour: none. Stated by omission, which is the whole grant.
        ],
        selections: [
          {
            id: 'monk.skills', prompt: 'Choose two monk skills', kind: 'skill', count: 2,
            from: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth']
          },
          {
            id: 'monk.tool', prompt: 'Choose one artisan\'s tool or musical instrument',
            kind: 'tool', count: 1
          }
        ]
      })
    },
    {
      id: `${MONK}.unarmored-defense`, name: 'Unarmored Defense',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: `${MONK}.unarmored-defense`, name: 'Unarmored Defense',
        modifiers: [
          /**
           * "AC equals 10 + your Dexterity modifier + your Wisdom modifier."
           *
           * Only 10 + WIS is declared: Dexterity is already a baseline `add`
           * on armorClass, so stating it again would count it twice. `base` is
           * highest-wins, which is exactly the comparison the SRD wants — a
           * monk's unarmoured AC competes with armour rather than stacking.
           *
           * The shield clause is where the monk and the barbarian genuinely
           * differ: the barbarian's Unarmored Defense explicitly permits a
           * shield, the monk's explicitly forbids one. Copying the barbarian's
           * gate across would have been wrong and invisible.
           */
          {
            id: id(), channel: 'value', target: ARMOR_CLASS, op: 'base',
            value: { sum: [10, { stat: abilityModifierPath('wis') }] },
            condition: UNARMOURED,
            permanence: 'persistent',
            note: '10 + Wisdom while unarmoured and carrying no shield'
          }
        ],
        narrative: [UNARMOURED_NARRATIVE]
      })
    },
    {
      id: `${MONK}.martial-arts`, name: 'Martial Arts',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: `${MONK}.martial-arts`, name: 'Martial Arts',
        completeness: 'partial',
        // Three clauses, none of which the vocabulary reaches:
        //
        //  - "Use Dexterity instead of Strength" needs the attack resolver to
        //    take an ability override for a *category* of weapon. `attackAbility`
        //    picks Strength, Dexterity or finesse-choice from the weapon's own
        //    properties; there is no channel by which a class feature can say
        //    "treat these weapons as finesse for me".
        //  - "Roll a d4 in place of the normal damage" needs a damage die
        //    *replacement*. Every damage modifier today is additive —
        //    DAMAGE_WEAPON adds a flat amount, Sneak Attack adds dice. Nothing
        //    swaps the weapon's own die for another, and a level table of die
        //    sizes (MARTIAL_ARTS_DIE above) has nothing to feed.
        //  - The bonus-action unarmed strike needs the action economy to model
        //    "after you take the Attack action", which it does not.
        //
        // Approximating any of these would put a confidently wrong number on
        // the sheet. So the numbers are shown and the player applies them.
        narrative: [{
          text: 'While unarmoured, carrying no shield, and unarmed or using only '
            + 'monk weapons (shortswords and simple melee weapons that are not '
            + 'two-handed or heavy): you may use Dexterity instead of Strength '
            + 'for attack and damage; you may roll your Martial Arts die in '
            + 'place of the weapon\'s normal damage (d4, rising to d6 at 5th, '
            + 'd8 at 11th and d10 at 17th); and after taking the Attack action '
            + 'you may make one unarmed strike as a bonus action. The app does '
            + 'not yet apply any of these — roll them yourself.',
          dmPromptable: true
        }]
      })
    },

    // --- 2nd ---------------------------------------------------------------
    {
      id: `${MONK}.ki`, name: 'Ki',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: `${MONK}.ki`, name: 'Ki',
        modifiers: [
          add(KI_MAX, { classLevelTable: { classId: MONK, values: KI_POINTS } },
            { note: 'Ki Points column of the Monk table' })
        ],
        resources: [{
          id: 'monk.ki', name: 'Ki Points', max: KI_MAX,
          // "Until you finish a short or long rest" — a short rest is the
          // shorter of the two, and a rule that recharges on a short rest
          // recharges on a long one too, which is what this kind already means.
          refresh: { kind: 'shortRest' },
          display: 'pool', group: 'Ki', order: 1
        }],
        actions: [
          {
            id: 'monk.flurry-of-blows', name: 'Flurry of Blows',
            kind: 'ability', cost: 'bonusAction',
            description: 'Immediately after the Attack action, make two unarmed strikes.',
            requirements: { resourceAtLeast: ['monk.ki', 1] },
            costs: { 'monk.ki': 1 }
          },
          {
            id: 'monk.patient-defense', name: 'Patient Defense',
            kind: 'ability', cost: 'bonusAction',
            description: 'Take the Dodge action as a bonus action.',
            requirements: { resourceAtLeast: ['monk.ki', 1] },
            costs: { 'monk.ki': 1 }
          },
          {
            id: 'monk.step-of-the-wind', name: 'Step of the Wind',
            kind: 'ability', cost: 'bonusAction',
            description: 'Disengage or Dash as a bonus action; your jump distance doubles.',
            requirements: { resourceAtLeast: ['monk.ki', 1] },
            costs: { 'monk.ki': 1 }
          }
        ],
        narrative: [{
          text: 'Regaining ki requires spending at least 30 minutes of the rest '
            + 'meditating. Ki save DC is 8 + proficiency bonus + Wisdom modifier.',
          dmPromptable: true
        }]
      })
    },
    {
      id: `${MONK}.unarmored-movement`, name: 'Unarmored Movement',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: `${MONK}.unarmored-movement`, name: 'Unarmored Movement',
        modifiers: [
          add(speedPath('walk'),
            { classLevelTable: { classId: MONK, values: UNARMORED_MOVEMENT } },
            {
              condition: UNARMOURED,
              note: 'Unarmored Movement column of the Monk table'
            })
        ],
        narrative: [UNARMOURED_NARRATIVE]
      })
    },

    // --- 3rd ---------------------------------------------------------------
    {
      id: `${MONK}.deflect-missiles`, name: 'Deflect Missiles',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 3,
      effects: source({
        id: `${MONK}.deflect-missiles`, name: 'Deflect Missiles',
        completeness: 'partial',
        actions: [{
          id: 'monk.deflect-missiles', name: 'Deflect Missiles',
          kind: 'ability', cost: 'reaction',
          description: 'Reduce the damage of a ranged weapon attack that hit you.',
          requirements: { always: true }
        }],
        // The reaction is offerable; the arithmetic is not applicable. Incoming
        // damage arrives through dmDamage, which the DM issues — there is no
        // hook by which a reaction reduces a number the DM is about to type.
        narrative: [{
          text: 'Reduce the damage by 1d10 + your Dexterity modifier + your monk '
            + 'level. If that reduces it to 0 you may catch the missile, and may '
            + 'spend 1 ki to throw it back as part of the same reaction '
            + '(proficient regardless, 20/60 range). Tell the DM the reduced '
            + 'number; the app does not subtract it for you.',
          dmPromptable: true
        }]
      })
    },

    // --- 4th ---------------------------------------------------------------
    {
      id: `${MONK}.slow-fall`, name: 'Slow Fall',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 4,
      effects: source({
        id: `${MONK}.slow-fall`, name: 'Slow Fall',
        completeness: 'partial',
        actions: [{
          id: 'monk.slow-fall', name: 'Slow Fall',
          kind: 'ability', cost: 'reaction',
          description: 'Reduce falling damage by five times your monk level.',
          requirements: { always: true }
        }],
        narrative: [{
          text: 'Falling damage is not modelled, so this reduction is yours to '
            + 'apply: five times your monk level.',
          dmPromptable: true
        }]
      })
    },

    // --- 5th ---------------------------------------------------------------
    {
      id: `${MONK}.extra-attack`, name: 'Extra Attack',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 5,
      effects: source({
        id: `${MONK}.extra-attack`, name: 'Extra Attack',
        completeness: 'partial',
        // The same gap the barbarian and fighter files record: how many attacks
        // the Attack action buys is not a stat anything reads. Every class that
        // gets Extra Attack will say this until the action economy grows a
        // number for it.
        narrative: [{
          text: 'You attack twice whenever you take the Attack action. The app '
            + 'does not track the attack count — roll the second attack yourself.',
          dmPromptable: false
        }]
      })
    },
    {
      id: `${MONK}.stunning-strike`, name: 'Stunning Strike',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 5,
      effects: source({
        id: `${MONK}.stunning-strike`, name: 'Stunning Strike',
        completeness: 'partial',
        actions: [{
          id: 'monk.stunning-strike', name: 'Stunning Strike',
          kind: 'ability', cost: 'free',
          description: 'On a melee weapon hit, spend 1 ki to attempt to stun the target.',
          requirements: { resourceAtLeast: ['monk.ki', 1] },
          costs: { 'monk.ki': 1 }
        }],
        // Spending the ki is real and the DC is a resolved stat the sheet can
        // show. What is not real is the target's saving throw: there are no
        // targets in theatre-of-the-mind, so the DM rolls it.
        narrative: [{
          text: 'The target makes a Constitution saving throw against your ki save '
            + 'DC or is stunned until the end of your next turn. The DM rolls '
            + 'that save.',
          dmPromptable: true
        }]
      })
    },

    // --- 6th ---------------------------------------------------------------
    {
      id: `${MONK}.ki-empowered-strikes`, name: 'Ki-Empowered Strikes',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 6,
      effects: source({
        id: `${MONK}.ki-empowered-strikes`, name: 'Ki-Empowered Strikes',
        modifiers: [
          // "Count as magical for the purpose of overcoming resistance and
          // immunity to nonmagical attacks" is exactly what the resistance
          // bypass paths are for. Bludgeoning is the unarmed strike's type.
          setTo(resistanceBypassPath('bludgeoning'), 1,
            { note: 'unarmed strikes count as magical' })
        ]
      })
    },

    // --- 7th ---------------------------------------------------------------
    {
      id: `${MONK}.evasion`, name: 'Evasion',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 7,
      effects: source({
        id: `${MONK}.evasion`, name: 'Evasion',
        completeness: 'partial',
        // "No damage on a success, half on a failure" is a rule about how an
        // *incoming* effect resolves. Incoming damage is the DM's dmDamage
        // command; nothing on the character intercepts it.
        narrative: [{
          text: 'When an effect lets you make a Dexterity save for half damage, '
            + 'you take none on a success and half on a failure. Tell the DM — '
            + 'the app does not halve incoming damage for you.',
          dmPromptable: true
        }]
      })
    },
    {
      id: `${MONK}.stillness-of-mind`, name: 'Stillness of Mind',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 7,
      effects: source({
        id: `${MONK}.stillness-of-mind`, name: 'Stillness of Mind',
        actions: [{
          id: 'monk.stillness-of-mind', name: 'Stillness of Mind',
          kind: 'ability', cost: 'action',
          description: 'End one effect on yourself causing you to be charmed or frightened.',
          requirements: { always: true }
        }]
      })
    },

    // --- 10th --------------------------------------------------------------
    {
      id: `${MONK}.purity-of-body`, name: 'Purity of Body',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 10,
      effects: source({
        id: `${MONK}.purity-of-body`, name: 'Purity of Body',
        completeness: 'partial',
        modifiers: [
          setTo(resistancePath('poison'), RESISTANCE_IMMUNE, { note: 'Purity of Body' })
        ],
        // Poison is a damage type and resolves. Disease is not modelled at all
        // — there is no disease vocabulary — so half of this feature is real
        // and half is a note, and saying so is better than implying both work.
        narrative: [{
          text: 'You are also immune to disease. Disease is not modelled by the '
            + 'app, so that half is between you and the DM.',
          dmPromptable: true
        }]
      })
    },

    // --- 13th --------------------------------------------------------------
    {
      id: `${MONK}.tongue-of-the-sun-and-moon`, name: 'Tongue of the Sun and Moon',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 13,
      effects: source({
        id: `${MONK}.tongue-of-the-sun-and-moon`, name: 'Tongue of the Sun and Moon',
        // Purely narrative in the rules themselves — it changes what the
        // character can do in fiction and touches no number. Not 'partial':
        // nothing is missing, there is simply nothing mechanical to express.
        narrative: [{
          text: 'You understand all spoken languages, and any creature that can '
            + 'understand a language can understand you.',
          dmPromptable: false
        }]
      })
    },

    // --- 14th --------------------------------------------------------------
    {
      id: `${MONK}.diamond-soul`, name: 'Diamond Soul',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 14,
      effects: source({
        id: `${MONK}.diamond-soul`, name: 'Diamond Soul',
        // "Proficiency in all saving throws" needs no new vocabulary at all —
        // it is six ordinary proficiency grants, and the two the monk already
        // had are harmless duplicates that the proficiency machinery resolves
        // to the same single bonus.
        proficiencies: [
          prof({ kind: 'save', ability: 'str' }),
          prof({ kind: 'save', ability: 'dex' }),
          prof({ kind: 'save', ability: 'con' }),
          prof({ kind: 'save', ability: 'int' }),
          prof({ kind: 'save', ability: 'wis' }),
          prof({ kind: 'save', ability: 'cha' })
        ],
        actions: [{
          id: 'monk.diamond-soul-reroll', name: 'Diamond Soul: reroll a save',
          kind: 'ability', cost: 'free',
          description: 'Spend 1 ki to reroll a failed saving throw; you must use the new roll.',
          requirements: { resourceAtLeast: ['monk.ki', 1] },
          costs: { 'monk.ki': 1 }
        }]
      })
    },

    // --- 15th --------------------------------------------------------------
    {
      id: `${MONK}.timeless-body`, name: 'Timeless Body',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 15,
      effects: source({
        id: `${MONK}.timeless-body`, name: 'Timeless Body',
        narrative: [{
          text: 'You suffer none of the frailty of old age, cannot be aged '
            + 'magically, and no longer need food or water.',
          dmPromptable: false
        }]
      })
    },

    // --- 18th --------------------------------------------------------------
    {
      id: `${MONK}.empty-body`, name: 'Empty Body',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 18,
      effects: source({
        id: `${MONK}.empty-body`, name: 'Empty Body',
        completeness: 'partial',
        actions: [
          {
            id: 'monk.empty-body', name: 'Empty Body: invisibility',
            kind: 'ability', cost: 'action',
            description: 'Spend 4 ki to become invisible for 1 minute, with resistance '
              + 'to all damage but force.',
            requirements: { resourceAtLeast: ['monk.ki', 4] },
            costs: { 'monk.ki': 4 }
          },
          {
            id: 'monk.empty-body-astral', name: 'Empty Body: astral projection',
            kind: 'ability', cost: 'action',
            description: 'Spend 8 ki to cast astral projection, without material components.',
            requirements: { resourceAtLeast: ['monk.ki', 8] },
            costs: { 'monk.ki': 8 }
          }
        ],
        // The ki cost and the action are real. The invisibility and the blanket
        // resistance would need an effect instance the action installs, which
        // actions cannot yet do; astral projection is not in the content set.
        narrative: [{
          text: 'The invisibility, the resistance to all damage but force, and '
            + 'astral projection itself are not applied by the app — the ki is '
            + 'spent correctly, the rest is adjudicated at the table.',
          dmPromptable: true
        }]
      })
    },

    // --- 20th --------------------------------------------------------------
    {
      id: `${MONK}.perfect-self`, name: 'Perfect Self',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 20,
      effects: source({
        id: `${MONK}.perfect-self`, name: 'Perfect Self',
        completeness: 'partial',
        // Initiative is rolled, but nothing fires *on* a roll — there are no
        // triggers on roll events, so "when you roll initiative" has nothing
        // to hang from.
        narrative: [{
          text: 'When you roll initiative with no ki points remaining, you regain '
            + '4 ki points. The app does not do this for you — restore them '
            + 'yourself at the top of a fight.',
          dmPromptable: true
        }]
      })
    }
  ]
}

/**
 * The levels at which the monk takes an Ability Score Improvement, and the die
 * its Martial Arts column steps through.
 *
 * Exported rather than inlined because neither has anywhere to go yet — there
 * is no advancement flow to consume ASI_LEVELS and no damage-die replacement
 * to consume MARTIAL_ARTS_DIE — and leaving them as loose numbers inside a
 * comment is how the next author ends up back in the PDF.
 */
export const MONK_TABLE = {
  asiLevels: ASI_LEVELS,
  martialArtsDie: MARTIAL_ARTS_DIE,
  kiPoints: KI_POINTS,
  unarmoredMovement: UNARMORED_MOVEMENT
}

// ===========================================================================
// Subclass — Way of the Open Hand (SRD p28-29)
// ===========================================================================

/**
 * The first subclass in the content set, and the reference for the other
 * eleven.
 *
 * It is deliberately not a new kind of thing: a SubclassDefinition carries the
 * same `features` array a ClassDefinition does, on the same level track, and
 * the collector runs both through identical code once the choice is made. What
 * a subclass adds is a gate — you get these features only if you chose this
 * tradition, and only if it belongs to the class you are actually playing.
 *
 * All four features here are `partial`, which is not a failure of this file.
 * Every one of them acts on a *target* — knock it prone, push it, end its
 * reactions, reduce it to 0 hit points — and there are no targets in
 * theatre-of-the-mind. The ki costs are real, the DCs are real, the healing is
 * real; the rest is the DM's to adjudicate, and each says so.
 */
export const WAY_OF_THE_OPEN_HAND: SubclassDefinition = {
  id: 'srd:subclass.open-hand', name: 'Way of the Open Hand',
  provenance: 'srd', contentVersion: 1,
  classId: MONK,
  features: [
    {
      id: 'srd:subclass.open-hand.technique', name: 'Open Hand Technique',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 3,
      effects: source({
        id: 'srd:subclass.open-hand.technique', name: 'Open Hand Technique',
        completeness: 'partial',
        // Three riders on a Flurry of Blows hit, each landing on the target.
        // Nothing here can reach a target, so the ki that Flurry already
        // spends is the whole mechanical part and the choice is the player's.
        narrative: [{
          text: 'When you hit with a Flurry of Blows attack, you may impose one '
            + 'of: a Dexterity save or knocked prone; a Strength save or pushed '
            + '15 feet; or no reactions until the end of your next turn. Both '
            + 'saves are against your ki save DC. Tell the DM which — the app '
            + 'does not apply it.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.open-hand.wholeness-of-body', name: 'Wholeness of Body',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 6,
      effects: source({
        id: 'srd:subclass.open-hand.wholeness-of-body', name: 'Wholeness of Body',
        completeness: 'partial',
        modifiers: [
          add(WHOLENESS_MAX, 1, { note: 'once per long rest' })
        ],
        resources: [{
          id: 'monk.wholeness-of-body', name: 'Wholeness of Body',
          max: WHOLENESS_MAX,
          refresh: { kind: 'longRest' }, display: 'uses', order: 2
        }],
        actions: [{
          id: 'monk.wholeness-of-body', name: 'Wholeness of Body',
          kind: 'ability', cost: 'action',
          description: 'Regain hit points equal to three times your monk level.',
          requirements: { resourceAtLeast: ['monk.wholeness-of-body', 1] },
          costs: { 'monk.wholeness-of-body': 1 }
        }]
        ,
        // The use is spent correctly; the healing is not applied, because an
        // action cannot yet restore hit points — the same wall Second Wind and
        // Lay on Hands are behind.
        narrative: [{
          text: 'Regain hit points equal to three times your monk level. The use '
            + 'is tracked; ask the DM to apply the healing.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.open-hand.tranquility', name: 'Tranquility',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 11,
      effects: source({
        id: 'srd:subclass.open-hand.tranquility', name: 'Tranquility',
        completeness: 'partial',
        // Note the DC: 8 + WIS + proficiency, which is the same arithmetic as
        // the ki save DC and so reads off the same stat rather than a second
        // one that could drift from it.
        narrative: [{
          text: 'At the end of a long rest you gain the effect of a sanctuary '
            + 'spell until your next long rest. Its save DC equals your ki save '
            + 'DC. Sanctuary is not in the content set, so the DM tracks it.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.open-hand.quivering-palm', name: 'Quivering Palm',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 17,
      effects: source({
        id: 'srd:subclass.open-hand.quivering-palm', name: 'Quivering Palm',
        completeness: 'partial',
        actions: [{
          id: 'monk.quivering-palm', name: 'Quivering Palm',
          kind: 'ability', cost: 'free',
          description: 'On an unarmed strike hit, spend 3 ki to start lethal vibrations.',
          requirements: { resourceAtLeast: ['monk.ki', 3] },
          costs: { 'monk.ki': 3 }
        }],
        narrative: [{
          text: 'The vibrations last a number of days equal to your monk level. '
            + 'Ending them with your action forces a Constitution save against '
            + 'your ki save DC: on a failure the target drops to 0 hit points, '
            + 'on a success it takes 10d10 necrotic. One creature at a time. '
            + 'The ki is spent here; everything after it is the DM\'s.',
          dmPromptable: true
        }]
      })
    }
  ]
}

export const MONK_SUBCLASSES: SubclassDefinition[] = [WAY_OF_THE_OPEN_HAND]

export const MONK_STATS = { KI_MAX, KI_SAVE_DC }
export const MONK_RULESET = V
