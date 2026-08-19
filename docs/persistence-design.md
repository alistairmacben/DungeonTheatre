# Phase F — persistence and server authority

Written after inspecting the live Supabase schema (project `DungeonStage`,
`sakzpiurgrbeewzhvvng`) rather than inferring it. Two findings change the size
of this phase, both downward.

## What already exists

| Table | Rows | What it holds |
|---|---|---|
| `profiles` | 1 | id → `auth.users`, discord id, display name, dice theme |
| `campaigns` | 2 | owner, invite code, stage settings, active scene |
| `campaign_members` | 2 | **`role` is already `dm` \| `player`** |
| `characters` | 10 | name, portrait, `kind` = **`pc` \| `npc`**, and **`sheet jsonb`** |
| `scenes` | 4 | background, npc ids, weather effect |
| `casting` | 2 | discord user → character |
| `dice_rolls` | 45 | notation, dice, total, **`visibility` = public \| secret \| hidden \| whisper** |

RLS is enabled on every table.

## Finding 1 — `characters.sheet` is already a jsonb column, and it is empty

v1 shipped a `sheet jsonb DEFAULT '{}'` column on `characters` and never wrote
to it. That is exactly where the rules-engine `Character` goes. No migration is
needed to store a character sheet — only code that writes and reads it.

This matters because it means persistence is not a schema problem. The whole
`Character` type is already JSON-shaped by construction: the player contract was
written under the rule *"if a field cannot be JSON, it does not belong here"*,
and `Character` holds only inputs — no functions, no Maps, no derived values.
It round-trips through `structuredClone` in the reducer today.

## Finding 2 — NPCs already exist as first-class rows

`characters.kind` is already `'pc' | 'npc'`, with `owner_id` nullable. Phase I
(the DM's enemy roster) does not need a new entity type: an NPC is a character
row with `kind = 'npc'`, and the DM's damage/heal/condition commands already
work on anything with hit points, because they were written against the generic
vocabulary rather than against "a player".

The consequence is that Phase I collapses into a UI over rows that already have
a home, plus the decision of how much of a sheet an NPC needs. For
theatre-of-the-mind the answer is: hit points, AC, conditions, and a name. Not a
class, not a species, not an inventory.

## What is genuinely missing

1. **Reading and writing `sheet`.** A `Character` codec, and the question of
   what happens when the content set moves under a stored sheet. Every
   definition already carries `contentVersion`, and `ItemInstance` pins the
   version it was created against, so a drifted sheet is *detectable*. What to
   do about it is undecided — surface it, do not silently migrate.

2. **Command authority.** `applyCommand` runs on the client. The server needs to
   run the identical function, which is the property the engine was built for —
   it is pure, portable, and imports nothing. A Supabase edge function importing
   `src/engine.ts` is the whole implementation. The client keeps running it for
   prediction.

3. **Per-viewer projection.** `buildPlayerView` currently builds one view. It
   needs to build a view *for a viewer*: a DM's secret roll, an unidentified
   item's true identity, another player's inventory. `ItemInstance` already has
   `apparentDefinitionId` for exactly this, and `dice_rolls.visibility` already
   distinguishes secret from public. Neither is used yet. The rule: filtering
   happens server-side, never in CSS.

4. **A domain event stream.** The reducer emits `Bloodied`, `Downed`,
   `SpellCast`, `ConcentrationBroken`, `LastUseSpent` — and nothing consumes
   them. Phase J (the theatre reacting) needs them broadcast. `dice_rolls` shows
   the pattern: a table plus a realtime channel. This is the one genuine new
   table.

5. **Turning off the client's write path.** Today `useGameState` mutates local
   state directly. It must become: predict locally, send the command, reconcile
   on the authoritative response. The `revision` field on `PlayerViewMeta`
   exists for this and is currently only ever incremented locally.

## The order

1. Codec + read/write `sheet`, with a drift check. *No authority yet — the
   client still writes.* This alone makes characters survive a refresh, which is
   the difference between a demo and a product.
2. Event table + broadcast.
3. Edge function running `applyCommand`; client switches to predict-and-reconcile.
4. Per-viewer projection, which is the only part that needs care.

Steps 1 and 2 are worth shipping before 3 and 4, because they are useful on
their own and they surface the codec problems while the client is still the
authority and mistakes are cheap.

## What this phase must not do

Multiclassing. Character migration between campaigns. Any attempt to make the
sheet queryable as relational columns — it is a document, it is read whole, and
normalising it would put the rules vocabulary into the schema where every
content change becomes a migration.
