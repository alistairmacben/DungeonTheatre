# Roadmap — from here to a finished product

Written after the first playable slice (HUD and menu over the theatre, commit
`7b3697c`). It records what is actually left, in the order the dependencies
force, and what "done" means for each phase.

## Where the project actually stands

The engine is deep and the content is shallow. That asymmetry is deliberate —
the vocabulary was built first — but it is now the binding constraint.

| | Built | Missing |
|---|---|---|
| Rules engine | 8 value ops, roll state, capabilities, proficiency, conditions, attacks, resources, explainability | spellcasting |
| Content | 1 species, 3 classes, 5 weapons, 4 armours, 12 feats, 15 conditions | **6 more species, 4+ classes, every spell** |
| Player contract | view model, commands, events, 4-tab IA, progressive disclosure | spell views, HUD preferences |
| Presentation | theatre, HUD, menu, dice | rolling from the sheet, DM surface |
| Server | — | **everything** |

The single largest hole is spellcasting. `SpellDefinition` and
`ContentIndex.spells` exist; nothing else does. `Character` holds no spell
state, `castSpell` is declared but unimplemented, and there are zero spells.
Roughly half of D&D's classes cannot be represented at all.

> **Status.** D1 (spellcasting), D2 (four archetypes), D3 (the test party) and
> the rolling half of D4 are done, along with the first cut of Phase E. What
> remains in D4 is HUD pinning and inventory organisation. See the vertical
> slice commit for what rendering it exposed.

## Phase D — The playable character

Goal: seven genuinely different characters, each complete, all rendered by the
same code.

**D1. Spellcasting.** The missing third of the vocabulary. Design constraint:
it must add as little new machinery as possible. Spell save DC and spell attack
bonus are *stats*, so an item that raises them needs no new code. Spell access
is a grant on `EffectSource`, so a racial innate spell, a domain spell and a
wizard's spellbook all arrive the same way. Preparation and concentration are
the only genuinely new character state.

**D2. Content breadth.** Seven archetypes chosen because each stresses a
different part of the model, not for variety's sake:

| Character | What it proves |
|---|---|
| Hill Dwarf Fighter | *(built)* baseline, heavy armour, suppression |
| High Elf Wizard | prepared casting from a spellbook, ritual, arcane recovery |
| Lightfoot Halfling Rogue | expertise (proficiency × 2), conditional damage, lucky rerolls |
| Human Cleric | preparing from a whole class list, channel divinity |
| Half-Orc Barbarian | unarmoured defence — two `base` ops competing — rage, cannot-cast gating |
| Tiefling Sorcerer | innate racial spells, metamagic spending a second resource on a cast |
| Dragonborn Paladin | smite converting a slot into damage, breath weapon, aura *(party effects: deferred)* |

**D3. The test party.** All seven loadable in `#solo` with a switcher, so a
character can be judged by looking at it rather than by reading a test name.

**D4. The player experience.** Roll from the sheet — clicking a skill, save or
ability rolls it on the shared table with the resolved modifier. HUD
customisation: which cards are pinned is a player preference, a new layer,
never character state. Organising inventory and actions.

Done when: seven characters, no class-specific code, every number explainable.

## Phase E — The DM's hand

"Playing god", and the hard requirement is that it not be a hardcoded list of
buttons. The DM inflicts by composing the same vocabulary the engine already
speaks: damage of a type, healing, a condition, an ad-hoc modifier with a
duration, a resource drain, an item granted or taken. Anything the DM can
imagine that the vocabulary can express should be reachable, and anything it
cannot express should be reachable as a narrative note rather than silently
impossible.

Done when: the DM can apply any effect in the vocabulary to any player without
the app knowing what that effect is.

## Phase F — Server authority

`applyCommand` moves behind Supabase; `PlayerView` is projected per player, so
a DM's hidden roll or an unidentified item is filtered server-side rather than
hidden in CSS. The client keeps running the same resolver for prediction. This
is the last structural unknown in the project.

Done when: two browsers see each other's changes, and the client cannot lie.

## Phase G — The theatre reacts

The reducer already emits domain-shaped events — `Bloodied`, `LastUseSpent`,
`ConditionApplied`. Nothing consumes them. The stage should: a bloodied hit
lands differently from a scratch. This is where the product stops being a
better character sheet and becomes the thing it is for.

Done when: watching the stage tells you what happened without reading a log.

## Phase H — Content and craft

Character creation and level-up. The full SRD spell list. DM-authored item art,
uploaded once and shared to the party. Visual design passes.

## Sequencing note

D → E → F is forced by dependency: there is no point projecting a view per
player before the view is worth projecting, and no point building the DM's
surface before there are characters worth affecting. G can start any time after
F. H runs continuously and never finishes.

The risk to watch is the one identified at the start: *does sitting in this app
feel better than Roll20?* Phase D answers it for the player, Phase G answers it
for the table. Phase F is infrastructure that answers nothing — it should be
done quickly and without ceremony.
