// Who may issue what.
//
// The edge function enforces this and the client predicts it. Both import the
// same module, which is the only reason they cannot drift — so what is worth
// testing is the policy itself, and the completeness property that stops a new
// command from silently defaulting to "anyone may".
//
// The Deno function around it is not exercised here; it needs a deployed
// runtime. What it does with this policy is three lines, and the policy is the
// part that decides whether a player can heal themselves to full.

import {
  DM_ONLY_COMMANDS, SERVER_ROLLED_COMMANDS, isDmOnly, isPredictable,
  isServerRolled, mayIssue
} from './bundle/engine.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()

// Every command the contract declares. Kept as a literal rather than derived,
// because the point is to notice when the union grows and this list does not.
const ALL_COMMANDS = [
  'equipItem', 'unequipItem', 'attuneItem', 'endAttunement', 'useItem',
  'makeAttack', 'makeCheck', 'makeSave', 'rollDamage', 'useAbility', 'castSpell',
  'prepareSpells', 'endConcentration', 'spendResource', 'restoreResource',
  'applyCondition', 'removeCondition', 'setToggle', 'shortRest', 'longRest',
  'transferItem', 'dmOverride', 'dmDamage', 'dmHeal', 'dmTemporaryHitPoints',
  'dmSetResource', 'dmApplyEffect', 'dmRemoveEffect'
]

// ---------------------------------------------------------------------------
// The DM
// ---------------------------------------------------------------------------

{
  check('dm: may issue every command there is',
    ALL_COMMANDS.every((t) => mayIssue('dm', t).allowed),
    ALL_COMMANDS.filter((t) => !mayIssue('dm', t).allowed).join(', '))
}

// ---------------------------------------------------------------------------
// The owner
// ---------------------------------------------------------------------------

{
  // The rule that matters. A player who can issue dmHeal can heal to full at
  // will, and one who can issue dmDamage can kill another character.
  const forbidden = ALL_COMMANDS.filter((t) => !mayIssue('owner', t).allowed)
  check('owner: is refused exactly the DM-only commands',
    forbidden.slice().sort().join(',') === [...DM_ONLY_COMMANDS].sort().join(','),
    `refused: ${forbidden.join(', ')}`)

  for (const t of ['dmDamage', 'dmHeal', 'dmSetResource', 'dmApplyEffect']) {
    check(`owner: cannot ${t}`, !mayIssue('owner', t).allowed)
  }
  check('owner: cannot impose a condition on themselves',
    !mayIssue('owner', 'applyCondition').allowed)

  // The other half: an owner must still be able to play.
  for (const t of ['equipItem', 'castSpell', 'makeAttack', 'shortRest', 'useAbility']) {
    check(`owner: may ${t}`, mayIssue('owner', t).allowed)
  }

  check('owner: a refusal explains itself',
    (mayIssue('owner', 'dmDamage').reason ?? '').includes('DM'),
    mayIssue('owner', 'dmDamage').reason)
}

// ---------------------------------------------------------------------------
// Somebody else at the table
// ---------------------------------------------------------------------------

{
  check('other: is refused everything, including harmless commands',
    ALL_COMMANDS.every((t) => !mayIssue('other', t).allowed))
  check('other: including equipping an item',
    !mayIssue('other', 'equipItem').allowed)
  check('other: and the refusal says whose character it is',
    (mayIssue('other', 'equipItem').reason ?? '').includes('your character'),
    mayIssue('other', 'equipItem').reason)
}

// ---------------------------------------------------------------------------
// Server-rolled commands
// ---------------------------------------------------------------------------

{
  check('dice: every roll command is server-rolled',
    ['makeCheck', 'makeSave', 'makeAttack'].every(isServerRolled))
  check('dice: and nothing else is',
    ALL_COMMANDS.filter(isServerRolled).sort().join(',')
      === [...SERVER_ROLLED_COMMANDS].sort().join(','),
    ALL_COMMANDS.filter(isServerRolled).join(', '))

  // The reason this list exists: a client supplying its own faces can supply
  // twenties, so a roll must never be predicted from client-side randomness.
  check('dice: a roll is never predicted, even for the DM',
    !isPredictable('dm', 'makeAttack') && !isPredictable('owner', 'makeCheck'))
}

// ---------------------------------------------------------------------------
// Prediction
// ---------------------------------------------------------------------------

{
  // Predicting something the server will refuse shows an effect that is about
  // to be undone, which reads as a bug even though it is not.
  check('predict: never predict what the caller may not issue',
    ALL_COMMANDS.every((t) => !isPredictable('owner', t) || mayIssue('owner', t).allowed))
  check('predict: an onlooker predicts nothing at all',
    ALL_COMMANDS.every((t) => !isPredictable('other', t)))

  // The common case must stay optimistic, or the HUD waits on a round trip for
  // every shield equip.
  check('predict: ordinary play is still predicted',
    ['equipItem', 'unequipItem', 'useAbility', 'shortRest']
      .every((t) => isPredictable('owner', t)))

  // Casting used to be on that list. It came off when spells that roll to hit
  // started carrying their d20 in the cast command: a Fire Bolt's attack is
  // randomness, and randomness is never predicted. The cost is that casting a
  // spell with no roll in it — Mage Armor — now waits for the round trip too,
  // because predictability is decided per command type and not per spell. That
  // is the right way round: a wrong prediction on a to-hit roll shows the
  // player a hit that then becomes a miss.
  check('predict: casting is not predicted, because some spells roll to hit',
    !isPredictable('owner', 'castSpell'))

  // A DM's own inflictions ARE predicted, and should be. dmDamage is
  // deterministic — the client applies the same resistances the server will —
  // so waiting on a round trip would make the DM panel feel broken for no
  // safety gain. What must never be predicted is randomness, and what must
  // never be predicted by a *player* is a command they cannot issue.
  check('predict: a DM sees their own deterministic commands immediately',
    isPredictable('dm', 'dmDamage') && isDmOnly('dmDamage'))
  check('predict: but a player does not, because it would be refused',
    !isPredictable('owner', 'dmDamage'))
}

// ---------------------------------------------------------------------------
// Completeness — the property that survives the union growing
// ---------------------------------------------------------------------------

{
  // An unknown command must not sail through as permitted. This is the check
  // that catches a new dm-something being added to the contract and forgotten
  // here: it will be allowed for an owner, and this test says so.
  check('completeness: every dm-prefixed command is DM-only',
    ALL_COMMANDS.filter((t) => t.startsWith('dm')).every(isDmOnly),
    ALL_COMMANDS.filter((t) => t.startsWith('dm') && !isDmOnly(t)).join(', '))

  check('completeness: the DM-only list contains nothing that is not a command',
    DM_ONLY_COMMANDS.every((t) => ALL_COMMANDS.includes(t)),
    DM_ONLY_COMMANDS.filter((t) => !ALL_COMMANDS.includes(t)).join(', '))
  check('completeness: the server-rolled list contains nothing that is not a command',
    SERVER_ROLLED_COMMANDS.every((t) => ALL_COMMANDS.includes(t)))
}

check.report()
