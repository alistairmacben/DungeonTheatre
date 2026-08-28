// 1st-level spells.
//
// Thirty-eight of them — the full union of every class's 1st-level column
// across all eight casters (docs/srd/08-spell-lists.md), minus the handful
// spells.ts and the class files already held. Split into its own file rather
// than grown inside spells.ts because the union at 1st level is triple the
// size of the cantrip union, and a single file that size stops being
// something a reader can hold in their head.
//
// Two spells here reuse shapes built for something else entirely:
//
// - Jump is the first spell to touch JUMP_LONG/JUMP_HIGH with `multiply`
//   rather than `add` — the paths were declared with `multiplyComposition:
//   'product'` from the start, for exactly this, and nobody had used it yet.
// - Hunter's Mark's advantage on tracking the marked creature is the ranger's
//   own Favored Enemy shape: a roll-channel modifier gated on a toggle,
//   because only the player knows which creature is marked.
//
// Sleep and Color Spray share a resolution shape nothing else in the set
// has: no attack roll and no saving throw, just a rolled hit-point pool spent
// against a sorted list of targets. There is no `delivery` value for that, so
// both stay pure narrative — not partial, because nothing here is a gap the
// vocabulary almost reaches. It is a fourth shape spells can take, next to
// attack/save/auto, and the fourth one is entirely the table's.

import type { EffectSource, Modifier, SpellDefinition } from '../rules/types.js'
import { ARMOR_CLASS, JUMP_HIGH, JUMP_LONG } from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `s1${++n}`

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
// Damage and healing — the shapes fire-bolt.ts and sacred-flame already proved
// ===========================================================================

export const BURNING_HANDS = spell({
  id: 'srd:spell.burning-hands', name: 'Burning Hands', level: 1, school: 'evocation',
  rangeKind: 'self', rangeFeet: 15,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'half' },
    damage: [{ dice: { count: 3, sides: 6 }, type: 'fire' }],
    perSlotAbove: { damageDice: { count: 1, sides: 6 } }
  },
  effects: effects({
    id: 'srd:spell.burning-hands', name: 'Burning Hands',
    narrative: [{
      text: 'A sheet of flame from your outstretched fingers, in a 15-foot cone. '
        + 'Every creature in it makes a Dexterity save, taking 3d6 fire damage on a '
        + 'failure and half on a success. The cone catches everyone at once — the '
        + 'resolved damage here is one target\'s; apply it to each. Ignites '
        + 'unattended flammable objects.',
      dmPromptable: true
    }]
  })
})

export const THUNDERWAVE = spell({
  id: 'srd:spell.thunderwave', name: 'Thunderwave', level: 1, school: 'evocation',
  rangeKind: 'self', rangeFeet: 15,
  effect: {
    delivery: 'save', save: { ability: 'con', onSuccess: 'half' },
    damage: [{ dice: { count: 2, sides: 8 }, type: 'thunder' }],
    perSlotAbove: { damageDice: { count: 1, sides: 8 } }
  },
  effects: effects({
    id: 'srd:spell.thunderwave', name: 'Thunderwave',
    // The push is a rider on a target the resolver has no target for — the
    // same wall Shocking Grasp's reaction denial and Ray of Frost's slow are
    // behind.
    completeness: 'partial',
    narrative: [{
      text: 'A wave of thunderous force in a 15-foot cube from you. Every creature '
        + 'in it makes a Constitution save, taking 2d8 thunder damage and being '
        + 'pushed 10 feet away on a failure, half damage and no push on a success. '
        + 'Unsecured objects in the area are pushed too. A thunderous boom is heard '
        + '300 feet away. The push is not modelled — apply it yourself.',
      dmPromptable: true
    }]
  })
})

export const GUIDING_BOLT = spell({
  id: 'srd:spell.guiding-bolt', name: 'Guiding Bolt', level: 1, school: 'evocation',
  rangeFeet: 120, durationSeconds: 6,
  effect: {
    delivery: 'attack',
    damage: [{ dice: { count: 4, sides: 6 }, type: 'radiant' }],
    perSlotAbove: { damageDice: { count: 1, sides: 6 } }
  },
  effects: effects({
    id: 'srd:spell.guiding-bolt', name: 'Guiding Bolt',
    // The advantage rider lands on whoever attacks the target next, which the
    // resolver cannot pre-load onto an attack that has not been declared yet.
    completeness: 'partial',
    narrative: [{
      text: 'A ranged spell attack for 4d6 radiant damage. On a hit, the next '
        + 'attack roll against the target before the end of your next turn has '
        + 'advantage — elect it yourself when that attack comes.',
      dmPromptable: true
    }]
  })
})

export const INFLICT_WOUNDS = spell({
  id: 'srd:spell.inflict-wounds', name: 'Inflict Wounds', level: 1, school: 'necromancy',
  rangeKind: 'touch',
  effect: {
    delivery: 'attack',
    damage: [{ dice: { count: 3, sides: 10 }, type: 'necrotic' }],
    perSlotAbove: { damageDice: { count: 1, sides: 10 } }
  },
  effects: effects({
    id: 'srd:spell.inflict-wounds', name: 'Inflict Wounds',
    narrative: [{
      text: 'A melee spell attack for 3d10 necrotic damage.',
      dmPromptable: false
    }]
  })
})

export const HEALING_WORD = spell({
  id: 'srd:spell.healing-word', name: 'Healing Word', level: 1, school: 'evocation',
  castingTime: 'bonusAction', rangeFeet: 60,
  effect: {
    delivery: 'auto',
    healing: { dice: { count: 1, sides: 4 }, addSpellMod: true },
    perSlotAbove: { healingDice: { count: 1, sides: 4 } }
  },
  effects: effects({
    id: 'srd:spell.healing-word', name: 'Healing Word',
    narrative: [{
      text: 'A creature you can see within 60 feet regains 1d4 + your spellcasting '
        + 'ability modifier hit points. No effect on undead or constructs. Costs a '
        + 'bonus action rather than an action — the one meaningful difference from '
        + 'Cure Wounds.',
      dmPromptable: false
    }]
  })
})

// ===========================================================================
// Buffs that install real modifiers — the mage-armor/shield/longstrider shape
// ===========================================================================

export const SHIELD_OF_FAITH = spell({
  id: 'srd:spell.shield-of-faith', name: 'Shield of Faith', level: 1, school: 'abjuration',
  castingTime: 'bonusAction', rangeFeet: 60, concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.shield-of-faith', name: 'Shield of Faith',
    modifiers: [add(ARMOR_CLASS, 2, { note: 'shield of faith' })],
    narrative: [{
      text: 'A shimmering field around a creature you can see. Its AC is +2 for '
        + 'up to 10 minutes, as long as you concentrate.',
      dmPromptable: false
    }]
  })
})

export const JUMP = spell({
  id: 'srd:spell.jump', name: 'Jump', level: 1, school: 'transmutation',
  rangeKind: 'touch', durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.jump', name: 'Jump',
    // The first spell to reach JUMP_LONG/JUMP_HIGH with `multiply` — the paths
    // were declared `multiplyComposition: 'product'` from the day they were
    // written, for exactly a spell like this one.
    modifiers: [
      { id: id(), channel: 'value', target: JUMP_LONG, op: 'multiply', value: 3, permanence: 'temporary', note: 'jump' },
      { id: id(), channel: 'value', target: JUMP_HIGH, op: 'multiply', value: 3, permanence: 'temporary', note: 'jump' }
    ],
    narrative: [{
      text: 'The jump distance of a creature you touch is tripled for a minute.',
      dmPromptable: false
    }]
  })
})

export const HUNTERS_MARK = spell({
  id: 'srd:spell.hunters-mark', name: "Hunter's Mark", level: 1, school: 'divination',
  castingTime: 'bonusAction', rangeFeet: 90, concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.hunters-mark', name: "Hunter's Mark",
    // The advantage half is the ranger's own Favored Enemy shape: a
    // roll-channel modifier gated on a toggle, because only the player knows
    // which creature is marked. The +1d6 damage on every hit is not — extra
    // damage dice on a roll already made is the wall Sneak Attack, Brutal
    // Critical and Divine Smite are all behind.
    completeness: 'partial',
    modifiers: [
      {
        id: id(), channel: 'roll', rollOp: 'advantage',
        scope: { kinds: ['check'], skills: ['perception', 'survival'] },
        condition: { playerToggle: 'spell.hunters-mark' },
        permanence: 'persistent',
        note: "Hunter's Mark: finding the marked creature"
      }
    ],
    narrative: [{
      text: 'Mark a creature you can see within 90 feet. Once on each of your '
        + 'turns, when you hit it with a weapon attack it takes an extra 1d6 '
        + 'damage — roll that yourself. If it drops to 0 hit points you may mark '
        + 'a new creature as a bonus action instead of ending the spell. Turn on '
        + 'the toggle for the advantage on tracking it.',
      toggleId: 'spell.hunters-mark', dmPromptable: true
    }]
  })
})

export const HEROISM = spell({
  id: 'srd:spell.heroism', name: 'Heroism', level: 1, school: 'enchantment',
  rangeKind: 'touch', concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.heroism', name: 'Heroism',
    // The immunity is Aura of Courage's shape exactly — suppress the
    // condition by source id. The temporary hit points that refresh every
    // turn are not modelled: temporary HP has no stat path anywhere in the
    // set, the same gap Dark One's Blessing and False Life sit behind.
    completeness: 'partial',
    modifiers: [{
      id: id(), channel: 'value', op: 'suppress', permanence: 'temporary',
      suppresses: { sourceIds: ['srd:condition.frightened'] },
      note: 'Heroism: immune to being frightened'
    }],
    narrative: [{
      text: 'A willing creature you touch is immune to being frightened for the '
        + 'duration, and gains temporary hit points equal to your spellcasting '
        + 'ability modifier at the start of each of its turns — add those by '
        + 'hand, and clear any that remain when the spell ends.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Save spells with a condition rather than damage — the resolver states the
// save and DC; what the condition does is the table's
// ===========================================================================

export const BANE = spell({
  id: 'srd:spell.bane', name: 'Bane', level: 1, school: 'enchantment',
  rangeFeet: 30, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.bane', name: 'Bane',
    // Bane's own inverse: a queued penalty die on a future roll, the same
    // party-wide reach Bless does not have either.
    completeness: 'partial',
    narrative: [{
      text: 'Up to three creatures you can see make a Charisma save or subtract '
        + '1d4 from every attack roll and saving throw they make for the duration. '
        + 'Party-wide penalty dice are not modelled — apply them at the table.',
      dmPromptable: true
    }]
  })
})

export const ANIMAL_FRIENDSHIP = spell({
  id: 'srd:spell.animal-friendship', name: 'Animal Friendship', level: 1, school: 'enchantment',
  rangeFeet: 30, durationSeconds: 86400,
  effects: effects({
    id: 'srd:spell.animal-friendship', name: 'Animal Friendship',
    completeness: 'partial',
    narrative: [{
      text: 'A beast that can see and hear you — automatically fails if its '
        + 'Intelligence is 4 or higher — makes a Wisdom save or is charmed by you '
        + 'for 24 hours. Ends early if you or a companion harms it.',
      dmPromptable: true
    }]
  })
})

export const COMMAND = spell({
  id: 'srd:spell.command', name: 'Command', level: 1, school: 'enchantment',
  rangeFeet: 60, components: { verbal: true, somatic: false }, durationSeconds: 6,
  effects: effects({
    id: 'srd:spell.command', name: 'Command',
    completeness: 'partial',
    narrative: [{
      text: 'One creature you can see makes a Wisdom save against your spell save '
        + 'DC or obeys a one-word command on its next turn — Approach, Drop, Flee, '
        + 'Grovel or Halt. No effect on undead, on a creature that does not '
        + 'understand you, or if the command is directly harmful.',
      dmPromptable: true
    }]
  })
})

export const ENTANGLE = spell({
  id: 'srd:spell.entangle', name: 'Entangle', level: 1, school: 'conjuration',
  rangeFeet: 90, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.entangle', name: 'Entangle',
    completeness: 'partial',
    narrative: [{
      text: 'Grasping weeds and vines fill a 20-foot square, becoming difficult '
        + 'terrain. Each creature there when it appears makes a Strength save or '
        + 'is restrained until it escapes with an action and a Strength check '
        + 'against your spell save DC.',
      dmPromptable: true
    }]
  })
})

export const GREASE = spell({
  id: 'srd:spell.grease', name: 'Grease', level: 1, school: 'conjuration',
  rangeFeet: 60, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.grease', name: 'Grease',
    completeness: 'partial',
    narrative: [{
      text: 'A 10-foot square of difficult terrain. A creature there when it '
        + 'appears, or that enters or ends its turn there, makes a Dexterity save '
        + 'or falls prone.',
      dmPromptable: true
    }]
  })
})

export const HIDEOUS_LAUGHTER = spell({
  id: 'srd:spell.hideous-laughter', name: 'Hideous Laughter', level: 1, school: 'enchantment',
  rangeFeet: 30, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.hideous-laughter', name: 'Hideous Laughter',
    completeness: 'partial',
    narrative: [{
      text: 'One creature you can see, Intelligence 5 or higher, makes a Wisdom '
        + 'save or falls prone, incapacitated and unable to stand, laughing '
        + 'uncontrollably. It repeats the save at the end of each of its turns and '
        + 'whenever it takes damage — with advantage when damage triggered it.',
      dmPromptable: true
    }]
  })
})

export const FAERIE_FIRE = spell({
  id: 'srd:spell.faerie-fire', name: 'Faerie Fire', level: 1, school: 'evocation',
  rangeFeet: 60, components: { verbal: true, somatic: false },
  concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.faerie-fire', name: 'Faerie Fire',
    // Advantage granted to whoever attacks the outlined creature next — a
    // rider on someone else's future roll, the wall Bless and Guiding Bolt's
    // rider are behind.
    completeness: 'partial',
    narrative: [{
      text: 'Every object in a 20-foot cube is outlined in light; creatures there '
        + 'make a Dexterity save or are outlined too. Outlined things shed dim '
        + 'light 10 feet, cannot benefit from being invisible, and every attack '
        + 'against them has advantage as long as the attacker can see them — elect '
        + 'that advantage yourself.',
      dmPromptable: true
    }]
  })
})

export const PROTECTION_FROM_EVIL_AND_GOOD = spell({
  id: 'srd:spell.protection-from-evil-and-good', name: 'Protection from Evil and Good',
  level: 1, school: 'abjuration', rangeKind: 'touch', concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.protection-from-evil-and-good', name: 'Protection from Evil and Good',
    // The paladin's Purity of Spirit grants this exact effect permanently, and
    // is partial for the same reason: every clause depends on the type of a
    // specific attacker, which nothing here reads.
    completeness: 'partial',
    narrative: [{
      text: 'A willing creature you touch: aberrations, celestials, elementals, '
        + 'fey, fiends and undead have disadvantage on attacks against it, it '
        + 'cannot be charmed, frightened or possessed by them, and an existing '
        + 'such effect gives it advantage on its next save to end it.',
      dmPromptable: true
    }]
  })
})

export const SANCTUARY = spell({
  id: 'srd:spell.sanctuary', name: 'Sanctuary', level: 1, school: 'abjuration',
  castingTime: 'bonusAction', rangeFeet: 30, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.sanctuary', name: 'Sanctuary',
    // Fires before a target is even selected, redirecting an attack that has
    // not happened yet — there is no hook that early in the pipeline.
    completeness: 'partial',
    narrative: [{
      text: 'A creature you choose is warded: any creature targeting it with an '
        + 'attack or a harmful spell must first succeed on a Wisdom save against '
        + 'your spell save DC or choose a new target. No protection against area '
        + 'effects. Ends if the warded creature attacks or casts a spell affecting '
        + 'an enemy.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Pure information and utility — nothing here is a gap, there is simply
// nothing to compute
// ===========================================================================

export const ALARM = spell({
  id: 'srd:spell.alarm', name: 'Alarm', level: 1, school: 'abjuration',
  ritual: true, castingTime: { minutes: 1 }, rangeFeet: 30, durationSeconds: 28800,
  effects: effects({
    id: 'srd:spell.alarm', name: 'Alarm',
    narrative: [{
      text: 'Wards a door, window or area up to a 20-foot cube for 8 hours. You '
        + 'choose a mental alarm (a ping in your mind within a mile, waking you) '
        + 'or an audible one (a ringing handbell for 10 seconds, 60 feet away) '
        + 'when a Tiny or larger creature you have not exempted touches or enters '
        + 'the warded area.',
      dmPromptable: false
    }]
  })
})

export const COMPREHEND_LANGUAGES = spell({
  id: 'srd:spell.comprehend-languages', name: 'Comprehend Languages', level: 1,
  school: 'divination', ritual: true, rangeKind: 'self', durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.comprehend-languages', name: 'Comprehend Languages',
    narrative: [{
      text: 'You understand any spoken language you hear, and any written '
        + 'language you touch, for an hour. Does not decode secret messages or '
        + 'non-language glyphs.',
      dmPromptable: false
    }]
  })
})

export const CREATE_OR_DESTROY_WATER = spell({
  id: 'srd:spell.create-or-destroy-water', name: 'Create or Destroy Water', level: 1,
  school: 'transmutation', rangeFeet: 30,
  effects: effects({
    id: 'srd:spell.create-or-destroy-water', name: 'Create or Destroy Water',
    narrative: [{
      text: 'Create 10 gallons of water in an open container, or as rain that '
        + 'falls and extinguishes exposed flames in a 30-foot cube; or destroy 10 '
        + 'gallons of water, or destroy fog in a 30-foot cube.',
      dmPromptable: false
    }]
  })
})

export const DETECT_EVIL_AND_GOOD = spell({
  id: 'srd:spell.detect-evil-and-good', name: 'Detect Evil and Good', level: 1,
  school: 'divination', rangeKind: 'self', concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.detect-evil-and-good', name: 'Detect Evil and Good',
    narrative: [{
      text: 'For 10 minutes you know the presence and location of aberrations, '
        + 'celestials, elementals, fey, fiends and undead within 30 feet, and of '
        + 'consecrated or desecrated places or objects. Blocked by a foot of '
        + 'stone, an inch of common metal, a thin sheet of lead, or three feet of '
        + 'wood or dirt.',
      dmPromptable: false
    }]
  })
})

export const DETECT_POISON_AND_DISEASE = spell({
  id: 'srd:spell.detect-poison-and-disease', name: 'Detect Poison and Disease', level: 1,
  school: 'divination', ritual: true, rangeKind: 'self', concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.detect-poison-and-disease', name: 'Detect Poison and Disease',
    narrative: [{
      text: 'For 10 minutes you sense and identify poisons, poisonous creatures '
        + 'and diseases within 30 feet, subject to the same barriers as Detect '
        + 'Evil and Good.',
      dmPromptable: false
    }]
  })
})

export const DISGUISE_SELF = spell({
  id: 'srd:spell.disguise-self', name: 'Disguise Self', level: 1, school: 'illusion',
  rangeKind: 'self', durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.disguise-self', name: 'Disguise Self',
    narrative: [{
      text: 'Change how you and your gear look — within a foot of your own '
        + 'height, any build, same body type and limb arrangement — for an hour. '
        + 'Fails physical inspection, and an Intelligence (Investigation) check '
        + 'against your spell save DC sees through it.',
      dmPromptable: false
    }]
  })
})

export const FEATHER_FALL = spell({
  id: 'srd:spell.feather-fall', name: 'Feather Fall', level: 1, school: 'transmutation',
  castingTime: 'reaction', rangeFeet: 60,
  components: { verbal: true, somatic: false }, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.feather-fall', name: 'Feather Fall',
    narrative: [{
      text: 'Cast as a reaction when you or a creature within 60 feet falls. Up '
        + 'to five falling creatures slow to 60 feet per round; on landing they '
        + 'take no falling damage, land on their feet, and the spell ends for '
        + 'them.',
      dmPromptable: false
    }]
  })
})

export const FIND_FAMILIAR = spell({
  id: 'srd:spell.find-familiar', name: 'Find Familiar', level: 1, school: 'conjuration',
  ritual: true, castingTime: { hours: 1 }, rangeFeet: 10,
  effects: effects({
    id: 'srd:spell.find-familiar', name: 'Find Familiar',
    // No bestiary and no engine for running a character from a second
    // statblock — the same wall Wild Shape and Pact of the Chain sit behind.
    completeness: 'partial',
    narrative: [{
      text: 'Summon a spirit familiar in an animal form of your choice — bat, '
        + 'cat, crab, frog, hawk, lizard, octopus, owl, poisonous snake, fish, '
        + 'rat, raven, sea horse, spider or weasel — using that animal\'s '
        + 'statistics. It acts on its own initiative, obeys you, and cannot '
        + 'attack. You can see and hear through it as an action, becoming blind '
        + 'and deaf yourself while you do. Run it from a statblock at the table.',
      dmPromptable: true
    }]
  })
})

export const FLOATING_DISK = spell({
  id: 'srd:spell.floating-disk', name: 'Floating Disk', level: 1, school: 'conjuration',
  ritual: true, rangeFeet: 30, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.floating-disk', name: 'Floating Disk',
    narrative: [{
      text: 'A 3-foot disk of force, floating 3 feet off the ground, that '
        + 'carries up to 500 pounds. It stays within 20 feet of you, cannot cross '
        + 'a 10-foot elevation change, and dumps its load if overloaded or if you '
        + 'move more than 100 feet from it.',
      dmPromptable: false
    }]
  })
})

export const FOG_CLOUD = spell({
  id: 'srd:spell.fog-cloud', name: 'Fog Cloud', level: 1, school: 'conjuration',
  rangeFeet: 120, concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.fog-cloud', name: 'Fog Cloud',
    narrative: [{
      text: 'A 20-foot-radius sphere of fog, heavily obscuring everything in it, '
        + 'spreading around corners. Dispersed by a wind of at least 10 mph.',
      dmPromptable: false
    }]
  })
})

export const GOODBERRY = spell({
  id: 'srd:spell.goodberry', name: 'Goodberry', level: 1, school: 'transmutation',
  rangeKind: 'touch',
  effects: effects({
    id: 'srd:spell.goodberry', name: 'Goodberry',
    narrative: [{
      text: 'Ten berries appear in your hand. Eating one is an action, restores '
        + '1 hit point, and provides a full day\'s nourishment. They lose potency '
        + 'after 24 hours.',
      dmPromptable: false
    }]
  })
})

export const ILLUSORY_SCRIPT = spell({
  id: 'srd:spell.illusory-script', name: 'Illusory Script', level: 1, school: 'illusion',
  ritual: true, castingTime: { minutes: 1 }, rangeKind: 'touch',
  components: { verbal: false, somatic: true, material: 'lead-based ink worth at least 10 gp', materialCostCp: 1000, consumed: true },
  durationSeconds: 864000,
  effects: effects({
    id: 'srd:spell.illusory-script', name: 'Illusory Script',
    narrative: [{
      text: 'Writing legible to you and creatures you designate; to anyone else '
        + 'it reads as unintelligible, or as a different message you compose, for '
        + '10 days. Dispelling destroys both the true and false script. Truesight '
        + 'reads the hidden message.',
      dmPromptable: false
    }]
  })
})

export const PURIFY_FOOD_AND_DRINK = spell({
  id: 'srd:spell.purify-food-and-drink', name: 'Purify Food and Drink', level: 1,
  school: 'transmutation', ritual: true, rangeFeet: 10,
  effects: effects({
    id: 'srd:spell.purify-food-and-drink', name: 'Purify Food and Drink',
    narrative: [{
      text: 'All nonmagical food and drink in a 5-foot-radius sphere becomes '
        + 'free of poison and disease.',
      dmPromptable: false
    }]
  })
})

export const SILENT_IMAGE = spell({
  id: 'srd:spell.silent-image', name: 'Silent Image', level: 1, school: 'illusion',
  rangeFeet: 60, concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.silent-image', name: 'Silent Image',
    narrative: [{
      text: 'A purely visual image, up to a 15-foot cube, with no sound, smell '
        + 'or other sensory effect. Use your action to move it within range and '
        + 'change its appearance. An Intelligence (Investigation) check against '
        + 'your spell save DC reveals it as an illusion.',
      dmPromptable: false
    }]
  })
})

export const SPEAK_WITH_ANIMALS = spell({
  id: 'srd:spell.speak-with-animals', name: 'Speak with Animals', level: 1,
  school: 'divination', ritual: true, rangeKind: 'self', durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.speak-with-animals', name: 'Speak with Animals',
    narrative: [{
      text: 'For 10 minutes you can comprehend and verbally communicate with '
        + 'beasts. They can, at minimum, tell you about nearby locations and '
        + 'monsters, including what they have perceived in the past day.',
      dmPromptable: true
    }]
  })
})

export const UNSEEN_SERVANT = spell({
  id: 'srd:spell.unseen-servant', name: 'Unseen Servant', level: 1, school: 'conjuration',
  ritual: true, rangeFeet: 60, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.unseen-servant', name: 'Unseen Servant',
    // A second character on the field — AC, hit points, its own actions —
    // with no statblock system to run it from.
    completeness: 'partial',
    narrative: [{
      text: 'An invisible, mindless force appears: AC 10, 1 hit point, Strength '
        + '2, and it cannot attack. Use a bonus action once per turn to move it '
        + '15 feet and have it fetch, clean, mend, fold, light fires, serve food '
        + 'or pour wine. It ends at 0 hit points or if commanded more than 60 '
        + 'feet away.',
      dmPromptable: true
    }]
  })
})

export const FALSE_LIFE = spell({
  id: 'srd:spell.false-life', name: 'False Life', level: 1, school: 'necromancy',
  rangeKind: 'self', durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.false-life', name: 'False Life',
    // Temporary hit points have no stat path anywhere in the set — the same
    // gap Dark One's Blessing and Heroism are behind.
    completeness: 'partial',
    narrative: [{
      text: 'You gain 1d4 + 4 temporary hit points for an hour. Add them by '
        + 'hand.',
      dmPromptable: true
    }]
  })
})

export const DIVINE_FAVOR = spell({
  id: 'srd:spell.divine-favor', name: 'Divine Favor', level: 1, school: 'evocation',
  castingTime: 'bonusAction', rangeKind: 'self', concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.divine-favor', name: 'Divine Favor',
    // Extra damage dice on a weapon hit — the queue Sneak Attack, Brutal
    // Critical, Divine Smite and Hunter's Mark are already in.
    completeness: 'partial',
    narrative: [{
      text: 'Your weapon attacks deal an extra 1d4 radiant damage on a hit, for '
        + 'up to a minute. Roll it yourself alongside your damage.',
      dmPromptable: true
    }]
  })
})

export const EXPEDITIOUS_RETREAT = spell({
  id: 'srd:spell.expeditious-retreat', name: 'Expeditious Retreat', level: 1,
  school: 'transmutation', castingTime: 'bonusAction', rangeKind: 'self',
  concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.expeditious-retreat', name: 'Expeditious Retreat',
    // Grants a bonus-action Dash, which changes what an action buys rather
    // than any stat — the same shape Extra Attack's gap is, in reverse.
    narrative: [{
      text: 'For up to 10 minutes you may take the Dash action as a bonus '
        + 'action on each of your turns.',
      dmPromptable: false
    }]
  })
})

// ===========================================================================
// A resolution shape nothing else in the set has — no attack, no save
// ===========================================================================

export const SLEEP = spell({
  id: 'srd:spell.sleep', name: 'Sleep', level: 1, school: 'enchantment',
  rangeFeet: 90, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.sleep', name: 'Sleep',
    narrative: [{
      text: 'Roll 5d8 — a pool of hit points. Starting with the creature with '
        + 'the lowest current hit points within 20 feet of a point you choose, '
        + 'each creature whose hit points are at or below what remains in the '
        + 'pool falls unconscious, and its hit points are subtracted from the '
        + 'pool; unconscious creatures are skipped. Undead and creatures immune '
        + 'to being charmed are unaffected. A sleeper wakes on taking damage or '
        + 'if someone uses an action to rouse it.',
      dmPromptable: true
    }]
  })
})

export const COLOR_SPRAY = spell({
  id: 'srd:spell.color-spray', name: 'Color Spray', level: 1, school: 'illusion',
  rangeKind: 'self', rangeFeet: 15, durationSeconds: 6,
  effects: effects({
    id: 'srd:spell.color-spray', name: 'Color Spray',
    narrative: [{
      text: 'A dazzling array of flashing colours in a 15-foot cone. Roll 6d10 — '
        + 'a pool of hit points. Starting with the creature with the lowest '
        + 'current hit points in the cone, each creature is blinded until the '
        + 'spell ends if its hit points are at or below what remains in the pool, '
        + 'and its hit points are subtracted from the pool. Unconscious creatures '
        + 'and those that cannot see are unaffected.',
      dmPromptable: true
    }]
  })
})

export const ALL_LEVEL1_SPELLS: SpellDefinition[] = [
  { ...BURNING_HANDS, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...THUNDERWAVE, lists: [
    'srd:list.bard', 'srd:list.druid', 'srd:list.sorcerer', 'srd:list.wizard'
  ] },
  { ...GUIDING_BOLT, lists: ['srd:list.cleric'] },
  { ...INFLICT_WOUNDS, lists: ['srd:list.cleric'] },
  { ...HEALING_WORD, lists: ['srd:list.bard', 'srd:list.cleric', 'srd:list.druid'] },
  { ...SHIELD_OF_FAITH, lists: ['srd:list.cleric', 'srd:list.paladin'] },
  { ...JUMP, lists: ['srd:list.druid', 'srd:list.ranger', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...HUNTERS_MARK, lists: ['srd:list.ranger'] },
  { ...HEROISM, lists: ['srd:list.bard', 'srd:list.paladin'] },
  { ...BANE, lists: ['srd:list.bard', 'srd:list.cleric'] },
  { ...ANIMAL_FRIENDSHIP, lists: ['srd:list.bard', 'srd:list.druid', 'srd:list.ranger'] },
  { ...COMMAND, lists: ['srd:list.cleric', 'srd:list.paladin'] },
  { ...ENTANGLE, lists: ['srd:list.druid'] },
  { ...GREASE, lists: ['srd:list.wizard'] },
  { ...HIDEOUS_LAUGHTER, lists: ['srd:list.bard', 'srd:list.wizard'] },
  { ...FAERIE_FIRE, lists: ['srd:list.bard', 'srd:list.druid'] },
  { ...PROTECTION_FROM_EVIL_AND_GOOD, lists: [
    'srd:list.cleric', 'srd:list.paladin', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...SANCTUARY, lists: ['srd:list.cleric'] },
  { ...ALARM, lists: ['srd:list.ranger', 'srd:list.wizard'] },
  { ...COMPREHEND_LANGUAGES, lists: [
    'srd:list.bard', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...CREATE_OR_DESTROY_WATER, lists: ['srd:list.cleric', 'srd:list.druid'] },
  { ...DETECT_EVIL_AND_GOOD, lists: ['srd:list.cleric', 'srd:list.paladin'] },
  { ...DETECT_POISON_AND_DISEASE, lists: [
    'srd:list.cleric', 'srd:list.druid', 'srd:list.ranger'
  ] },
  { ...DISGUISE_SELF, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...FEATHER_FALL, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...FIND_FAMILIAR, lists: ['srd:list.wizard'] },
  { ...FLOATING_DISK, lists: ['srd:list.wizard'] },
  { ...FOG_CLOUD, lists: [
    'srd:list.druid', 'srd:list.ranger', 'srd:list.sorcerer', 'srd:list.wizard'
  ] },
  { ...GOODBERRY, lists: ['srd:list.druid', 'srd:list.ranger'] },
  { ...ILLUSORY_SCRIPT, lists: ['srd:list.bard', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...PURIFY_FOOD_AND_DRINK, lists: [
    'srd:list.cleric', 'srd:list.druid', 'srd:list.paladin'
  ] },
  { ...SILENT_IMAGE, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...SPEAK_WITH_ANIMALS, lists: ['srd:list.bard', 'srd:list.druid', 'srd:list.ranger'] },
  { ...UNSEEN_SERVANT, lists: ['srd:list.warlock', 'srd:list.wizard'] },
  { ...FALSE_LIFE, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...DIVINE_FAVOR, lists: ['srd:list.paladin'] },
  { ...EXPEDITIOUS_RETREAT, lists: ['srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...SLEEP, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...COLOR_SPRAY, lists: ['srd:list.sorcerer', 'srd:list.wizard'] }
]
