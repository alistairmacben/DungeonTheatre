// Commands and the state transition.
//
// The reducer is pure: randomness arrives as an argument, so a transition is
// deterministic and testable and the authority is the only thing that touches
// an RNG. That is the same property that makes the resolver shareable between
// client and server.
//
// Rejection is a first-class result, never an exception. A race — two players
// grabbing the same item — produces an explanation the UI can show, not a
// silent no-op.

import type {
  Character, ContentIndex, EffectSource, GameEvent
} from '../rules/types.js'
import { createResolution, characterLevel } from '../rules/resolve.js'
import { resolveResources, applyRest } from '../rules/resources.js'
import { cheapestSlot, resolveSpellcasting } from '../rules/spells.js'
import { resolveSpellAttackRoll, resolveSpellEffect } from '../rules/spellEffect.js'
import { diceMismatch, totalDamageRoll, type PoolKind } from '../rules/rollDamage.js'
import { resolveCheck } from '../rules/check.js'
import { resolveAttack } from '../rules/attack.js'
import { applyOutcome } from '../rules/roll.js'
import { applyDamage, assignTemporaryHitPoints } from '../rules/damage.js'
import { resistancesOf } from '../rules/attack.js'
import { HP_MAX } from '../rules/statPaths.js'
import type { RollResolution, RollResult } from '../rules/types.js'
import type { PlayerCommand } from './types.js'
import { buildPlayerView } from './build.js'

export interface CommandResult {
  character: Character
  events: DomainEvent[]
  /** Present when nothing changed, carrying the same reasons an ActionView shows. */
  rejected?: { reasons: string[] }
}

/** Domain-shaped, never presentational. `ScreenShake` is wrong; `Bloodied` is right. */
export interface DomainEvent extends Omit<GameEvent, 'id' | 'seq' | 'timestampSeconds'> {
  type: DomainEventType
}

export type DomainEventType =
  | 'ItemEquipped' | 'ItemUnequipped' | 'ItemAttuned' | 'AttunementEnded'
  | 'ItemUsed' | 'ItemTransferred'
  | 'ResourceSpent' | 'ResourceRestored' | 'LastUseSpent'
  | 'ConditionApplied' | 'ConditionRemoved'
  | 'ToggleChanged'
  | 'ShortRestTaken' | 'LongRestTaken'
  | 'AbilityUsed'
  | 'SpellCast' | 'SpellsPrepared' | 'ConcentrationBroken'
  | 'LeveledUp' | 'BuildChoiceAnswered' | 'SelectionAnswered'
  | 'RollMade'
  | 'DamageTaken' | 'Healed' | 'TemporaryHitPointsGained' | 'Bloodied' | 'Downed'
  | 'EffectApplied' | 'EffectRemoved' | 'ResourceSet'
  | 'CommandRejected'

const MAX_ATTUNED = 3

const clone = (c: Character): Character => structuredClone(c)

function event(type: DomainEventType, character: Character, payload: Record<string, unknown>): DomainEvent {
  return { type, campaignId: character.campaignId, actorId: character.id, payload }
}

function reject(character: Character, reasons: string[]): CommandResult {
  return {
    character,
    events: [event('CommandRejected', character, { reasons })],
    rejected: { reasons }
  }
}

/**
 * Applies one command. The caller — the authority — is responsible for having
 * already established that this player may issue it.
 */
export function applyCommand(
  character: Character,
  command: PlayerCommand,
  content: ContentIndex
): CommandResult {
  switch (command.type) {
    case 'equipItem': return equipItem(character, command, content)
    case 'unequipItem': return unequipItem(character, command, content)
    case 'attuneItem': return attuneItem(character, command, content)
    case 'endAttunement': return endAttunement(character, command)
    case 'useItem': return useItem(character, command, content)
    case 'useAbility': return useAbility(character, command, content)
    case 'castSpell': return castSpell(character, command, content)
    case 'prepareSpells': return prepareSpells(character, command, content)
    case 'endConcentration': return endConcentration(character)
    case 'makeCheck': return makeCheck(character, command, content)
    case 'makeSave': return makeSave(character, command, content)
    case 'makeAttack': return makeAttack(character, command, content)
    case 'rollDamage': return rollDamage(character, command, content)
    case 'dmDamage': return dmDamage(character, command, content)
    case 'dmHeal': return dmHeal(character, command, content)
    case 'dmTemporaryHitPoints': return dmTemporaryHitPoints(character, command)
    case 'dmSetResource': return dmSetResource(character, command, content)
    case 'dmApplyEffect': return dmApplyEffect(character, command)
    case 'dmRemoveEffect': return dmRemoveEffect(character, command)
    case 'spendResource': return spendResource(character, command, content)
    case 'restoreResource': return restoreResource(character, command)
    case 'applyCondition': return applyCondition(character, command, content)
    case 'removeCondition': return removeCondition(character, command)
    case 'setToggle': return setToggle(character, command)
    case 'shortRest': return rest(character, content, 'short')
    case 'longRest': return rest(character, content, 'long')
    case 'levelUp': return levelUp(character, command, content)
    case 'answerBuildChoice': return answerBuildChoice(character, command, content)
    case 'answerSelection': return answerSelection(character, command, content)
    default:
      // Rolls, attacks and spell effects are resolved by the authority against
      // the rules engine, not by this reducer — it only moves state.
      return reject(character, [`command "${command.type}" is not a state transition`])
  }
}

// ---------------------------------------------------------------------------

function equipItem(
  character: Character,
  command: Extract<PlayerCommand, { type: 'equipItem' }>,
  content: ContentIndex
): CommandResult {
  const inst = character.inventory.instances.find((i) => i.instanceId === command.instanceId)
  if (!inst) return reject(character, ['that item is not in your inventory'])
  const def = content.items.get(inst.definitionId)
  if (!def) return reject(character, ['that item no longer exists in the loaded content'])
  if (!def.slot) return reject(character, [`${def.name} cannot be equipped`])
  if (def.slot !== command.slot) {
    return reject(character, [`${def.name} goes in the ${def.slot} slot, not ${command.slot}`])
  }

  const next = clone(character)
  const displaced = next.inventory.equipped[command.slot as keyof typeof next.inventory.equipped]
  next.inventory.equipped[command.slot as keyof typeof next.inventory.equipped] = command.instanceId

  const events: DomainEvent[] = []
  if (displaced && displaced !== command.instanceId) {
    events.push(event('ItemUnequipped', next, { instanceId: displaced, slot: command.slot }))
  }
  events.push(event('ItemEquipped', next, {
    instanceId: command.instanceId, itemId: def.id, slot: command.slot, itemName: def.name
  }))
  return { character: next, events }
}

function unequipItem(
  character: Character,
  command: Extract<PlayerCommand, { type: 'unequipItem' }>,
  content: ContentIndex
): CommandResult {
  const slot = command.slot as keyof Character['inventory']['equipped']
  const instanceId = character.inventory.equipped[slot]
  if (!instanceId) return reject(character, [`nothing is equipped in the ${command.slot} slot`])

  const next = clone(character)
  delete next.inventory.equipped[slot]
  const inst = next.inventory.instances.find((i) => i.instanceId === instanceId)
  const def = inst ? content.items.get(inst.definitionId) : undefined
  return {
    character: next,
    events: [event('ItemUnequipped', next, {
      instanceId, slot: command.slot, itemName: def?.name
    })]
  }
}

function attuneItem(
  character: Character,
  command: Extract<PlayerCommand, { type: 'attuneItem' }>,
  content: ContentIndex
): CommandResult {
  const inst = character.inventory.instances.find((i) => i.instanceId === command.instanceId)
  if (!inst) return reject(character, ['that item is not in your inventory'])
  const def = content.items.get(inst.definitionId)
  if (!def) return reject(character, ['that item no longer exists in the loaded content'])
  if (!def.requiresAttunement) return reject(character, [`${def.name} does not require attunement`])
  if (character.inventory.attunedInstanceIds.includes(command.instanceId)) {
    return reject(character, [`already attuned to ${def.name}`])
  }
  if (character.inventory.attunedInstanceIds.length >= MAX_ATTUNED) {
    return reject(character, [`you can be attuned to only ${MAX_ATTUNED} items at once`])
  }
  // "A creature can't attune to more than one copy of an item."
  const duplicate = character.inventory.attunedInstanceIds.some((id) => {
    const other = character.inventory.instances.find((i) => i.instanceId === id)
    return other?.definitionId === inst.definitionId
  })
  if (duplicate) return reject(character, [`you cannot attune to two copies of ${def.name}`])

  const next = clone(character)
  next.inventory.attunedInstanceIds.push(command.instanceId)
  return {
    character: next,
    events: [event('ItemAttuned', next, { instanceId: command.instanceId, itemName: def.name })]
  }
}

function endAttunement(
  character: Character,
  command: Extract<PlayerCommand, { type: 'endAttunement' }>
): CommandResult {
  if (!character.inventory.attunedInstanceIds.includes(command.instanceId)) {
    return reject(character, ['you are not attuned to that item'])
  }
  const next = clone(character)
  next.inventory.attunedInstanceIds =
    next.inventory.attunedInstanceIds.filter((id) => id !== command.instanceId)
  return {
    character: next,
    events: [event('AttunementEnded', next, { instanceId: command.instanceId })]
  }
}

function useItem(
  character: Character,
  command: Extract<PlayerCommand, { type: 'useItem' }>,
  content: ContentIndex
): CommandResult {
  const inst = character.inventory.instances.find((i) => i.instanceId === command.instanceId)
  if (!inst) return reject(character, ['that item is not in your inventory'])
  const def = content.items.get(inst.definitionId)
  if (!def) return reject(character, ['that item no longer exists in the loaded content'])

  const resolution = createResolution(character, content)
  if (!resolution.capability('takeActions').allowed) {
    return reject(character, ['you cannot take actions right now'])
  }

  const next = clone(character)
  const target = next.inventory.instances.find((i) => i.instanceId === command.instanceId)!
  const events: DomainEvent[] = [
    event('ItemUsed', next, { instanceId: command.instanceId, itemId: def.id, itemName: def.name })
  ]

  if (def.category === 'consumable') {
    const remaining = (target.quantity ?? 1) - 1
    if (remaining > 0) target.quantity = remaining
    else {
      next.inventory.instances = next.inventory.instances.filter(
        (i) => i.instanceId !== command.instanceId)
    }
    // A consumable's effect becomes an effect instance, resolved by the same
    // machinery as a spell or a condition.
    next.effectInstances.push({
      instanceId: `ei-${command.instanceId}-${next.effectInstances.length}`,
      definitionId: def.id,
      contentVersion: def.contentVersion,
      appliedAtSeconds: 0
    })
  }

  return { character: next, events }
}

/**
 * Uses an ability declared by any effect source.
 *
 * Availability is not re-derived here. The view already decides whether an
 * action can be taken, and asking it again is what guarantees the reason a
 * button was disabled is exactly the reason a command is refused — one rule,
 * one place. Costs come from the action's own `costs` map, so a class feature,
 * a feat and a DM-authored ability all spend through the same code.
 */
function useAbility(
  character: Character,
  command: Extract<PlayerCommand, { type: 'useAbility' }>,
  content: ContentIndex
): CommandResult {
  const view = buildPlayerView(createResolution(character, content), content, { detail: 'summary' })
  const action = view.actions.find((a) => a.id === command.actionId)
  if (!action) return reject(character, ['you do not have that ability'])
  if (!action.available) return reject(character, action.unavailableReasons)

  const next = clone(character)
  const events: DomainEvent[] = [
    event('AbilityUsed', next, {
      actionId: action.id, label: action.label, sourceId: command.sourceId
    })
  ]

  const resources = resolveResources(createResolution(character, content))
  for (const cost of action.costs) {
    const resource = resources.find((x) => x.id === cost.resourceId)
    next.resourcesSpent[cost.resourceId] =
      (next.resourcesSpent[cost.resourceId] ?? 0) + cost.amount
    const left = (resource?.remaining ?? cost.amount) - cost.amount
    events.push(event('ResourceSpent', next, {
      resourceId: cost.resourceId, label: resource?.name ?? cost.resourceId,
      amount: cost.amount, remaining: left
    }))
    if (left === 0) {
      events.push(event('LastUseSpent', next, {
        resourceId: cost.resourceId, label: resource?.name ?? cost.resourceId
      }))
    }
  }

  return { character: next, events }
}

/**
 * Casts a spell.
 *
 * Which slot to spend is the player's decision when they have one to make, so
 * the command may name a slot; when it does not, the cheapest that will do the
 * job is spent. Upcasting is therefore not a separate command — it is the same
 * command with a different slot.
 */
function castSpell(
  character: Character,
  command: Extract<PlayerCommand, { type: 'castSpell' }>,
  content: ContentIndex
): CommandResult {
  const casting = resolveSpellcasting(createResolution(character, content), content)
  const target = casting.accessible.find((s) => s.spell.id === command.spellId)
  if (!target) return reject(character, ['you do not have access to that spell'])
  if (!target.available) return reject(character, target.unavailableReasons)

  // A named slot must exist, be high enough and have a charge left. Saying
  // which of the three failed is the difference between a usable error and a
  // shrug.
  let slot = cheapestSlot(target)
  if (command.slotResourceId) {
    const chosen = target.slotOptions.find((s) => s.resourceId === command.slotResourceId)
    if (!chosen) {
      return reject(character, [`${target.spell.name} cannot be cast from that slot`])
    }
    if (chosen.remaining < 1) return reject(character, [`no ${chosen.label} remaining`])
    slot = chosen
  }

  const next = clone(character)
  const events: DomainEvent[] = []

  // Concentration is exclusive, and losing the old spell is a thing that
  // happened to the character — the theatre should be able to show it.
  if (target.spell.concentration && next.concentratingOn) {
    const previous = next.effectInstances.find((e) => e.instanceId === next.concentratingOn)
    next.effectInstances = next.effectInstances.filter(
      (e) => e.instanceId !== next.concentratingOn)
    events.push(event('ConcentrationBroken', next, {
      reason: 'a new concentration spell was cast',
      endedInstanceId: next.concentratingOn,
      endedDefinitionId: previous?.definitionId
    }))
    delete next.concentratingOn
  }

  if (target.spell.level > 0 && slot) {
    next.resourcesSpent[slot.resourceId] = (next.resourcesSpent[slot.resourceId] ?? 0) + 1
    events.push(event('ResourceSpent', next, {
      resourceId: slot.resourceId, label: slot.label,
      amount: 1, remaining: slot.remaining - 1
    }))
    if (slot.remaining - 1 === 0) {
      events.push(event('LastUseSpent', next, {
        resourceId: slot.resourceId, label: slot.label
      }))
    }
  }

  for (const cost of target.costs) {
    next.resourcesSpent[cost.resourceId] = (next.resourcesSpent[cost.resourceId] ?? 0) + cost.amount
    events.push(event('ResourceSpent', next, {
      resourceId: cost.resourceId, label: cost.label,
      amount: cost.amount, remaining: cost.remaining - cost.amount
    }))
  }

  // A spell that lasts becomes an effect instance, resolved by exactly the
  // machinery that resolves a condition or a potion.
  const lasts = target.spell.concentration || (target.spell.durationSeconds ?? 0) > 0
  if (lasts) {
    const instanceId = `ei-${target.spell.id}-${next.effectInstances.length}`
    next.effectInstances.push({
      instanceId,
      definitionId: target.spell.id,
      contentVersion: target.spell.contentVersion,
      appliedAtSeconds: 0
    })
    if (target.spell.concentration) next.concentratingOn = instanceId
  }

  // The one-shot effect at the level it was actually cast, so the DM has a
  // damage number to apply rather than a paragraph to read. Nothing is applied
  // here — theatre-of-the-mind, the DM adjudicates what it hits.
  const resolved = resolveSpellEffect(
    target.spell,
    {
      ability: target.ability,
      characterLevel: characterLevel(character),
      slotLevel: slot?.level ?? target.spell.level
    },
    createResolution(character, content)
  )

  // The to-hit roll, for a spell that needs one. It happens here rather than in
  // a follow-up command because casting and rolling to hit are a single act at
  // the table — and because a separate command would let a player spend the
  // slot, see something they disliked, and never roll.
  if (resolved?.delivery === 'attack') {
    const attackRoll = resolveSpellAttackRoll(createResolution(character, content))
    const faces = command.faces ?? []
    const problem = facesProblem(attackRoll, faces)
    if (problem) return reject(character, [problem])
    const result = applyOutcome(attackRoll, {
      faces, keptIndex: keptIndexOf(faces, attackRoll.dice.keep)
    })
    events.push(rollEvent(next, `${target.spell.name} attack`, 'attack', attackRoll, result, {
      spellId: target.spell.id,
      spellName: target.spell.name,
      damage: resolved.damage
    }))
  }

  events.unshift(event('SpellCast', next, {
    spellId: target.spell.id,
    label: target.spell.name,
    level: target.spell.level,
    castAtLevel: slot?.level ?? target.spell.level,
    upcast: slot !== undefined && slot.level > target.spell.level,
    concentration: target.spell.concentration,
    saveDc: casting.saveDc.total,
    attackBonus: casting.attackBonus.total,
    // Structured, for the DM to act on in one click; absent for spells with no
    // one-shot effect (Detect Magic and the like).
    ...(resolved
      ? {
        effect: {
          delivery: resolved.delivery,
          summary: resolved.label,
          damage: resolved.damage,
          instances: resolved.instances,
          ...(resolved.healing ? { healing: resolved.healing } : {}),
          ...(resolved.save ? { save: resolved.save } : {}),
          ...(resolved.attackBonus !== undefined ? { attackBonus: resolved.attackBonus } : {})
        }
      }
      : {})
  }))

  return { character: next, events }
}

/**
 * Sets the prepared list wholesale rather than one spell at a time, because
 * preparation is a single decision the player makes about the whole day.
 */
function prepareSpells(
  character: Character,
  command: Extract<PlayerCommand, { type: 'prepareSpells' }>,
  content: ContentIndex
): CommandResult {
  const casting = resolveSpellcasting(createResolution(character, content), content)
  const preparable = new Set(
    casting.accessible.filter((s) => !s.alwaysAvailable).map((s) => s.spell.id))

  const unknown = command.spellIds.filter((id) => !preparable.has(id))
  if (unknown.length > 0) {
    return reject(character, unknown.map((id) =>
      `${content.spells.get(id)?.name ?? id} is not a spell you can prepare`))
  }
  if (command.spellIds.length > casting.preparedMax) {
    return reject(character, [
      `you can prepare ${casting.preparedMax} spells, not ${command.spellIds.length}`
    ])
  }

  const next = clone(character)
  next.spellsPrepared = [...command.spellIds]
  return {
    character: next,
    events: [event('SpellsPrepared', next, {
      spellIds: next.spellsPrepared,
      count: next.spellsPrepared.length,
      maximum: casting.preparedMax
    })]
  }
}

function endConcentration(character: Character): CommandResult {
  if (!character.concentratingOn) {
    return reject(character, ['you are not concentrating on anything'])
  }
  const next = clone(character)
  const ended = next.effectInstances.find((e) => e.instanceId === next.concentratingOn)
  next.effectInstances = next.effectInstances.filter(
    (e) => e.instanceId !== next.concentratingOn)
  delete next.concentratingOn
  return {
    character: next,
    events: [event('ConcentrationBroken', next, {
      reason: 'released', endedDefinitionId: ended?.definitionId
    })]
  }
}

// ---------------------------------------------------------------------------
// Rolling
//
// A roll changes nothing about the character. It is an observation, and in a
// theatre-of-the-mind game the consequences are the DM's to apply — which is
// why these return the character untouched and put the whole result in an
// event. The randomness arrives as `faces`, so the reducer stays pure and the
// server can become the roller without the UI changing.
// ---------------------------------------------------------------------------

/** Which die survives advantage or disadvantage. A rule, not a random choice. */
function keptIndexOf(faces: number[], keep: 'highest' | 'lowest' | 'all'): number {
  if (keep === 'all' || faces.length < 2) return 0
  let best = 0
  for (let i = 1; i < faces.length; i++) {
    const better = keep === 'highest' ? faces[i]! > faces[best]! : faces[i]! < faces[best]!
    if (better) best = i
  }
  return best
}

function rollEvent(
  character: Character, label: string, kind: string,
  resolution: RollResolution, result: RollResult, extra: Record<string, unknown> = {}
): DomainEvent {
  return event('RollMade', character, {
    label,
    kind,
    faces: result.outcome.faces,
    natural: result.natural,
    modifier: resolution.modifierTotal,
    total: result.total,
    advantage: resolution.advantage,
    ...(result.success !== undefined ? { success: result.success } : {}),
    ...(result.critical ? { critical: true } : {}),
    ...(result.criticalMiss ? { criticalMiss: true } : {}),
    incomplete: resolution.incomplete,
    // The full breakdown travels with the result, so "why is it that number"
    // is answerable from the event alone.
    // `op` travels with the value because a proficiency term's value is a
    // multiplier, not an addend. Dropping it makes a reader add "×2" as "+2"
    // and the explanation stops matching the total.
    terms: result.terms.map((t) => ({
      source: t.sourceName, value: t.value, op: t.op, applied: t.applied,
      ...(t.reason ? { reason: t.reason } : {}),
      ...(t.note ? { note: t.note } : {})
    })),
    notes: resolution.notes
  })
}

/**
 * Rejects a face count that does not match what the resolution asked for.
 *
 * Silently accepting the wrong number would let a client roll one die and claim
 * advantage, which is precisely the check the server will need.
 */
function facesProblem(resolution: RollResolution, faces: number[]): string | undefined {
  if (faces.length !== resolution.dice.count) {
    return `this roll needs ${resolution.dice.count} d20, not ${faces.length}`
  }
  if (faces.some((f) => !Number.isInteger(f) || f < 1 || f > resolution.dice.sides)) {
    return `a d${resolution.dice.sides} cannot show that`
  }
  return undefined
}

function makeCheck(
  character: Character,
  command: Extract<PlayerCommand, { type: 'makeCheck' }>,
  content: ContentIndex
): CommandResult {
  const r = createResolution(character, content)
  const resolution = resolveCheck(r, {
    checkType: command.checkType,
    ...(command.ability ? { ability: command.ability } : {}),
    ...(command.skill ? { skill: command.skill } : {})
  })
  const problem = facesProblem(resolution, command.faces)
  if (problem) return reject(character, [problem])

  const result = applyOutcome(resolution, {
    faces: command.faces,
    keptIndex: keptIndexOf(command.faces, resolution.dice.keep)
  })
  return {
    character,
    events: [rollEvent(character, resolution.label, command.checkType, resolution, result)]
  }
}

function makeSave(
  character: Character,
  command: Extract<PlayerCommand, { type: 'makeSave' }>,
  content: ContentIndex
): CommandResult {
  const r = createResolution(character, content)
  const resolution = resolveCheck(r, { checkType: 'savingThrow', ability: command.ability })
  const problem = facesProblem(resolution, command.faces)
  if (problem) return reject(character, [problem])

  const result = applyOutcome(resolution, {
    faces: command.faces,
    keptIndex: keptIndexOf(command.faces, resolution.dice.keep)
  })
  return {
    character,
    events: [rollEvent(character, resolution.label, 'save', resolution, result,
      command.dc !== undefined ? { dc: command.dc } : {})]
  }
}

function makeAttack(
  character: Character,
  command: Extract<PlayerCommand, { type: 'makeAttack' }>,
  content: ContentIndex
): CommandResult {
  const inst = character.inventory.instances.find(
    (i) => i.instanceId === command.weaponInstanceId)
  if (!inst) return reject(character, ['that weapon is not in your inventory'])
  const weapon = content.items.get(inst.definitionId)
  if (!weapon) return reject(character, ['that weapon no longer exists in the loaded content'])

  const r = createResolution(character, content)
  const attack = resolveAttack(r, {
    weapon,
    ...(command.targetAc !== undefined ? { targetAc: command.targetAc } : {}),
    ...(command.twoHanded !== undefined ? { twoHanded: command.twoHanded } : {})
  })
  const problem = facesProblem(attack.attackRoll, command.faces)
  if (problem) return reject(character, [problem])

  const result = applyOutcome(attack.attackRoll, {
    faces: command.faces,
    keptIndex: keptIndexOf(command.faces, attack.attackRoll.dice.keep)
  })
  return {
    character,
    events: [rollEvent(character, `${weapon.name} attack`, 'attack', attack.attackRoll, result, {
      weaponId: weapon.id,
      weaponName: weapon.name,
      // The damage the DM applies on a hit, in the form the narrator rolls it.
      damage: attack.damage.components.map((c) => ({
        dice: c.dice, flat: c.flat, type: c.type
      }))
    })]
  }
}

export type DamageSource = Extract<PlayerCommand, { type: 'rollDamage' }>['source']

/**
 * What rolling a hit's damage needs: the pools (undoubled — the caller applies
 * the critical) and a label for the roll. Shared by the reducer and by the
 * server authority, which needs the exact dice shape to roll without being
 * able to run the reducer speculatively the way it does for a d20.
 */
export function resolveDamagePools(
  character: Character, source: DamageSource, content: ContentIndex
): { pools: { type: PoolKind; dice: { count: number; sides: number }; flat: number }[]; label: string }
  | { rejected: string } {
  const r = createResolution(character, content)

  if (source.kind === 'weapon') {
    const inst = character.inventory.instances.find(
      (i) => i.instanceId === source.weaponInstanceId)
    if (!inst) return { rejected: 'that weapon is not in your inventory' }
    const weapon = content.items.get(inst.definitionId)
    if (!weapon) return { rejected: 'that weapon no longer exists in the loaded content' }
    const attack = resolveAttack(r, {
      weapon, ...(source.twoHanded !== undefined ? { twoHanded: source.twoHanded } : {})
    })
    return {
      label: weapon.name,
      pools: attack.damage.components.map((c) => ({
        type: c.type, dice: c.dice ?? { count: 0, sides: 1 }, flat: c.flat ?? 0
      }))
    }
  }

  const casting = resolveSpellcasting(r, content)
  const target = casting.accessible.find((s) => s.spell.id === source.spellId)
  if (!target) return { rejected: 'you do not have access to that spell' }
  // `accessible` lists every spell on the character's lists, prepared or not
  // — that is what lets the UI show "Fireball: not prepared" instead of
  // nothing. It means this lookup alone does not prove the spell is castable:
  // before every level-3-and-up spell existed, an unprepared, nonexistent
  // spell id happened to fail for the right-shaped wrong reason (`!target`),
  // which is exactly the kind of coincidence that survives until real content
  // exposes it. Reject on the same terms the view already computed.
  if (!target.available) return { rejected: target.unavailableReasons.join('; ') }
  const chosen = source.slotResourceId
    ? target.slotOptions.find((s) => s.resourceId === source.slotResourceId)
    : cheapestSlot(target)
  const resolved = resolveSpellEffect(
    target.spell,
    { ability: target.ability, characterLevel: characterLevel(character), slotLevel: chosen?.level ?? target.spell.level },
    r
  )
  if (!resolved) return { rejected: `${target.spell.name} has nothing to roll` }

  // Healing rolls exactly as damage does — dice plus a flat bonus, handed to
  // the DM as a number. Only the word on the front differs.
  if (resolved.healing) {
    return {
      label: target.spell.name,
      pools: [{
        type: 'healing',
        dice: { count: resolved.healing.dice.count, sides: resolved.healing.dice.sides },
        flat: resolved.healing.flatAdd
      }]
    }
  }

  if (resolved.damage.length === 0) {
    return { rejected: `${target.spell.name} has no damage to roll` }
  }
  // Instances (Magic Missile's three darts) fold into one pool per damage
  // type: three 1d4+1 rolls summed is the same total as 3d4+3 rolled once.
  return {
    label: target.spell.name,
    pools: resolved.damage.map((d) => ({
      type: d.type,
      dice: { count: d.dice.count * resolved.instances, sides: d.dice.sides },
      flat: (d.dice.modifier ?? 0) * resolved.instances
    }))
  }
}

/**
 * The follow-up to a hit: rolls the damage dice, doubled on a critical.
 *
 * Never applies anything to anyone — theatre-of-the-mind means the DM decides
 * what the attack hits and applies the total through dmDamage, same as always.
 * This only answers "how much, and of what type."
 */
function rollDamage(
  character: Character,
  command: Extract<PlayerCommand, { type: 'rollDamage' }>,
  content: ContentIndex
): CommandResult {
  const resolved = resolveDamagePools(character, command.source, content)
  if ('rejected' in resolved) return reject(character, [resolved.rejected])
  const { pools, label } = resolved

  const problem = diceMismatch(pools, command.faces, command.critical)
  if (problem) return reject(character, [problem])

  const rolled = totalDamageRoll(pools, command.faces, command.critical)
  const healing = pools.every((p) => p.type === 'healing')
  return {
    character,
    events: [event('RollMade', character, {
      label: `${label} ${healing ? 'healing' : 'damage'}`,
      kind: 'damage',
      critical: command.critical,
      pools: rolled.pools,
      total: rolled.total,
      damageLabel: rolled.label
    })]
  }
}

// ---------------------------------------------------------------------------
// The DM's hand
//
// Six verbs, not a button per D&D effect. Each composes vocabulary that already
// exists: damage runs through the same resistance pipeline a weapon does, and
// an improvised curse is an EffectSource resolved like a feat. Nothing here
// needs an enemy to exist, which is the point for a theatre-of-the-mind table —
// the DM narrates, then applies.
// ---------------------------------------------------------------------------

/** Crossing half the maximum, and dropping, are things the theatre should see. */
function vitalityEvents(
  character: Character, before: number, after: number, max: number
): DomainEvent[] {
  const out: DomainEvent[] = []
  if (after <= max / 2 && before > max / 2) {
    out.push(event('Bloodied', character, { hitPoints: after, max }))
  }
  if (after <= 0 && before > 0) out.push(event('Downed', character, { max }))
  return out
}

function dmDamage(
  character: Character,
  command: Extract<PlayerCommand, { type: 'dmDamage' }>,
  content: ContentIndex
): CommandResult {
  if (!Number.isFinite(command.amount) || command.amount < 0) {
    return reject(character, ['damage must be a positive number'])
  }
  const r = createResolution(character, content)
  const max = r.stat(HP_MAX).total

  // The DM names a number and a type. Resistance, vulnerability and temporary
  // hit points are the engine's business, not theirs.
  const result = applyDamage({
    packet: {
      components: [{ sourceId: 'dm', type: command.damageType, flat: command.amount }],
      ...(command.tags ? { tags: command.tags } : {})
    },
    rolled: [{
      sourceId: 'dm', sourceName: 'DM', type: command.damageType,
      diceTotal: command.amount, flat: 0, doublesOnCrit: false
    }],
    critical: false,
    flatReductions: [],
    resistances: resistancesOf(r),
    temporaryHitPoints: character.hitPointsTemp,
    hitPointsCurrent: Math.min(character.hitPointsCurrent, max)
  })

  const next = clone(character)
  next.hitPointsCurrent = result.hitPointsRemaining
  next.hitPointsTemp = result.temporaryHitPointsRemaining

  return {
    character: next,
    events: [
      event('DamageTaken', next, {
        amount: result.appliedToHitPoints,
        rawAmount: result.totalBeforeAbsorption,
        damageType: command.damageType,
        absorbedByTemporary: result.absorbedByTemporary,
        hitPoints: result.hitPointsRemaining,
        max,
        // Resistance halving it is exactly what a player should be shown.
        terms: result.terms.filter((t) => t.applied).map((t) => ({
          source: t.sourceName, value: t.value, ...(t.note ? { note: t.note } : {})
        })),
        notes: result.notes
      }),
      ...vitalityEvents(next, Math.min(character.hitPointsCurrent, max), result.hitPointsRemaining, max)
    ]
  }
}

function dmHeal(
  character: Character,
  command: Extract<PlayerCommand, { type: 'dmHeal' }>,
  content: ContentIndex
): CommandResult {
  if (!Number.isFinite(command.amount) || command.amount < 0) {
    return reject(character, ['healing must be a positive number'])
  }
  const max = createResolution(character, content).stat(HP_MAX).total
  const before = Math.min(character.hitPointsCurrent, max)
  const after = Math.min(before + command.amount, max)

  const next = clone(character)
  next.hitPointsCurrent = after
  return {
    character: next,
    events: [event('Healed', next, {
      amount: after - before,
      requested: command.amount,
      hitPoints: after,
      max,
      // Overhealing is worth saying rather than silently discarding.
      ...(after - before < command.amount ? { wasted: command.amount - (after - before) } : {})
    })]
  }
}

function dmTemporaryHitPoints(
  character: Character,
  command: Extract<PlayerCommand, { type: 'dmTemporaryHitPoints' }>
): CommandResult {
  // Temporary hit points never stack; the recipient chooses which pool to keep.
  // Defaulting to whichever is larger is the choice a player would always make,
  // and the engine still owns the rule so the DM cannot accidentally add them.
  const choice = command.choice
    ?? (command.amount > character.hitPointsTemp ? 'replace' : 'keep')
  const outcome = assignTemporaryHitPoints(character.hitPointsTemp, command.amount, choice)
  const next = clone(character)
  next.hitPointsTemp = outcome.value
  return {
    character: next,
    events: [event('TemporaryHitPointsGained', next, {
      amount: outcome.value, choice, note: outcome.note
    })]
  }
}

function dmSetResource(
  character: Character,
  command: Extract<PlayerCommand, { type: 'dmSetResource' }>,
  content: ContentIndex
): CommandResult {
  const resource = resolveResources(createResolution(character, content))
    .find((x) => x.id === command.resourceId)
  if (!resource) return reject(character, ['that character has no such resource'])

  const remaining = Math.max(0, Math.min(command.remaining, resource.maximum))
  const next = clone(character)
  next.resourcesSpent[command.resourceId] = resource.maximum - remaining
  return {
    character: next,
    events: [event('ResourceSet', next, {
      resourceId: command.resourceId, label: resource.name,
      remaining, maximum: resource.maximum
    })]
  }
}

function dmApplyEffect(
  character: Character,
  command: Extract<PlayerCommand, { type: 'dmApplyEffect' }>
): CommandResult {
  const next = clone(character)
  // Stamped DM-authored, so every breakdown line it produces is labelled and a
  // player can always see the number came from the table, not from the rules.
  const effect: EffectSource = { ...structuredClone(command.effect), provenance: 'dm' }
  next.adHocSources = [
    ...(next.adHocSources ?? []).filter((s) => s.id !== effect.id),
    effect
  ]
  return {
    character: next,
    events: [event('EffectApplied', next, {
      sourceId: effect.id, label: effect.name, provenance: 'dm'
    })]
  }
}

function dmRemoveEffect(
  character: Character,
  command: Extract<PlayerCommand, { type: 'dmRemoveEffect' }>
): CommandResult {
  const existing = (character.adHocSources ?? []).find((s) => s.id === command.sourceId)
  if (!existing) return reject(character, ['that effect is not on this character'])
  const next = clone(character)
  next.adHocSources = (next.adHocSources ?? []).filter((s) => s.id !== command.sourceId)
  return {
    character: next,
    events: [event('EffectRemoved', next, { sourceId: existing.id, label: existing.name })]
  }
}

function spendResource(
  character: Character,
  command: Extract<PlayerCommand, { type: 'spendResource' }>,
  content: ContentIndex
): CommandResult {
  const resolution = createResolution(character, content)
  const resource = resolveResources(resolution).find((x) => x.id === command.resourceId)
  if (!resource) return reject(character, ['you do not have that resource'])
  if (resource.remaining < command.amount) {
    return reject(character, [
      `not enough ${resource.name}: ${resource.remaining} remaining, ${command.amount} needed`
    ])
  }

  const next = clone(character)
  next.resourcesSpent[command.resourceId] =
    (next.resourcesSpent[command.resourceId] ?? 0) + command.amount

  const left = resource.remaining - command.amount
  const events: DomainEvent[] = [
    event('ResourceSpent', next, {
      resourceId: command.resourceId, label: resource.name,
      amount: command.amount, remaining: left
    })
  ]
  // A dramatic beat the theatre can react to, derived rather than authored.
  if (left === 0) {
    events.push(event('LastUseSpent', next, {
      resourceId: command.resourceId, label: resource.name
    }))
  }
  return { character: next, events }
}

function restoreResource(
  character: Character,
  command: Extract<PlayerCommand, { type: 'restoreResource' }>
): CommandResult {
  const spent = character.resourcesSpent[command.resourceId] ?? 0
  if (spent === 0) return reject(character, ['nothing to restore'])

  const next = clone(character)
  const restored = Math.min(spent, command.amount)
  next.resourcesSpent[command.resourceId] = spent - restored
  return {
    character: next,
    events: [event('ResourceRestored', next, { resourceId: command.resourceId, amount: restored })]
  }
}

function applyCondition(
  character: Character,
  command: Extract<PlayerCommand, { type: 'applyCondition' }>,
  content: ContentIndex
): CommandResult {
  if (!content.conditions.has(command.conditionId)) {
    return reject(character, [`unknown condition "${command.conditionId}"`])
  }
  const next = clone(character)
  // Each application is its own instance with its own duration, but the
  // condition itself is binary — that is the appendix's own rule.
  next.conditions.push({
    conditionId: command.conditionId,
    instanceId: `ci-${next.conditions.length}-${command.conditionId}`,
    sourceId: command.sourceId,
    appliedAtSeconds: 0,
    ...(command.durationSeconds !== undefined ? { durationSeconds: command.durationSeconds } : {})
  })
  return {
    character: next,
    events: [event('ConditionApplied', next, {
      conditionId: command.conditionId, sourceId: command.sourceId
    })]
  }
}

function removeCondition(
  character: Character,
  command: Extract<PlayerCommand, { type: 'removeCondition' }>
): CommandResult {
  const inst = character.conditions.find((c) => c.instanceId === command.instanceId)
  if (!inst) return reject(character, ['that condition instance is not present'])

  const next = clone(character)
  next.conditions = next.conditions.filter((c) => c.instanceId !== command.instanceId)
  const stillHeld = next.conditions.some((c) => c.conditionId === inst.conditionId)
  return {
    character: next,
    events: [event('ConditionRemoved', next, {
      conditionId: inst.conditionId,
      instanceId: command.instanceId,
      // Removing one instance does not clear the condition if another remains.
      stillAffected: stillHeld
    })]
  }
}

function setToggle(
  character: Character,
  command: Extract<PlayerCommand, { type: 'setToggle' }>
): CommandResult {
  const next = clone(character)
  next.toggles[command.toggleId] = command.value
  return {
    character: next,
    events: [event('ToggleChanged', next, { toggleId: command.toggleId, value: command.value })]
  }
}

function rest(character: Character, content: ContentIndex, kind: 'short' | 'long'): CommandResult {
  const resolution = createResolution(character, content)
  const next = clone(character)
  const restored: { resourceId: string; amount: number }[] = []

  for (const resource of resolveResources(resolution)) {
    const result = applyRest(resource, kind)
    if (result.restored > 0) {
      next.resourcesSpent[resource.id] = result.spent
      restored.push({ resourceId: resource.id, amount: result.restored })
    }
  }

  if (kind === 'long') {
    next.hitPointsCurrent = resolution.stat('hitPoints.max').total
    next.hitPointsTemp = 0
    next.deathSaves = { successes: 0, failures: 0 }
    // "Finishing a long rest reduces exhaustion by 1, provided the creature has
    // also ingested food and drink." Food is campaign state the reducer does
    // not see, so the authority passes it as a toggle.
    if (next.exhaustionLevel > 0 && next.toggles['rest.hadFoodAndDrink'] !== false) {
      next.exhaustionLevel -= 1
    }
  }

  return {
    character: next,
    events: [event(kind === 'long' ? 'LongRestTaken' : 'ShortRestTaken', next, { restored })]
  }
}

// ---------------------------------------------------------------------------

/**
 * Raises one class's level by one.
 *
 * HP_MAX is already a fully derived stat (average hit die + CON per level),
 * so the new maximum needs no formula here — only the *delta* is applied to
 * current hit points, so damage already taken survives the level (this does
 * not heal to full, the way a long rest does).
 */
function levelUp(
  character: Character,
  command: Extract<PlayerCommand, { type: 'levelUp' }>,
  content: ContentIndex
): CommandResult {
  const cl = character.classLevels.find((c) => c.classId === command.classId)
  if (!cl) return reject(character, [`you have no levels in "${command.classId}"`])

  const before = createResolution(character, content).stat(HP_MAX).total

  const next = clone(character)
  const nextCl = next.classLevels.find((c) => c.classId === command.classId)!
  nextCl.level += 1

  const def = content.classes.get(command.classId)
  const hitDie = def?.hitDie ?? 8
  next.hitDiceSpent[hitDie] = next.hitDiceSpent[hitDie] ?? 0

  const after = createResolution(next, content).stat(HP_MAX).total
  next.hitPointsCurrent += Math.max(0, after - before)

  return {
    character: next,
    events: [event('LeveledUp', next, {
      classId: command.classId, level: nextCl.level, hitPointsMaxDelta: after - before
    })]
  }
}

/**
 * Answers a level-up choice — an ASI, a feat, or a subclass. Three shapes,
 * one command, because all three are the same thing from the player's chair:
 * a choice the sheet says is owed, answered once.
 */
function answerBuildChoice(
  character: Character,
  command: Extract<PlayerCommand, { type: 'answerBuildChoice' }>,
  content: ContentIndex
): CommandResult {
  const next = clone(character)
  next.buildChoices = next.buildChoices.filter(
    (b) => !(b.atLevel === command.atLevel && (b.kind === command.kind
      || (b.kind === 'feat' && command.kind === 'abilityScoreImprovement')
      || (b.kind === 'abilityScoreImprovement' && command.kind === 'feat'))))

  if (command.kind === 'abilityScoreImprovement') {
    const total = Object.values(command.value).reduce((n, v) => n + (v ?? 0), 0)
    const abilities = Object.keys(command.value).length
    if (total !== 2 || abilities > 2 || abilities < 1) {
      return reject(character, ['an Ability Score Improvement raises abilities by a total of 2, split across at most two of them'])
    }
    next.buildChoices.push({ atLevel: command.atLevel, kind: 'abilityScoreImprovement', value: command.value })
    return { character: next, events: [event('BuildChoiceAnswered', next, { atLevel: command.atLevel, kind: 'abilityScoreImprovement', value: command.value })] }
  }

  if (command.kind === 'feat') {
    const feat = content.feats.get(command.value)
    if (!feat) return reject(character, [`unknown feat "${command.value}"`])
    const trial = clone(next)
    trial.buildChoices.push({ atLevel: command.atLevel, kind: 'feat', value: command.value })
    const resolution = createResolution(trial, content)
    const blocked = resolution.sources.inactive.find((i) => i.source.id === feat.effects.id)
    if (blocked) return reject(character, [`${feat.effects.name}: ${blocked.reason}`])
    next.buildChoices = trial.buildChoices
    return { character: next, events: [event('BuildChoiceAnswered', next, { atLevel: command.atLevel, kind: 'feat', value: command.value })] }
  }

  // subclass — v1 only ever puts one entry in classLevels (see Character.classLevels)
  const cl = next.classLevels.find((c) => content.classes.get(c.classId)?.subclassSlot)
  const def = cl ? content.classes.get(cl.classId) : undefined
  if (!cl || !def?.subclassSlot) return reject(character, ['no class here offers a subclass'])
  if (!def.subclassSlot.options.includes(command.value)) {
    return reject(character, [`"${command.value}" is not one of ${def.name}'s subclasses`])
  }
  cl.subclassId = command.value
  return { character: next, events: [event('BuildChoiceAnswered', next, { atLevel: command.atLevel, kind: 'subclass', value: command.value })] }
}

/**
 * Answers a feature's own "choose N" selection — cantrips known, a skill
 * list, spells known. Until now `character.selections` was only ever
 * written by creation's deterministic auto-fill; this is the first
 * interactive path to it.
 */
function answerSelection(
  character: Character,
  command: Extract<PlayerCommand, { type: 'answerSelection' }>,
  content: ContentIndex
): CommandResult {
  const resolution = createResolution(character, content)
  const source = resolution.sources.active.find((s) => s.id === command.sourceId)
  const sel = source?.selections?.find((s) => s.id === command.selectionId)
  if (!source || !sel) {
    return reject(character, [`no such selection on "${command.sourceId}"`])
  }
  if (command.values.length > sel.count) {
    return reject(character, [`${sel.prompt} allows ${sel.count}, not ${command.values.length}`])
  }
  if (sel.from && command.values.some((v) => !sel.from!.includes(v))) {
    return reject(character, [`${sel.prompt}: one of the values offered isn't a valid choice`])
  }

  const next = clone(character)
  next.selections ??= {}
  next.selections[command.sourceId] ??= {}
  next.selections[command.sourceId]![command.selectionId] = command.values

  return {
    character: next,
    events: [event('SelectionAnswered', next, {
      sourceId: command.sourceId, selectionId: command.selectionId, values: command.values
    })]
  }
}

/**
 * Moving an item between two characters. Two-party, so it returns both sides
 * and the authority commits them in one transaction.
 */
export function transferItem(
  from: Character,
  to: Character,
  instanceId: string
): { from: Character; to: Character; events: DomainEvent[]; rejected?: { reasons: string[] } } {
  const inst = from.inventory.instances.find((i) => i.instanceId === instanceId)
  if (!inst) {
    return { from, to, events: [], rejected: { reasons: ['that item is not in your inventory'] } }
  }
  const equipped = Object.values(from.inventory.equipped).includes(instanceId)
  if (equipped) {
    return { from, to, events: [], rejected: { reasons: ['unequip it before handing it over'] } }
  }

  const nextFrom = clone(from)
  const nextTo = clone(to)
  nextFrom.inventory.instances = nextFrom.inventory.instances.filter(
    (i) => i.instanceId !== instanceId)
  // Attunement is personal and does not travel with the item.
  nextFrom.inventory.attunedInstanceIds =
    nextFrom.inventory.attunedInstanceIds.filter((id) => id !== instanceId)
  nextTo.inventory.instances.push(structuredClone(inst))

  return {
    from: nextFrom,
    to: nextTo,
    events: [{
      type: 'ItemTransferred',
      campaignId: from.campaignId,
      actorId: from.id,
      payload: { instanceId, fromCharacterId: from.id, toCharacterId: to.id }
    }]
  }
}
