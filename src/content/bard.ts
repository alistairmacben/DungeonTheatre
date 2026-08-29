// Half-Elf Bard — the support caster, and the first content that reaches for
// another creature.
//
// Every class so far has been self-contained: a modifier changes the character
// carrying it. The bard's signature feature hands a *die to somebody else*, and
// the College of Lore's answer to that is to subtract the same die from an
// *enemy's* roll. Neither is expressible, and neither is faked here — the
// vocabulary has exactly two directions (`self` and `attackersAgainstSelf`) and
// no notion of a source travelling to another character sheet. What that costs
// is written out in the narrative clauses rather than smoothed over.
//
// The other three pressure points landed differently. Expertise and the
// Half-Elf's two free skills fell straight out of the selection machinery.
// Jack of All Trades needed one missing ProficiencyCategory, which arrived
// with the Champion's Remarkable Athlete and now makes it work. Font of
// Inspiration — a refresh rule that changes at 5th level — turned out to be
// expressible with an activation predicate, at the price of one extra source;
// see the comment there.

import type {
  ClassDefinition, ClassFeatureDefinition, EffectSource, ItemDefinition,
  Modifier, ProficiencyGrant, SelectionDefinition, SpeciesDefinition, SubclassDefinition
} from '../rules/types.js'
import {
  abilityModifierPath, abilityScorePath, declareResourceMax, HP_MAX,
  PROFICIENCY_BONUS, SPELL_ATTACK, SPELL_SAVE_DC, speedPath
} from '../rules/statPaths.js'
import { fullCasterSlots } from './progression.js'

const V = '2014'
let n = 0
const id = () => `bd${++n}`

const BARD = 'srd:class.bard'

/** The Bard table's slot columns, 1st through 9th. */
const BARD_SLOTS = fullCasterSlots(BARD, 'bard')

// Bardic Inspiration's maximum is a formula (Charisma modifier, minimum one),
// so it is an ordinary derived stat like a sorcerer's point total rather than a
// number the class stores.
const BARDIC_INSPIRATION_MAX = declareResourceMax('bardicInspiration')

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
 * A proficiency the player picks rather than one the content names.
 *
 * `expandSelections` turns one authored grant into as many held proficiencies
 * as the player answered with, so "choose any three skills", "three musical
 * instruments" and Expertise's "two of your proficiencies" are the same grant
 * with a different level. The `as never` cast matches how the Resilient feat
 * already authors this: `selection` is read off the category by the resolver
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

const ALL_SKILLS = [
  'acrobatics', 'animal-handling', 'arcana', 'athletics', 'deception', 'history',
  'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception',
  'performance', 'persuasion', 'religion', 'sleight-of-hand', 'stealth', 'survival'
]

const INSTRUMENTS = [
  'bagpipes', 'drum', 'dulcimer', 'flute', 'lute', 'lyre', 'horn', 'pan-flute',
  'shawm', 'viol'
]

/**
 * The bard spells present in the loaded content set.
 *
 * A bard is a *known* caster, so access is a selection the player answered and
 * not a whole-list grant — which is the same SpellGrant the cleric's list uses
 * with one field swapped. The candidate pool is short because only five spells
 * in `spells.ts` are on the SRD bard list; that is a content-set limit, not a
 * modelling one, and it disappears the moment more spells carry `srd:list.bard`.
 */
// Two entries, matching the level-1 "choose two" exactly. Mending is also on
// the SRD bard cantrip list (docs/srd/08-spell-lists.md) and quote-checked in
// spells.ts; it was authored for the druid's own thin pool and reused here
// rather than duplicated.
const BARD_CANTRIP_POOL = [
  'srd:spell.prestidigitation', 'srd:spell.mending', 'srd:spell.dancing-lights',
  'srd:spell.light', 'srd:spell.mage-hand', 'srd:spell.message',
  'srd:spell.minor-illusion', 'srd:spell.true-strike', 'srd:spell.vicious-mockery'
]
const BARD_SPELL_POOL = [
  'srd:spell.cure-wounds', 'srd:spell.detect-magic', 'srd:spell.identify',
  'srd:spell.longstrider', 'srd:spell.charm-person', 'srd:spell.animal-friendship',
  'srd:spell.bane', 'srd:spell.comprehend-languages', 'srd:spell.disguise-self',
  'srd:spell.faerie-fire', 'srd:spell.feather-fall', 'srd:spell.healing-word',
  'srd:spell.heroism', 'srd:spell.hideous-laughter', 'srd:spell.illusory-script',
  'srd:spell.silent-image', 'srd:spell.sleep', 'srd:spell.speak-with-animals',
  'srd:spell.thunderwave', 'srd:spell.unseen-servant',
  'srd:spell.animal-messenger', 'srd:spell.blindness-deafness', 'srd:spell.calm-emotions',
  'srd:spell.detect-thoughts', 'srd:spell.enhance-ability', 'srd:spell.enthrall',
  'srd:spell.heat-metal', 'srd:spell.hold-person', 'srd:spell.invisibility',
  'srd:spell.knock', 'srd:spell.lesser-restoration', 'srd:spell.locate-animals-or-plants',
  'srd:spell.locate-object', 'srd:spell.magic-mouth', 'srd:spell.see-invisibility',
  'srd:spell.shatter', 'srd:spell.silence', 'srd:spell.suggestion', 'srd:spell.zone-of-truth',
  'srd:spell.bestow-curse', 'srd:spell.clairvoyance', 'srd:spell.dispel-magic',
  'srd:spell.fear', 'srd:spell.glyph-of-warding', 'srd:spell.hypnotic-pattern',
  'srd:spell.major-image', 'srd:spell.nondetection', 'srd:spell.sending',
  'srd:spell.speak-with-dead', 'srd:spell.speak-with-plants', 'srd:spell.stinking-cloud',
  'srd:spell.tiny-hut', 'srd:spell.tongues',
  'srd:spell.compulsion', 'srd:spell.confusion', 'srd:spell.dimension-door',
  'srd:spell.freedom-of-movement', 'srd:spell.greater-invisibility',
  'srd:spell.hallucinatory-terrain', 'srd:spell.locate-creature', 'srd:spell.polymorph',
  'srd:spell.animate-objects', 'srd:spell.awaken', 'srd:spell.dominate-person',
  'srd:spell.dream', 'srd:spell.geas', 'srd:spell.greater-restoration',
  'srd:spell.hold-monster', 'srd:spell.legend-lore', 'srd:spell.mass-cure-wounds',
  'srd:spell.mislead', 'srd:spell.modify-memory', 'srd:spell.planar-binding',
  'srd:spell.raise-dead', 'srd:spell.scrying', 'srd:spell.seeming',
  'srd:spell.teleportation-circle',
  'srd:spell.eyebite', 'srd:spell.find-the-path', 'srd:spell.guards-and-wards',
  'srd:spell.irresistible-dance', 'srd:spell.mass-suggestion',
  'srd:spell.programmed-illusion', 'srd:spell.true-seeing',
  'srd:spell.arcane-sword', 'srd:spell.etherealness', 'srd:spell.forcecage',
  'srd:spell.magnificent-mansion', 'srd:spell.mirage-arcane', 'srd:spell.project-image',
  'srd:spell.regenerate', 'srd:spell.resurrection', 'srd:spell.symbol', 'srd:spell.teleport',
  'srd:spell.dominate-monster', 'srd:spell.feeblemind', 'srd:spell.glibness',
  'srd:spell.mind-blank', 'srd:spell.power-word-stun',
  'srd:spell.foresight', 'srd:spell.power-word-kill', 'srd:spell.true-polymorph'
]

// ===========================================================================
// Species — Half-Elf
// ===========================================================================

const FLOATING_ABILITIES = ['str', 'dex', 'con', 'int', 'wis'] as const

/**
 * Half-Elf.
 *
 * The +2 Charisma is an ordinary modifier. The "+1 to two other ability scores
 * of your choice" is the reason this source is `partial`.
 *
 * A modifier's `target` is a fixed stat path, and no predicate reads a
 * selection answer, so a chosen ability cannot steer a modifier at either end.
 * The house pattern (Resilient) authors one gated modifier per ability, which
 * is done below — the mechanics are real and visible in every breakdown rather
 * than hidden in prose. What it cannot do is *connect* the choice to the gate:
 * the player answers the selection and must also flip two toggles, and nothing
 * stops them flipping five. That silent divergence is what `partial` is for.
 */
export const HALF_ELF: SpeciesDefinition = {
  id: 'srd:species.half-elf', name: 'Half-Elf', provenance: 'srd', contentVersion: 1,
  size: 'medium', baseWalkSpeed: 30,
  effects: source({
    id: 'srd:species.half-elf', name: 'Half-Elf', kind: 'species',
    modifiers: [
      add(abilityScorePath('cha'), 2),
      { id: id(), channel: 'value', target: speedPath('walk'), op: 'base', value: 30, permanence: 'persistent' },
      // Fey Ancestry, worded to match the elf's so the two compose rather than
      // each inventing a tag.
      {
        id: id(), channel: 'roll', rollOp: 'advantage',
        scope: { kinds: ['save'], againstTags: ['charm'] },
        permanence: 'persistent', note: 'Fey Ancestry'
      },
      ...FLOATING_ABILITIES.map((a) =>
        add(abilityScorePath(a), 1, {
          condition: { playerToggle: `half-elf.asi.${a}` },
          note: `Half-Elf: chosen +1 to ${a.toUpperCase()}`
        }))
    ],
    proficiencies: [chosenProf('skill', 'versatility')],
    selections: [
      {
        id: 'ability-increase',
        prompt: 'Choose two ability scores other than Charisma to increase by 1',
        kind: 'ability', count: 2, from: [...FLOATING_ABILITIES]
      },
      {
        id: 'versatility', prompt: 'Skill Versatility: choose two skills',
        kind: 'skill', count: 2, from: ALL_SKILLS
      },
      {
        id: 'language', prompt: 'One extra language beyond Common and Elvish',
        kind: 'language', count: 1
      }
    ],
    narrative: [{
      text: 'Your two chosen +1 ability increases are present as real modifiers '
        + 'but each is gated on its own toggle, because a selection answer '
        + 'cannot yet steer which stat a modifier targets. Turn on exactly the '
        + 'two you chose — the engine cannot check that you picked two, or that '
        + 'they match your answer above.',
      dmPromptable: true
    }, {
      text: 'Fey Ancestry also makes you immune to magical sleep. Darkvision '
        + 'reaches 60 feet. You speak Common, Elvish and one language of your choice.',
      dmPromptable: false
    }],
    completeness: 'partial'
  })
}

// ===========================================================================
// Class — Bard, levels 1-5, except Spells Known which now runs the full
// table to 20. The class's other features (Song of Rest's rising die,
// Magical Secrets as a mechanic rather than a count, Peerless Skill,
// Superior Inspiration, College of Lore past 3rd) are still not authored
// past 5th — a separate, larger pass, not this one.
// ===========================================================================

/**
 * Cantrips Known and Spells Known, transcribed from the Bard table
 * (docs/srd-source/classes.pdf p11, "The Bard"). `values[0]` is level 1.
 *
 * Spells Known jumps by 2 rather than 1 at 10th, 14th and 18th — the levels
 * Magical Secrets lands. The real rule lets those two be learned from *any*
 * class's spell list, not just the bard's own; this table only has the count
 * right, and the selection pool below still draws bard spells only. Said once
 * here rather than approximated into a grant that looks complete and isn't.
 */
/**
 * The Bardic Inspiration die: d6, rising at 5th, 10th and 15th. And Song of
 * Rest's die: d6, rising at 9th, 13th and 17th — a different track, which is
 * exactly why both are transcribed rather than one derived from the other.
 *
 * Neither is consumed yet: a die size is not a number, and nothing in the
 * vocabulary replaces one. Kept so whoever adds that mechanism does not go
 * back to the PDF.
 */
const BARD_INSPIRATION_DIE = [
  6, 6, 6, 6, 8, 8, 8, 8, 8, 10, 10, 10, 10, 10, 12, 12, 12, 12, 12, 12
]
const BARD_SONG_OF_REST_DIE = [
  0, 6, 6, 6, 6, 6, 6, 6, 8, 8, 8, 8, 10, 10, 10, 10, 12, 12, 12, 12
]

/** The bard takes the standard five Ability Score Improvements. */
const BARD_ASI_LEVELS = [4, 8, 12, 16, 19]

/** Magical Secrets lands three times, and is why Spells Known jumps by two. */
const MAGICAL_SECRETS_LEVELS = [10, 14, 18]

const BARD_CANTRIPS_KNOWN = [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
const BARD_SPELLS_KNOWN = [
  4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22
]

/**
 * One level's worth of the Cantrips/Spells Known columns, as the increase
 * over the level before.
 *
 * `SelectionDefinition.count` is a constant, so each increment is authored as
 * its own level-gated grant — `grantedAtLevel` is already exactly this
 * mechanism. A level where neither column moves (12th, 16th, 19th, 20th — all
 * Ability Score Improvement levels instead) grants nothing, since a selection
 * asking for zero of anything is not a choice and the content integrity check
 * already rejects one.
 */
function spellsKnownAtLevel(
  level: number, cantrips: number, spells: number
): ClassFeatureDefinition | undefined {
  if (cantrips === 0 && spells === 0) return undefined

  const fid = `${BARD}.spells-known-${level}`
  const selections: SelectionDefinition[] = []
  const grants: EffectSource['spells'] = []

  if (cantrips > 0) {
    selections.push({
      id: 'cantrips', prompt: `Learn ${cantrips} more bard cantrip${cantrips === 1 ? '' : 's'}`,
      kind: 'spellList', count: cantrips, from: BARD_CANTRIP_POOL
    })
    // No slotGroup: that, and nothing else, is what makes a cantrip a cantrip.
    grants.push({ selectionId: 'cantrips', availability: 'always', ability: 'cha' })
  }

  if (spells > 0) {
    selections.push({
      id: 'spells', prompt: `Learn ${spells} more bard spell${spells === 1 ? '' : 's'}`,
      kind: 'spellList', count: spells, from: BARD_SPELL_POOL
    })
    // 'always' rather than 'prepared': a bard knows spells, it does not
    // prepare them, so preparation is not a question this grant asks.
    grants.push({
      selectionId: 'spells', availability: 'always', slotGroup: 'bard', ability: 'cha'
    })
  }

  return {
    id: fid, name: `Spells Known (level ${level})`,
    provenance: 'srd', contentVersion: 1, grantedAtLevel: level,
    effects: source({ id: fid, name: `Spells Known (level ${level})`, selections, spells: grants })
  }
}

/** One feature per level with a nonzero delta, in the order the table has them. */
const BARD_KNOWN_FEATURES = BARD_CANTRIPS_KNOWN
  .map((cantrips, i) => {
    const level = i + 1
    if (level === 1) return undefined // Granted directly by the level-1 Spellcasting feature.
    const spells = BARD_SPELLS_KNOWN[i]! - BARD_SPELLS_KNOWN[i - 1]!
    const cantripDelta = cantrips - BARD_CANTRIPS_KNOWN[i - 1]!
    return spellsKnownAtLevel(level, cantripDelta, spells)
  })
  .filter((f): f is ClassFeatureDefinition => f !== undefined)

export const BARD_CLASS: ClassDefinition = {
  id: BARD, name: 'Bard', provenance: 'srd', contentVersion: 1,
  hitDie: 8, savingThrowProficiencies: ['dex', 'cha'],
  subclassSlot: { grantedAtLevel: 3, options: ['srd:subclass.lore'] },
  asiLevels: BARD_ASI_LEVELS,
  features: [
    {
      id: `${BARD}.proficiencies`, name: 'Bard Proficiencies',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: `${BARD}.proficiencies`, name: 'Bard Proficiencies',
        modifiers: [
          add(HP_MAX, {
            sum: [
              8, { product: [5, { sum: [{ characterLevel: true }, -1] }] },
              { product: [{ stat: abilityModifierPath('con') }, { characterLevel: true }] }
            ]
          }, { note: 'd8 hit die: 5 per level after the first, +8 at 1st, + CON per level' })
        ],
        proficiencies: [
          prof({ kind: 'save', ability: 'dex' }),
          prof({ kind: 'save', ability: 'cha' }),
          prof({ kind: 'armor', category: 'light' }),
          prof({ kind: 'weaponCategory', category: 'simple' }),
          // "simple weapons, hand crossbows, longswords, rapiers, shortswords":
          // four martial exceptions the category grant does not reach, so each
          // is named. Same shape as the rogue's list.
          prof({ kind: 'weapon', itemId: 'srd:weapon.hand-crossbow' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.longsword' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.rapier' }),
          prof({ kind: 'weapon', itemId: 'srd:weapon.shortsword' }),
          // "Skills: choose any three" — the bard is the only class whose skill
          // list is the whole list, which is a `from` of everything rather than
          // a different kind of grant.
          chosenProf('skill', 'skills'),
          chosenProf('tool', 'instruments')
        ],
        selections: [
          {
            id: 'skills', prompt: 'Choose any three skills',
            kind: 'skill', count: 3, from: ALL_SKILLS
          },
          {
            id: 'instruments', prompt: 'Choose three musical instruments',
            kind: 'tool', count: 3, from: INSTRUMENTS
          }
        ]
      })
    },
    {
      id: `${BARD}.spellcasting`, name: 'Bard Spellcasting',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: `${BARD}.spellcasting`, name: 'Bard Spellcasting',
        modifiers: [
          // The same three ordinary modifiers the wizard uses, differing only
          // in which ability feeds them. Nothing here knows it is a bard.
          { id: id(), channel: 'value', target: SPELL_SAVE_DC, op: 'base', value: 8, permanence: 'persistent' },
          add(SPELL_SAVE_DC, { stat: PROFICIENCY_BONUS }),
          add(SPELL_SAVE_DC, { stat: abilityModifierPath('cha') }, { note: 'Charisma' }),
          add(SPELL_ATTACK, { stat: PROFICIENCY_BONUS }),
          add(SPELL_ATTACK, { stat: abilityModifierPath('cha') }, { note: 'Charisma' }),
          // No SPELLS_PREPARED_MAX: a known caster never prepares, so the stat
          // that governs preparation is simply absent rather than set to a
          // sentinel. The difference between the bard and the cleric is one
          // field on the grant.
          {
            id: id(), channel: 'capability', capability: 'castSpells',
            capOp: 'grant', permanence: 'persistent'
          },
          ...BARD_SLOTS.modifiers
        ],
        // The full ladder, 1st through 9th, read off the Bard table rather
        // than frozen at one row.
        resources: BARD_SLOTS.resources,
        selections: [
          {
            id: 'cantrips', prompt: 'Choose two bard cantrips',
            kind: 'spellList', count: 2, from: BARD_CANTRIP_POOL
          },
          {
            id: 'spells', prompt: 'Choose four bard spells',
            kind: 'spellList', count: 4, from: BARD_SPELL_POOL
          }
        ],
        spells: [
          { selectionId: 'cantrips', availability: 'always', ability: 'cha' },
          { selectionId: 'spells', availability: 'always', slotGroup: 'bard', ability: 'cha' }
        ],
        narrative: [{
          text: 'You may swap one spell you know for another whenever you gain '
            + 'a bard level, and you can cast any bard spell you know that has '
            + 'the ritual tag as a ritual. A musical instrument is your '
            + 'spellcasting focus.',
          dmPromptable: false
        }]
      })
    },
    // One feature per level the Cantrips/Spells Known columns actually move,
    // built above from the transcribed table.
    ...BARD_KNOWN_FEATURES,
    {
      id: `${BARD}.bardic-inspiration`, name: 'Bardic Inspiration',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: `${BARD}.bardic-inspiration`, name: 'Bardic Inspiration',
        modifiers: [
          add(BARDIC_INSPIRATION_MAX,
            { max: [1, { stat: abilityModifierPath('cha') }] },
            { note: 'Charisma modifier, minimum one' })
        ],
        actions: [{
          id: 'bard.bardic-inspiration.use', name: 'Bardic Inspiration',
          kind: 'ability', cost: 'bonusAction',
          description: 'Give one creature that can hear you a Bardic Inspiration die.',
          requirements: { resourceAtLeast: ['bard.bardicInspiration', 1] },
          costs: { 'bard.bardicInspiration': 1 },
          targets: { selector: 'creature', count: 1, rangeFeet: 60 }
        }],
        // Spending the use is real; the die is not, and is not pretended to be.
        // A modifier belongs to the character carrying it and reaches at most
        // the creatures attacking them (`appliesTo`), so there is no way to put
        // a d6 on somebody else's ability check. Nor could the die ride along
        // if there were: `RollResolution.pendingDice` — the slot bless's 1d4
        // would use — is never populated by any modifier. The same wall bless
        // hit, recorded the same way.
        narrative: [{
          text: 'The recipient has 10 minutes to add one Bardic Inspiration die '
            + '(d6, rising to d8 at 5th level) to one ability check, attack roll '
            + 'or saving throw, and may decide to use it after rolling the d20 '
            + 'but before the outcome is announced. One die at a time per '
            + 'creature. Effects on another creature’s sheet are not modelled: '
            + 'spend the use here and roll the die at the table.',
          dmPromptable: true
        }],
        completeness: 'partial'
      })
    },
    {
      id: `${BARD}.bardic-inspiration.uses`, name: 'Bardic Inspiration Uses',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 1,
      effects: source({
        id: `${BARD}.bardic-inspiration.uses`, name: 'Bardic Inspiration Uses',
        // A ResourceDefinition's refresh rule is fixed, and Font of Inspiration
        // changes it at 5th level. Rather than approximate — long rest, wrong
        // from 5th; short rest, wrong before it — the pool is authored twice
        // and each copy is switched off by an activation predicate at the
        // boundary. Same resource id, so the spent count carries across, and
        // exactly one is ever live. The cost is this extra source; a `refresh`
        // that a later feature could raise would fold the two back into one.
        activation: { not: { classLevelAtLeast: [BARD, 5] } },
        resources: [{
          id: 'bard.bardicInspiration', name: 'Bardic Inspiration',
          max: BARDIC_INSPIRATION_MAX,
          refresh: { kind: 'longRest' }, display: 'dice', order: 4
        }]
      })
    },
    {
      id: `${BARD}.font-of-inspiration`, name: 'Font of Inspiration',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 5,
      effects: source({
        id: `${BARD}.font-of-inspiration`, name: 'Font of Inspiration',
        // The other half of the pair above: from 5th level the uses come back
        // on a short rest as well as a long one, which `{ kind: 'shortRest' }`
        // already means.
        resources: [{
          id: 'bard.bardicInspiration', name: 'Bardic Inspiration',
          max: BARDIC_INSPIRATION_MAX,
          refresh: { kind: 'shortRest' }, display: 'dice', order: 4
        }]
      })
    },
    {
      id: `${BARD}.jack-of-all-trades`, name: 'Jack of All Trades',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: `${BARD}.jack-of-all-trades`, name: 'Jack of All Trades',
        // This was the gap this file recorded in its own header: "one missing
        // ProficiencyCategory away from working". The category — `abilityCheck`
        // — was added for the Champion's Remarkable Athlete, which needs the
        // same thing for three abilities instead of all six.
        //
        // Everything else was already here. `level: 'half'` with
        // `rounding: 'floor'`, and the highest-multiplier-wins rule between
        // grants, gives exactly the SRD answer: half a bonus on an unproficient
        // check, no change when proficient, no change under Expertise. "That
        // doesn't already include your proficiency bonus" needs no rule of its
        // own.
        //
        // Note what this is NOT: eighteen skill grants. That was rejected twice
        // over when this file was first written — it would miss raw ability
        // checks and initiative, and `grantsProficiency: true` on eighteen
        // skills would make the bard read as *proficient* in all of them to
        // every prerequisite and to Expertise. Six ability-check grants have
        // neither problem.
        proficiencies: (['str', 'dex', 'con', 'int', 'wis', 'cha'] as const)
          .map((a) => prof({ kind: 'abilityCheck', ability: a }, 'half')),
        narrative: [{
          text: 'Half your proficiency bonus, rounded down, applies to any ability '
            + 'check you are not already proficient in.',
          dmPromptable: false
        }]
      })
    },
    {
      id: `${BARD}.song-of-rest`, name: 'Song of Rest',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 2,
      effects: source({
        id: `${BARD}.song-of-rest`, name: 'Song of Rest',
        // Two separate reasons this cannot be data: it lands on allies rather
        // than on the bard, and it modifies how much a *Hit Die* restores,
        // which is a rest procedure and not a stat path.
        narrative: [{
          text: 'If you and any friendly creatures spend a short rest listening '
            + 'to your performance, each of them regains an extra 1d6 hit points '
            + 'when they spend a Hit Die to heal. Roll the extra die at the table.',
          dmPromptable: true
        }],
        completeness: 'partial'
      })
    },
    {
      id: `${BARD}.expertise`, name: 'Expertise',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 3,
      effects: source({
        id: `${BARD}.expertise`, name: 'Expertise',
        // Where the rogue's two skills are authored in, the bard's are chosen —
        // and it is the identical grant with a selection in place of an id.
        // "You add it only once and multiply it only once" still falls out of
        // the proficiency bonus's `single-highest` multiply composition, so
        // Expertise stacking with Jack of All Trades is a non-question.
        proficiencies: [chosenProf('skill', 'expertise', 'expertise')],
        selections: [{
          id: 'expertise',
          prompt: 'Choose two skill proficiencies to double',
          kind: 'skill', count: 2, from: ALL_SKILLS
        }],
        narrative: [{
          text: 'Both choices must be skills you are already proficient in. '
            + 'Doubling a skill you are not proficient in doubles nothing, which '
            + 'is what the engine will show.',
          dmPromptable: false
        }]
      })
    },

    // --- 6th ---------------------------------------------------------------
    {
      id: `${BARD}.countercharm`, name: 'Countercharm',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 6,
      effects: source({
        id: `${BARD}.countercharm`, name: 'Countercharm',
        completeness: 'partial',
        actions: [{
          id: 'bard.countercharm', name: 'Countercharm',
          kind: 'ability', cost: 'action',
          description: 'Start a performance granting advantage against being charmed or frightened.',
          requirements: { always: true }
        }],
        // The bard's own half would be an ordinary roll modifier; the allies'
        // half is the same wall Bardic Inspiration hit — a modifier belongs to
        // the character carrying it and cannot travel to another sheet. Half a
        // feature applied is worse than a note, so it stays a note.
        narrative: [{
          text: 'Until the end of your next turn, you and friendly creatures within '
            + '30 feet have advantage on saving throws against being frightened or '
            + 'charmed. A creature must be able to hear you. Apply the advantage '
            + 'at the table — a modifier cannot reach another character\'s sheet.',
          dmPromptable: true
        }]
      })
    },

    // --- 10th, 14th, 18th --------------------------------------------------
    ...MAGICAL_SECRETS_LEVELS.map((level) => ({
      id: `${BARD}.magical-secrets-${level}`, name: `Magical Secrets (level ${level})`,
      provenance: 'srd' as const, contentVersion: 1, grantedAtLevel: level,
      effects: source({
        id: `${BARD}.magical-secrets-${level}`, name: `Magical Secrets (level ${level})`,
        completeness: 'partial',
        // "Two spells from any class" — a pool that is every spell in the game
        // at or below the bard's slot ceiling. A `spellList` selection needs a
        // stated pool, and the honest pool here is the whole content set, which
        // would be a menu of everything rather than a considered choice. The
        // count is already right: the Spells Known column jumps by two at each
        // of these levels rather than one.
        narrative: [{
          text: 'Choose two spells from any class, of a level you can cast or a '
            + 'cantrip. They count as bard spells and are already included in your '
            + 'Spells Known total. Pick them with your DM — the app offers the bard '
            + 'list only.',
          dmPromptable: true
        }]
      })
    })),

    // --- 20th --------------------------------------------------------------
    {
      id: `${BARD}.superior-inspiration`, name: 'Superior Inspiration',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 20,
      effects: source({
        id: `${BARD}.superior-inspiration`, name: 'Superior Inspiration',
        completeness: 'partial',
        // Nothing fires on rolling initiative — there are no triggers on roll
        // events. The monk's Perfect Self is the same shape at the same level.
        narrative: [{
          text: 'When you roll initiative with no uses of Bardic Inspiration left, '
            + 'you regain one. Restore it yourself at the top of a fight.',
          dmPromptable: true
        }]
      })
    }
  ]
}

// ===========================================================================
// Subclass — College of Lore (SRD p13-14)
// ===========================================================================

/**
 * Lore was two class features on the bard itself — granted to every bard at
 * 3rd level whether they had joined the college or not — while the class also
 * declared a subclass slot pointing at a `srd:subclass.lore` nobody had
 * defined. The same shape the cleric's Life Domain was in.
 */
export const COLLEGE_OF_LORE: SubclassDefinition = {
  id: 'srd:subclass.lore', name: 'College of Lore',
  provenance: 'srd', contentVersion: 1,
  classId: BARD,
  features: [
    {
      id: 'srd:subclass.lore.bonus-proficiencies', name: 'Bonus Proficiencies',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 3,
      effects: source({
        id: 'srd:subclass.lore.bonus-proficiencies', name: 'Bonus Proficiencies',
        proficiencies: [chosenProf('skill', 'lore-skills')],
        selections: [{
          id: 'lore-skills', prompt: 'Choose three skills of your choice',
          kind: 'skill', count: 3, from: ALL_SKILLS
        }]
      })
    },
    {
      id: 'srd:subclass.lore.cutting-words', name: 'Cutting Words',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 3,
      effects: source({
        id: 'srd:subclass.lore.cutting-words', name: 'Cutting Words',
        completeness: 'partial',
        // The reaction and its cost are ordinary; the subtraction is Bardic
        // Inspiration's problem in the opposite direction — a die applied to a
        // roll made by a creature that is not this character.
        actions: [{
          id: 'bard.lore.cutting-words', name: 'Cutting Words',
          kind: 'ability', cost: 'reaction',
          description: 'Expend a Bardic Inspiration die to subtract it from a creature’s roll.',
          requirements: { resourceAtLeast: ['bard.bardicInspiration', 1] },
          costs: { 'bard.bardicInspiration': 1 },
          targets: { selector: 'creature', count: 1, rangeFeet: 60 }
        }],
        narrative: [{
          text: 'When a creature within 60 feet you can see makes an attack roll, '
            + 'ability check or damage roll, subtract your Bardic Inspiration die '
            + 'from it — decided after their roll but before you know the outcome. '
            + 'A creature that cannot hear you, or that is immune to being '
            + 'charmed, is unaffected. Roll and apply the subtraction at the table.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.lore.additional-magical-secrets',
      name: 'Additional Magical Secrets',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 6,
      effects: source({
        id: 'srd:subclass.lore.additional-magical-secrets',
        name: 'Additional Magical Secrets',
        completeness: 'partial',
        narrative: [{
          text: 'Learn two spells from any class, of a level you can cast or a '
            + 'cantrip. Unlike Magical Secrets these do NOT count against your '
            + 'Spells Known. Pick them with your DM.',
          dmPromptable: true
        }]
      })
    },
    {
      id: 'srd:subclass.lore.peerless-skill', name: 'Peerless Skill',
      provenance: 'srd', contentVersion: 1, grantedAtLevel: 14,
      effects: source({
        id: 'srd:subclass.lore.peerless-skill', name: 'Peerless Skill',
        completeness: 'partial',
        actions: [{
          id: 'bard.lore.peerless-skill', name: 'Peerless Skill',
          kind: 'ability', cost: 'free',
          description: 'Expend a Bardic Inspiration die and add it to your ability check.',
          requirements: { resourceAtLeast: ['bard.bardicInspiration', 1] },
          costs: { 'bard.bardicInspiration': 1 }
        }],
        // This one IS on the bard's own roll, unlike Cutting Words — but it is
        // decided after the die is read, and the roll pipeline has no window
        // that reopens a resolved roll. Guidance has the same problem.
        narrative: [{
          text: 'Add a Bardic Inspiration die to an ability check you have already '
            + 'rolled, before the DM says whether you succeeded. Roll and add it '
            + 'yourself — the app cannot reopen a roll you have seen.',
          dmPromptable: true
        }]
      })
    }
  ]
}

export const BARD_SUBCLASSES: SubclassDefinition[] = [COLLEGE_OF_LORE]

/** Columns nothing reads yet. */
export const BARD_TABLE = {
  asiLevels: BARD_ASI_LEVELS,
  inspirationDie: BARD_INSPIRATION_DIE,
  songOfRestDie: BARD_SONG_OF_REST_DIE,
  cantripsKnown: BARD_CANTRIPS_KNOWN,
  spellsKnown: BARD_SPELLS_KNOWN
}

// ===========================================================================
// Kit — the shortsword and longsword already exist; the two martial
// exceptions in the bard's proficiency list, and the focus, do not
// ===========================================================================

export const RAPIER: ItemDefinition = {
  id: 'srd:weapon.rapier', name: 'Rapier',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'common', slot: 'mainHand', costCp: 2500,
  weapon: {
    category: 'martial', reach: 'melee', damage: { count: 1, sides: 8 },
    damageType: 'piercing', properties: ['finesse']
  },
  effects: source({ id: 'srd:weapon.rapier', name: 'Rapier', kind: 'item' })
}

export const HAND_CROSSBOW: ItemDefinition = {
  id: 'srd:weapon.hand-crossbow', name: 'Hand Crossbow',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'weapon', rarity: 'common', slot: 'mainHand', costCp: 7500,
  weapon: {
    category: 'martial', reach: 'ranged', damage: { count: 1, sides: 6 },
    damageType: 'piercing', properties: ['ammunition', 'light', 'loading'],
    normalRangeFeet: 30, longRangeFeet: 120
  },
  effects: source({ id: 'srd:weapon.hand-crossbow', name: 'Hand Crossbow', kind: 'item' })
}

/**
 * A lute, and the reason it is here rather than in a props list: the SRD makes
 * a musical instrument a bard's spellcasting focus, so the focus is an item the
 * character carries and a tool proficiency they may hold — both already
 * modelled — and not a caster-specific field.
 */
export const LUTE: ItemDefinition = {
  id: 'srd:tool.lute', name: 'Lute',
  provenance: 'srd', contentVersion: 1, rulesetVersion: V,
  category: 'tool', rarity: 'common', weight: 2, costCp: 3500,
  effects: source({
    id: 'srd:tool.lute', name: 'Lute', kind: 'item',
    narrative: [{
      text: 'A musical instrument serves as a bard’s spellcasting focus, '
        + 'replacing the material components of a spell that names no cost.',
      dmPromptable: false
    }]
  })
}

export const BARD_SPECIES: SpeciesDefinition[] = [HALF_ELF]
export const BARD_CLASSES: ClassDefinition[] = [BARD_CLASS]
export const BARD_ITEMS: ItemDefinition[] = [RAPIER, HAND_CROSSBOW, LUTE]
