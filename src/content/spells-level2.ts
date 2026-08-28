// 2nd-level spells.
//
// Fifty-one of them — the full union of every class's 2nd-level column
// (docs/srd/08-spell-lists.md), minus Darkness, which the tiefling already
// needed. The biggest batch yet, and the one with the richest mechanical
// yield: five spells here reach vocabulary that had never been exercised.
//
// - Barkskin is the `min` operation's first real use: "AC can't be less than
//   16" is a floor on a derived stat, exactly as 91-effect-vocabulary.md's
//   finding #8 predicted before any spell needed it.
// - Blur is Reckless Attack's exposure clause with nothing attached to it —
//   `appliesTo: 'attackersAgainstSelf'` as a spell's entire effect, rather
//   than the price of a barbarian's own aggression.
// - Spider Climb reads Dragon Wings' shape exactly: a `base` on a movement
//   path that resolves to another stat (`{ stat: speedPath('walk') }`),
//   proving that shape was never Dragon Wings' alone.
// - Protection from Poison is the first spell to combine a `resistance` set
//   with a `roll` advantage in one buff — two ordinary modifiers that happen
//   to both be about poison.
// - Invisibility needs nothing new at all: `srd:condition.invisible` already
//   carries the correct attack-advantage/attack-disadvantage pair, so the
//   spell's whole mechanical job is telling the DM which condition to apply.
//
// Enhance Ability is the fighting-style shape at six options instead of
// three: one gated advantage modifier per ability, chosen by a selection the
// engine cannot yet read back — so all six live in the source and only the
// toggled one does anything, the same as Champion vs. Battle Master styles.

import type { EffectSource, Modifier, SpellDefinition } from '../rules/types.js'
import {
  ARMOR_CLASS, resistancePath, RESISTANCE_RESISTANT, skillPath, speedPath
} from '../rules/statPaths.js'

const V = '2014'
let n = 0
const id = () => `s2${++n}`

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
// Damage and healing
// ===========================================================================

export const SHATTER = spell({
  id: 'srd:spell.shatter', name: 'Shatter', level: 2, school: 'evocation',
  rangeFeet: 60,
  effect: {
    delivery: 'save', save: { ability: 'con', onSuccess: 'half' },
    damage: [{ dice: { count: 3, sides: 8 }, type: 'thunder' }],
    perSlotAbove: { damageDice: { count: 1, sides: 8 } }
  },
  effects: effects({
    id: 'srd:spell.shatter', name: 'Shatter',
    completeness: 'partial',
    narrative: [{
      text: 'A sudden loud ringing noise in a 10-foot-radius sphere. Every '
        + 'creature there makes a Constitution save, taking 3d8 thunder damage on '
        + 'a failure and half on a success — creatures made of stone, crystal or '
        + 'metal save with disadvantage, which is not modelled. Unattended '
        + 'nonmagical objects in the area take the damage too.',
      dmPromptable: true
    }]
  })
})

export const MOONBEAM = spell({
  id: 'srd:spell.moonbeam', name: 'Moonbeam', level: 2, school: 'evocation',
  rangeFeet: 120, concentration: true, durationSeconds: 60,
  effect: {
    delivery: 'save', save: { ability: 'con', onSuccess: 'half' },
    damage: [{ dice: { count: 2, sides: 10 }, type: 'radiant' }],
    perSlotAbove: { damageDice: { count: 1, sides: 10 } }
  },
  effects: effects({
    id: 'srd:spell.moonbeam', name: 'Moonbeam',
    narrative: [{
      text: 'A 5-foot-radius, 40-foot cylinder of pale light. A creature '
        + 'entering it for the first time on a turn, or starting its turn there, '
        + 'makes a Constitution save, taking 2d10 radiant damage on a failure and '
        + 'half on a success — resolve the save again each time a creature '
        + 'triggers it. Shapechangers save with disadvantage and revert on a '
        + 'failure. Move the beam up to 60 feet as an action.',
      dmPromptable: true
    }]
  })
})

export const FLAMING_SPHERE = spell({
  id: 'srd:spell.flaming-sphere', name: 'Flaming Sphere', level: 2, school: 'conjuration',
  rangeFeet: 60, concentration: true, durationSeconds: 60,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'half' },
    damage: [{ dice: { count: 2, sides: 6 }, type: 'fire' }],
    perSlotAbove: { damageDice: { count: 1, sides: 6 } }
  },
  effects: effects({
    id: 'srd:spell.flaming-sphere', name: 'Flaming Sphere',
    narrative: [{
      text: 'A 5-foot-diameter fiery sphere. Any creature ending its turn within '
        + '5 feet makes a Dexterity save, taking 2d6 fire damage on a failure and '
        + 'half on a success — resolve this again each time it happens. Move it up '
        + 'to 30 feet as a bonus action; ramming it into a creature forces the '
        + 'save immediately and stops the sphere.',
      dmPromptable: true
    }]
  })
})

export const ACID_ARROW = spell({
  id: 'srd:spell.acid-arrow', name: 'Acid Arrow', level: 2, school: 'evocation',
  rangeFeet: 90,
  effect: {
    delivery: 'attack',
    damage: [{ dice: { count: 4, sides: 4 }, type: 'acid' }],
    perSlotAbove: { damageDice: { count: 1, sides: 4 } }
  },
  effects: effects({
    id: 'srd:spell.acid-arrow', name: 'Acid Arrow',
    // The delayed 2d4 at the end of the target's next turn, and the "half
    // damage on a miss instead of nothing" clause, are both riders the
    // resolver has no window for — one is scheduled and one changes what a
    // miss means, and this content set has no vocabulary for either yet.
    completeness: 'partial',
    narrative: [{
      text: 'A ranged spell attack for 4d4 acid damage on a hit — resolved here '
        + '— plus 2d4 more acid at the end of the target\'s next turn, which is '
        + 'not modelled. On a miss the target still takes the initial damage '
        + 'halved and no delayed damage; the resolved roll here is the hit case.',
      dmPromptable: true
    }]
  })
})

export const FLAME_BLADE = spell({
  id: 'srd:spell.flame-blade', name: 'Flame Blade', level: 2, school: 'evocation',
  castingTime: 'bonusAction', rangeKind: 'self', concentration: true, durationSeconds: 600,
  effect: { delivery: 'attack', damage: [{ dice: { count: 3, sides: 6 }, type: 'fire' }] },
  effects: effects({
    id: 'srd:spell.flame-blade', name: 'Flame Blade',
    // Upcasting adds a die every *two* slot levels above 2nd — the one
    // non-linear upcast rule in this batch, and `perSlotAbove` has no way to
    // say "every other level", so it is left off rather than made wrong.
    completeness: 'partial',
    narrative: [{
      text: 'A fiery scimitar-shaped blade in your hand. Use your action to make '
        + 'a melee spell attack for 3d6 fire damage. It upcasts by 1d6 every two '
        + 'slot levels above 2nd — 4th and 6th, not every level — which is not '
        + 'modelled; add it yourself when you cast at a higher slot.',
      dmPromptable: true
    }]
  })
})

export const SPIRITUAL_WEAPON = spell({
  id: 'srd:spell.spiritual-weapon', name: 'Spiritual Weapon', level: 2, school: 'evocation',
  castingTime: 'bonusAction', rangeFeet: 60, durationSeconds: 60,
  effect: { delivery: 'attack', damage: [{ dice: { count: 1, sides: 8 }, type: 'force' }] },
  effects: effects({
    id: 'srd:spell.spiritual-weapon', name: 'Spiritual Weapon',
    // The flat "+ your spellcasting ability modifier" on damage has nowhere to
    // live — `effect.damage` carries dice and a type, never a flat bonus,
    // which only `healing.addSpellMod` does. Add it by hand.
    completeness: 'partial',
    narrative: [{
      text: 'A spectral weapon appears and strikes on casting: a melee spell '
        + 'attack against a creature within 5 feet of it for 1d8 force damage — '
        + 'add your spellcasting ability modifier by hand. A bonus action moves '
        + 'it 20 feet and attacks again; it lasts a minute with no concentration '
        + 'required.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Buffs that install real modifiers
// ===========================================================================

export const BARKSKIN = spell({
  id: 'srd:spell.barkskin', name: 'Barkskin', level: 2, school: 'transmutation',
  rangeKind: 'touch', concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.barkskin', name: 'Barkskin',
    // The `min` operation's first spell: "AC can't be less than 16" is a
    // floor, not a bonus, so it does nothing to a plate-armoured target and
    // raises an unarmoured one straight to 16.
    modifiers: [{
      id: id(), channel: 'value', target: ARMOR_CLASS, op: 'min', value: 16,
      permanence: 'temporary', note: 'barkskin'
    }],
    narrative: [{
      text: 'A willing creature you touch has an AC that cannot go below 16, '
        + 'regardless of armour, for up to an hour.',
      dmPromptable: false
    }]
  })
})

export const BLUR = spell({
  id: 'srd:spell.blur', name: 'Blur', level: 2, school: 'illusion',
  rangeKind: 'self', components: { verbal: true, somatic: false },
  concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.blur', name: 'Blur',
    // Reckless Attack's exposure clause, but as a spell's whole effect rather
    // than the price of a barbarian's own aggression: `attackersAgainstSelf`
    // needs no gate here beyond the spell being active.
    modifiers: [{
      id: id(), channel: 'roll', rollOp: 'disadvantage', scope: { kinds: ['attack'] },
      appliesTo: 'attackersAgainstSelf', permanence: 'temporary', note: 'blur'
    }],
    narrative: [{
      text: 'Your outline shimmers for up to a minute. Every attack roll '
        + 'against you has disadvantage, unless the attacker does not rely on '
        + 'sight or can see through illusions.',
      dmPromptable: false
    }]
  })
})

export const SPIDER_CLIMB = spell({
  id: 'srd:spell.spider-climb', name: 'Spider Climb', level: 2, school: 'transmutation',
  rangeKind: 'touch', concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.spider-climb', name: 'Spider Climb',
    // Dragon Wings' shape exactly: a `base` reading another stat, so the climb
    // speed always tracks whatever the walking speed currently is.
    modifiers: [{
      id: id(), channel: 'value', target: speedPath('climb'), op: 'base',
      value: { stat: speedPath('walk') }, permanence: 'temporary',
      note: 'spider climb'
    }],
    narrative: [{
      text: 'A creature you touch can move on vertical surfaces and ceilings, '
        + 'hands free, gaining a climbing speed equal to its walking speed, for '
        + 'up to an hour.',
      dmPromptable: false
    }]
  })
})

export const PROTECTION_FROM_POISON = spell({
  id: 'srd:spell.protection-from-poison', name: 'Protection from Poison', level: 2,
  school: 'abjuration', rangeKind: 'touch', durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.protection-from-poison', name: 'Protection from Poison',
    // Two ordinary modifiers that happen to both be about poison — a
    // resistance `set` and a `roll` advantage — is the whole spell.
    completeness: 'partial',
    modifiers: [
      { id: id(), channel: 'value', target: resistancePath('poison'), op: 'set', value: RESISTANCE_RESISTANT, permanence: 'temporary', note: 'protection from poison' },
      {
        id: id(), channel: 'roll', rollOp: 'advantage',
        scope: { kinds: ['save'], againstTags: ['poison'] },
        permanence: 'temporary', note: 'protection from poison'
      }
    ],
    narrative: [{
      text: 'A creature you touch neutralises one poison affecting it — not '
        + 'modelled, apply it by hand — and for an hour has advantage on saves '
        + 'against being poisoned and resistance to poison damage.',
      dmPromptable: true
    }]
  })
})

export const PASS_WITHOUT_TRACE = spell({
  id: 'srd:spell.pass-without-trace', name: 'Pass without Trace', level: 2,
  school: 'abjuration', rangeKind: 'self', concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.pass-without-trace', name: 'Pass without Trace',
    // The same +10 Hide in Plain Sight already uses, applied to the caster;
    // extending it to allies within 30 feet is the party-wide reach nothing
    // here has.
    completeness: 'partial',
    modifiers: [add(skillPath('stealth'), 10, { note: 'pass without trace' })],
    narrative: [{
      text: 'For up to an hour, you and chosen creatures within 30 feet add +10 '
        + 'to Dexterity (Stealth) checks and cannot be tracked except by magic. '
        + 'Only your own bonus is applied — extend it to allies at the table.',
      dmPromptable: true
    }]
  })
})

export const ENHANCE_ABILITY = spell({
  id: 'srd:spell.enhance-ability', name: 'Enhance Ability', level: 2, school: 'transmutation',
  rangeKind: 'touch', concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.enhance-ability', name: 'Enhance Ability',
    // Six options, the fighting-style shape at double the width: one gated
    // advantage modifier per ability, chosen by a selection this vocabulary
    // cannot read back — so all six are authored and only the toggled one
    // does anything.
    completeness: 'partial',
    modifiers: (['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((a) => ({
      id: id(), channel: 'roll', rollOp: 'advantage',
      scope: { kinds: ['check'], abilities: [a] },
      condition: { playerToggle: `spell.enhance-ability.${a}` },
      permanence: 'temporary', note: `Enhance Ability: ${a.toUpperCase()}`
    })),
    narrative: [{
      text: 'Choose one for a creature you touch, for up to an hour, and turn '
        + 'on the matching toggle: Bear\'s Endurance (Constitution checks, plus '
        + '2d6 temporary hit points not modelled), Bull\'s Strength (Strength '
        + 'checks, plus doubled carrying capacity not modelled), Cat\'s Grace '
        + '(Dexterity checks, plus no damage from short falls not modelled), '
        + 'Eagle\'s Splendor (Charisma checks), Fox\'s Cunning (Intelligence '
        + 'checks), or Owl\'s Wisdom (Wisdom checks).',
      toggleId: 'spell.enhance-ability.str', dmPromptable: true
    }]
  })
})

export const ENLARGE_REDUCE = spell({
  id: 'srd:spell.enlarge-reduce', name: 'Enlarge/Reduce', level: 2, school: 'transmutation',
  rangeFeet: 30, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.enlarge-reduce', name: 'Enlarge/Reduce',
    // The advantage/disadvantage half is real; the size change itself — which
    // feeds carrying capacity, weapon damage dice and squeezing — has no
    // mutable size stat anywhere in the set to write to.
    completeness: 'partial',
    modifiers: [
      {
        id: id(), channel: 'roll', rollOp: 'advantage',
        scope: { kinds: ['check', 'save'], abilities: ['str'] },
        condition: { playerToggle: 'spell.enlarge' },
        permanence: 'temporary', note: 'Enlarge'
      },
      {
        id: id(), channel: 'roll', rollOp: 'disadvantage',
        scope: { kinds: ['check', 'save'], abilities: ['str'] },
        condition: { playerToggle: 'spell.reduce' },
        permanence: 'temporary', note: 'Reduce'
      }
    ],
    narrative: [{
      text: 'A creature or unworn object grows or shrinks for a minute; an '
        + 'unwilling creature saves Constitution to negate. Enlarge doubles all '
        + 'dimensions, gives advantage on Strength checks and saves, and adds '
        + '1d4 to weapon damage; Reduce halves dimensions, gives disadvantage on '
        + 'Strength checks and saves, and subtracts 1d4 from weapon damage '
        + '(never below 1). Only the advantage/disadvantage is applied — turn on '
        + 'the matching toggle, and track the size and damage changes yourself.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// The condition machinery already built — the spell's job is to say which one
// ===========================================================================

export const INVISIBILITY = spell({
  id: 'srd:spell.invisibility', name: 'Invisibility', level: 2, school: 'illusion',
  rangeKind: 'touch', concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.invisibility', name: 'Invisibility',
    narrative: [{
      text: 'A creature you touch, and what it is wearing and carrying, turns '
        + 'invisible for up to an hour — ends early if it attacks or casts a '
        + 'spell. Apply the existing Invisible condition, which already carries '
        + 'the correct advantage and disadvantage.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Save spells with a condition rather than damage
// ===========================================================================

export const HOLD_PERSON = spell({
  id: 'srd:spell.hold-person', name: 'Hold Person', level: 2, school: 'enchantment',
  rangeFeet: 60, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.hold-person', name: 'Hold Person',
    completeness: 'partial',
    narrative: [{
      text: 'One humanoid you can see makes a Wisdom save or is paralyzed for '
        + 'the duration, repeating the save at the end of each of its turns. '
        + 'Apply the Paralyzed condition on a failure.',
      dmPromptable: true
    }]
  })
})

export const SUGGESTION = spell({
  id: 'srd:spell.suggestion', name: 'Suggestion', level: 2, school: 'enchantment',
  rangeFeet: 30, components: { verbal: true, somatic: false }, concentration: true, durationSeconds: 28800,
  effects: effects({
    id: 'srd:spell.suggestion', name: 'Suggestion',
    completeness: 'partial',
    narrative: [{
      text: 'One creature that can hear and understand you, and is not immune '
        + 'to being charmed, makes a Wisdom save or pursues a one-or-two-'
        + 'sentence course of action you describe for up to 8 hours — an '
        + 'obviously harmful one ends the spell instead. Damage from you or your '
        + 'companions also ends it.',
      dmPromptable: true
    }]
  })
})

export const WEB = spell({
  id: 'srd:spell.web', name: 'Web', level: 2, school: 'conjuration',
  rangeFeet: 60, concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.web', name: 'Web',
    completeness: 'partial',
    narrative: [{
      text: 'Thick webbing fills a 20-foot cube, becoming difficult terrain and '
        + 'lightly obscuring it. A creature there when it appears, or that enters '
        + 'or starts its turn there, makes a Dexterity save or is restrained, '
        + 'and may repeat the save with an action.',
      dmPromptable: true
    }]
  })
})

export const SPIKE_GROWTH = spell({
  id: 'srd:spell.spike-growth', name: 'Spike Growth', level: 2, school: 'transmutation',
  rangeFeet: 150, concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.spike-growth', name: 'Spike Growth',
    // Damage proportional to distance travelled rather than to a turn or an
    // event — a shape none of the resolved delivery kinds cover.
    completeness: 'partial',
    narrative: [{
      text: 'The ground in a 20-foot radius sprouts hidden spikes: difficult '
        + 'terrain dealing 2d4 piercing damage per 5 feet a creature travels '
        + 'through it. Camouflaged — a creature that did not see it cast needs a '
        + 'Wisdom (Perception) check against your spell save DC to notice the '
        + 'hazard before entering.',
      dmPromptable: true
    }]
  })
})

export const BLINDNESS_DEAFNESS = spell({
  id: 'srd:spell.blindness-deafness', name: 'Blindness/Deafness', level: 2,
  school: 'necromancy', rangeFeet: 30, components: { verbal: true, somatic: false },
  durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.blindness-deafness', name: 'Blindness/Deafness',
    completeness: 'partial',
    narrative: [{
      text: 'One creature you can see makes a Constitution save or is blinded '
        + 'or deafened, your choice, for a minute — it repeats the save at the '
        + 'end of each of its turns. Apply the matching condition on a failure.',
      dmPromptable: true
    }]
  })
})

export const CALM_EMOTIONS = spell({
  id: 'srd:spell.calm-emotions', name: 'Calm Emotions', level: 2, school: 'enchantment',
  rangeFeet: 60, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.calm-emotions', name: 'Calm Emotions',
    completeness: 'partial',
    narrative: [{
      text: 'Humanoids in a 20-foot-radius sphere make a Charisma save — a '
        + 'creature may choose to fail. On a failure, either suppress charmed '
        + 'and frightened on it (resuming when the spell ends, if their duration '
        + 'has not lapsed), or make it indifferent toward creatures you choose '
        + 'until it is harmed.',
      dmPromptable: true
    }]
  })
})

export const ENTHRALL = spell({
  id: 'srd:spell.enthrall', name: 'Enthrall', level: 2, school: 'enchantment',
  rangeFeet: 60, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.enthrall', name: 'Enthrall',
    completeness: 'partial',
    narrative: [{
      text: 'Creatures that can hear you make a Wisdom save — automatic success '
        + 'if immune to being charmed, and advantage if you or a companion is '
        + 'fighting it. On a failure it has disadvantage on Wisdom (Perception) '
        + 'checks to notice anyone but you until the spell ends.',
      dmPromptable: true
    }]
  })
})

export const ZONE_OF_TRUTH = spell({
  id: 'srd:spell.zone-of-truth', name: 'Zone of Truth', level: 2, school: 'enchantment',
  rangeFeet: 60, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.zone-of-truth', name: 'Zone of Truth',
    completeness: 'partial',
    narrative: [{
      text: 'Creatures entering a 15-foot-radius sphere for the first time on a '
        + 'turn, or starting there, make a Charisma save or cannot speak a '
        + 'deliberate lie while inside. You know whether each save succeeded; an '
        + 'affected creature knows it is affected and can stay evasive within '
        + 'the truth.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Riders on damage already dealt, or on a weapon — the queue Divine Smite and
// Shillelagh already opened
// ===========================================================================

export const BRANDING_SMITE = spell({
  id: 'srd:spell.branding-smite', name: 'Branding Smite', level: 2, school: 'evocation',
  castingTime: 'bonusAction', rangeKind: 'self', components: { verbal: true, somatic: false },
  concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.branding-smite', name: 'Branding Smite',
    completeness: 'partial',
    narrative: [{
      text: 'The next weapon attack that hits before the spell ends deals an '
        + 'extra 2d6 radiant damage, and the target becomes visible, sheds dim '
        + 'light and cannot turn invisible until the spell ends. Roll the extra '
        + 'damage yourself.',
      dmPromptable: true
    }]
  })
})

export const MAGIC_WEAPON = spell({
  id: 'srd:spell.magic-weapon', name: 'Magic Weapon', level: 2, school: 'transmutation',
  castingTime: 'bonusAction', rangeKind: 'touch', concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.magic-weapon', name: 'Magic Weapon',
    // The weapon-override wall Shillelagh is already behind: a weapon's
    // attack and damage bonus are read straight off the item, not computed
    // through a pipeline a spell could add to.
    completeness: 'partial',
    narrative: [{
      text: 'A nonmagical weapon you touch becomes magical, with a +1 bonus to '
        + 'its attack and damage rolls for up to an hour — +2 at 4th level, +3 '
        + 'at 6th. Apply the bonus on the weapon itself, or by hand when you '
        + 'attack.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Everything targeting another creature that the resolver has no window for
// ===========================================================================

export const MIRROR_IMAGE = spell({
  id: 'srd:spell.mirror-image', name: 'Mirror Image', level: 2, school: 'illusion',
  rangeKind: 'self', durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.mirror-image', name: 'Mirror Image',
    // A die the defender rolls mid-resolution of the attacker's own roll —
    // there is no hook that late in the pipeline for anyone.
    completeness: 'partial',
    narrative: [{
      text: 'Three illusory duplicates of you appear. Each time a creature '
        + 'targets you with an attack, roll a d20: with three duplicates '
        + 'remaining it redirects on an 6 or higher, with two on an 8 or higher, '
        + 'with one on an 11 or higher. A duplicate has AC 10 + your Dexterity '
        + 'modifier and only a hit destroys it.',
      dmPromptable: true
    }]
  })
})

export const RAY_OF_ENFEEBLEMENT = spell({
  id: 'srd:spell.ray-of-enfeeblement', name: 'Ray of Enfeeblement', level: 2,
  school: 'necromancy', rangeFeet: 60, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.ray-of-enfeeblement', name: 'Ray of Enfeeblement',
    // A ranged spell attack with no damage of its own — the debuff halves the
    // target's own future weapon rolls, which nothing here can reach.
    completeness: 'partial',
    narrative: [{
      text: 'A ranged spell attack. On a hit, the target deals only half '
        + 'damage with Strength-based weapon attacks until it succeeds a '
        + 'Constitution save at the end of one of its turns.',
      dmPromptable: true
    }]
  })
})

export const WARDING_BOND = spell({
  id: 'srd:spell.warding-bond', name: 'Warding Bond', level: 2, school: 'abjuration',
  rangeKind: 'touch',
  components: { verbal: true, somatic: true, material: 'a pair of platinum rings worth at least 50 gp each, worn by both of you for the duration' },
  durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.warding-bond', name: 'Warding Bond',
    // The purest two-player mechanic in the level: shared damage between two
    // real characters, which needs a live link this engine does not have.
    completeness: 'partial',
    narrative: [{
      text: 'While within 60 feet of a creature you touch, it has +1 AC and +1 '
        + 'to saving throws, and resistance to all damage — but you take the '
        + 'same damage it takes. Ends if you drop to 0 hit points. Run the '
        + 'shared damage at the table.',
      dmPromptable: true
    }]
  })
})

export const HEAT_METAL = spell({
  id: 'srd:spell.heat-metal', name: 'Heat Metal', level: 2, school: 'transmutation',
  rangeFeet: 60, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.heat-metal', name: 'Heat Metal',
    // Targets an item and depends on who currently has it equipped — a
    // queryable relation nothing here reads.
    completeness: 'partial',
    narrative: [{
      text: 'A manufactured metal object you can see glows red-hot. Whoever is '
        + 'touching it takes 2d8 fire damage on casting and again whenever you '
        + 'spend a bonus action later. Holding or wearing it forces a '
        + 'Constitution save or the creature drops it; if it does not, it has '
        + 'disadvantage on attack rolls and ability checks until your next turn.',
      dmPromptable: true
    }]
  })
})

export const ALTER_SELF = spell({
  id: 'srd:spell.alter-self', name: 'Alter Self', level: 2, school: 'transmutation',
  rangeKind: 'self', concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.alter-self', name: 'Alter Self',
    // Natural Weapons grants a real attack option with a real damage die —
    // the same second-statblock wall Wild Shape sits behind, at a smaller
    // scale.
    completeness: 'partial',
    narrative: [{
      text: 'Choose one for up to an hour, swappable as an action: Aquatic '
        + 'Adaptation (breathe water, swim speed equals walking speed); Change '
        + 'Appearance (no statistics change); or Natural Weapons (unarmed '
        + 'strikes deal 1d6 of your choice of bludgeoning, piercing or slashing, '
        + 'you are proficient with them, and they count as magical). None of it '
        + 'is applied to your sheet — run it at the table.',
      dmPromptable: true
    }]
  })
})

export const FIND_STEED = spell({
  id: 'srd:spell.find-steed', name: 'Find Steed', level: 2, school: 'conjuration',
  castingTime: { minutes: 10 }, rangeFeet: 30,
  effects: effects({
    id: 'srd:spell.find-steed', name: 'Find Steed',
    // No bestiary and no engine for a second statblock — Find Familiar and
    // Wild Shape's wall, for a mount instead of a familiar or a beast form.
    completeness: 'partial',
    narrative: [{
      text: 'Summon a spirit that assumes the form of a loyal steed — a '
        + 'warhorse, pony, camel, elk or mastiff — with a celestial, fey or '
        + 'fiendish nature. While mounted, a spell you cast that targets only '
        + 'you also targets it. Run it from a statblock at the table.',
      dmPromptable: true
    }]
  })
})

export const GUST_OF_WIND = spell({
  id: 'srd:spell.gust-of-wind', name: 'Gust of Wind', level: 2, school: 'evocation',
  rangeKind: 'self', rangeFeet: 60, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.gust-of-wind', name: 'Gust of Wind',
    completeness: 'partial',
    narrative: [{
      text: 'A 60-foot line of wind, 10 feet wide, from you. A creature '
        + 'starting its turn in it makes a Strength save or is pushed 15 feet '
        + 'along it; moving toward you there costs 2 feet per foot moved. It '
        + 'disperses gas and extinguishes unprotected flames. Change its '
        + 'direction as a bonus action.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Pure information and utility
// ===========================================================================

export const DARKVISION = spell({
  id: 'srd:spell.darkvision', name: 'Darkvision', level: 2, school: 'transmutation',
  rangeKind: 'touch', durationSeconds: 28800,
  effects: effects({
    id: 'srd:spell.darkvision', name: 'Darkvision',
    narrative: [{
      text: 'A willing creature you touch gains darkvision to 60 feet for 8 '
        + 'hours.',
      dmPromptable: false
    }]
  })
})

export const SEE_INVISIBILITY = spell({
  id: 'srd:spell.see-invisibility', name: 'See Invisibility', level: 2, school: 'divination',
  rangeKind: 'self', durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.see-invisibility', name: 'See Invisibility',
    narrative: [{
      text: 'For an hour you see invisible creatures and objects as if they '
        + 'were visible, and see into the Ethereal Plane.',
      dmPromptable: false
    }]
  })
})

export const LEVITATE = spell({
  id: 'srd:spell.levitate', name: 'Levitate', level: 2, school: 'transmutation',
  rangeFeet: 60, concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.levitate', name: 'Levitate',
    narrative: [{
      text: 'A creature or object up to 500 pounds rises up to 20 feet and '
        + 'hangs there for up to 10 minutes — an unwilling creature saves '
        + 'Constitution to negate. It can only move by pushing off a fixed '
        + 'surface. Change its altitude by 20 feet on your turn.',
      dmPromptable: true
    }]
  })
})

export const MISTY_STEP = spell({
  id: 'srd:spell.misty-step', name: 'Misty Step', level: 2, school: 'conjuration',
  castingTime: 'bonusAction', rangeKind: 'self', components: { verbal: true, somatic: false },
  effects: effects({
    id: 'srd:spell.misty-step', name: 'Misty Step',
    narrative: [{
      text: 'Surrounded by silvery mist, you teleport up to 30 feet to an '
        + 'unoccupied space you can see.',
      dmPromptable: false
    }]
  })
})

export const ROPE_TRICK = spell({
  id: 'srd:spell.rope-trick', name: 'Rope Trick', level: 2, school: 'transmutation',
  rangeKind: 'touch', durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.rope-trick', name: 'Rope Trick',
    narrative: [{
      text: 'A rope up to 60 feet long rises on its own and its top vanishes '
        + 'into an extradimensional space holding up to eight Medium or smaller '
        + 'creatures, for an hour. Attacks and spells cannot cross the entrance; '
        + 'occupants see out as through a narrow window.',
      dmPromptable: false
    }]
  })
})

export const KNOCK = spell({
  id: 'srd:spell.knock', name: 'Knock', level: 2, school: 'transmutation',
  rangeFeet: 60, components: { verbal: true, somatic: false },
  effects: effects({
    id: 'srd:spell.knock', name: 'Knock',
    narrative: [{
      text: 'A target you can see — a lock, a stuck or barred door or lid — '
        + 'opens. Only one lock opens if there are several. A loud knock is '
        + 'audible up to 300 feet away.',
      dmPromptable: false
    }]
  })
})

export const SILENCE = spell({
  id: 'srd:spell.silence', name: 'Silence', level: 2, school: 'illusion',
  ritual: true, rangeFeet: 120, concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.silence', name: 'Silence',
    completeness: 'partial',
    narrative: [{
      text: 'No sound is created within, or passes through, a 20-foot-radius '
        + 'sphere for up to 10 minutes. Creatures and objects entirely inside '
        + 'are immune to thunder damage, creatures there are deafened, and '
        + 'spells with a verbal component cannot be cast there.',
      dmPromptable: true
    }]
  })
})

export const CONTINUAL_FLAME = spell({
  id: 'srd:spell.continual-flame', name: 'Continual Flame', level: 2, school: 'evocation',
  rangeKind: 'touch',
  components: { verbal: true, somatic: true, material: 'ruby dust worth at least 50 gp', materialCostCp: 5000, consumed: true },
  effects: effects({
    id: 'srd:spell.continual-flame', name: 'Continual Flame',
    narrative: [{
      text: 'A flame springs from an object you touch, giving off heatless '
        + 'light like a torch, until dispelled. It can be covered but not '
        + 'smothered or quenched.',
      dmPromptable: false
    }]
  })
})

export const GENTLE_REPOSE = spell({
  id: 'srd:spell.gentle-repose', name: 'Gentle Repose', level: 2, school: 'necromancy',
  ritual: true, rangeKind: 'touch',
  components: { verbal: true, somatic: true, material: 'salt and a copper piece placed on each of the corpse\'s eyes, which must remain for the duration' },
  durationSeconds: 864000,
  effects: effects({
    id: 'srd:spell.gentle-repose', name: 'Gentle Repose',
    narrative: [{
      text: 'A corpse you touch is protected from decay and cannot become '
        + 'undead, for 10 days. Days under this effect do not count against '
        + 'raise dead\'s time limit.',
      dmPromptable: false
    }]
  })
})

export const AUGURY = spell({
  id: 'srd:spell.augury', name: 'Augury', level: 2, school: 'divination',
  ritual: true, castingTime: { minutes: 1 }, rangeKind: 'self',
  components: { verbal: true, somatic: true, material: 'divinatory tokens worth at least 25 gp', materialCostCp: 2500 },
  effects: effects({
    id: 'srd:spell.augury', name: 'Augury',
    narrative: [{
      text: 'An omen about the results of a course of action you plan to take '
        + 'within 30 minutes: weal, woe, both, or nothing. The DM narrates the '
        + 'reading.',
      dmPromptable: true
    }]
  })
})

export const DETECT_THOUGHTS = spell({
  id: 'srd:spell.detect-thoughts', name: 'Detect Thoughts', level: 2, school: 'divination',
  rangeKind: 'self', concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.detect-thoughts', name: 'Detect Thoughts',
    narrative: [{
      text: 'Use your action to focus on one creature within 30 feet and read '
        + 'its surface thoughts; probing deeper asks a Wisdom save. No effect on '
        + 'a creature with Intelligence 3 or lower or no language.',
      dmPromptable: true
    }]
  })
})

export const LOCATE_OBJECT = spell({
  id: 'srd:spell.locate-object', name: 'Locate Object', level: 2, school: 'divination',
  rangeKind: 'self', concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.locate-object', name: 'Locate Object',
    narrative: [{
      text: 'Sense the direction to a specific object you have seen, or the '
        + 'nearest of a named kind, within 1,000 feet — blocked by any '
        + 'thickness of lead.',
      dmPromptable: false
    }]
  })
})

export const LOCATE_ANIMALS_OR_PLANTS = spell({
  id: 'srd:spell.locate-animals-or-plants', name: 'Locate Animals or Plants',
  level: 2, school: 'divination', ritual: true, rangeKind: 'self',
  effects: effects({
    id: 'srd:spell.locate-animals-or-plants', name: 'Locate Animals or Plants',
    narrative: [{
      text: 'Sense the direction and distance to the nearest creature or plant '
        + 'of a kind you name, within 5 miles.',
      dmPromptable: false
    }]
  })
})

export const FIND_TRAPS = spell({
  id: 'srd:spell.find-traps', name: 'Find Traps', level: 2, school: 'divination',
  rangeFeet: 120,
  effects: effects({
    id: 'srd:spell.find-traps', name: 'Find Traps',
    narrative: [{
      text: 'Sense the presence of anything in line of sight within range that '
        + 'was specifically built to cause a sudden harmful effect — not a mere '
        + 'structural hazard. Does not reveal its location, only that it exists.',
      dmPromptable: false
    }]
  })
})

export const ANIMAL_MESSENGER = spell({
  id: 'srd:spell.animal-messenger', name: 'Animal Messenger', level: 2, school: 'enchantment',
  ritual: true, rangeFeet: 30,
  effects: effects({
    id: 'srd:spell.animal-messenger', name: 'Animal Messenger',
    narrative: [{
      text: 'A Tiny beast carries a 25-word message to a place you have visited '
        + 'and a recipient matching a general description, over the next 24 '
        + 'hours.',
      dmPromptable: false
    }]
  })
})

export const MAGIC_MOUTH = spell({
  id: 'srd:spell.magic-mouth', name: 'Magic Mouth', level: 2, school: 'illusion',
  ritual: true, castingTime: { minutes: 1 }, rangeFeet: 30,
  components: { verbal: true, somatic: true, material: 'honeycomb and jade dust worth at least 10 gp', materialCostCp: 1000, consumed: true },
  effects: effects({
    id: 'srd:spell.magic-mouth', name: 'Magic Mouth',
    narrative: [{
      text: 'Implant a message of 25 words or fewer in an unattended object; it '
        + 'speaks in your voice when a trigger you define, resting on a visual '
        + 'or audible condition within 30 feet, occurs.',
      dmPromptable: false
    }]
  })
})

export const ARCANE_LOCK = spell({
  id: 'srd:spell.arcane-lock', name: 'Arcane Lock', level: 2, school: 'abjuration',
  rangeKind: 'touch',
  components: { verbal: true, somatic: true, material: 'gold dust worth at least 25 gp', materialCostCp: 2500, consumed: true },
  effects: effects({
    id: 'srd:spell.arcane-lock', name: 'Arcane Lock',
    narrative: [{
      text: 'A door, chest or window you touch is locked until dispelled; you '
        + 'and creatures you designate pass freely. Raises the DC to break or '
        + 'pick it by 10.',
      dmPromptable: false
    }]
  })
})

export const ARCANISTS_MAGIC_AURA = spell({
  id: 'srd:spell.arcanists-magic-aura', name: "Arcanist's Magic Aura", level: 2,
  school: 'illusion', rangeKind: 'touch', durationSeconds: 86400,
  effects: effects({
    id: 'srd:spell.arcanists-magic-aura', name: "Arcanist's Magic Aura",
    narrative: [{
      text: 'A creature or object you touch reads falsely to detect magic, or '
        + 'has its apparent creature type or alignment changed against '
        + 'type-detecting effects, for 24 hours.',
      dmPromptable: false
    }]
  })
})

export const LESSER_RESTORATION = spell({
  id: 'srd:spell.lesser-restoration', name: 'Lesser Restoration', level: 2, school: 'abjuration',
  rangeKind: 'touch',
  effects: effects({
    id: 'srd:spell.lesser-restoration', name: 'Lesser Restoration',
    completeness: 'partial',
    narrative: [{
      text: 'A creature you touch has one disease, or the blinded, deafened, '
        + 'paralyzed or poisoned condition, ended.',
      dmPromptable: true
    }]
  })
})

export const PRAYER_OF_HEALING = spell({
  id: 'srd:spell.prayer-of-healing', name: 'Prayer of Healing', level: 2, school: 'evocation',
  castingTime: { minutes: 10 }, rangeFeet: 30, components: { verbal: true, somatic: false },
  effect: {
    delivery: 'auto',
    healing: { dice: { count: 2, sides: 8 }, addSpellMod: true },
    perSlotAbove: { healingDice: { count: 1, sides: 8 } }
  },
  effects: effects({
    id: 'srd:spell.prayer-of-healing', name: 'Prayer of Healing',
    // Up to six creatures, each healed separately — the party-wide reach
    // Bless and Bane are behind. The resolved amount is one creature's.
    completeness: 'partial',
    narrative: [{
      text: 'Up to six creatures you can see regain 2d8 + your spellcasting '
        + 'ability modifier hit points, after 10 minutes of prayer. The number '
        + 'resolved here is one creature\'s — apply it to each.',
      dmPromptable: true
    }]
  })
})

export const SCORCHING_RAY = spell({
  id: 'srd:spell.scorching-ray', name: 'Scorching Ray', level: 2, school: 'evocation',
  rangeFeet: 120,
  effects: effects({
    id: 'srd:spell.scorching-ray', name: 'Scorching Ray',
    // Eldritch Blast's own shape: a variable number of separate attack rolls
    // is not a roll request any spell here can carry.
    narrative: [{
      text: 'Three rays of fire, distributed as you choose among one or more '
        + 'targets. Make a separate ranged spell attack for each: 2d6 fire '
        + 'damage on a hit. One more ray per slot level above 2nd.',
      dmPromptable: false
    }]
  })
})

export const ALL_LEVEL2_SPELLS: SpellDefinition[] = [
  { ...SHATTER, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...MOONBEAM, lists: ['srd:list.druid'] },
  { ...FLAMING_SPHERE, lists: ['srd:list.druid', 'srd:list.wizard'] },
  { ...ACID_ARROW, lists: ['srd:list.wizard'] },
  { ...FLAME_BLADE, lists: ['srd:list.druid'] },
  { ...SPIRITUAL_WEAPON, lists: ['srd:list.cleric'] },
  { ...BARKSKIN, lists: ['srd:list.druid', 'srd:list.ranger'] },
  { ...BLUR, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...SPIDER_CLIMB, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...PROTECTION_FROM_POISON, lists: [
    'srd:list.cleric', 'srd:list.druid', 'srd:list.paladin', 'srd:list.ranger'
  ] },
  { ...PASS_WITHOUT_TRACE, lists: ['srd:list.druid', 'srd:list.ranger'] },
  { ...ENHANCE_ABILITY, lists: ['srd:list.bard', 'srd:list.cleric', 'srd:list.druid'] },
  { ...ENLARGE_REDUCE, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...INVISIBILITY, lists: [
    'srd:list.bard', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...HOLD_PERSON, lists: [
    'srd:list.bard', 'srd:list.cleric', 'srd:list.druid', 'srd:list.sorcerer',
    'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...SUGGESTION, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...WEB, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...SPIKE_GROWTH, lists: ['srd:list.druid', 'srd:list.ranger'] },
  { ...BLINDNESS_DEAFNESS, lists: [
    'srd:list.bard', 'srd:list.cleric', 'srd:list.sorcerer', 'srd:list.wizard'
  ] },
  { ...CALM_EMOTIONS, lists: ['srd:list.bard', 'srd:list.cleric'] },
  { ...ENTHRALL, lists: ['srd:list.bard', 'srd:list.warlock'] },
  { ...ZONE_OF_TRUTH, lists: ['srd:list.bard', 'srd:list.cleric', 'srd:list.paladin'] },
  { ...BRANDING_SMITE, lists: ['srd:list.paladin'] },
  { ...MAGIC_WEAPON, lists: ['srd:list.paladin', 'srd:list.wizard'] },
  { ...MIRROR_IMAGE, lists: ['srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...RAY_OF_ENFEEBLEMENT, lists: ['srd:list.warlock', 'srd:list.wizard'] },
  { ...WARDING_BOND, lists: ['srd:list.cleric'] },
  { ...HEAT_METAL, lists: ['srd:list.bard', 'srd:list.druid'] },
  { ...ALTER_SELF, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...FIND_STEED, lists: ['srd:list.paladin'] },
  { ...GUST_OF_WIND, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...DARKVISION, lists: ['srd:list.druid', 'srd:list.ranger', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...SEE_INVISIBILITY, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...LEVITATE, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...MISTY_STEP, lists: ['srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...ROPE_TRICK, lists: ['srd:list.wizard'] },
  { ...KNOCK, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...SILENCE, lists: ['srd:list.bard', 'srd:list.cleric', 'srd:list.ranger'] },
  { ...CONTINUAL_FLAME, lists: ['srd:list.cleric', 'srd:list.wizard'] },
  { ...GENTLE_REPOSE, lists: ['srd:list.cleric', 'srd:list.wizard'] },
  { ...AUGURY, lists: ['srd:list.cleric'] },
  { ...DETECT_THOUGHTS, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...LOCATE_OBJECT, lists: [
    'srd:list.bard', 'srd:list.cleric', 'srd:list.paladin', 'srd:list.ranger', 'srd:list.wizard'
  ] },
  { ...LOCATE_ANIMALS_OR_PLANTS, lists: [
    'srd:list.bard', 'srd:list.druid', 'srd:list.ranger'
  ] },
  { ...FIND_TRAPS, lists: ['srd:list.cleric', 'srd:list.druid', 'srd:list.ranger'] },
  { ...ANIMAL_MESSENGER, lists: ['srd:list.bard', 'srd:list.druid', 'srd:list.ranger'] },
  { ...MAGIC_MOUTH, lists: ['srd:list.bard', 'srd:list.wizard'] },
  { ...ARCANE_LOCK, lists: ['srd:list.wizard'] },
  { ...ARCANISTS_MAGIC_AURA, lists: ['srd:list.wizard'] },
  { ...LESSER_RESTORATION, lists: [
    'srd:list.bard', 'srd:list.cleric', 'srd:list.druid', 'srd:list.paladin', 'srd:list.ranger'
  ] },
  { ...PRAYER_OF_HEALING, lists: ['srd:list.cleric'] },
  { ...SCORCHING_RAY, lists: ['srd:list.sorcerer', 'srd:list.wizard'] }
]
