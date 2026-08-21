// Turning a blank slate into a level-1 character.
//
// This is not a general character-building engine — it is the smallest thing
// that gets a new player from nothing to a playable, saved character. Two
// deliberate simplifications, both documented rather than hidden:
//
//  1. ABILITY SCORES use the SRD standard array (15/14/13/12/10/8), assigned by
//     the player to the six abilities. Point buy and rolling are not offered.
//     `abilityScoreBase` is the array BEFORE racial bonuses — species effects
//     add their bonus on top when the character resolves, so a dwarf who put
//     13 in Constitution ends up with 15, not 13.
//
//  2. STARTING EQUIPMENT is one curated kit per class, not the SRD's full
//     branching choice ("a martial weapon and a shield, or two martial
//     weapons"). The kit uses only items that already exist in content. A
//     richer equipment-choice UI is future work; a wrong-but-playable sword
//     beats a creation flow that cannot finish because the perfect one does
//     not exist yet.
//
// Feats and subclasses are absent on purpose: both are level-4+ concerns, and
// this only ever creates a level-1 character. There is nothing to pick yet.

import {
  ABILITIES,
  type Ability, type Character, type ClassId, type ContentIndex, type SpeciesId
} from '../rules/types.js'
import { validateCharacter, type Problem } from '../rules/validate.js'
import { createResolution } from '../rules/resolve.js'
import { HP_MAX } from '../rules/statPaths.js'

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const

export interface StartingKitItem {
  instanceId: string
  definitionId: string
  quantity?: number
}

export interface StartingKit {
  items: StartingKitItem[]
  /** slot -> instanceId, using the instanceIds this kit assigns below. */
  equipped: Record<string, string>
}

/**
 * One sensible kit per class, built only from items already in content.
 *
 * Every class gets a potion of healing — a new character with nothing to
 * drink in a pinch is a worse first session than a curated kit lacking the
 * SRD's full branching choice.
 */
const STARTING_KITS: Record<string, () => StartingKit> = {
  'srd:class.fighter': () => kit([
    slot('armor', 'srd:armor.chain-mail'),
    slot('shield', 'srd:armor.shield'),
    slot('mainHand', 'srd:weapon.longsword'),
    carried('srd:item.potion-of-healing', 2)
  ]),
  'srd:class.wizard': () => kit([
    slot('mainHand', 'srd:weapon.dagger'),
    carried('srd:item.potion-of-healing')
  ]),
  'srd:class.rogue': () => kit([
    slot('mainHand', 'srd:weapon.shortsword'),
    slot('armor', 'srd:armor.leather'),
    carried('srd:weapon.dagger'),
    carried('srd:item.potion-of-healing')
  ]),
  'srd:class.cleric': () => kit([
    slot('mainHand', 'srd:weapon.mace'),
    slot('armor', 'srd:armor.chain-mail'),
    slot('shield', 'srd:armor.shield'),
    carried('srd:item.potion-of-healing', 2)
  ]),
  'srd:class.barbarian': () => kit([
    // No armour, no shield — Unarmoured Defense is the point of the class.
    slot('mainHand', 'srd:weapon.greataxe'),
    carried('srd:weapon.javelin', 4),
    carried('srd:item.potion-of-healing', 2)
  ]),
  'srd:class.bard': () => kit([
    slot('mainHand', 'srd:weapon.rapier'),
    slot('armor', 'srd:armor.leather'),
    carried('srd:weapon.dagger'),
    carried('srd:item.potion-of-healing')
  ]),
  'srd:class.warlock': () => kit([
    slot('mainHand', 'srd:weapon.rapier'),
    carried('srd:item.potion-of-healing')
  ]),
  'srd:class.druid': () => kit([
    // Hide rather than metal armour, and a scimitar rather than a bladed
    // weapon that needs metal — druids famously will not wear or wield either.
    slot('mainHand', 'srd:weapon.scimitar'),
    slot('armor', 'srd:armor.hide'),
    carried('srd:item.potion-of-healing')
  ]),
  'srd:class.paladin': () => kit([
    slot('mainHand', 'srd:weapon.longsword'),
    slot('armor', 'srd:armor.chain-mail'),
    slot('shield', 'srd:armor.shield'),
    carried('srd:item.potion-of-healing', 2)
  ]),
  'srd:class.sorcerer': () => kit([
    slot('mainHand', 'srd:weapon.dagger'),
    carried('srd:item.potion-of-healing')
  ])
}

let n = 0
function nextId(): string { return `start-${++n}` }

interface KitEntry { slotName?: string; item: StartingKitItem }

function slot(slotName: string, definitionId: string): KitEntry {
  return { slotName, item: { instanceId: nextId(), definitionId } }
}
function carried(definitionId: string, quantity?: number): KitEntry {
  return { item: { instanceId: nextId(), definitionId, ...(quantity ? { quantity } : {}) } }
}
function kit(entries: KitEntry[]): StartingKit {
  const equipped: Record<string, string> = {}
  for (const e of entries) if (e.slotName) equipped[e.slotName] = e.item.instanceId
  return { items: entries.map((e) => e.item), equipped }
}

export function startingKitFor(classId: string): StartingKit | undefined {
  return STARTING_KITS[classId]?.()
}

/**
 * Answers every "choose your spells" selection a level-1 class feature offers,
 * by taking the first `count` entries from its own pool.
 *
 * A bard or druid built by `createCharacter` would otherwise know its class
 * features but no actual spells: `character.selections` starts empty, and a
 * grant behind an unanswered selection resolves to nothing — the character
 * would be a caster with an empty spellbook. This is the same simplification
 * as the fixed starting kit above and the standard-array-only abilities:
 * where the SRD offers a real choice this module cannot yet put in front of a
 * player, it makes the choice deterministically rather than leaving the
 * character half-built. A later UI can let the player redo it; nothing here
 * stops that, because `selections` is ordinary character state, not baked in.
 */
function defaultSelections(
  classId: string, content: ContentIndex
): Record<string, Record<string, string[]>> {
  const klass = content.classes.get(classId)
  if (!klass) return {}

  const out: Record<string, Record<string, string[]>> = {}
  for (const feature of klass.features) {
    if (feature.grantedAtLevel > 1) continue
    for (const sel of feature.effects.selections ?? []) {
      if (sel.kind !== 'spellList' || !sel.from) continue
      out[feature.effects.id] ??= {}
      out[feature.effects.id]![sel.id] = sel.from.slice(0, sel.count)
    }
  }
  return out
}

export interface CreateCharacterInput {
  id: string
  campaignId: string
  name: string
  speciesId: SpeciesId
  subspeciesId?: string
  classId: ClassId
  /** One of the six abilities per standard-array value, each value used once. */
  abilityScores: Record<Ability, number>
}

export interface CreateCharacterResult {
  character?: Character
  problems: Problem[]
}

/**
 * Builds a level-1 Character from a creation form's answers.
 *
 * Pure and synchronous — no I/O, so a UI can call this on every keystroke to
 * show a live preview, and the same function is what a script or a test calls.
 * Validation runs before returning: a character this function will not build
 * cleanly must not reach the caller half-formed.
 */
export function createCharacter(
  input: CreateCharacterInput, content: ContentIndex
): CreateCharacterResult {
  const problems: Problem[] = []
  const err = (message: string): void => {
    problems.push({ severity: 'error', where: input.id, message })
  }

  const species = content.species.get(input.speciesId)
  if (!species) err(`unknown species "${input.speciesId}"`)
  if (species?.subspecies && species.subspecies.length > 0) {
    if (!input.subspeciesId) {
      err(`${species.effects.name} requires choosing a subspecies`)
    } else if (!species.subspecies.some((s) => s.id === input.subspeciesId)) {
      err(`"${input.subspeciesId}" is not a subspecies of "${input.speciesId}"`)
    }
  } else if (input.subspeciesId) {
    err(`"${input.speciesId}" has no subspecies to choose`)
  }

  const klass = content.classes.get(input.classId)
  if (!klass) err(`unknown class "${input.classId}"`)

  const scores = Object.values(input.abilityScores)
  const wanted = [...STANDARD_ARRAY].sort((a, b) => a - b)
  const got = [...scores].sort((a, b) => a - b)
  if (ABILITIES.some((a) => input.abilityScores[a] === undefined)) {
    err('every ability needs a score')
  } else if (JSON.stringify(got) !== JSON.stringify(wanted)) {
    err(`ability scores must be the standard array (${STANDARD_ARRAY.join('/')}), each used once`)
  }

  if (!input.name.trim()) err('a character needs a name')

  if (problems.length > 0) return { problems }

  const startKit = startingKitFor(input.classId)
  const instances = (startKit?.items ?? []).map((i) => ({
    instanceId: i.instanceId,
    definitionId: i.definitionId,
    contentVersion: content.items.get(i.definitionId)?.contentVersion ?? 1,
    identified: true,
    ...(i.quantity ? { quantity: i.quantity } : {})
  }))

  // Wearing armour toggles Fighting-Style-style "while armoured" clauses; a
  // starting kit that equips armour should start with it worn.
  const wearingArmor = Object.keys(startKit?.equipped ?? {}).includes('armor')

  const selections = defaultSelections(input.classId, content)

  const draft: Character = {
    id: input.id,
    campaignId: input.campaignId,
    name: input.name.trim(),
    speciesId: input.speciesId,
    ...(input.subspeciesId ? { subspeciesId: input.subspeciesId } : {}),
    classLevels: [{ classId: input.classId, level: 1 }],
    abilityScoreBase: input.abilityScores,
    buildChoices: [],
    ...(Object.keys(selections).length > 0 ? { selections } : {}),
    // Placeholder — never store a derived value, but this field cannot be
    // omitted, and the real number needs a resolution to compute. Replaced
    // below with the resolver's own answer before this ever leaves the module.
    hitPointsCurrent: 0,
    hitPointsTemp: 0,
    hitDiceSpent: {},
    resourcesSpent: {},
    conditions: [],
    effectInstances: [],
    exhaustionLevel: 0,
    inventory: {
      instances,
      equipped: startKit?.equipped ?? {},
      attunedInstanceIds: []
    },
    deathSaves: { successes: 0, failures: 0 },
    toggles: wearingArmor ? { 'wearing-armor': true } : {}
  }

  // A brand-new character starts at full health, and "full" is whatever the
  // engine's own class-feature formulas say it is — this asks rather than
  // recomputing a hit-die-plus-Constitution formula a second time outside it.
  const maxHp = createResolution(draft, content).stat(HP_MAX).total
  const character: Character = { ...draft, hitPointsCurrent: maxHp }

  problems.push(...validateCharacter(character))
  if (problems.some((p) => p.severity === 'error')) return { problems }

  return { character, problems }
}
