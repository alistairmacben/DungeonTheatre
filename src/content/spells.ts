// Spells.
//
// Started as twelve, chosen the way the weapons and feats were: for coverage,
// not volume. Between them they exercise every axis the spell model has —
// cantrip/slotted, instantaneous/duration, concentration/not, ritual, attack
// roll/save/no roll, self/touch/ranged, and a buff that has to reach the same
// stat pipeline armour uses.
//
// Now growing toward the full SRD list, class by class rather than
// alphabetically: every class file has a cantrip or spell pool that stops
// short of what the SRD actually grants, because the spell did not exist yet.
// This pass closes the cantrip column for all six casters that have one —
// Cleric, Druid, Sorcerer, Wizard, Warlock, Bard — at once, since the six
// cantrip lists overlap enormously and ten new spells plus two pool
// corrections (Thaumaturgy was authored but never added to the cleric's own
// pool; Poison Spray never got a mechanical effect at all) complete all six.
//
// The load-bearing property, as everywhere else: none of these contains
// calculation logic. `mage armor` competes with chain mail through the ordinary
// highest-wins `base` rule, and *shield* stacks on top of it with `add`,
// because that is what the operations already mean.

import type { EffectSource, Modifier, SpellDefinition } from '../rules/types.js'
import { ARMOR_CLASS, resistancePath, speedPath } from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `sp${++n}`

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

const WIZARD = 'srd:list.wizard'
const CLERIC = 'srd:list.cleric'
const SORCERER = 'srd:list.sorcerer'

// ===========================================================================
// Cantrips — no slot, so `slotGroup` never comes into it
// ===========================================================================

export const FIRE_BOLT = spell({
  id: 'srd:spell.fire-bolt', name: 'Fire Bolt', level: 0, school: 'evocation',
  rangeFeet: 120,
  // The first spell with a resolved effect: a spell attack for 1d10 fire that
  // grows with character level. `cantripScaling` is the whole of the "increases
  // at 5th/11th/17th" clause below — the resolver applies it, so a level-11
  // wizard sees 3d10 with no second definition.
  effect: {
    delivery: 'attack',
    damage: [{ dice: { count: 1, sides: 10 }, type: 'fire' }],
    cantripScaling: true
  },
  effects: effects({
    id: 'srd:spell.fire-bolt', name: 'Fire Bolt',
    narrative: [{
      text: 'A mote of fire. Make a ranged spell attack; on a hit the target '
        + 'takes 1d10 fire damage. The damage increases at 5th, 11th and 17th level.',
      dmPromptable: false
    }]
  })
})

export const RAY_OF_FROST = spell({
  id: 'srd:spell.ray-of-frost', name: 'Ray of Frost', level: 0, school: 'evocation',
  rangeFeet: 60,
  // The speed reduction is a rider on the target the engine has no target to
  // apply it to — it stays narrative. The damage is real.
  effect: {
    delivery: 'attack',
    damage: [{ dice: { count: 1, sides: 8 }, type: 'cold' }],
    cantripScaling: true
  },
  effects: effects({
    id: 'srd:spell.ray-of-frost', name: 'Ray of Frost',
    narrative: [{
      text: 'A ranged spell attack for 1d8 cold damage. On a hit the target’s '
        + 'speed is reduced by 10 feet until the start of your next turn.',
      dmPromptable: false
    }]
  })
})

export const PRESTIDIGITATION = spell({
  id: 'srd:spell.prestidigitation', name: 'Prestidigitation', level: 0,
  school: 'transmutation', rangeFeet: 10, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.prestidigitation', name: 'Prestidigitation',
    narrative: [{
      text: 'A minor magical trick: a shower of sparks, a puff of wind, a faint '
        + 'sound, a small mark or a trinket. Whatever the table agrees it does.',
      dmPromptable: true
    }]
  })
})

/**
 * The druid's cantrip pool was a selection with nowhere to choose from — no
 * `from:` list, because the agent who wrote it believed `SelectionDefinition`
 * had no spell-list kind. It does (`'spellList'`, already in the vocabulary,
 * used correctly by the bard next to it). This and Mending below give that
 * pool two real, quote-checked cantrips so a level-1 druid's "choose two" is
 * finally answerable.
 */
export const DRUIDCRAFT = spell({
  id: 'srd:spell.druidcraft', name: 'Druidcraft', level: 0,
  school: 'transmutation', rangeFeet: 30,
  effects: effects({
    id: 'srd:spell.druidcraft', name: 'Druidcraft',
    narrative: [{
      text: 'One of: a 24-hour weather prediction; make a flower bloom or a '
        + 'seed pod open; a harmless sensory effect in a 5-foot cube — falling '
        + 'leaves, a puff of wind, an animal sound, an odour; light or snuff a '
        + 'candle, torch or small campfire.',
      dmPromptable: true
    }]
  })
})

// ---------------------------------------------------------------------------
// Cleric cantrips
//
// Added so a cleric's Cantrips Known column has something to draw from: the
// class knows three at 1st and five by 10th, and the content set held two.
// All four are on the SRD cleric cantrip list (docs/srd/08-spell-lists.md) and
// were checked against docs/srd/08b-spell-descriptions.md.
// ---------------------------------------------------------------------------

export const GUIDANCE = spell({
  id: 'srd:spell.guidance', name: 'Guidance', level: 0,
  school: 'divination', rangeKind: 'touch',
  components: { verbal: true, somatic: true },
  concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.guidance', name: 'Guidance',
    narrative: [{
      // The SRD explicitly permits deciding after the d20 is seen, which the
      // roll pipeline has no window for — a modifier joins a roll as it is
      // resolved, not after the player has read it.
      text: 'Once before the spell ends, the target adds 1d4 to one ability check '
        + 'of its choice, and may roll the die before or after making the check. '
        + 'Then the spell ends. Roll and add the d4 yourself — the app cannot '
        + 'reopen a roll you have already seen.',
      dmPromptable: true
    }]
  })
})

export const RESISTANCE = spell({
  id: 'srd:spell.resistance', name: 'Resistance', level: 0,
  school: 'abjuration', rangeKind: 'touch',
  components: { verbal: true, somatic: true, material: 'a miniature cloak' },
  concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.resistance', name: 'Resistance',
    narrative: [{
      text: 'Once before the spell ends, the target adds 1d4 to one saving throw '
        + 'of its choice, rolling the die before or after the save. Then the '
        + 'spell ends. The saving-throw twin of Guidance, and the same manual roll.',
      dmPromptable: true
    }]
  })
})

export const SPARE_THE_DYING = spell({
  id: 'srd:spell.spare-the-dying', name: 'Spare the Dying', level: 0,
  school: 'necromancy', rangeKind: 'touch',
  components: { verbal: true, somatic: true },
  effects: effects({
    id: 'srd:spell.spare-the-dying', name: 'Spare the Dying',
    narrative: [{
      text: 'A living creature at 0 hit points becomes stable. No effect on undead '
        + 'or constructs. Stabilising another character is the DM\'s to apply.',
      dmPromptable: true
    }]
  })
})

export const LIGHT = spell({
  id: 'srd:spell.light', name: 'Light', level: 0,
  school: 'evocation', rangeKind: 'touch',
  // "V, M" — no somatic component, which is unusual enough to be worth stating
  // rather than defaulting.
  components: { verbal: true, somatic: false, material: 'a firefly or phosphorescent moss' },
  durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.light', name: 'Light',
    narrative: [{
      text: 'An object no larger than 10 feet in any dimension sheds bright light '
        + 'in a 20-foot radius and dim light for 20 feet more, in a colour you '
        + 'choose. Covering it with something opaque blocks the light. It ends if '
        + 'you cast it again or dismiss it as an action. An object held or worn by '
        + 'a hostile creature gets a Dexterity save to avoid it.',
      dmPromptable: true
    }]
  })
})

export const MENDING = spell({
  id: 'srd:spell.mending', name: 'Mending', level: 0,
  school: 'transmutation', castingTime: { minutes: 1 }, rangeKind: 'touch',
  // A plain "M" with no listed cost is met by an ordinary component pouch or
  // spellcasting focus under the core rules — the specific object is flavour,
  // not a mechanical fact this extraction records, so none is claimed here.
  components: { verbal: true, somatic: true, material: 'a component pouch or spellcasting focus' },
  effects: effects({
    id: 'srd:spell.mending', name: 'Mending',
    narrative: [{
      text: 'Repairs one break or tear no longer than a foot in any dimension, '
        + 'leaving no trace. Can physically repair a magic item or construct '
        + 'but cannot restore its magic.',
      dmPromptable: false
    }]
  })
})

export const SACRED_FLAME = spell({
  id: 'srd:spell.sacred-flame', name: 'Sacred Flame', level: 0, school: 'evocation',
  rangeFeet: 60, components: { verbal: true, somatic: true },
  // A save spell, not an attack: the target rolls, the caster does not. On a
  // successful save it takes nothing ('none'), which the DC and ability let the
  // DM adjudicate directly.
  effect: {
    delivery: 'save',
    save: { ability: 'dex', onSuccess: 'none' },
    damage: [{ dice: { count: 1, sides: 8 }, type: 'radiant' }],
    cantripScaling: true
  },
  effects: effects({
    id: 'srd:spell.sacred-flame', name: 'Sacred Flame',
    narrative: [{
      text: 'Radiance falls on a target you can see. It must succeed on a '
        + 'Dexterity saving throw or take 1d8 radiant damage. Cover does not help it.',
      dmPromptable: false
    }]
  })
})

export const ACID_SPLASH = spell({
  id: 'srd:spell.acid-splash', name: 'Acid Splash', level: 0, school: 'conjuration',
  rangeFeet: 60,
  effect: {
    delivery: 'save',
    save: { ability: 'dex', onSuccess: 'none' },
    damage: [{ dice: { count: 1, sides: 6 }, type: 'acid' }],
    cantripScaling: true
  },
  effects: effects({
    id: 'srd:spell.acid-splash', name: 'Acid Splash',
    narrative: [{
      text: 'A bubble of acid at one creature, or two within 5 feet of each other. '
        + 'Each target makes a Dexterity save or takes 1d6 acid damage. Targeting a '
        + 'second creature is not modelled — resolve one target here and the other '
        + 'at the table.',
      dmPromptable: true
    }],
    completeness: 'partial'
  })
})

export const DANCING_LIGHTS = spell({
  id: 'srd:spell.dancing-lights', name: 'Dancing Lights', level: 0, school: 'evocation',
  rangeFeet: 120, concentration: true, durationSeconds: 60,
  components: { verbal: true, somatic: true, material: 'a bit of phosphorus or wychwood, or a glowworm' },
  effects: effects({
    id: 'srd:spell.dancing-lights', name: 'Dancing Lights',
    narrative: [{
      text: 'Up to four torch-sized lights, or one Medium humanoid shape, each '
        + 'shedding dim light in a 10-foot radius. Move them up to 60 feet as a '
        + 'bonus action; each must stay within 20 feet of another or it winks out.',
      dmPromptable: false
    }]
  })
})

export const MAGE_HAND = spell({
  id: 'srd:spell.mage-hand', name: 'Mage Hand', level: 0, school: 'conjuration',
  rangeFeet: 30, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.mage-hand', name: 'Mage Hand',
    narrative: [{
      text: 'A spectral hand that vanishes beyond 30 feet or on a recast. Use your '
        + 'action to move it up to 30 feet and manipulate an object, open an '
        + 'unlocked door or container, or pour out a vial. It cannot attack, '
        + 'activate a magic item, or carry more than 10 pounds.',
      dmPromptable: false
    }]
  })
})

export const MESSAGE = spell({
  id: 'srd:spell.message', name: 'Message', level: 0, school: 'transmutation',
  rangeFeet: 120, durationSeconds: 6,
  components: { verbal: true, somatic: true, material: 'a short piece of copper wire' },
  effects: effects({
    id: 'srd:spell.message', name: 'Message',
    narrative: [{
      text: 'A whispered message to one creature you point at, who can reply in a '
        + 'whisper only you hear. Travels around corners and through solid '
        + 'objects, but is blocked by magical silence, a foot of stone, an inch of '
        + 'common metal, a thin sheet of lead, or three feet of wood.',
      dmPromptable: false
    }]
  })
})

export const MINOR_ILLUSION = spell({
  id: 'srd:spell.minor-illusion', name: 'Minor Illusion', level: 0, school: 'illusion',
  rangeFeet: 30, durationSeconds: 60,
  // "S, M (no verbal)" — the inverse of Light's "V, M (no somatic)", and worth
  // stating explicitly for the same reason.
  components: { verbal: false, somatic: true, material: 'a bit of fleece' },
  effects: effects({
    id: 'srd:spell.minor-illusion', name: 'Minor Illusion',
    narrative: [{
      text: 'Either a sound or an image of an object, not both — a sound as loud '
        + 'as a scream, or a silent, motionless image no larger than a 5-foot '
        + 'cube. Physical interaction reveals the image; a creature can use its '
        + 'action and an Intelligence (Investigation) check against your spell '
        + 'save DC to discern either.',
      dmPromptable: true
    }]
  })
})

export const PRODUCE_FLAME = spell({
  id: 'srd:spell.produce-flame', name: 'Produce Flame', level: 0, school: 'conjuration',
  rangeKind: 'self', rangeFeet: 30, durationSeconds: 600,
  // A cantrip that is a light source until the moment it becomes a weapon:
  // hurling it — on casting, or as an action any time before the spell ends —
  // is the attack, and attacking ends the light. Modelled as an attack cantrip
  // like Fire Bolt; the light-only mode has nothing to resolve.
  effect: {
    delivery: 'attack',
    damage: [{ dice: { count: 1, sides: 8 }, type: 'fire' }],
    cantripScaling: true
  },
  effects: effects({
    id: 'srd:spell.produce-flame', name: 'Produce Flame',
    narrative: [{
      text: 'A flame flickers in your hand, shedding bright light 10 feet and '
        + 'dim light 10 feet more, for up to 10 minutes. Attacking with it — on '
        + 'casting, or as an action later — hurls it at a creature within 30 feet '
        + 'as a ranged spell attack, and ends the light.',
      dmPromptable: false
    }]
  })
})

export const SHILLELAGH = spell({
  id: 'srd:spell.shillelagh', name: 'Shillelagh', level: 0, school: 'transmutation',
  castingTime: 'bonusAction', rangeKind: 'touch', durationSeconds: 60,
  components: { verbal: true, somatic: true, material: 'a club or quarterstaff' },
  effects: effects({
    id: 'srd:spell.shillelagh', name: 'Shillelagh',
    // Overrides which ability a weapon attack uses and replaces its damage die
    // — a weapon's statistics are read straight off the item, not computed
    // through an effect pipeline a spell could redirect. The same wall the
    // paladin's Divine Smite and the ranger's Foe Slayer are behind.
    completeness: 'partial',
    narrative: [{
      text: 'For one minute, the club or quarterstaff you touch uses your '
        + 'spellcasting ability instead of Strength for its attack and damage '
        + 'rolls, its damage die becomes a d8, and it counts as magical. Ends '
        + 'early if you cast this again or let go of the weapon. The app reads a '
        + 'weapon\'s ability and die from the item — change them on the weapon '
        + 'itself, or apply the swap by hand when you attack.',
      dmPromptable: true
    }]
  })
})

export const SHOCKING_GRASP = spell({
  id: 'srd:spell.shocking-grasp', name: 'Shocking Grasp', level: 0, school: 'evocation',
  rangeKind: 'touch',
  effect: {
    delivery: 'attack',
    damage: [{ dice: { count: 1, sides: 8 }, type: 'lightning' }],
    cantripScaling: true
  },
  effects: effects({
    id: 'srd:spell.shocking-grasp', name: 'Shocking Grasp',
    narrative: [{
      text: 'A melee spell attack, with advantage if the target is wearing metal '
        + 'armour — the app does not read a target\'s equipment, so elect '
        + 'advantage yourself when it applies. On a hit the target takes 1d8 '
        + 'lightning damage and cannot take reactions until the start of its '
        + 'next turn.',
      dmPromptable: true
    }]
  })
})

export const TRUE_STRIKE = spell({
  id: 'srd:spell.true-strike', name: 'True Strike', level: 0, school: 'divination',
  rangeFeet: 30, concentration: true, durationSeconds: 6,
  components: { verbal: false, somatic: true },
  effects: effects({
    id: 'srd:spell.true-strike', name: 'True Strike',
    // Advantage on a named future roll, the Sacred Weapon/Reckless Attack
    // shape: a roll-channel modifier gated on a toggle the player switches on
    // for the one attack it covers. What the scope cannot say is *which*
    // target — advantage on an attack roll is as narrow as the vocabulary
    // gets, so a second attack before the toggle is turned off would wrongly
    // benefit too.
    modifiers: [{
      id: id(), channel: 'roll', rollOp: 'advantage',
      scope: { kinds: ['attack'] },
      condition: { playerToggle: 'spell.true-strike' },
      permanence: 'temporary', note: 'True Strike'
    }],
    narrative: [{
      text: 'Turn this on for your first attack roll against the target you '
        + 'concentrated on, on your next turn, then turn it off — the engine '
        + 'cannot narrow the advantage to that one target or that one attack.',
      toggleId: 'spell.true-strike', dmPromptable: false
    }]
  })
})

export const VICIOUS_MOCKERY = spell({
  id: 'srd:spell.vicious-mockery', name: 'Vicious Mockery', level: 0, school: 'enchantment',
  rangeFeet: 60, components: { verbal: true, somatic: false },
  effect: {
    delivery: 'save',
    save: { ability: 'wis', onSuccess: 'none' },
    damage: [{ dice: { count: 1, sides: 4 }, type: 'psychic' }],
    cantripScaling: true
  },
  effects: effects({
    id: 'srd:spell.vicious-mockery', name: 'Vicious Mockery',
    // The damage and the save are exact; the rider lands on the target's next
    // roll, which is the same "reaches another creature's future action" wall
    // Bless and Bane are behind.
    completeness: 'partial',
    narrative: [{
      text: 'A string of insults at one creature that can hear you. It makes a '
        + 'Wisdom save or takes 1d4 psychic damage and has disadvantage on its '
        + 'next attack roll before the end of its next turn — the disadvantage is '
        + 'not applied here, since it lands on the target\'s next roll rather than '
        + 'yours.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Buffs — the interesting ones, because they meet armour in the AC pipeline
// ===========================================================================

/**
 * Mage armor.
 *
 * `base` 13, so it competes with chain mail's 16 by the ordinary highest-wins
 * rule and loses — which is exactly the SRD outcome, reached without anyone
 * writing "if wearing armour". The Dexterity term is the baseline's, untouched.
 */
export const MAGE_ARMOR = spell({
  id: 'srd:spell.mage-armor', name: 'Mage Armor', level: 1, school: 'abjuration',
  rangeKind: 'touch', durationSeconds: 28800,
  components: { verbal: true, somatic: true, material: 'a piece of cured leather' },
  effects: effects({
    id: 'srd:spell.mage-armor', name: 'Mage Armor',
    modifiers: [{
      id: id(), channel: 'value', target: ARMOR_CLASS, op: 'base', value: 13,
      permanence: 'temporary', note: 'mage armor'
    }],
    narrative: [{
      text: 'A protective magical force surrounds an unarmoured creature. Its '
        + 'base AC becomes 13 + its Dexterity modifier for 8 hours.',
      dmPromptable: false
    }]
  })
})

/**
 * Shield.
 *
 * `add` rather than `base`, so it stacks on top of whatever established the
 * base — armour, mage armor or nothing. The two spells sitting side by side is
 * the clearest demonstration in the content that the operations carry the
 * meaning.
 */
export const SHIELD_SPELL = spell({
  id: 'srd:spell.shield', name: 'Shield', level: 1, school: 'abjuration',
  castingTime: 'reaction', rangeKind: 'self', durationSeconds: 6,
  effects: effects({
    id: 'srd:spell.shield', name: 'Shield',
    modifiers: [add(ARMOR_CLASS, 5, { note: 'shield spell' })],
    narrative: [{
      text: 'An invisible barrier springs into being. You gain +5 AC until the '
        + 'start of your next turn, including against the triggering attack.',
      dmPromptable: false
    }]
  })
})

export const BLESS = spell({
  id: 'srd:spell.bless', name: 'Bless', level: 1, school: 'enchantment',
  rangeFeet: 30, concentration: true, durationSeconds: 60,
  components: { verbal: true, somatic: true, material: 'a sprinkling of holy water' },
  effects: effects({
    id: 'srd:spell.bless', name: 'Bless',
    narrative: [{
      text: 'Up to three creatures add 1d4 to each attack roll and saving throw '
        + 'they make for the duration. Party-wide effects are not modelled yet — '
        + 'apply the die at the table.',
      dmPromptable: true
    }],
    completeness: 'partial'
  })
})

export const LONGSTRIDER = spell({
  id: 'srd:spell.longstrider', name: 'Longstrider', level: 1,
  school: 'transmutation', rangeKind: 'touch', durationSeconds: 3600,
  components: { verbal: true, somatic: true, material: 'a pinch of dirt' },
  effects: effects({
    id: 'srd:spell.longstrider', name: 'Longstrider',
    modifiers: [add(speedPath('walk'), 10, { note: 'longstrider' })],
    narrative: [{ text: 'The target’s speed increases by 10 feet for an hour.', dmPromptable: false }]
  })
})

export const PROTECTION_FROM_ENERGY = spell({
  id: 'srd:spell.protection-from-energy', name: 'Protection from Energy', level: 3,
  school: 'abjuration', rangeKind: 'touch', concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.protection-from-energy', name: 'Protection from Energy',
    modifiers: [{
      id: id(), channel: 'value', target: resistancePath('fire'), op: 'set', value: 1,
      permanence: 'temporary', note: 'chosen energy type'
    }],
    selections: [{
      id: 'energy-type', prompt: 'Which damage type?', kind: 'damageType', count: 1,
      from: ['acid', 'cold', 'fire', 'lightning', 'thunder']
    }],
    narrative: [{
      text: 'The target gains resistance to one damage type of your choice for '
        + 'the duration. Modelled as fire until the selection drives the target path.',
      dmPromptable: true
    }],
    completeness: 'partial'
  })
})

// ===========================================================================
// Utility and ritual
// ===========================================================================

export const DETECT_MAGIC = spell({
  id: 'srd:spell.detect-magic', name: 'Detect Magic', level: 1, school: 'divination',
  ritual: true, rangeKind: 'self', concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.detect-magic', name: 'Detect Magic',
    narrative: [{
      text: 'You sense the presence of magic within 30 feet, and on a spare '
        + 'action can see a faint aura around anything magical and learn its school.',
      dmPromptable: false
    }]
  })
})

export const IDENTIFY = spell({
  id: 'srd:spell.identify', name: 'Identify', level: 1, school: 'divination',
  ritual: true, rangeKind: 'touch', castingTime: { minutes: 1 },
  components: { verbal: true, somatic: true, material: 'a pearl worth 100 gp', materialCostCp: 10000 },
  effects: effects({
    id: 'srd:spell.identify', name: 'Identify',
    narrative: [{
      text: 'You learn an item’s properties, how to use them, whether it '
        + 'requires attunement and how many charges it has.',
      dmPromptable: true
    }]
  })
})

export const CURE_WOUNDS = spell({
  id: 'srd:spell.cure-wounds', name: 'Cure Wounds', level: 1, school: 'evocation',
  rangeKind: 'touch',
  // Healing, not damage: 1d8 plus the caster's own spellcasting modifier, and
  // an extra 1d8 for each slot level above 1st. `addSpellMod` reaches the
  // ability the grant declared (wis for a cleric, cha for a bard) — nothing
  // here names an ability, which is why the same definition works for both.
  effect: {
    delivery: 'auto',
    healing: { dice: { count: 1, sides: 8 }, addSpellMod: true },
    perSlotAbove: { healingDice: { count: 1, sides: 8 } }
  },
  effects: effects({
    id: 'srd:spell.cure-wounds', name: 'Cure Wounds',
    narrative: [{
      text: 'A creature you touch regains 1d8 + your spellcasting ability '
        + 'modifier hit points. Upcasting adds 1d8 per slot level above 1st.',
      dmPromptable: false
    }]
  })
})

export const MAGIC_MISSILE = spell({
  id: 'srd:spell.magic-missile', name: 'Magic Missile', level: 1, school: 'evocation',
  rangeFeet: 120,
  // Automatic damage — no attack, no save — as three darts, each 1d4+1 force,
  // with one more dart per slot level above 1st. `instances` is what makes the
  // preview read "3 × 1d4+1 force" rather than folding the darts into one pool,
  // because each dart can be aimed separately.
  effect: {
    delivery: 'auto',
    damage: [{ dice: { count: 1, sides: 4, modifier: 1 }, type: 'force' }],
    instances: 3,
    perSlotAbove: { instances: 1 }
  },
  effects: effects({
    id: 'srd:spell.magic-missile', name: 'Magic Missile',
    narrative: [{
      text: 'Three darts of force, each hitting automatically for 1d4 + 1. '
        + 'One more dart per slot level above 1st.',
      dmPromptable: false
    }]
  })
})

// ===========================================================================
// Lists
// ===========================================================================

/** Every spell, with the class lists it appears on. */
const DRUID = 'srd:list.druid'
const PALADIN = 'srd:list.paladin'
const RANGER = 'srd:list.ranger'

export const ALL_SPELLS: SpellDefinition[] = [
  { ...FIRE_BOLT, lists: [WIZARD, SORCERER] },
  { ...RAY_OF_FROST, lists: [WIZARD, SORCERER] },
  { ...PRESTIDIGITATION, lists: [WIZARD, SORCERER, 'srd:list.bard', 'srd:list.warlock'] },
  { ...SACRED_FLAME, lists: [CLERIC] },
  { ...MAGE_ARMOR, lists: [WIZARD, SORCERER] },
  { ...SHIELD_SPELL, lists: [WIZARD, SORCERER] },
  // Bless, Cure Wounds and Detect Magic are all on the SRD paladin list
  // (docs/srd/08-spell-lists.md) and carried no paladin tag, so the paladin's
  // prepared grant drew from a list nothing was on. The integrity checker said
  // so the moment the class was authored.
  { ...BLESS, lists: [CLERIC, PALADIN] },
  // Longstrider, Detect Magic and Cure Wounds are all genuinely on the SRD
  // druid list (docs/srd/08-spell-lists.md) — the druid's own content file
  // said adding this tag was "a one-word data edit, not an engine change."
  { ...LONGSTRIDER, lists: [WIZARD, DRUID, RANGER] },
  { ...PROTECTION_FROM_ENERGY, lists: [WIZARD, SORCERER, CLERIC] },
  { ...DETECT_MAGIC, lists: [WIZARD, SORCERER, CLERIC, DRUID, PALADIN, RANGER] },
  { ...IDENTIFY, lists: [WIZARD] },
  { ...CURE_WOUNDS, lists: [CLERIC, DRUID, PALADIN, RANGER] },
  { ...MAGIC_MISSILE, lists: [WIZARD, SORCERER] },
  { ...DRUIDCRAFT, lists: [DRUID] },
  // Also genuinely on the bard cantrip list. Bard's own grant draws from a
  // fixed pool rather than `lists` (see bard.ts), so this tag is accurate
  // bookkeeping today rather than something anything currently reads — but a
  // future fromList-based bard grant should find it already correct.
  // Genuinely on the cleric, druid and bard cantrip lists.
  { ...MENDING, lists: [DRUID, CLERIC, 'srd:list.bard'] },
  { ...GUIDANCE, lists: [CLERIC, DRUID] },
  { ...RESISTANCE, lists: [CLERIC, DRUID] },
  { ...SPARE_THE_DYING, lists: [CLERIC] },
  { ...LIGHT, lists: [CLERIC, WIZARD, SORCERER, 'srd:list.bard'] },
  // Ten more cantrips, tagged against docs/srd/08-spell-lists.md. The wizard
  // and sorcerer cantrip lists are identical in the SRD; the six lists below
  // overlap enough that these ten close out all six casters' cantrip columns
  // at once — see each class file's own pool for which of these it draws on.
  { ...ACID_SPLASH, lists: [WIZARD, SORCERER] },
  { ...DANCING_LIGHTS, lists: [WIZARD, SORCERER, 'srd:list.bard'] },
  { ...MAGE_HAND, lists: [WIZARD, SORCERER, 'srd:list.bard', 'srd:list.warlock'] },
  { ...MESSAGE, lists: [WIZARD, SORCERER, 'srd:list.bard'] },
  { ...MINOR_ILLUSION, lists: [WIZARD, SORCERER, 'srd:list.bard', 'srd:list.warlock'] },
  { ...PRODUCE_FLAME, lists: [DRUID] },
  { ...SHILLELAGH, lists: [DRUID] },
  { ...SHOCKING_GRASP, lists: [WIZARD, SORCERER] },
  { ...TRUE_STRIKE, lists: [WIZARD, SORCERER, 'srd:list.bard', 'srd:list.warlock'] },
  { ...VICIOUS_MOCKERY, lists: ['srd:list.bard'] }
]

export const SPELL_LISTS = { WIZARD, CLERIC, SORCERER, DRUID }
