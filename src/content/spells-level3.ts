// 3rd-level spells.
//
// Forty-one of them — the full union of every class's 3rd-level column
// (docs/srd/08-spell-lists.md), minus Protection from Energy, which the set
// already held. Fireball and Lightning Bolt arrive here — the two damage
// spells every table actually remembers — alongside Haste and Fly, which
// between them exercise every buff shape the set has built so far in one
// spell each.
//
// - Haste is the richest buff yet: three of its four clauses are ordinary
//   modifiers stacked on one spell — `multiply` doubles speed, `add` gives
//   +2 AC, and `roll` grants advantage on Dexterity saves. Only the extra
//   action and the after-effect lethargy stay narrative.
// - Fly is Dragon Wings' shape with a literal number instead of a stat read:
//   `base` on speed.fly, set to 60 rather than to `{ stat: speedPath('walk') }`.
// - Spirit Guardians is the one place in the SRD that gives alignment a
//   mechanical consequence — the damage type depends on whether the caster
//   is good, neutral or evil — which nothing in the character model tracks,
//   so the resolved damage defaults to radiant and the necrotic case is
//   narrative.

import type { EffectSource, Modifier, SpellDefinition } from '../rules/types.js'
import { ARMOR_CLASS, speedPath } from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `s3${++n}`

function effects(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'spell',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

const add = (target: string, value: Modifier['value'], extra: Partial<Modifier> = {}): Modifier =>
  ({ id: id(), channel: 'value', target, op: 'add', value, permanence: 'temporary', ...extra })

function spell(o: Partial<SpellDefinition> & {
  id: string; name: string; level: number; school: string; effects: EffectSource
}): SpellDefinition {
  return {
    provenance: 'srd', contentVersion: 1, rulesetVersion: V,
    ritual: false, castingTime: 'action', rangeKind: 'ranged',
    components: { verbal: true, somatic: true },
    concentration: false,
    ...o
  } as SpellDefinition
}

// ===========================================================================
// Damage
// ===========================================================================

export const FIREBALL = spell({
  id: 'srd:spell.fireball', name: 'Fireball', level: 3, school: 'evocation',
  rangeFeet: 150,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'half' },
    damage: [{ dice: { count: 8, sides: 6 }, type: 'fire' }],
    perSlotAbove: { damageDice: { count: 1, sides: 6 } }
  },
  effects: effects({
    id: 'srd:spell.fireball', name: 'Fireball',
    narrative: [{
      text: 'A 20-foot-radius sphere of fire, spreading around corners. Every '
        + 'creature there makes a Dexterity save, taking 8d6 fire damage on a '
        + 'failure and half on a success. Ignites unattended flammable objects.',
      dmPromptable: false
    }]
  })
})

export const LIGHTNING_BOLT = spell({
  id: 'srd:spell.lightning-bolt', name: 'Lightning Bolt', level: 3, school: 'evocation',
  rangeKind: 'self', rangeFeet: 100,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'half' },
    damage: [{ dice: { count: 8, sides: 6 }, type: 'lightning' }],
    perSlotAbove: { damageDice: { count: 1, sides: 6 } }
  },
  effects: effects({
    id: 'srd:spell.lightning-bolt', name: 'Lightning Bolt',
    narrative: [{
      text: 'A 100-foot line, 5 feet wide, of lightning from you. Every creature '
        + 'in it makes a Dexterity save, taking 8d6 lightning damage on a failure '
        + 'and half on a success. Ignites unattended flammable objects.',
      dmPromptable: false
    }]
  })
})

export const CALL_LIGHTNING = spell({
  id: 'srd:spell.call-lightning', name: 'Call Lightning', level: 3, school: 'conjuration',
  rangeFeet: 120, concentration: true, durationSeconds: 600,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'half' },
    damage: [{ dice: { count: 3, sides: 10 }, type: 'lightning' }],
    perSlotAbove: { damageDice: { count: 1, sides: 10 } }
  },
  effects: effects({
    id: 'srd:spell.call-lightning', name: 'Call Lightning',
    // Outdoors in a storm the damage rises to 4d10, which depends on weather
    // the character sheet has no notion of.
    completeness: 'partial',
    narrative: [{
      text: 'A storm cloud gathers 100 feet above you. Choose a point beneath '
        + 'it; every creature within 5 feet makes a Dexterity save, taking 3d10 '
        + 'lightning damage on a failure and half on a success — 4d10 outdoors '
        + 'in a storm, which is not modelled. Use your action on later turns to '
        + 'call down another bolt.',
      dmPromptable: true
    }]
  })
})

export const SPIRIT_GUARDIANS = spell({
  id: 'srd:spell.spirit-guardians', name: 'Spirit Guardians', level: 3, school: 'conjuration',
  rangeKind: 'self', rangeFeet: 15, concentration: true, durationSeconds: 600,
  effect: {
    delivery: 'save', save: { ability: 'wis', onSuccess: 'half' },
    damage: [{ dice: { count: 3, sides: 8 }, type: 'radiant' }],
    perSlotAbove: { damageDice: { count: 1, sides: 8 } }
  },
  effects: effects({
    id: 'srd:spell.spirit-guardians', name: 'Spirit Guardians',
    // The one place the SRD gives alignment a mechanical consequence: the
    // damage type is radiant for a good or neutral caster and necrotic for an
    // evil one, and alignment is not a field the character model tracks.
    completeness: 'partial',
    narrative: [{
      text: 'Spectral guardians fill a 15-foot radius around you. Anyone you '
        + 'have not exempted has their speed halved there, and entering for the '
        + 'first time on a turn or starting there forces a Wisdom save: 3d8 '
        + 'radiant damage on a failure, half on a success — 3d8 necrotic instead '
        + 'if you are evil, which the resolved damage above does not know to '
        + 'switch.',
      dmPromptable: true
    }]
  })
})

export const WIND_WALL = spell({
  id: 'srd:spell.wind-wall', name: 'Wind Wall', level: 3, school: 'evocation',
  rangeFeet: 120, concentration: true, durationSeconds: 60,
  effect: {
    delivery: 'save', save: { ability: 'str', onSuccess: 'half' },
    damage: [{ dice: { count: 3, sides: 8 }, type: 'bludgeoning' }]
  },
  effects: effects({
    id: 'srd:spell.wind-wall', name: 'Wind Wall',
    // The wall's ongoing effects — deflecting arrows, blocking gas and small
    // flyers — are about a zone in space, not a stat any creature carries.
    completeness: 'partial',
    narrative: [{
      text: 'A wall of strong wind up to 50 feet long, 15 feet high and 1 foot '
        + 'thick. On appearing, each creature there makes a Strength save, '
        + 'taking 3d8 bludgeoning damage on a failure and half on a success. For '
        + 'the duration it deflects arrows, bolts and other ordinary projectiles, '
        + 'blocks small flying creatures, and holds back fog, smoke and gas — '
        + 'none of which is modelled beyond the initial impact.',
      dmPromptable: true
    }]
  })
})

export const VAMPIRIC_TOUCH = spell({
  id: 'srd:spell.vampiric-touch', name: 'Vampiric Touch', level: 3, school: 'necromancy',
  rangeKind: 'self', concentration: true, durationSeconds: 60,
  effect: {
    delivery: 'attack',
    damage: [{ dice: { count: 3, sides: 6 }, type: 'necrotic' }],
    perSlotAbove: { damageDice: { count: 1, sides: 6 } }
  },
  effects: effects({
    id: 'srd:spell.vampiric-touch', name: 'Vampiric Touch',
    // Healing derived from damage just dealt — the two rolls are linked, and
    // nothing in the healing vocabulary reads a damage result that was just
    // computed elsewhere.
    completeness: 'partial',
    narrative: [{
      text: 'A melee spell attack for 3d6 necrotic damage. You regain hit '
        + 'points equal to half the damage dealt — add that by hand. Repeat as '
        + 'an action on later turns while you concentrate.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Buffs that install real modifiers
// ===========================================================================

export const HASTE = spell({
  id: 'srd:spell.haste', name: 'Haste', level: 3, school: 'transmutation',
  rangeFeet: 30, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.haste', name: 'Haste',
    // Three of the four clauses are ordinary modifiers stacked on one spell.
    // The extra action and the one-turn lethargy when it ends are the two
    // that are not: an action economy grant, and a penalty applied on a
    // delay the resolver has no clock for.
    completeness: 'partial',
    modifiers: [
      { id: id(), channel: 'value', target: speedPath('walk'), op: 'multiply', value: 2, permanence: 'temporary', note: 'haste' },
      add(ARMOR_CLASS, 2, { note: 'haste' }),
      {
        id: id(), channel: 'roll', rollOp: 'advantage',
        scope: { kinds: ['save'], abilities: ['dex'] },
        permanence: 'temporary', note: 'haste'
      }
    ],
    narrative: [{
      text: 'A willing creature you touch has its speed doubled, gains +2 AC '
        + 'and advantage on Dexterity saves, and gains an extra action each '
        + 'turn — usable only to Attack (one weapon attack), Dash, Disengage, '
        + 'Hide, or Use an Object — for up to a minute. When the spell ends the '
        + 'target can\'t move or act until after its next turn; neither the '
        + 'extra action nor that lethargy is applied.',
      dmPromptable: true
    }]
  })
})

export const FLY = spell({
  id: 'srd:spell.fly', name: 'Fly', level: 3, school: 'transmutation',
  rangeKind: 'touch', concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.fly', name: 'Fly',
    // Dragon Wings' shape with a literal number instead of a stat read: `base`
    // on speed.fly, fixed at 60 rather than tracking the walking speed.
    modifiers: [{
      id: id(), channel: 'value', target: speedPath('fly'), op: 'base', value: 60,
      permanence: 'temporary', note: 'fly'
    }],
    narrative: [{
      text: 'A willing creature you touch gains a flying speed of 60 feet for '
        + 'up to 10 minutes. It falls if still aloft when the spell ends.',
      dmPromptable: false
    }]
  })
})

export const BEACON_OF_HOPE = spell({
  id: 'srd:spell.beacon-of-hope', name: 'Beacon of Hope', level: 3, school: 'abjuration',
  rangeFeet: 30, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.beacon-of-hope', name: 'Beacon of Hope',
    // Advantage on two roll kinds is real; the maximised-healing rider changes
    // how a die is read rather than granting advantage on anything, which is
    // a different mechanism nothing here has.
    completeness: 'partial',
    modifiers: [
      {
        id: id(), channel: 'roll', rollOp: 'advantage',
        scope: { kinds: ['save'], abilities: ['wis'] },
        permanence: 'temporary', note: 'beacon of hope'
      },
      {
        id: id(), channel: 'roll', rollOp: 'advantage', scope: { kinds: ['death'] },
        permanence: 'temporary', note: 'beacon of hope'
      }
    ],
    narrative: [{
      text: 'Any creature you choose gains advantage on Wisdom saves and death '
        + 'saving throws, and regains the maximum possible hit points from any '
        + 'healing, for up to a minute. Only the two advantages are applied — '
        + 'maximise healing rolls by hand.',
      dmPromptable: true
    }]
  })
})

export const GASEOUS_FORM = spell({
  id: 'srd:spell.gaseous-form', name: 'Gaseous Form', level: 3, school: 'transmutation',
  rangeKind: 'touch', concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.gaseous-form', name: 'Gaseous Form',
    // The advantage on three saves is real; everything else about being a
    // cloud — a 10-foot fly speed, resistance to nonmagical damage, passing
    // through cracks — is a change to what kind of thing the creature is,
    // which nothing here models.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'roll', rollOp: 'advantage',
      scope: { kinds: ['save'], abilities: ['str', 'dex', 'con'] },
      permanence: 'temporary', note: 'gaseous form'
    }],
    narrative: [{
      text: 'A willing creature and its gear become a misty cloud for up to an '
        + 'hour: a 10-foot flying speed, resistance to nonmagical damage, and '
        + 'it can squeeze through cracks but cannot attack, manipulate objects '
        + 'or cast spells. Only the advantage on Strength, Dexterity and '
        + 'Constitution saves is applied.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Save spells with a condition rather than damage
// ===========================================================================

export const FEAR = spell({
  id: 'srd:spell.fear', name: 'Fear', level: 3, school: 'illusion',
  rangeKind: 'self', rangeFeet: 30, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.fear', name: 'Fear',
    completeness: 'partial',
    narrative: [{
      text: 'Every creature in a 30-foot cone from you makes a Wisdom save or '
        + 'drops what it is holding and is frightened, forced to Dash away from '
        + 'you by the safest route each turn. It repeats the save at the end of '
        + 'a turn spent out of your sight.',
      dmPromptable: true
    }]
  })
})

export const HYPNOTIC_PATTERN = spell({
  id: 'srd:spell.hypnotic-pattern', name: 'Hypnotic Pattern', level: 3, school: 'illusion',
  rangeFeet: 120, components: { verbal: false, somatic: true, material: 'a glowing stick of incense or a crystal vial of colored sand' },
  concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.hypnotic-pattern', name: 'Hypnotic Pattern',
    completeness: 'partial',
    narrative: [{
      text: 'A swirling pattern fills a 30-foot cube. Every creature that sees '
        + 'it makes a Wisdom save or is charmed, incapacitated and has its speed '
        + 'reduced to 0 — ending for a creature that takes damage or is shaken '
        + 'out of it by another creature\'s action.',
      dmPromptable: true
    }]
  })
})

export const SLOW = spell({
  id: 'srd:spell.slow', name: 'Slow', level: 3, school: 'transmutation',
  rangeFeet: 120, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.slow', name: 'Slow',
    completeness: 'partial',
    narrative: [{
      text: 'Up to six creatures in a 40-foot cube make a Wisdom save. On a '
        + 'failure: speed halved, −2 AC and −2 to Dexterity saves, no reactions, '
        + 'and only an action or a bonus action each turn, not both, with at '
        + 'most one attack. It repeats the save at the end of its turn to end '
        + 'the effect.',
      dmPromptable: true
    }]
  })
})

export const STINKING_CLOUD = spell({
  id: 'srd:spell.stinking-cloud', name: 'Stinking Cloud', level: 3, school: 'conjuration',
  rangeFeet: 90, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.stinking-cloud', name: 'Stinking Cloud',
    completeness: 'partial',
    narrative: [{
      text: 'A 20-foot-radius sphere of nauseating gas, heavily obscured. A '
        + 'creature that starts its turn entirely inside makes a Constitution '
        + 'save or spends its action retching — creatures that don\'t breathe '
        + 'or are immune to poison automatically succeed.',
      dmPromptable: true
    }]
  })
})

export const SLEET_STORM = spell({
  id: 'srd:spell.sleet-storm', name: 'Sleet Storm', level: 3, school: 'conjuration',
  rangeFeet: 150, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.sleet-storm', name: 'Sleet Storm',
    completeness: 'partial',
    narrative: [{
      text: 'A 40-foot-radius, 20-foot-tall cylinder of freezing rain: heavily '
        + 'obscured, ground turned to difficult terrain, exposed flames doused. '
        + 'A creature entering it for the first time on a turn, or starting '
        + 'there, makes a Dexterity save or falls prone. Anyone concentrating '
        + 'in the area makes a Constitution save against your spell save DC or '
        + 'loses concentration.',
      dmPromptable: true
    }]
  })
})

export const BESTOW_CURSE = spell({
  id: 'srd:spell.bestow-curse', name: 'Bestow Curse', level: 3, school: 'necromancy',
  rangeKind: 'touch', concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.bestow-curse', name: 'Bestow Curse',
    // A melee spell attack this content set has no analogue for — it targets
    // a creature you touch rather than resolving a roll of its own, and every
    // option is a standing effect on the target's future rolls.
    completeness: 'partial',
    narrative: [{
      text: 'A creature you touch makes a Wisdom save or is cursed for up to a '
        + 'minute. Choose one: disadvantage on checks and saves with one '
        + 'ability; disadvantage on attack rolls against you; a Wisdom save at '
        + 'the start of each of its turns or it wastes its turn; or your '
        + 'attacks and spells deal it an extra 1d8 necrotic damage. Ended by '
        + 'remove curse.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Healing that reaches more than one creature
// ===========================================================================

export const MASS_HEALING_WORD = spell({
  id: 'srd:spell.mass-healing-word', name: 'Mass Healing Word', level: 3, school: 'evocation',
  castingTime: 'bonusAction', rangeFeet: 60, components: { verbal: true, somatic: false },
  effect: {
    delivery: 'auto',
    healing: { dice: { count: 1, sides: 4 }, addSpellMod: true },
    perSlotAbove: { healingDice: { count: 1, sides: 4 } }
  },
  effects: effects({
    id: 'srd:spell.mass-healing-word', name: 'Mass Healing Word',
    // Up to six creatures, each healed separately — the same party-wide reach
    // Prayer of Healing and Bless are behind.
    completeness: 'partial',
    narrative: [{
      text: 'Up to six creatures you can see regain 1d4 + your spellcasting '
        + 'ability modifier hit points. The number resolved here is one '
        + 'creature\'s — apply it to each.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Summons and revivals — the second-statblock wall
// ===========================================================================

export const CONJURE_ANIMALS = spell({
  id: 'srd:spell.conjure-animals', name: 'Conjure Animals', level: 3, school: 'conjuration',
  rangeFeet: 60, concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.conjure-animals', name: 'Conjure Animals',
    completeness: 'partial',
    narrative: [{
      text: 'Summon spirits that become beasts: one of CR 2, two of CR 1, four '
        + 'of CR 1/2, or eight of CR 1/4, obeying your verbal commands and '
        + 'vanishing at 0 hit points or when the spell ends. Run them from '
        + 'statblocks at the table.',
      dmPromptable: true
    }]
  })
})

export const ANIMATE_DEAD = spell({
  id: 'srd:spell.animate-dead', name: 'Animate Dead', level: 3, school: 'necromancy',
  castingTime: { minutes: 1 }, rangeFeet: 10,
  effects: effects({
    id: 'srd:spell.animate-dead', name: 'Animate Dead',
    completeness: 'partial',
    narrative: [{
      text: 'A Medium or Small corpse or pile of bones rises as a skeleton or '
        + 'zombie under your control for 24 hours, commandable with a bonus '
        + 'action. Run it from a statblock at the table.',
      dmPromptable: true
    }]
  })
})

export const PHANTOM_STEED = spell({
  id: 'srd:spell.phantom-steed', name: 'Phantom Steed', level: 3, school: 'illusion',
  ritual: true, castingTime: { minutes: 1 }, rangeFeet: 30, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.phantom-steed', name: 'Phantom Steed',
    completeness: 'partial',
    narrative: [{
      text: 'A quasi-real, Large steed with a saddle, bit and bridle appears, '
        + 'using riding horse statistics but with a speed of 100 feet on land. '
        + 'It fades a minute after the spell ends. Run it from a statblock at '
        + 'the table.',
      dmPromptable: true
    }]
  })
})

export const REVIVIFY = spell({
  id: 'srd:spell.revivify', name: 'Revivify', level: 3, school: 'necromancy',
  rangeKind: 'touch',
  components: { verbal: true, somatic: true, material: 'diamonds worth at least 300 gp, which the spell consumes', materialCostCp: 30000, consumed: true },
  effects: effects({
    id: 'srd:spell.revivify', name: 'Revivify',
    // A binary state change — dead to alive at 1 hit point — rather than a
    // healing roll; there is no vocabulary for reversing death.
    completeness: 'partial',
    narrative: [{
      text: 'A creature that died within the last minute returns to life with '
        + '1 hit point. Cannot restore a creature dead of old age or missing '
        + 'body parts.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Pure information and utility
// ===========================================================================

export const COUNTERSPELL = spell({
  id: 'srd:spell.counterspell', name: 'Counterspell', level: 3, school: 'abjuration',
  castingTime: 'reaction', rangeFeet: 60, components: { verbal: false, somatic: true },
  effects: effects({
    id: 'srd:spell.counterspell', name: 'Counterspell',
    narrative: [{
      text: 'Cast as a reaction when you see a creature within 60 feet casting '
        + 'a spell. A spell of 3rd level or lower automatically fails; against '
        + '4th level or higher, make an ability check with your spellcasting '
        + 'ability against DC 10 + the spell\'s level.',
      dmPromptable: true
    }]
  })
})

export const DISPEL_MAGIC = spell({
  id: 'srd:spell.dispel-magic', name: 'Dispel Magic', level: 3, school: 'abjuration',
  rangeFeet: 120,
  effects: effects({
    id: 'srd:spell.dispel-magic', name: 'Dispel Magic',
    narrative: [{
      text: 'Choose one creature, object or effect within range under the '
        + 'influence of a spell. A spell of 3rd level or lower on it ends '
        + 'automatically; for 4th level or higher, make an ability check with '
        + 'your spellcasting ability against DC 10 + the spell\'s level.',
      dmPromptable: true
    }]
  })
})

export const DAYLIGHT = spell({
  id: 'srd:spell.daylight', name: 'Daylight', level: 3, school: 'evocation',
  rangeFeet: 60, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.daylight', name: 'Daylight',
    narrative: [{
      text: 'A 60-foot-radius sphere of bright light, dim for 60 feet more, for '
        + 'an hour — anchorable to an object, blocked by opaque covering, and '
        + 'dispelling darkness from a spell of 3rd level or lower that it '
        + 'overlaps.',
      dmPromptable: false
    }]
  })
})

export const CLAIRVOYANCE = spell({
  id: 'srd:spell.clairvoyance', name: 'Clairvoyance', level: 3, school: 'divination',
  castingTime: { minutes: 10 }, rangeFeet: 5280,
  components: { verbal: true, somatic: true, material: 'a focus worth at least 100 gp — a jeweled horn for hearing, or a glass eye for seeing' },
  concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.clairvoyance', name: 'Clairvoyance',
    narrative: [{
      text: 'An invisible sensor appears in a location you know, up to a mile '
        + 'away, letting you see or hear through it for up to 10 minutes — '
        + 'switch which as an action.',
      dmPromptable: false
    }]
  })
})

export const SENDING = spell({
  id: 'srd:spell.sending', name: 'Sending', level: 3, school: 'evocation',
  rangeKind: 'unlimited', durationSeconds: 6,
  effects: effects({
    id: 'srd:spell.sending', name: 'Sending',
    narrative: [{
      text: 'A 25-word-or-fewer message to a creature you know, anywhere, who '
        + 'can reply in kind immediately. A 5% chance the message fails to '
        + 'arrive if the two of you are on different planes.',
      dmPromptable: false
    }]
  })
})

export const TONGUES = spell({
  id: 'srd:spell.tongues', name: 'Tongues', level: 3, school: 'divination',
  rangeKind: 'touch', components: { verbal: true, somatic: false }, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.tongues', name: 'Tongues',
    narrative: [{
      text: 'A creature you touch understands any spoken language it hears, '
        + 'and anyone who knows at least one language understands its speech, '
        + 'for an hour.',
      dmPromptable: false
    }]
  })
})

export const NONDETECTION = spell({
  id: 'srd:spell.nondetection', name: 'Nondetection', level: 3, school: 'abjuration',
  rangeKind: 'touch',
  components: { verbal: true, somatic: true, material: 'diamond dust worth at least 25 gp, which the spell consumes', materialCostCp: 2500, consumed: true },
  durationSeconds: 28800,
  effects: effects({
    id: 'srd:spell.nondetection', name: 'Nondetection',
    narrative: [{
      text: 'A willing creature, place or object you touch is hidden from all '
        + 'divination magic and magical scrying for 8 hours.',
      dmPromptable: false
    }]
  })
})

export const MAJOR_IMAGE = spell({
  id: 'srd:spell.major-image', name: 'Major Image', level: 3, school: 'illusion',
  rangeFeet: 120, concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.major-image', name: 'Major Image',
    narrative: [{
      text: 'An illusion up to a 20-foot cube, with sound, smell and '
        + 'temperature but nothing that can deal damage or impose a condition. '
        + 'Move it and alter its appearance as an action; physical interaction '
        + 'or an Intelligence (Investigation) check against your spell save DC '
        + 'reveals it.',
      dmPromptable: false
    }]
  })
})

export const GLYPH_OF_WARDING = spell({
  id: 'srd:spell.glyph-of-warding', name: 'Glyph of Warding', level: 3, school: 'abjuration',
  castingTime: { hours: 1 }, rangeKind: 'touch',
  components: { verbal: true, somatic: true, material: 'incense and powdered diamond worth at least 200 gp, which the spell consumes', materialCostCp: 20000, consumed: true },
  effects: effects({
    id: 'srd:spell.glyph-of-warding', name: 'Glyph of Warding',
    completeness: 'partial',
    narrative: [{
      text: 'Inscribe a glyph on a surface or inside an object, with a trigger '
        + 'you define, that lasts until dispelled or triggered. Found only with '
        + 'an Intelligence (Investigation) check against your spell save DC. '
        + 'The Explosive Runes variant is an area save-for-half burst of '
        + 'unrecorded damage — resolve it at the table.',
      dmPromptable: true
    }]
  })
})

export const MAGIC_CIRCLE = spell({
  id: 'srd:spell.magic-circle', name: 'Magic Circle', level: 3, school: 'abjuration',
  castingTime: { minutes: 1 }, rangeFeet: 10, durationSeconds: 3600,
  components: { verbal: true, somatic: true, material: 'holy water or powdered silver and iron worth at least 100 gp, which the spell consumes', materialCostCp: 10000, consumed: true },
  effects: effects({
    id: 'srd:spell.magic-circle', name: 'Magic Circle',
    // Protection from Evil and Good's shape, cast as a 10-foot cylinder rather
    // than on one creature — every clause depends on the type of a specific
    // attacker or occupant, which nothing here reads.
    completeness: 'partial',
    narrative: [{
      text: 'A 10-foot-radius, 20-foot-tall cylinder, warded against chosen '
        + 'creature types for an hour: they cannot willingly enter by '
        + 'nonmagical means, have disadvantage on attacks against targets '
        + 'inside, and cannot charm, frighten or possess creatures inside. '
        + 'Reversible, to trap them in instead.',
      dmPromptable: true
    }]
  })
})

export const REMOVE_CURSE = spell({
  id: 'srd:spell.remove-curse', name: 'Remove Curse', level: 3, school: 'abjuration',
  rangeKind: 'touch',
  effects: effects({
    id: 'srd:spell.remove-curse', name: 'Remove Curse',
    completeness: 'partial',
    narrative: [{
      text: 'All curses on one creature or object you touch end. A cursed '
        + 'magic item stays cursed, but attunement to it breaks so it can be '
        + 'removed.',
      dmPromptable: true
    }]
  })
})

export const SPEAK_WITH_DEAD = spell({
  id: 'srd:spell.speak-with-dead', name: 'Speak with Dead', level: 3, school: 'necromancy',
  rangeFeet: 10, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.speak-with-dead', name: 'Speak with Dead',
    narrative: [{
      text: 'A corpse with a mouth, not undead, and not spoken to by this '
        + 'spell in the last 10 days, answers five questions from what it '
        + 'knew in life — briefly, cryptically or evasively if it was hostile.',
      dmPromptable: true
    }]
  })
})

export const SPEAK_WITH_PLANTS = spell({
  id: 'srd:spell.speak-with-plants', name: 'Speak with Plants', level: 3, school: 'transmutation',
  rangeKind: 'self', rangeFeet: 30, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.speak-with-plants', name: 'Speak with Plants',
    narrative: [{
      text: 'Plants within 30 feet can converse with you about events in the '
        + 'area over the past day, and you can turn plant-caused difficult '
        + 'terrain there ordinary or ordinary terrain difficult, for 10 '
        + 'minutes.',
      dmPromptable: false
    }]
  })
})

export const PLANT_GROWTH = spell({
  id: 'srd:spell.plant-growth', name: 'Plant Growth', level: 3, school: 'transmutation',
  rangeFeet: 150,
  effects: effects({
    id: 'srd:spell.plant-growth', name: 'Plant Growth',
    narrative: [{
      text: 'Cast in an action: plants in a 100-foot radius overgrow into '
        + 'difficult terrain costing 4 feet of movement per foot moved. Cast '
        + 'over 8 hours instead: plants in a half-mile radius are enriched, '
        + 'yielding double food for a year.',
      dmPromptable: false
    }]
  })
})

export const CREATE_FOOD_AND_WATER = spell({
  id: 'srd:spell.create-food-and-water', name: 'Create Food and Water', level: 3,
  school: 'conjuration', rangeFeet: 30,
  effects: effects({
    id: 'srd:spell.create-food-and-water', name: 'Create Food and Water',
    narrative: [{
      text: '45 pounds of food and 30 gallons of water appear — enough for '
        + 'fifteen humanoids or five steeds for a day. The food spoils after '
        + '24 hours.',
      dmPromptable: false
    }]
  })
})

export const WATER_BREATHING = spell({
  id: 'srd:spell.water-breathing', name: 'Water Breathing', level: 3, school: 'transmutation',
  ritual: true, rangeFeet: 30, durationSeconds: 86400,
  effects: effects({
    id: 'srd:spell.water-breathing', name: 'Water Breathing',
    narrative: [{
      text: 'Up to ten willing creatures can breathe underwater, in addition '
        + 'to their normal breathing, for 24 hours.',
      dmPromptable: false
    }]
  })
})

export const WATER_WALK = spell({
  id: 'srd:spell.water-walk', name: 'Water Walk', level: 3, school: 'transmutation',
  ritual: true, rangeFeet: 30, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.water-walk', name: 'Water Walk',
    narrative: [{
      text: 'Up to ten willing creatures can move across any liquid surface — '
        + 'water, acid, mud, lava — as though it were solid ground, for an '
        + 'hour. A submerged target is carried to the surface at 60 feet per '
        + 'round.',
      dmPromptable: false
    }]
  })
})

export const MELD_INTO_STONE = spell({
  id: 'srd:spell.meld-into-stone', name: 'Meld into Stone', level: 3, school: 'transmutation',
  ritual: true, rangeKind: 'touch', durationSeconds: 28800,
  effects: effects({
    id: 'srd:spell.meld-into-stone', name: 'Meld into Stone',
    narrative: [{
      text: 'You and your gear merge with a stone object large enough to '
        + 'contain you, undetectable by nonmagical senses, for 8 hours. You '
        + 'cannot see out and hear only at disadvantage.',
      dmPromptable: false
    }]
  })
})

export const TINY_HUT = spell({
  id: 'srd:spell.tiny-hut', name: 'Tiny Hut', level: 3, school: 'evocation',
  ritual: true, castingTime: { minutes: 1 }, rangeKind: 'self', rangeFeet: 10,
  durationSeconds: 28800,
  effects: effects({
    id: 'srd:spell.tiny-hut', name: 'Tiny Hut',
    narrative: [{
      text: 'An immobile 10-foot-radius dome of force appears around you for 8 '
        + 'hours, holding up to nine other Medium or smaller creatures. Nothing '
        + 'crosses it uninvited, and no spell can be cast through it.',
      dmPromptable: false
    }]
  })
})

export const BLINK = spell({
  id: 'srd:spell.blink', name: 'Blink', level: 3, school: 'transmutation',
  rangeKind: 'self', durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.blink', name: 'Blink',
    narrative: [{
      text: 'Roll a d20 at the end of each of your turns for a minute; on 11 '
        + 'or higher you vanish into the Ethereal Plane until the start of '
        + 'your next turn, when you return to a space of your choice within 10 '
        + 'feet.',
      dmPromptable: false
    }]
  })
})

export const ALL_LEVEL3_SPELLS: SpellDefinition[] = [
  { ...FIREBALL, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...LIGHTNING_BOLT, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...CALL_LIGHTNING, lists: ['srd:list.druid'] },
  { ...SPIRIT_GUARDIANS, lists: ['srd:list.cleric'] },
  { ...WIND_WALL, lists: ['srd:list.druid', 'srd:list.ranger'] },
  { ...VAMPIRIC_TOUCH, lists: ['srd:list.warlock', 'srd:list.wizard'] },
  { ...HASTE, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...FLY, lists: ['srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...BEACON_OF_HOPE, lists: ['srd:list.cleric'] },
  { ...GASEOUS_FORM, lists: ['srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...FEAR, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...HYPNOTIC_PATTERN, lists: [
    'srd:list.bard', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...SLOW, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...STINKING_CLOUD, lists: ['srd:list.druid', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...SLEET_STORM, lists: ['srd:list.druid', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...BESTOW_CURSE, lists: ['srd:list.bard', 'srd:list.cleric', 'srd:list.wizard'] },
  { ...MASS_HEALING_WORD, lists: ['srd:list.cleric'] },
  { ...CONJURE_ANIMALS, lists: ['srd:list.druid', 'srd:list.ranger', 'srd:list.wizard'] },
  { ...ANIMATE_DEAD, lists: ['srd:list.cleric', 'srd:list.wizard'] },
  { ...PHANTOM_STEED, lists: ['srd:list.wizard'] },
  { ...REVIVIFY, lists: ['srd:list.cleric', 'srd:list.paladin'] },
  { ...COUNTERSPELL, lists: ['srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...DISPEL_MAGIC, lists: [
    'srd:list.bard', 'srd:list.cleric', 'srd:list.druid', 'srd:list.paladin',
    'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...DAYLIGHT, lists: [
    'srd:list.cleric', 'srd:list.druid', 'srd:list.paladin', 'srd:list.ranger',
    'srd:list.sorcerer', 'srd:list.wizard'
  ] },
  { ...CLAIRVOYANCE, lists: ['srd:list.bard', 'srd:list.cleric', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...SENDING, lists: ['srd:list.bard', 'srd:list.cleric', 'srd:list.wizard'] },
  { ...TONGUES, lists: [
    'srd:list.bard', 'srd:list.cleric', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...NONDETECTION, lists: ['srd:list.bard', 'srd:list.ranger', 'srd:list.wizard'] },
  { ...MAJOR_IMAGE, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...GLYPH_OF_WARDING, lists: ['srd:list.bard', 'srd:list.cleric', 'srd:list.wizard'] },
  { ...MAGIC_CIRCLE, lists: [
    'srd:list.cleric', 'srd:list.paladin', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...REMOVE_CURSE, lists: ['srd:list.cleric', 'srd:list.paladin', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...SPEAK_WITH_DEAD, lists: ['srd:list.bard', 'srd:list.cleric'] },
  { ...SPEAK_WITH_PLANTS, lists: ['srd:list.bard', 'srd:list.druid', 'srd:list.ranger'] },
  { ...PLANT_GROWTH, lists: ['srd:list.druid', 'srd:list.ranger'] },
  { ...CREATE_FOOD_AND_WATER, lists: ['srd:list.cleric', 'srd:list.paladin'] },
  { ...WATER_BREATHING, lists: ['srd:list.druid', 'srd:list.ranger', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...WATER_WALK, lists: [
    'srd:list.cleric', 'srd:list.druid', 'srd:list.ranger', 'srd:list.sorcerer', 'srd:list.wizard'
  ] },
  { ...MELD_INTO_STONE, lists: ['srd:list.cleric', 'srd:list.druid'] },
  { ...TINY_HUT, lists: ['srd:list.bard', 'srd:list.wizard'] },
  { ...BLINK, lists: ['srd:list.sorcerer', 'srd:list.wizard'] }
]
