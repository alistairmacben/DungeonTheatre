// Phase L — what the stage reacts to.
//
// The mapping from domain event to on-screen beat is the whole judgement of
// this phase, and it is judgement rather than mechanics: which of the 27 event
// types a person at the table would actually notice. That decision deserves to
// be pinned down, because the failure mode is not a crash — it is a stage that
// either says nothing when something happened, or narrates a toggle being
// flipped.

import { beatFrom, beatsFrom } from './bundle/reactions.mjs'
import { makeChecker } from './rules-fixtures.mjs'

const check = makeChecker()
const ev = (type, payload = {}) => ({ type, payload })

// ---------------------------------------------------------------------------
// Things a person would notice
// ---------------------------------------------------------------------------

{
  const hit = beatFrom(ev('DamageTaken', { amount: 12, damageType: 'fire' }))
  check('damage: produces a beat', hit !== undefined)
  check.eq('damage: reads as a loss', hit?.headline, '−12')
  check.eq('damage: is toned as harm', hit?.tone, 'harm')
  check.eq('damage: carries its type so the icon can follow', hit?.damageType, 'fire')

  const heal = beatFrom(ev('Healed', { amount: 7 }))
  check.eq('healing: reads as a gain', heal?.headline, '+7')
  check.eq('healing: is toned as healing', heal?.tone, 'heal')

  const cast = beatFrom(ev('SpellCast', { spellId: 'srd:spell.fire-bolt', label: 'Fire Bolt', level: 0 }))
  check.eq('a cast announces the spell by name', cast?.headline, 'Fire Bolt')
  check.eq('a cantrip says so', cast?.detail, 'cantrip')
  check.eq('a cast carries its id, so its own art can be found', cast?.spellId, 'srd:spell.fire-bolt')

  check.eq('bloodied proclaims', beatFrom(ev('Bloodied', {}))?.headline, 'Bloodied')
  check.eq('downed proclaims', beatFrom(ev('Downed', {}))?.headline, 'Downed')
  check.eq('downed is grim, not merely harmful',
    beatFrom(ev('Downed', {}))?.tone, 'grim')

  check.eq('a condition names itself readably',
    beatFrom(ev('ConditionApplied', { conditionId: 'srd:condition.frightened' }))?.headline,
    'Frightened')
  check.eq('a condition ending says so',
    beatFrom(ev('ConditionRemoved', { conditionId: 'srd:condition.frightened' }))?.headline,
    'Frightened ended')
}

// ---------------------------------------------------------------------------
// Silence is the feature
// ---------------------------------------------------------------------------

{
  // A stage that reacted to every event would be a log with animation. These
  // are all real events the reducer emits, and none of them is worth a beat.
  for (const type of [
    'ToggleChanged', 'SelectionAnswered', 'BuildChoiceAnswered', 'ResourceSpent',
    'ResourceRestored', 'ItemEquipped', 'ItemUnequipped', 'SpellsPrepared',
    'CommandRejected', 'RollMade'
  ]) {
    check(`${type}: bookkeeping, so no beat`, beatFrom(ev(type, {})) === undefined)
  }

  // Zero is not an event. A heal that restored nothing because you were already
  // at full, or absorbed damage that got through as 0, should not flash.
  check('a heal of nothing is not a beat', beatFrom(ev('Healed', { amount: 0 })) === undefined)
  check('damage of nothing is not a beat',
    beatFrom(ev('DamageTaken', { amount: 0, damageType: 'fire' })) === undefined)

  // Malformed payloads must not throw — events cross a network in multiplayer.
  check('a spell with no label is skipped, not thrown',
    beatFrom(ev('SpellCast', {})) === undefined)
  check('a condition with no id is skipped, not thrown',
    beatFrom(ev('ConditionApplied', {})) === undefined)
  check('an unknown event type is simply ignored',
    beatFrom(ev('SomethingFromTheFuture', { a: 1 })) === undefined)
}

// ---------------------------------------------------------------------------
// A batch keeps its order, and drops what it should
// ---------------------------------------------------------------------------

{
  // The reducer emits cause before consequence; the stage must not invert it.
  const beats = beatsFrom([
    ev('DamageTaken', { amount: 35, damageType: 'slashing' }),
    ev('Bloodied', {}),
    ev('ToggleChanged', {})
  ])
  check.eq('a batch drops the bookkeeping', beats.length, 2)
  check.eq('the blow comes first', beats[0]?.headline, '−35')
  check.eq('its consequence second', beats[1]?.headline, 'Bloodied')

  const ids = new Set(beatsFrom([
    ev('DamageTaken', { amount: 1 }), ev('DamageTaken', { amount: 1 })
  ]).map((b) => b.id))
  check.eq('identical events still get distinct ids, so both render', ids.size, 2)
}

check.report()
