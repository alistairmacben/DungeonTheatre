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

import type { Character, ContentIndex, GameEvent } from '../rules/types.js'
import { createResolution } from '../rules/resolve.js'
import { resolveResources, applyRest } from '../rules/resources.js'
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
    case 'spendResource': return spendResource(character, command, content)
    case 'restoreResource': return restoreResource(character, command)
    case 'applyCondition': return applyCondition(character, command, content)
    case 'removeCondition': return removeCondition(character, command)
    case 'setToggle': return setToggle(character, command)
    case 'shortRest': return rest(character, content, 'short')
    case 'longRest': return rest(character, content, 'long')
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
