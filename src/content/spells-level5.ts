// 5th-level spells.
//
// Thirty-seven of them — the full union of every class's 5th-level column
// (docs/srd/08-spell-lists.md). This is the level where the SRD tips hard
// toward summons, charms, resurrection and other things outside the
// damage/save/heal vocabulary — only five of the thirty-seven get an `effect`
// block, the rest are narrative.
//
// Flame Strike is the second two-damage-type spell (after Ice Storm), and the
// first where the SRD gives the caster a real choice the engine can't offer:
// upcasting adds a die to *either* fire or radiant, your pick. `perSlotAbove`
// only ever scales `damage[0]`, so the engine always grows the fire term —
// flagged partial rather than silently picking a side.
//
// Contact Other Plane is a spell whose damage the engine could resolve (6d6
// psychic on a failed INT save) but whose save DC is a flat 15, not the
// caster's spell save DC — there is no field to override that, so it stays
// fully narrative rather than emit a wrong number.
//
// Checked against docs/srd-source/spells.pdf via docs/srd/08b-spell-descriptions.md
// and docs/srd/08-spell-lists.md.

import type { EffectSource, SpellDefinition } from '../rules/types.js'

const V = '2014'

function effects(o: Partial<EffectSource> & { id: string; name: string }): EffectSource {
  return {
    provenance: 'srd', contentVersion: 1, kind: 'spell',
    activation: { always: true }, modifiers: [], completeness: 'complete',
    ...o
  }
}

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

export const CLOUDKILL = spell({
  id: 'srd:spell.cloudkill', name: 'Cloudkill', level: 5, school: 'conjuration',
  rangeFeet: 120, concentration: true, durationSeconds: 600,
  effect: {
    delivery: 'save', save: { ability: 'con', onSuccess: 'half' },
    damage: [{ dice: { count: 5, sides: 8 }, type: 'poison' }],
    perSlotAbove: { damageDice: { count: 1, sides: 8 } }
  },
  effects: effects({
    id: 'srd:spell.cloudkill', name: 'Cloudkill',
    narrative: [{
      text: 'A 20-foot-radius sphere of poison fog that spreads around '
        + 'corners and heavily obscures. Moves 10 feet away from you at the '
        + 'start of each of your turns; a strong wind disperses it and ends '
        + 'the spell.',
      dmPromptable: true
    }]
  })
})

export const CONE_OF_COLD = spell({
  id: 'srd:spell.cone-of-cold', name: 'Cone of Cold', level: 5, school: 'evocation',
  rangeKind: 'self',
  effect: {
    delivery: 'save', save: { ability: 'con', onSuccess: 'half' },
    damage: [{ dice: { count: 8, sides: 8 }, type: 'cold' }],
    perSlotAbove: { damageDice: { count: 1, sides: 8 } }
  },
  effects: effects({
    id: 'srd:spell.cone-of-cold', name: 'Cone of Cold',
    narrative: [{
      text: 'A 60-foot cone. A creature killed by this damage becomes a '
        + 'frozen statue until it thaws.',
      dmPromptable: true
    }]
  })
})

export const FLAME_STRIKE = spell({
  id: 'srd:spell.flame-strike', name: 'Flame Strike', level: 5, school: 'evocation',
  rangeFeet: 60,
  effect: {
    delivery: 'save', save: { ability: 'dex', onSuccess: 'half' },
    damage: [
      { dice: { count: 4, sides: 6 }, type: 'fire' },
      { dice: { count: 4, sides: 6 }, type: 'radiant' }
    ],
    perSlotAbove: { damageDice: { count: 1, sides: 6 } }
  },
  effects: effects({
    id: 'srd:spell.flame-strike', name: 'Flame Strike',
    // RAW lets the caster choose fire or radiant for the upcast die each
    // time. The engine always grows damage[0] (fire) — Ice Storm's rule
    // applied to a spell where the asymmetry is a player choice, not a fixed
    // SRD fact, so it is called out rather than silently resolved one way.
    completeness: 'partial',
    narrative: [{
      text: 'A 10-foot-radius, 40-foot-high cylinder. Upcasting lets you add '
        + 'the extra die to fire or radiant damage, your choice — this always '
        + 'resolves it as fire; move it to radiant by hand if you chose '
        + 'otherwise.',
      dmPromptable: true
    }]
  })
})

export const INSECT_PLAGUE = spell({
  id: 'srd:spell.insect-plague', name: 'Insect Plague', level: 5, school: 'conjuration',
  rangeFeet: 300, concentration: true, durationSeconds: 600,
  effect: {
    delivery: 'save', save: { ability: 'con', onSuccess: 'half' },
    damage: [{ dice: { count: 4, sides: 10 }, type: 'piercing' }],
    perSlotAbove: { damageDice: { count: 1, sides: 10 } }
  },
  effects: effects({
    id: 'srd:spell.insect-plague', name: 'Insect Plague',
    narrative: [{
      text: 'A 20-foot-radius sphere of biting, stinging insects: lightly '
        + 'obscured and difficult terrain. A creature takes this damage on '
        + 'entering, starting its turn there, or when the sphere first '
        + 'appears around it.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Healing that reaches more than one creature
// ===========================================================================

export const MASS_CURE_WOUNDS = spell({
  id: 'srd:spell.mass-cure-wounds', name: 'Mass Cure Wounds', level: 5, school: 'evocation',
  rangeFeet: 60,
  effect: {
    delivery: 'auto',
    healing: { dice: { count: 3, sides: 8 }, addSpellMod: true },
    perSlotAbove: { healingDice: { count: 1, sides: 8 } }
  },
  effects: effects({
    id: 'srd:spell.mass-cure-wounds', name: 'Mass Cure Wounds',
    // Up to six creatures, each healed separately — the same party-wide
    // reach Mass Healing Word and Prayer of Healing are behind.
    completeness: 'partial',
    narrative: [{
      text: 'Up to six creatures you can see in a 30-foot-radius sphere each '
        + 'regain 3d8 + your spellcasting ability modifier hit points. No '
        + 'effect on undead or constructs. The number resolved here is one '
        + "creature's — apply it to each.",
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Pure information and utility — nothing to compute, only to narrate
// ===========================================================================

export const COMMUNE = spell({
  id: 'srd:spell.commune', name: 'Commune', level: 5, school: 'divination',
  ritual: true, castingTime: { minutes: 1 }, rangeKind: 'self', durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.commune', name: 'Commune',
    narrative: [{
      text: 'Three yes-or-no questions to your deity or a proxy, answered '
        + 'correctly if the answer is knowable. A cumulative 25% chance of no '
        + 'answer for each casting after the first before a long rest.',
      dmPromptable: true
    }]
  })
})

export const COMMUNE_WITH_NATURE = spell({
  id: 'srd:spell.commune-with-nature', name: 'Commune with Nature', level: 5, school: 'divination',
  ritual: true, castingTime: { minutes: 1 }, rangeKind: 'self',
  effects: effects({
    id: 'srd:spell.commune-with-nature', name: 'Commune with Nature',
    narrative: [{
      text: 'Learn three facts of your choice about the land within 3 miles '
        + '(300 feet underground): terrain and water, plants/minerals/'
        + 'animals/peoples, powerful otherworldly presences, planar '
        + 'influence, or buildings.',
      dmPromptable: true
    }]
  })
})

export const LEGEND_LORE = spell({
  id: 'srd:spell.legend-lore', name: 'Legend Lore', level: 5, school: 'divination',
  castingTime: { minutes: 10 }, rangeKind: 'self',
  components: {
    verbal: true, somatic: true,
    material: 'incense worth at least 250 gp and four ivory strips worth at '
      + 'least 50 gp each, all of which the spell consumes',
    materialCostCp: 45000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.legend-lore', name: 'Legend Lore',
    narrative: [{
      text: 'A summary of significant lore about a named person, place or '
        + 'object — nothing if it is not of legendary importance. The more '
        + 'you already know, the more precise the answer.',
      dmPromptable: true
    }]
  })
})

export const TELEPATHIC_BOND = spell({
  id: 'srd:spell.telepathic-bond', name: 'Telepathic Bond', level: 5, school: 'divination',
  ritual: true, rangeFeet: 30, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.telepathic-bond', name: 'Telepathic Bond',
    narrative: [{
      text: 'Links up to eight willing creatures telepathically, regardless '
        + 'of shared language, over any distance short of crossing planes. '
        + 'No effect on a creature with Intelligence 2 or lower.',
      dmPromptable: false
    }]
  })
})

export const TELEPORTATION_CIRCLE = spell({
  id: 'srd:spell.teleportation-circle', name: 'Teleportation Circle', level: 5, school: 'conjuration',
  castingTime: { minutes: 1 }, rangeFeet: 10, durationSeconds: 6,
  components: {
    verbal: true, somatic: false,
    material: 'rare chalks and inks worth at least 50 gp, which the spell consumes',
    materialCostCp: 5000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.teleportation-circle', name: 'Teleportation Circle',
    narrative: [{
      text: 'A 10-foot-diameter portal to a permanent circle whose sigil '
        + 'sequence you know, open until the end of your next turn. You '
        + 'learn two sigil sequences when you gain this spell.',
      dmPromptable: false
    }]
  })
})

export const TREE_STRIDE = spell({
  id: 'srd:spell.tree-stride', name: 'Tree Stride', level: 5, school: 'conjuration',
  rangeKind: 'self', concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.tree-stride', name: 'Tree Stride',
    narrative: [{
      text: 'Enter a living tree at least your size and step out of another '
        + 'tree of the same kind within 500 feet, once per round. You know '
        + 'the location of all same-kind trees in range. You must end each '
        + 'turn outside a tree.',
      dmPromptable: false
    }]
  })
})

export const ANTILIFE_SHELL = spell({
  id: 'srd:spell.antilife-shell', name: 'Antilife Shell', level: 5, school: 'abjuration',
  rangeKind: 'self', concentration: true, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.antilife-shell', name: 'Antilife Shell',
    narrative: [{
      text: 'A 10-foot-radius barrier hedges out every creature except '
        + 'undead and constructs — they can still cast spells and make '
        + 'ranged or reach attacks through it. Ends if you force an '
        + 'affected creature through it.',
      dmPromptable: false
    }]
  })
})

export const PASSWALL = spell({
  id: 'srd:spell.passwall', name: 'Passwall', level: 5, school: 'transmutation',
  rangeFeet: 30, durationSeconds: 3600,
  effects: effects({
    id: 'srd:spell.passwall', name: 'Passwall',
    narrative: [{
      text: 'A passage through wood, plaster or stone up to 5 feet wide, 8 '
        + 'feet tall and 20 feet deep, causing no structural instability. '
        + 'Occupants are safely ejected when it closes.',
      dmPromptable: false
    }]
  })
})

export const MISLEAD = spell({
  id: 'srd:spell.mislead', name: 'Mislead', level: 5, school: 'illusion',
  rangeKind: 'self', concentration: true, durationSeconds: 3600,
  components: { verbal: false, somatic: true },
  effects: effects({
    id: 'srd:spell.mislead', name: 'Mislead',
    narrative: [{
      text: 'You turn invisible — ending if you attack or cast a spell — and '
        + 'an illusory double of you appears. Use your action to move and '
        + 'act through the double; a bonus action switches which set of '
        + 'senses you use.',
      dmPromptable: false
    }]
  })
})

export const WALL_OF_FORCE = spell({
  id: 'srd:spell.wall-of-force', name: 'Wall of Force', level: 5, school: 'evocation',
  rangeFeet: 120, concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.wall-of-force', name: 'Wall of Force',
    narrative: [{
      text: 'An invisible wall of force: a hemisphere or sphere up to 10 '
        + 'feet in radius, or ten contiguous 10-by-10-foot panels. Creatures '
        + 'in its path are pushed to a side of your choice. Nothing '
        + 'physically passes through it, it is immune to all damage and '
        + "dispel magic can't end it, though disintegrate destroys it "
        + 'instantly.',
      dmPromptable: false
    }]
  })
})

export const CREATION = spell({
  id: 'srd:spell.creation', name: 'Creation', level: 5, school: 'illusion',
  castingTime: { minutes: 1 }, rangeFeet: 30,
  effects: effects({
    id: 'srd:spell.creation', name: 'Creation',
    narrative: [{
      text: 'A nonliving object up to a 5-foot cube, of a form and material '
        + "you have seen before. Duration depends on the material — 1 day "
        + 'for vegetable matter down to 1 minute for adamantine or mithral. '
        + "Material this way can't serve as another spell's component.",
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Everything else — a target-facing save, condition, summon or transformation
// this content set has no vocabulary for
// ===========================================================================

export const ANIMATE_OBJECTS = spell({
  id: 'srd:spell.animate-objects', name: 'Animate Objects', level: 5, school: 'transmutation',
  rangeFeet: 120, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.animate-objects', name: 'Animate Objects',
    completeness: 'partial',
    narrative: [{
      text: 'Up to ten nonmagical, unattended objects animate and fight for '
        + 'you (a Medium object counts as two, Large as four, Huge as '
        + 'eight). Each is a full statblock — HP, AC, an attack, and Tiny '
        + 'through Huge scale from 20 HP/AC 18 up to 80 HP/AC 10 — that this '
        + 'content set has no analogue for. Two additional objects per slot '
        + 'above 5th.',
      dmPromptable: true
    }]
  })
})

export const ARCANE_HAND = spell({
  id: 'srd:spell.arcane-hand', name: 'Arcane Hand', level: 5, school: 'evocation',
  rangeFeet: 120, concentration: true, durationSeconds: 60,
  components: {
    verbal: true, somatic: true,
    material: 'an eggshell and a snakeskin glove'
  },
  effects: effects({
    id: 'srd:spell.arcane-hand', name: 'Arcane Hand',
    completeness: 'partial',
    narrative: [{
      text: 'A Large hand of force (AC 20, HP equal to your own maximum, '
        + 'STR 26) you move 60 feet as a bonus action each turn, then choose '
        + 'one: Clenched Fist (melee spell attack, 4d8 force), Forceful Hand '
        + "(shove with the hand's Strength), Grasping Hand (grapple and "
        + 'crush for 2d6 + your spellcasting modifier bludgeoning), or '
        + 'Interposing Hand (half cover against one creature). Clenched '
        + 'Fist +2d8 and Grasping Hand +2d6 per slot above 5th.',
      dmPromptable: true
    }]
  })
})

export const AWAKEN = spell({
  id: 'srd:spell.awaken', name: 'Awaken', level: 5, school: 'transmutation',
  castingTime: { hours: 8 }, rangeKind: 'touch',
  components: {
    verbal: true, somatic: true,
    material: 'an agate worth at least 1,000 gp, which the spell consumes',
    materialCostCp: 100000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.awaken', name: 'Awaken',
    completeness: 'partial',
    narrative: [{
      text: 'A Huge or smaller beast or plant with no Intelligence score or '
        + 'Intelligence 3 or lower gains Intelligence 10 and a language you '
        + 'know (plants also gain movement and senses). Charmed by you for '
        + '30 days, or until harmed by you or your allies; afterwards its '
        + 'attitude depends on how you treated it.',
      dmPromptable: true
    }]
  })
})

export const CONJURE_ELEMENTAL = spell({
  id: 'srd:spell.conjure-elemental', name: 'Conjure Elemental', level: 5, school: 'conjuration',
  castingTime: { minutes: 1 }, rangeFeet: 90, concentration: true, durationSeconds: 3600,
  components: {
    verbal: true, somatic: true,
    material: 'a substance representing the element you choose'
  },
  effects: effects({
    id: 'srd:spell.conjure-elemental', name: 'Conjure Elemental',
    completeness: 'partial',
    narrative: [{
      text: 'Requires a 10-foot cube of the matching element in range. An '
        + 'elemental of CR 5 or lower appears within 10 feet of it and '
        + 'obeys your commands. If your concentration breaks, it does not '
        + 'vanish — it turns hostile and cannot be dismissed, disappearing '
        + '1 hour later regardless. +1 CR per slot above 5th.',
      dmPromptable: true
    }]
  })
})

export const CONTACT_OTHER_PLANE = spell({
  id: 'srd:spell.contact-other-plane', name: 'Contact Other Plane', level: 5, school: 'divination',
  ritual: true, castingTime: { minutes: 1 }, rangeKind: 'self', durationSeconds: 60,
  components: { verbal: true, somatic: false },
  effects: effects({
    id: 'srd:spell.contact-other-plane', name: 'Contact Other Plane',
    // A real save exists (DC 15 Intelligence) but it is a flat DC, not the
    // caster's spell save DC — there is no field to override that, so the
    // damage roll is left for the DM rather than resolved wrong.
    completeness: 'partial',
    narrative: [{
      text: 'You attempt to contact a mysterious entity. DC 15 Intelligence '
        + 'save (not your spell save DC): failure deals 6d6 psychic and '
        + "leaves you insane until your next long rest, ended early by "
        + "greater restoration. Success lets you ask five questions, "
        + "answered in one word each.",
      dmPromptable: true
    }]
  })
})

export const CONTAGION = spell({
  id: 'srd:spell.contagion', name: 'Contagion', level: 5, school: 'necromancy',
  rangeKind: 'touch', durationSeconds: 604800,
  components: { verbal: true, somatic: true },
  effects: effects({
    id: 'srd:spell.contagion', name: 'Contagion',
    completeness: 'partial',
    narrative: [{
      text: 'Melee spell attack; on a hit, inflict a disease of your '
        + "choice. Constitution save at the end of the target's turns: "
        + 'three failures locks the disease in for the duration, three '
        + 'successes cures it. Because the disease is natural, anything '
        + 'that removes or eases disease applies.',
      dmPromptable: true
    }]
  })
})

export const DISPEL_EVIL_AND_GOOD = spell({
  id: 'srd:spell.dispel-evil-and-good', name: 'Dispel Evil and Good', level: 5, school: 'abjuration',
  rangeKind: 'self', concentration: true, durationSeconds: 60,
  components: { verbal: true, somatic: true },
  effects: effects({
    id: 'srd:spell.dispel-evil-and-good', name: 'Dispel Evil and Good',
    completeness: 'partial',
    narrative: [{
      text: 'Celestials, elementals, fey, fiends and undead have '
        + 'disadvantage on attack rolls against you. End it early with '
        + 'either Break Enchantment (touch, end a charm/fear/possession by '
        + 'one of those types) or Dismissal (melee spell attack; on a hit a '
        + 'Charisma save or the creature is sent to its home plane).',
      dmPromptable: true
    }]
  })
})

export const DOMINATE_PERSON = spell({
  id: 'srd:spell.dominate-person', name: 'Dominate Person', level: 5, school: 'enchantment',
  rangeFeet: 60, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.dominate-person', name: 'Dominate Person',
    completeness: 'partial',
    narrative: [{
      text: 'One humanoid you can see makes a Wisdom save (with advantage '
        + 'if you or your allies are fighting it) or is charmed. Telepathic '
        + 'link on the same plane; general commands need no action, and '
        + 'spending your action grants precise control until the end of '
        + 'your next turn. A new save each time it takes damage. Longer '
        + 'concentration duration at higher slots.',
      dmPromptable: true
    }]
  })
})

export const DREAM = spell({
  id: 'srd:spell.dream', name: 'Dream', level: 5, school: 'illusion',
  castingTime: { minutes: 1 }, rangeKind: 'special', durationSeconds: 28800,
  components: { verbal: true, somatic: true, material: 'a handful of sand, a dab of ink, and a writing quill plucked from a sleeping creature' },
  effects: effects({
    id: 'srd:spell.dream', name: 'Dream',
    completeness: 'partial',
    narrative: [{
      text: 'A creature known to you on the same plane, if it sleeps. You '
        + 'or a willing touched creature enters a trance as the messenger, '
        + 'appearing in the target’s dream to converse and shape the '
        + 'dreamscape; the target recalls it perfectly. As a nightmare '
        + 'instead: deliver up to ten words, then the target saves Wisdom '
        + 'or gains no benefit from the rest and takes 3d6 psychic on '
        + 'waking.',
      dmPromptable: true
    }]
  })
})

export const GEAS = spell({
  id: 'srd:spell.geas', name: 'Geas', level: 5, school: 'enchantment',
  castingTime: { minutes: 1 }, rangeFeet: 60, durationSeconds: 2592000,
  components: { verbal: true, somatic: false },
  effects: effects({
    id: 'srd:spell.geas', name: 'Geas',
    completeness: 'partial',
    narrative: [{
      text: 'A creature that can understand you makes a Wisdom save or is '
        + 'charmed and bound to your instructions for 30 days. Each time it '
        + 'acts directly counter to them, at most once per day, it takes '
        + '5d10 psychic. A suicidal command ends the spell. Ended by your '
        + 'action, remove curse, greater restoration or wish.',
      dmPromptable: true
    }]
  })
})

export const GREATER_RESTORATION = spell({
  id: 'srd:spell.greater-restoration', name: 'Greater Restoration', level: 5, school: 'abjuration',
  rangeKind: 'touch',
  components: {
    verbal: true, somatic: true,
    material: 'diamond dust worth at least 100 gp, which the spell consumes',
    materialCostCp: 10000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.greater-restoration', name: 'Greater Restoration',
    completeness: 'partial',
    narrative: [{
      text: 'A creature you touch either reduces its exhaustion by one '
        + 'level, or has one of the following ended: a charmed or '
        + 'petrified effect, a curse (including attunement to a cursed '
        + 'item), any reduction to an ability score, or any reduction to '
        + 'its hit point maximum.',
      dmPromptable: true
    }]
  })
})

export const HALLOW = spell({
  id: 'srd:spell.hallow', name: 'Hallow', level: 5, school: 'evocation',
  castingTime: { hours: 24 }, rangeKind: 'touch',
  components: {
    verbal: true, somatic: true,
    material: 'herbs, oils and incense worth at least 1,000 gp, which the spell consumes',
    materialCostCp: 100000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.hallow', name: 'Hallow',
    completeness: 'partial',
    narrative: [{
      text: 'Wards a radius up to 60 feet (fails if it would overlap '
        + 'another hallow). Celestials, elementals, fey, fiends and undead '
        + "can't enter or use charm/fear/possession inside, and existing "
        + 'such effects end on entry — you may exclude any of those types. '
        + 'Choose one bound extra effect from a fixed list (courage, '
        + 'darkness, daylight, energy protection or vulnerability, and '
        + 'more), resistible with a Charisma save.',
      dmPromptable: true
    }]
  })
})

export const HOLD_MONSTER = spell({
  id: 'srd:spell.hold-monster', name: 'Hold Monster', level: 5, school: 'enchantment',
  rangeFeet: 90, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.hold-monster', name: 'Hold Monster',
    completeness: 'partial',
    narrative: [{
      text: 'One creature you can see makes a Wisdom save or is paralyzed '
        + 'for the duration, repeating the save at the end of each of its '
        + 'turns. No effect on undead. Apply the Paralyzed condition on a '
        + 'failure. One additional target per slot above 5th, all within '
        + '30 feet of each other.',
      dmPromptable: true
    }]
  })
})

export const MODIFY_MEMORY = spell({
  id: 'srd:spell.modify-memory', name: 'Modify Memory', level: 5, school: 'enchantment',
  rangeFeet: 30, concentration: true, durationSeconds: 60,
  effects: effects({
    id: 'srd:spell.modify-memory', name: 'Modify Memory',
    completeness: 'partial',
    narrative: [{
      text: 'One creature you can see makes a Wisdom save (with advantage '
        + 'if you are fighting it) or is charmed, incapacitated and unaware '
        + 'of its surroundings, though it can still hear you. Any damage or '
        + 'being targeted by another spell ends this with no memories '
        + 'changed. Erase, sharpen, alter or fabricate a memory of an event '
        + 'from the last 24 hours, lasting no more than 10 minutes.',
      dmPromptable: true
    }]
  })
})

export const PLANAR_BINDING = spell({
  id: 'srd:spell.planar-binding', name: 'Planar Binding', level: 5, school: 'abjuration',
  castingTime: { hours: 1 }, rangeFeet: 60, durationSeconds: 86400,
  components: {
    verbal: true, somatic: true,
    material: 'a jewel worth at least 1,000 gp, which the spell consumes',
    materialCostCp: 100000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.planar-binding', name: 'Planar Binding',
    completeness: 'partial',
    narrative: [{
      text: 'A celestial, elemental, fey or fiend you can see, typically '
        + 'held in place by an inverted magic circle, makes a Charisma save '
        + 'or is bound to serve you for the duration. It obeys the letter '
        + 'of your instructions, twisting your words if hostile.',
      dmPromptable: true
    }]
  })
})

export const RAISE_DEAD = spell({
  id: 'srd:spell.raise-dead', name: 'Raise Dead', level: 5, school: 'necromancy',
  castingTime: { hours: 1 }, rangeKind: 'touch',
  components: {
    verbal: true, somatic: true,
    material: 'a diamond worth at least 500 gp, which the spell consumes',
    materialCostCp: 50000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.raise-dead', name: 'Raise Dead',
    // A binary state change — dead to alive at 1 hit point — rather than a
    // healing roll, the same gap Revivify has, plus a decaying ordeal
    // penalty this content set has no clock for.
    completeness: 'partial',
    narrative: [{
      text: 'A creature dead no longer than 10 days, with a willing soul, '
        + 'returns to life with 1 hit point. Neutralises poisons and cures '
        + "nonmagical diseases present at death. Can't restore missing "
        + 'body parts or raise the undead. The creature suffers -4 to '
        + 'attack rolls, saves and checks, improving by 1 per long rest.',
      dmPromptable: true
    }]
  })
})

export const REINCARNATE = spell({
  id: 'srd:spell.reincarnate', name: 'Reincarnate', level: 5, school: 'transmutation',
  castingTime: { hours: 1 }, rangeKind: 'touch',
  components: {
    verbal: true, somatic: true,
    material: 'rare oils worth at least 1,000 gp, which the spell consumes',
    materialCostCp: 100000, consumed: true
  },
  effects: effects({
    id: 'srd:spell.reincarnate', name: 'Reincarnate',
    completeness: 'partial',
    narrative: [{
      text: 'A humanoid dead no longer than 10 days gets a new adult body, '
        + 'likely of a different species — the GM rolls or chooses. The '
        + 'creature returns with its class and levels but a new body and '
        + 'possibly changed ability scores.',
      dmPromptable: true
    }]
  })
})

export const SCRYING = spell({
  id: 'srd:spell.scrying', name: 'Scrying', level: 5, school: 'divination',
  castingTime: { minutes: 10 }, rangeKind: 'self', concentration: true, durationSeconds: 600,
  components: {
    verbal: true, somatic: true,
    material: 'a focus worth at least 1,000 gp, such as a crystal ball, a '
      + 'silver mirror, or a font of holy water'
  },
  effects: effects({
    id: 'srd:spell.scrying', name: 'Scrying',
    completeness: 'partial',
    narrative: [{
      text: 'The target makes a Wisdom save, modified by your knowledge of '
        + 'and connection to it (from +5 for hearsay down to -5 for '
        + 'familiarity), or you see and hear it and its surroundings for '
        + 'the duration. It may choose to fail the save if it knows you are '
        + 'casting.',
      dmPromptable: true
    }]
  })
})

export const SEEMING = spell({
  id: 'srd:spell.seeming', name: 'Seeming', level: 5, school: 'illusion',
  rangeFeet: 30, durationSeconds: 28800,
  effects: effects({
    id: 'srd:spell.seeming', name: 'Seeming',
    completeness: 'partial',
    narrative: [{
      text: 'Any number of creatures get illusory appearances covering '
        + 'clothing, armour and equipment; unwilling targets save Charisma. '
        + 'Height changes by up to a foot, any build, same body type. Fails '
        + 'physical inspection: an Investigation check against your spell '
        + 'save DC reveals it.',
      dmPromptable: true
    }]
  })
})

export const TELEKINESIS = spell({
  id: 'srd:spell.telekinesis', name: 'Telekinesis', level: 5, school: 'transmutation',
  rangeFeet: 60, concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.telekinesis', name: 'Telekinesis',
    completeness: 'partial',
    narrative: [{
      text: 'On casting, and as your action each round, affect one target. '
        + 'A creature Huge or smaller: spellcasting ability check contested '
        + "by its Strength check; on a win, move it 30 feet and restrain it "
        + 'in your grip until the end of your next turn. An object up to '
        + '1,000 lb: move it 30 feet, with fine control for a worn or '
        + 'carried object contested the same way.',
      dmPromptable: true
    }]
  })
})

export const WALL_OF_STONE = spell({
  id: 'srd:spell.wall-of-stone', name: 'Wall of Stone', level: 5, school: 'evocation',
  rangeFeet: 120, concentration: true, durationSeconds: 600,
  effects: effects({
    id: 'srd:spell.wall-of-stone', name: 'Wall of Stone',
    completeness: 'partial',
    narrative: [{
      text: 'Ten contiguous 10-by-10-foot panels, 6 inches thick (or half '
        + 'that thickness at double area), in any shape, merged with and '
        + 'supported by existing stone. Creatures in its path are pushed '
        + 'aside; one that would be fully enclosed may Dexterity save to '
        + 'use its reaction to move clear. AC 15, 30 HP per inch of '
        + 'thickness.',
      dmPromptable: true
    }]
  })
})

// ===========================================================================
// Registration
// ===========================================================================

export const ALL_LEVEL5_SPELLS: SpellDefinition[] = [
  { ...CLOUDKILL, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...CONE_OF_COLD, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...FLAME_STRIKE, lists: ['srd:list.cleric'] },
  { ...INSECT_PLAGUE, lists: ['srd:list.cleric', 'srd:list.druid', 'srd:list.sorcerer'] },
  { ...MASS_CURE_WOUNDS, lists: ['srd:list.bard', 'srd:list.cleric', 'srd:list.druid'] },
  { ...COMMUNE, lists: ['srd:list.cleric'] },
  { ...COMMUNE_WITH_NATURE, lists: ['srd:list.druid', 'srd:list.ranger'] },
  { ...LEGEND_LORE, lists: ['srd:list.bard', 'srd:list.cleric', 'srd:list.wizard'] },
  { ...TELEPATHIC_BOND, lists: ['srd:list.wizard'] },
  { ...TELEPORTATION_CIRCLE, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...TREE_STRIDE, lists: ['srd:list.druid', 'srd:list.ranger'] },
  { ...ANTILIFE_SHELL, lists: ['srd:list.druid'] },
  { ...PASSWALL, lists: ['srd:list.wizard'] },
  { ...MISLEAD, lists: ['srd:list.bard', 'srd:list.wizard'] },
  { ...WALL_OF_FORCE, lists: ['srd:list.wizard'] },
  { ...CREATION, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...ANIMATE_OBJECTS, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...ARCANE_HAND, lists: ['srd:list.wizard'] },
  { ...AWAKEN, lists: ['srd:list.bard', 'srd:list.druid'] },
  { ...CONJURE_ELEMENTAL, lists: ['srd:list.druid', 'srd:list.wizard'] },
  { ...CONTACT_OTHER_PLANE, lists: ['srd:list.warlock', 'srd:list.wizard'] },
  { ...CONTAGION, lists: ['srd:list.cleric', 'srd:list.druid'] },
  { ...DISPEL_EVIL_AND_GOOD, lists: ['srd:list.cleric', 'srd:list.paladin'] },
  { ...DOMINATE_PERSON, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...DREAM, lists: ['srd:list.bard', 'srd:list.warlock', 'srd:list.wizard'] },
  { ...GEAS, lists: [
    'srd:list.bard', 'srd:list.cleric', 'srd:list.druid', 'srd:list.paladin', 'srd:list.wizard'
  ] },
  { ...GREATER_RESTORATION, lists: ['srd:list.bard', 'srd:list.cleric', 'srd:list.druid'] },
  { ...HALLOW, lists: ['srd:list.cleric'] },
  { ...HOLD_MONSTER, lists: [
    'srd:list.bard', 'srd:list.sorcerer', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...MODIFY_MEMORY, lists: ['srd:list.bard', 'srd:list.wizard'] },
  { ...PLANAR_BINDING, lists: [
    'srd:list.bard', 'srd:list.cleric', 'srd:list.druid', 'srd:list.wizard'
  ] },
  { ...RAISE_DEAD, lists: ['srd:list.bard', 'srd:list.cleric', 'srd:list.paladin'] },
  { ...REINCARNATE, lists: ['srd:list.druid'] },
  { ...SCRYING, lists: [
    'srd:list.bard', 'srd:list.cleric', 'srd:list.druid', 'srd:list.warlock', 'srd:list.wizard'
  ] },
  { ...SEEMING, lists: ['srd:list.bard', 'srd:list.sorcerer', 'srd:list.wizard'] },
  { ...TELEKINESIS, lists: ['srd:list.sorcerer', 'srd:list.wizard'] },
  { ...WALL_OF_STONE, lists: ['srd:list.druid', 'srd:list.sorcerer', 'srd:list.wizard'] }
]
