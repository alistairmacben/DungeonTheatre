# Roadmap — from here to a finished product

Rewritten after the SRD spell list was completed (commit `dc8264c`, 318
spells, cantrip through 9th). The original phases below (D through H) are kept
for their reasoning, but the status table and the phase markers are corrected
to match what actually exists now, not what existed when this file was first
written.

## Where the project actually stands

The asymmetry that motivated this file — deep engine, shallow content — has
inverted for classes and spells and is now the situation for magic items.

| | Built | Missing |
|---|---|---|
| Rules engine | value ops, roll state, capabilities, proficiency, conditions, attacks, resources, resistances, spellcasting, attunement, paired body slots, charge resources with dawn refresh, explainability | a level-up command; the reaction-window design |
| Content | 7 species, 12 classes to level 20 (each with a subclass), 12 feats, 14 conditions, **318 spells — the complete SRD list**, 34 items | **~313 more magic items (SRD has ~347)** |
| Player contract | view model, commands, events, 4-tab IA, progressive disclosure, spell views | level-up flow, HUD preferences |
| Presentation | theatre, HUD, menu, dice, rolling from the sheet, DM surface | the stage reacting to domain events |
| Server | Supabase edge function is the command authority; `PlayerView` projected per player | — |

D (the playable character), E (the DM's hand) and F (server authority) are
done. Character creation exists. What's left is one real content gap (magic
items) and two feature gaps that are genuinely unbuilt: level-up, and the
theatre reacting to what happens.

## Phase D — The playable character — **done**

Seven-plus archetypes, all rendered by the same code, all twelve SRD classes
built to level 20 with a subclass, spellcasting fully wired (`SpellDamage`,
`SpellEffect`, preparation, concentration), rolling from the sheet, HUD
pinning. Nothing here is class-specific code — a class is content, not a
branch.

## Phase E — The DM's hand — **done**

The DM panel composes the same vocabulary the engine speaks: damage of a
type, healing, a condition, an ad-hoc modifier with a duration, a resource
drain. `DmPanel.tsx` is the surface; nothing about it is a hardcoded list of
character-specific buttons.

## Phase F — Server authority — **done**

`applyCommand` runs behind a Supabase edge function
(`supabase/functions/command`); the client keeps a copy of the same resolver
for prediction, but the server is authoritative. `PlayerView` is projected per
player.

## Phase I — Magic items — **next**

The engine vocabulary for this already exists and needs no new machinery:
`ItemDefinition.charges` (a `ResourceDefinition`, including `{kind: 'dawn'}`
refresh), `requiresAttunement` / `attunementPrerequisite`, `slot` /
`pairedWith` for boots-gloves-bracers pairing, and the same `EffectSource`
every other content kind uses. Only 34 items exist against an SRD catalogue of
roughly 347 (`docs/srd/10-magic-items.md`, 48 pages) — this is a content-
authoring pass shaped exactly like the spell-list one, batched by the SRD's
own alphabetical catalogue sections (A · B · C · D–I · I–R · S–Z) rather than
by level. A handful of items are genuinely out of scope by design — the
*Apparatus of the Crab*'s ten-lever control surface is a stateful machine no
`{modifier, value}` vocabulary can express — and get the same `partial` +
narrative treatment an unmodelable spell got.

Done when: every SRD magic item exists as content, checked by an integrity
pass and a test file per catalogue section, the same bar the spell list met.

## Phase J — Level-up

The engine already knows a character owes a choice — `pendingChoices` on
`ProgressionView` lists them, "pick 2 cantrips," "choose a subclass" — and
character creation can answer them once. There is no command a *returning*
player can issue to answer them again at level 5, 11, 17. A character can be
built; it cannot grow. This is the largest missing player-facing feature, not
a content gap.

Done when: a character can level up from the sheet, mid-campaign, and every
choice the engine already tracks is answerable through it.

## Phase K — The reaction window

Genuinely unresolved, and a design problem before it is an engineering one.
Shield, Bardic Inspiration, Cutting Words and their kin let a player revise a
roll after seeing it — sometimes someone else's roll. In a shared multiplayer
session this means deciding who may interrupt, for how long the table waits,
and what "too late" looks like. Nothing in the current architecture answers
this; it needs a design pass before any code.

Done when: a resolved roll can be reopened by an eligible reaction within a
bounded window, visibly to the table, without the server trusting the client's
timing.

## Phase L — The theatre reacts

The reducer has emitted domain-shaped events — `Bloodied`, `LastUseSpent`,
`ConditionApplied`, `ConcentrationBroken` — since the first playable slice.
`player/src/game/eventStream.ts` exists to carry them and nothing imports it
yet. The stage should look different when a hit lands as a bloodied blow
versus a scratch. This is where the product stops being a better character
sheet and becomes the thing it is for.

Done when: watching the stage tells you what happened without reading a log.

## Phase M — Content and craft, continuously

DM-authored item art, uploaded once and shared to the party. Visual design
passes. Backgrounds. This phase never finishes and can absorb spare effort at
any point after Phase I.

## Sequencing note

I is unblocked and safe to run right now — pure content, same shape as the
spell list, no design risk. J is next because it is the largest hole in what
a *player* can do with a character they already have. K should get a design
pass (not just implementation) before code, because getting the interrupt
model wrong is expensive to unwind once players depend on it. L can start any
time after K, since a reaction window changes what "resolved" means for an
event the stage would react to. M runs alongside all of it.

The risk to watch is the one this file was written to track: *does sitting in
this app feel better than Roll20?* Phase D answered it for the player, Phase L
answers it for the table. I and J are what stand between "the engine is
finished" and "the product is finished" — they are necessary, not the point.
