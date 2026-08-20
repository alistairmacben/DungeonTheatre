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

> **CORRECTED.** Finding 1 below is wrong, and the code does not follow it.
> Reading the RLS showed that `characters_select_members` lets any campaign
> member `select('*')` — which the stage depends on, to draw NPC names and
> portraits. A sheet column on `characters` would therefore hand every player
> the DM's exact enemy hit points, and Postgres RLS is row-level so a column
> cannot be hidden. Sheets live in their own table, `character_sheets`, readable
> only by the owner or the DM. `characters.sheet` is left in place and unused
> rather than dropped, because the DM app is live against that table.

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

## The order — as built

1. **Codec + drift check.** Done. `src/persistence/sheet.ts`.
2. **`character_sheets` + `game_events` tables.** Done, additive migration.
   `player/src/game/sheetStore.ts`, `player/src/game/eventStream.ts`.
3. **Per-viewer projection.** Done, and it moved ahead of the edge function
   because it turned out to be pure view-layer work with no deployment
   dependency. `buildPlayerView` takes a `viewer`.
4. **Edge function + predict-and-reconcile.** Written and bundled;
   `supabase/functions/command/index.ts` and
   `player/src/game/useServerGame.ts`. **Not yet deployed** — see below.

### What the edge function does that RLS cannot

RLS stops a player reading somebody else's sheet, but it cannot tell a
legitimate `equipItem` from a `dmDamage`: both are writes to a row the caller is
allowed to write. Three things therefore have to happen server-side:

- **Authorisation.** `src/view/authority.ts` holds the policy, and both the edge
  function and the client's optimistic path import it. Written down twice, it
  would eventually disagree with itself.
- **The dice.** A client that supplies its own faces can supply twenties, so
  faces arriving in a roll command are discarded and regenerated. This is the
  difference between a dice roller and a game.
- **Ordering.** The revision check makes two simultaneous writers resolve to a
  refusal rather than to whichever request landed second.

### Deploying it

The project is not linked to the Supabase CLI, and linking needs a database
password. Two commands, run locally:

```
npx supabase link --project-ref sakzpiurgrbeewzhvvng
npm run build:edge && npx supabase functions deploy command
```

`build:edge` re-bundles `src/engine.ts` into
`supabase/functions/_shared/engine.mjs`. **Re-run it after any engine or content
change**, or the server will be adjudicating with a stale rulebook while the
client uses the new one — the exact divergence the shared-engine design exists
to prevent.

## What this phase must not do

Multiclassing. Character migration between campaigns. Any attempt to make the
sheet queryable as relational columns — it is a document, it is read whole, and
normalising it would put the rules vocabulary into the schema where every
content change becomes a migration.
