# Roadmap — from here to a finished product

Rewritten after the SRD spell list was completed (commit `dc8264c`, 318
spells, cantrip through 9th). The original phases below (D through H) are kept
for their reasoning, but the status table and the phase markers are corrected
to match what actually exists now, not what existed when this file was first
written. Updated again now that Phase I (magic items) is done.

## Where the project actually stands

The asymmetry that motivated this file — deep engine, shallow content — is
resolved for classes, spells and items alike. What remains is feature work:
level-up, the reaction window, and the theatre reacting to events.

| | Built | Missing |
|---|---|---|
| Rules engine | value ops, roll state, capabilities, proficiency, conditions, attacks, resources, resistances, spellcasting, attunement, paired body slots, charge resources with dawn refresh, explainability | a level-up command; the reaction-window design |
| Content | 7 species, 12 classes to level 20 (each with a subclass), 12 feats, 14 conditions, **318 spells — the complete SRD list**, **323 items — the complete SRD magic-item catalogue, save the one deliberately out-of-scope Apparatus of the Crab and the narrative-only Sentient Items rule** | — |
| Player contract | view model, commands, events, 4-tab IA, progressive disclosure, spell views | level-up flow, HUD preferences |
| Presentation | theatre, HUD, menu, dice, rolling from the sheet, DM surface | the stage reacting to domain events |
| Server | Supabase edge function is the command authority; `PlayerView` projected per player | — |

D (the playable character), E (the DM's hand), F (server authority) and I
(magic items) are done. Character creation exists. What's left is two feature
gaps that are genuinely unbuilt: level-up, and the theatre reacting to what
happens.

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

## Phase I — Magic items — **done**

The engine vocabulary needed no new machinery: `ItemDefinition.charges` (a
`ResourceDefinition`, including `{kind: 'dawn'}` and, once, `{kind: 'dusk'}`
refresh), `requiresAttunement` / `attunementPrerequisite`, `slot` /
`pairedWith` for boots-gloves-bracers pairing, and the same `EffectSource`
every other content kind uses covered the entire catalogue. 323 items now
exist, authored in batches shaped like the spell-list pass and matching the
SRD's own alphabetical catalogue sections (A · B · C · D–I · I–R · S–Z), each
with an integrity pass and its own test file. A handful of items are
genuinely out of scope by design and carry the same `partial` + narrative
treatment an unmodelable spell got — the *Apparatus of the Crab*'s ten-lever
control surface is a stateful machine no `{modifier, value}` vocabulary can
express, and several staffs' and wands' variable per-spell charge costs have
no precedent anywhere in `SpellGrant` and were left narrative rather than
force-fit. Sentient magic items (§12 of the doc) are not catalogue content at
all — the SRD's own text describes an NPC-agent mechanic explicitly flagged
as DM-facing and out of scope for a deterministic resolver; nothing was
authored for it and nothing should be.

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
passes. Backgrounds. This phase never finishes and can absorb spare effort
alongside any other phase.

## Sequencing note

J is next because it is the largest hole in what a *player* can do with a
character they already have. K should get a design pass (not just
implementation) before code, because getting the interrupt model wrong is
expensive to unwind once players depend on it. L can start any time after K,
since a reaction window changes what "resolved" means for an event the stage
would react to. M runs alongside all of it.

The risk to watch is the one this file was written to track: *does sitting in
this app feel better than Roll20?* Phase D answered it for the player, Phase L
answers it for the table. J is what stands between "the engine and its
content are finished" and "the product is finished" — necessary, not the point.
