// Who may issue what.
//
// This lives in the engine, next to the reducer, because the server enforces it
// and the client needs to predict it — and a policy written down twice is a
// policy that will eventually disagree with itself. Same reason `applyCommand`
// is shared: one implementation, two call sites.
//
// The engine deliberately does NOT enforce this inside `applyCommand`. A
// command's legality depends on who is asking, and the reducer has no notion of
// a caller; it answers "is this a legal move for this character", which is a
// different question from "may you make it". Keeping them apart is what lets
// the DM issue a command a player cannot without the reducer growing a concept
// of permissions.

import type { CommandType } from './types.js'

/** What the caller is, relative to the character being acted on. */
export type Role = 'owner' | 'dm' | 'other'

/**
 * Commands only a DM may issue.
 *
 * Inflicting is the DM's job: damage, healing, resources set by fiat, effects
 * improvised at the table. Conditions are here too — imposing one is narration,
 * and a player frightening themselves at will is not a rule anybody wrote.
 */
export const DM_ONLY_COMMANDS: readonly CommandType[] = [
  'dmDamage', 'dmHeal', 'dmTemporaryHitPoints', 'dmSetResource',
  'dmApplyEffect', 'dmRemoveEffect', 'dmOverride',
  'applyCondition', 'removeCondition'
]

/**
 * Commands whose randomness the server generates.
 *
 * A client that supplies its own faces can supply twenties. These arrive with
 * whatever the client rolled and leave with whatever the server rolled.
 */
export const SERVER_ROLLED_COMMANDS: readonly CommandType[] = [
  // `castSpell` is here for the spells that roll to hit. The rest ignore the
  // faces entirely, and one wasted d20 costs nothing next to a client that
  // gets to choose whether its Fire Bolt lands.
  'makeCheck', 'makeSave', 'makeAttack', 'rollDamage', 'castSpell'
]

const DM_ONLY = new Set<string>(DM_ONLY_COMMANDS)
const SERVER_ROLLED = new Set<string>(SERVER_ROLLED_COMMANDS)

export function isDmOnly(type: string): boolean {
  return DM_ONLY.has(type)
}

export function isServerRolled(type: string): boolean {
  return SERVER_ROLLED.has(type)
}

export interface Permission {
  allowed: boolean
  /** Present when refused, in the same voice an unavailable action uses. */
  reason?: string
}

/**
 * May this caller issue this command against this character?
 *
 * Note that `other` is refused outright rather than being given a narrower set:
 * one player acting on another's sheet is not a thing the game does, and the
 * DM already has a route for everything that looks like it should be.
 */
export function mayIssue(role: Role, type: string): Permission {
  if (role === 'dm') return { allowed: true }
  if (role === 'other') return { allowed: false, reason: 'that is not your character' }
  if (isDmOnly(type)) {
    return { allowed: false, reason: `only the DM may issue "${type}"` }
  }
  return { allowed: true }
}

/**
 * Should the client show an optimistic result, or wait?
 *
 * Predicting a server-rolled command would show a number that is about to be
 * replaced by a different one, which reads as a bug even though it is not.
 * Predicting a DM-only command the caller may not be entitled to issue is worse
 * — it shows an effect that is about to be refused.
 */
export function isPredictable(role: Role, type: string): boolean {
  if (isServerRolled(type)) return false
  return mayIssue(role, type).allowed
}
