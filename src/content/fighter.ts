// Fighter, levels 1 to 20, and the Champion archetype.
//
// Authored against the monk's pattern (see monk.ts) — every level the table
// names, columns transcribed rather than derived, vocabulary never invented,
// and `completeness: 'partial'` wherever a rule cannot be expressed rather
// than an approximation that resolves to a plausible wrong number.
//
// The fighter previously lived in srd.ts as a levels-1-to-2 reference sketch:
// three features, a Fighting Style hardcoded to Defense, and Action Surge
// frozen at one use. This replaces it. What the sketch got right — hit points
// as a formula, Defense as a gated modifier — is kept verbatim.
//
// What this class exercises that the monk did not:
//
//  - A CHOICE OF STYLE. Fighting Style is one of six, and the SRD's own text
//    ("you can't take a Fighting Style option more than once") means the
//    second pick at Champion 10th must exclude the first. The house pattern
//    for a choice that steers a modifier is one gated modifier per option —
//    see the half-elf's ability increases — because a selection answer cannot
//    yet reach a modifier's target.
//  - A CLAMPED STAT. Improved Critical lowers the crit range to 19 and
//    Superior Critical to 18, which are two `max` clamps on one path rather
//    than two `set`s racing each other.
//  - HALF PROFICIENCY. Remarkable Athlete is the first content to use
//    `level: 'half'`, and it needs no special case: the resolver takes the
//    highest multiplier, so a check the fighter is already proficient in
//    keeps full proficiency and everything else gets half, which is exactly
//    what "that doesn't already use your proficiency bonus" means.

import type {
  ClassDefinition, EffectSource, Modifier, ProficiencyGrant, SubclassDefinition
} from '../rules/types.js'
import {
  abilityModifierPath, ARMOR_CLASS, ATTACK_ROLL, CRIT_RANGE, DAMAGE_WEAPON,
  declareResourceMax, HP_MAX, JUMP_LONG
} from '../rules/statPaths.js'

const FIGHTER = 'srd:class.fighter'
const V = '2014'
let n = 0
const id = (): string => `ft${++n}`

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
  level: ProficiencyGrant['level'] = 'proficient',
  extra: Partial<ProficiencyGrant> = {}
): ProficiencyGrant =>
  ({ id: id(), category, level, rounding: 'floor', grantsProficiency: true, ...extra })

/**
 * A proficiency the player chose rather than one the class handed over.
 *
 * `expandSelections` turns this single grant into as many held proficiencies
 * as the answer names. The `as never` matches how the bard and the Resilient
 * feat already author it: `selection` is read off the category by the resolver
 * but is not part of the ProficiencyCategory union.
 */
const chosenProf = (
  kind: 'skill' | 'tool',
  selectionId: string,
  level: ProficiencyGrant['level'] = 'proficient'
): ProficiencyGrant => ({
  id: id(),
  category: { kind, selection: selectionId } as never,
  level, rounding: 'floor', grantsProficiency: true
})

// ---------------------------------------------------------------------------
// Stats this class introduces
// ---------------------------------------------------------------------------

const SECOND_WIND_MAX = declareResourceMax('fighter.second-wind')
const ACTION_SURGE_MAX = declareResourceMax('fighter.action-surge')
const INDOMITABLE_MAX = declareResourceMax('fighter.indomitable')

// ---------------------------------------------------------------------------
// The Fighter table (SRD p24), transcribed
// ---------------------------------------------------------------------------

/** Action Surge: one use from 2nd, two from 17th. 0 before it is gained. */
const ACTION_SURGE_USES = [
  0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2
]

/** Indomitable: one use from 9th, two from 13th, three from 17th. */
const INDOMITABLE_USES = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3
]

/**
 * Attacks per Attack action: one, two from 5th, three from 11th, four from
 * 20th.
 *
 * Recorded even though nothing consumes it — the action economy has no notion
 * of an attack count, which is why Extra Attack is partial below. Kept here so
 * whoever adds that mechanism does not go back to the PDF for the numbers.
 */
const ATTACKS_PER_ACTION = [
  1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4
]

/** The fighter takes seven ASIs — more than any other class. */
const ASI_LEVELS = [4, 6, 8, 12, 14, 16, 19]

// ---------------------------------------------------------------------------
// Fighting Style
// ---------------------------------------------------------------------------

/**
 * The six styles, each as its own gated modifier.
 *
 * A `SelectionDefinition` records which the player picked, but a selection
 * answer cannot steer a modifier's target — the same wall the half-elf's
 * floating ability increases hit — so each style is authored as a real
 * modifier gated on its own toggle. The mechanics are visible in every
 * breakdown rather than hidden in prose; what the engine cannot do is check
 * that the toggles match the answer, or that only one is on.
 *
 * Three of the six have no mechanical form at all and are narrative only:
 * Great Weapon Fighting rerolls a damage die (no reroll channel for damage),
 * Protection imposes disadvantage on someone else's attack roll (modifiers
 * reach at most `attackersAgainstSelf`, and this defends a third party), and
 * Two-Weapon Fighting adds a modifier to an off-hand attack the action economy
 * does not model.
 */
const FIGHTING_STYLES = [
  { id: 'archery', name: 'Archery' },
  { id: 'defense', name: 'Defense' },
  { id: 'dueling', name: 'Dueling' },
  { id: 'great-weapon', name: 'Great Weapon Fighting' },
  { id: 'protection', name: 'Protection' },
  { id: 'two-weapon', name: 'Two-Weapon Fighting' }
] as const

const styleToggle = (styleId: string): string => `fighter.style.${styleId}`

/** The modifiers a style contributes, for the styles that have any. */
function styleModifiers(): Modifier[] {
  return [
    // "+2 bonus to attack rolls you make with ranged weapons." The scope
    // cannot say "ranged only", so the note says it and the toggle is the
    // player's honesty about when it applies.
    add(ATTACK_ROLL, 2, {
      condition: { playerToggle: styleToggle('archery') },
      note: 'Archery: +2 with ranged weapons — turn off when not using one'
    }),
    // "While you are wearing armor, you gain a +1 bonus to AC." Two gates,
    // both real: the style, and the armour.
    add(ARMOR_CLASS, 1, {
      condition: {
        all: [
          { playerToggle: styleToggle('defense') },
          { playerToggle: 'wearing-armor' }
        ]
      },
      note: 'Defense: +1 AC while wearing armour'
    }),
    // "+2 bonus to damage rolls" with a one-handed melee weapon and nothing
    // else in the other hand — a condition about what is held, which the
    // toggle stands in for.
    add(DAMAGE_WEAPON, 2, {
      condition: { playerToggle: styleToggle('dueling') },
      note: 'Dueling: +2 damage with a single one-handed melee weapon'
    })
  ]
}

/** The three styles that resolve to nothing, and why. */
const NARRATIVE_STYLES: { id: string; text: string }[] = [
  {
    id: 'great-weapon',
    text: 'Great Weapon Fighting: when you roll a 1 or 2 on a damage die for a '
      + 'two-handed or versatile melee weapon, reroll it and take the new roll. '
      + 'Damage dice have no reroll rule in the engine — reroll it yourself.'
  },
  {
    id: 'protection',
    text: 'Protection: while wielding a shield, use your reaction to impose '
      + 'disadvantage on an attack against someone within 5 feet of you. A '
      + 'modifier cannot reach a third party\'s attacker — tell the DM.'
  },
  {
    id: 'two-weapon',
    text: 'Two-Weapon Fighting: add your ability modifier to the damage of the '
      + 'second attack. The off-hand attack is not modelled, so neither is this.'
  }
]

// ---------------------------------------------------------------------------
// The class
// ---------------------------------------------------------------------------

export const FIGHTER_CLASS: ClassDefinition = {
  id: FIGHTER, name: 'Fighter', provenance: 'srd', contentVersion: 1,
  hitDie: 10,
  savingThrowProficiencies: ['str', 'con'],
  subclassSlot: { grantedAtLevel: 3, options: ['srd:subclass.champion'] },
  features: [
    // --- 1st ---------------------------------------------------------------
    {
      id: `${FIGHTER}.proficiencies`, name: 'Fighter Proficiencies',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: `${FIGHTER}.proficiencies`, name: 'Fighter Proficiencies',
        modifiers: [
          // Kept verbatim from the original sketch: the class die average plus
          // Constitution every level, with the full die at 1st.
          add(HP_MAX, {
            sum: [
              { product: [{ characterLevel: true }, 6] },
              { product: [{ characterLevel: true }, { stat: abilityModifierPath('con') }] },
              4
            ]
          }, { note: 'd10 hit die: 6 per level after the first, +4 at 1st, + CON per level' })
        ],
        proficiencies: [
          prof({ kind: 'save', ability: 'str' }),
          prof({ kind: 'save', ability: 'con' }),
          prof({ kind: 'armor', category: 'light' }),
          prof({ kind: 'armor', category: 'medium' }),
          prof({ kind: 'armor', category: 'heavy' }),
          prof({ kind: 'armor', category: 'shield' }),
          prof({ kind: 'weaponCategory', category: 'simple' }),
          prof({ kind: 'weaponCategory', category: 'martial' }),
          // "Choose two skills from…" — one authored grant that `expandSelections`
          // turns into as many held proficiencies as the player answered with.
          // A bare selection records the answer and grants nothing; this is what
          // makes the answer mean something. Same shape the bard's Skill
          // Versatility uses.
          chosenProf('skill', 'skills')
        ],
        selections: [{
          id: 'skills', prompt: 'Choose two fighter skills', kind: 'skill', count: 2,
          from: [
            'acrobatics', 'animal-handling', 'athletics', 'history',
            'insight', 'intimidation', 'perception', 'survival'
          ]
        }]
      })
    },
    {
      id: `${FIGHTER}.fighting-style`, name: 'Fighting Style',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: `${FIGHTER}.fighting-style`, name: 'Fighting Style',
        // Complete, and deliberately so. Archery, Defense and Dueling are
        // fully expressed; the three that are not live in their own source
        // below, gated on actually having chosen one. Marking this whole
        // feature partial would flag every fighter's AC as unreliable —
        // including a Defense fighter whose AC is exactly right.
        modifiers: styleModifiers(),
        selections: [{
          id: 'fighting-style', prompt: 'Choose a Fighting Style',
          kind: 'other', count: 1, from: FIGHTING_STYLES.map((s) => s.id)
        }],
        narrative: [{
          text: 'Turn on the toggle for the style you chose. The engine cannot '
            + 'check that it matches your answer above, or that only one is on — '
            + 'a selection answer cannot yet steer which modifier applies.',
          dmPromptable: true
        }]
      })
    },
    {
      id: `${FIGHTER}.fighting-style-manual`, name: 'Fighting Style (manual)',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: `${FIGHTER}.fighting-style-manual`, name: 'Fighting Style (manual)',
        completeness: 'partial',
        // Active only for a fighter who actually took one of the three styles
        // the vocabulary cannot express. `partial` propagates uncertainty into
        // every stat a character's sources touch, so it has to be earned:
        // flagging a Dueling fighter because Protection exists would be the
        // engine crying wolf.
        activation: {
          any: NARRATIVE_STYLES.map((s) => ({ playerToggle: styleToggle(s.id) }))
        },
        narrative: NARRATIVE_STYLES.map((s) => ({ text: s.text, dmPromptable: true }))
      })
    },
    {
      id: `${FIGHTER}.second-wind`, name: 'Second Wind',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: `${FIGHTER}.second-wind`, name: 'Second Wind',
        completeness: 'partial',
        modifiers: [add(SECOND_WIND_MAX, 1, { note: 'once per short or long rest' })],
        resources: [{
          id: 'fighter.second-wind', name: 'Second Wind', max: SECOND_WIND_MAX,
          refresh: { kind: 'shortRest' }, display: 'uses', order: 1
        }],
        actions: [{
          id: 'fighter.second-wind.use', name: 'Second Wind',
          kind: 'ability', cost: 'bonusAction',
          description: 'Regain 1d10 + your fighter level hit points.',
          requirements: { resourceAtLeast: ['fighter.second-wind', 1] },
          costs: { 'fighter.second-wind': 1 }
        }],
        // The use is spent correctly; the healing is not applied, because an
        // action cannot yet restore hit points.
        narrative: [{
          text: 'Regain 1d10 + your fighter level hit points. Roll it and ask the '
            + 'DM to apply it — the use is tracked, the healing is not.',
          dmPromptable: true
        }]
      })
    },

    // --- 2nd ---------------------------------------------------------------
    {
      id: `${FIGHTER}.action-surge`, name: 'Action Surge',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: `${FIGHTER}.action-surge`, name: 'Action Surge',
        completeness: 'partial',
        modifiers: [
          add(ACTION_SURGE_MAX,
            { classLevelTable: { classId: FIGHTER, values: ACTION_SURGE_USES } },
            { note: 'one use, two from 17th level' })
        ],
        resources: [{
          id: 'fighter.action-surge', name: 'Action Surge', max: ACTION_SURGE_MAX,
          refresh: { kind: 'shortRest' }, display: 'uses', order: 2
        }],
        actions: [{
          id: 'fighter.action-surge.use', name: 'Action Surge',
          kind: 'ability', cost: 'free',
          description: 'Take one additional action on your turn.',
          requirements: { resourceAtLeast: ['fighter.action-surge', 1] },
          costs: { 'fighter.action-surge': 1 }
        }],
        // The use is real; the extra action is not, because the action economy
        // does not count actions. From 17th the SRD also limits it to once per
        // turn even with two uses, which nothing here can enforce either.
        narrative: [{
          text: 'You take one additional action this turn. From 17th level you have '
            + 'two uses per rest, but may still only use it once on the same turn — '
            + 'the app tracks the uses, not the turn.',
          dmPromptable: true
        }]
      })
    },

    // --- 5th ---------------------------------------------------------------
    {
      id: `${FIGHTER}.extra-attack`, name: 'Extra Attack',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 5,
      effects: source({
        id: `${FIGHTER}.extra-attack`, name: 'Extra Attack',
        completeness: 'partial',
        // The same gap every class with Extra Attack records. The fighter is
        // the only class whose count rises three times, which is why the table
        // above exists even with nothing to read it.
        narrative: [{
          text: 'You attack twice whenever you take the Attack action — three times '
            + 'from 11th level, four from 20th. The app does not track the attack '
            + 'count; roll the extra attacks yourself.',
          dmPromptable: false
        }]
      })
    },

    // --- 9th ---------------------------------------------------------------
    {
      id: `${FIGHTER}.indomitable`, name: 'Indomitable',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 9,
      effects: source({
        id: `${FIGHTER}.indomitable`, name: 'Indomitable',
        completeness: 'partial',
        modifiers: [
          add(INDOMITABLE_MAX,
            { classLevelTable: { classId: FIGHTER, values: INDOMITABLE_USES } },
            { note: 'one use, two from 13th, three from 17th' })
        ],
        resources: [{
          id: 'fighter.indomitable', name: 'Indomitable', max: INDOMITABLE_MAX,
          refresh: { kind: 'longRest' }, display: 'uses', order: 3
        }],
        actions: [{
          id: 'fighter.indomitable.use', name: 'Indomitable',
          kind: 'ability', cost: 'free',
          description: 'Reroll a saving throw you failed; you must use the new roll.',
          requirements: { resourceAtLeast: ['fighter.indomitable', 1] },
          costs: { 'fighter.indomitable': 1 }
        }],
        // Rerolling an already-resolved roll is not something the roll pipeline
        // can be asked to do after the fact — `rerollOn` fires during a roll,
        // on named faces, not on a failure the player has already seen.
        narrative: [{
          text: 'Reroll a saving throw you failed and take the new roll. Roll it '
            + 'again yourself — the use is tracked.',
          dmPromptable: true
        }]
      })
    }
  ]
}

// ===========================================================================
// Subclass — Champion (SRD p25)
// ===========================================================================

export const CHAMPION: SubclassDefinition = {
  id: 'srd:subclass.champion', name: 'Champion',
  provenance: 'srd', contentVersion: 1,
  classId: FIGHTER,
  features: [
    {
      id: 'srd:subclass.champion.improved-critical', name: 'Improved Critical',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 3,
      effects: source({
        id: 'srd:subclass.champion.improved-critical', name: 'Improved Critical',
        modifiers: [
          // A `max` clamp, not a `set`. Superior Critical at 15th adds a second
          // clamp at 18, and two clamps compose to the lower without either
          // needing to know the other exists — where two `set`s would race and
          // the winner would depend on declaration order.
          {
            id: id(), channel: 'value', target: CRIT_RANGE, op: 'max', value: 19,
            permanence: 'persistent', note: 'critical on 19 or 20'
          }
        ]
      })
    },
    {
      id: 'srd:subclass.champion.remarkable-athlete', name: 'Remarkable Athlete',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 7,
      effects: source({
        id: 'srd:subclass.champion.remarkable-athlete', name: 'Remarkable Athlete',
        completeness: 'partial',
        modifiers: [
          // "the distance you can cover increases by a number of feet equal to
          // your Strength modifier" — an ordinary add on an ordinary stat.
          add(JUMP_LONG, { stat: abilityModifierPath('str') },
            { note: 'Remarkable Athlete: running long jump' })
        ],
        // Half proficiency, rounded UP, on Strength, Dexterity and Constitution
        // checks. "That doesn't already use your proficiency bonus" needs no
        // rule of its own: the resolver takes the highest multiplier, so a
        // check already proficient keeps full proficiency and the rest get half.
        proficiencies: [
          prof({ kind: 'abilityCheck', ability: 'str' }, 'half', { rounding: 'ceil' }),
          prof({ kind: 'abilityCheck', ability: 'dex' }, 'half', { rounding: 'ceil' }),
          prof({ kind: 'abilityCheck', ability: 'con' }, 'half', { rounding: 'ceil' })
        ],
        narrative: [{
          text: 'Half your proficiency bonus, rounded up, applies to Strength, '
            + 'Dexterity and Constitution checks you are not already proficient in.',
          dmPromptable: false
        }]
      })
    },
    {
      id: 'srd:subclass.champion.additional-fighting-style',
      name: 'Additional Fighting Style',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 10,
      effects: source({
        id: 'srd:subclass.champion.additional-fighting-style',
        name: 'Additional Fighting Style',
        completeness: 'partial',
        // No modifiers of its own: the six styles are already authored on the
        // class feature, each gated on its own toggle, so a second style is a
        // second toggle rather than a second set of modifiers. What cannot be
        // enforced is the SRD's "not more than once" — nothing stops the
        // player turning on the one they already had.
        selections: [{
          id: 'second-fighting-style', prompt: 'Choose a second Fighting Style',
          kind: 'other', count: 1, from: FIGHTING_STYLES.map((s) => s.id)
        }],
        narrative: [{
          text: 'Choose a second Fighting Style and turn on its toggle too. It must '
            + 'differ from your first — the engine cannot check that.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.champion.superior-critical', name: 'Superior Critical',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 15,
      effects: source({
        id: 'srd:subclass.champion.superior-critical', name: 'Superior Critical',
        modifiers: [
          {
            id: id(), channel: 'value', target: CRIT_RANGE, op: 'max', value: 18,
            permanence: 'persistent', note: 'critical on 18, 19 or 20'
          }
        ]
      })
    },
    {
      id: 'srd:subclass.champion.survivor', name: 'Survivor',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 18,
      effects: source({
        id: 'srd:subclass.champion.survivor', name: 'Survivor',
        completeness: 'partial',
        // Regeneration at the start of a turn, conditional on current hit
        // points. Turns are not modelled and nothing fires on one.
        narrative: [{
          text: 'At the start of each of your turns you regain 5 + your Constitution '
            + 'modifier hit points, if you are at or below half your maximum and not '
            + 'at 0. Nothing fires on the start of a turn — ask the DM to apply it.',
          dmPromptable: true
        }]
      })
    }
  ]
}

export const FIGHTER_CLASSES: ClassDefinition[] = [FIGHTER_CLASS]
export const FIGHTER_SUBCLASSES: SubclassDefinition[] = [CHAMPION]

/**
 * Columns nothing reads yet: the attack count Extra Attack would use, and the
 * seven levels at which the fighter takes an Ability Score Improvement.
 */
export const FIGHTER_TABLE = {
  asiLevels: ASI_LEVELS,
  attacksPerAction: ATTACKS_PER_ACTION,
  actionSurgeUses: ACTION_SURGE_USES,
  indomitableUses: INDOMITABLE_USES,
  fightingStyles: FIGHTING_STYLES,
  styleToggle
}

export const FIGHTER_RULESET = V
