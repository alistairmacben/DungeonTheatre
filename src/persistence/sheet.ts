// Storing a character.
//
// `characters.sheet` is a jsonb column that v1 shipped and never wrote to. The
// engine `Character` goes in it whole, because it is JSON-shaped by
// construction: it holds only inputs, no functions, no Maps, and above all no
// derived values. Normalising it into relational columns would put the rules
// vocabulary into the database schema, where every content change becomes a
// migration.
//
// The interesting problem here is not encoding. It is that content moves under
// a stored sheet: an item is renamed, a feat is rebalanced, a homebrew class is
// removed from the deployment. Every definition carries `contentVersion` and
// every `ItemInstance` pins the version it was created against precisely so
// that drift is *detectable*. This module detects it and reports it. It does
// not migrate anything — silently rewriting a player's character is worse than
// telling somebody the truth.

import type { Character, ContentIndex } from '../rules/types.js'
import { validateCharacter, type Problem } from '../rules/validate.js'

/** Bumped only when the envelope changes, never when content does. */
export const SHEET_SCHEMA = 1

export interface SheetDocument {
  schema: number
  character: Character
}

export interface DecodeResult {
  /** Present unless the document was structurally unusable. */
  character?: Character
  /**
   * Everything wrong with it. An `error` means do not load; a `warning` means
   * the sheet is usable but something it references has moved.
   */
  problems: Problem[]
}

export function encodeSheet(character: Character): SheetDocument {
  return { schema: SHEET_SCHEMA, character }
}

/**
 * The fields a `Character` cannot be without.
 *
 * Checked by hand rather than with a schema library because the list is short,
 * it changes when the type changes, and a dependency that silently accepts a
 * malformed sheet would be worse than no check at all.
 */
const REQUIRED: (keyof Character)[] = [
  'id', 'campaignId', 'name', 'speciesId', 'classLevels', 'abilityScoreBase',
  'buildChoices', 'hitPointsCurrent', 'hitPointsTemp', 'hitDiceSpent',
  'resourcesSpent', 'conditions', 'effectInstances', 'exhaustionLevel',
  'inventory', 'deathSaves', 'toggles'
]

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

function structural(value: unknown): Problem[] {
  const problems: Problem[] = []
  const err = (message: string): void => {
    problems.push({ severity: 'error', where: 'sheet', message })
  }

  if (typeof value !== 'object' || value === null) {
    err('sheet is not an object')
    return problems
  }
  const c = value as Partial<Character>

  for (const field of REQUIRED) {
    if (c[field] === undefined) err(`missing required field "${field}"`)
  }

  if (c.classLevels !== undefined && !Array.isArray(c.classLevels)) {
    err('classLevels is not an array')
  }
  if (c.abilityScoreBase !== undefined) {
    for (const a of ABILITIES) {
      const score = c.abilityScoreBase[a]
      if (typeof score !== 'number') err(`abilityScoreBase.${a} is not a number`)
    }
  }
  if (c.inventory !== undefined) {
    if (!Array.isArray(c.inventory.instances)) err('inventory.instances is not an array')
    if (!Array.isArray(c.inventory.attunedInstanceIds)) {
      err('inventory.attunedInstanceIds is not an array')
    }
    if (typeof c.inventory.equipped !== 'object' || c.inventory.equipped === null) {
      err('inventory.equipped is not an object')
    }
  }

  return problems
}

/**
 * Checks every content id the character references.
 *
 * Reported as warnings, not errors: a sheet that references a missing item is
 * still a playable character, and the resolver already skips definitions it
 * cannot find. What must not happen is that it does so silently — a player
 * whose sword vanished is entitled to know why.
 */
export function checkContentDrift(character: Character, content: ContentIndex): Problem[] {
  const problems: Problem[] = []
  const warn = (message: string): void => {
    problems.push({ severity: 'warning', where: character.id, message })
  }

  if (!content.species.has(character.speciesId)) {
    warn(`species "${character.speciesId}" is not in the loaded content`)
  } else if (character.subspeciesId) {
    const species = content.species.get(character.speciesId)!
    if (!species.subspecies?.some((s) => s.id === character.subspeciesId)) {
      warn(`subspecies "${character.subspeciesId}" is not part of "${character.speciesId}"`)
    }
  }

  for (const entry of character.classLevels) {
    if (!content.classes.has(entry.classId)) {
      warn(`class "${entry.classId}" is not in the loaded content`)
    }
  }

  for (const choice of character.buildChoices) {
    if (choice.kind === 'feat' && typeof choice.value === 'string'
      && !content.feats.has(choice.value)) {
      warn(`feat "${choice.value}" taken at level ${choice.atLevel} is not in the loaded content`)
    }
  }

  // Items pin the version they were created against, so a definition that has
  // since been edited is distinguishable from one that is merely absent.
  for (const instance of character.inventory.instances) {
    const item = content.items.get(instance.definitionId)
    if (!item) {
      warn(`item "${instance.definitionId}" is not in the loaded content`)
      continue
    }
    if (item.contentVersion !== instance.contentVersion) {
      warn(`item "${item.name}" was stored at content version ${instance.contentVersion}`
        + ` and is now version ${item.contentVersion}`)
    }
  }

  for (const condition of character.conditions) {
    if (!content.conditions.has(condition.conditionId)) {
      warn(`condition "${condition.conditionId}" is not in the loaded content`)
    }
  }

  for (const effect of character.effectInstances) {
    const known = content.spells.get(effect.definitionId) ?? content.items.get(effect.definitionId)
    if (!known) {
      warn(`active effect "${effect.definitionId}" is not in the loaded content`)
      continue
    }
    if (known.contentVersion !== effect.contentVersion) {
      warn(`active effect "${known.name}" was stored at content version`
        + ` ${effect.contentVersion} and is now version ${known.contentVersion}`)
    }
  }

  for (const spellId of character.spellsPrepared ?? []) {
    if (!content.spells.has(spellId)) {
      warn(`prepared spell "${spellId}" is not in the loaded content`)
    }
  }

  // Concentration points at an effect instance, which must still be held.
  if (character.concentratingOn
    && !character.effectInstances.some((e) => e.instanceId === character.concentratingOn)) {
    warn('concentrating on an effect that is no longer active')
  }

  return problems
}

/**
 * Reads a stored sheet.
 *
 * Three checks in order, and the order matters: structure first, because the
 * later two would throw on a malformed object; then the engine's own character
 * invariants; then content drift, which is informational.
 */
export function decodeSheet(raw: unknown, content: ContentIndex): DecodeResult {
  if (typeof raw !== 'object' || raw === null) {
    return { problems: [{ severity: 'error', where: 'sheet', message: 'sheet is not an object' }] }
  }

  const doc = raw as Partial<SheetDocument>
  // An empty jsonb default is not a corrupt sheet, it is the absence of one.
  if (doc.schema === undefined && doc.character === undefined) {
    return { problems: [{ severity: 'error', where: 'sheet', message: 'sheet is empty' }] }
  }
  if (typeof doc.schema !== 'number') {
    return {
      problems: [{ severity: 'error', where: 'sheet', message: 'sheet has no schema version' }]
    }
  }
  if (doc.schema > SHEET_SCHEMA) {
    return {
      problems: [{
        severity: 'error', where: 'sheet',
        message: `sheet schema ${doc.schema} is newer than this build understands`
          + ` (${SHEET_SCHEMA}); update the app rather than loading it`
      }]
    }
  }

  const problems = structural(doc.character)
  if (problems.some((p) => p.severity === 'error')) return { problems }

  const character = doc.character as Character
  problems.push(...validateCharacter(character))
  if (problems.some((p) => p.severity === 'error')) return { problems }

  problems.push(...checkContentDrift(character, content))
  return { character, problems }
}
