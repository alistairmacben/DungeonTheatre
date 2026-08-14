# Rules Engine — Architecture Proposal

**Status:** proposal, for review. No schemas, datasets, migrations or code yet.

---

## 0. Two things to settle before anything else

**The document is SRD 5.1, not 5.2.1.** The brief says 5.2.1; the file is
`SRD_CC_v5.1 min.pdf` and page 1 identifies itself as *System Reference Document
5.1* under CC-BY-4.0. 253 pages, ~1.4M characters. These are materially
different rule sets — 5.2.1 is the 2024 revision, where species replace races,
backgrounds grant ability score increases and feats, weapon mastery exists, and
several conditions changed. **Which one you intend to build decides the shape of
character creation.** Everything below is written against 5.1 as supplied, and
flags where 5.2.1 would differ.

Whichever you pick, CC-BY-4.0 requires attribution in the shipped product.

**Dice are currently client-authoritative.** In today's code the roller's own
machine calls `rollValues()`, computes the total, and broadcasts the finished
result; every other client just animates to it. That was the right call for
v1 — it is what makes the physics honest and the table agree. But the brief
asks for server-side validation, and those two facts collide. Section 9 covers
this properly; it needs a decision from you, not from me.

---

## 1. The one idea everything else hangs off

**Derived statistics are never stored. They are computed, every time, from base
facts plus an ordered list of modifiers.**

This is the decision that makes the product vision achievable. "Equip helmet →
AC updates" is not a feature you implement; it is what *automatically* happens
when AC is a function rather than a field. The alternative — storing `ac: 17`
and remembering to update it in every code path that could affect it — is how
VTTs end up with characters whose numbers are quietly wrong.

Concretely:

```
STORED (base facts)          COMPUTED (derived, on demand)
────────────────────         ────────────────────────────
ability scores               ability modifiers
class + level                proficiency bonus
equipped item ids            armour class
known/prepared spell ids     skill modifiers
active condition ids         saving throw modifiers
current HP, slots, uses      attack + damage for each weapon
                             spell save DC, spell attack bonus
                             carrying capacity, speed
                             available actions
```

Everything in the right column is a pure function of the left column plus the
rules data. That purity is what makes the engine deterministic, testable
without a UI, and safe to run identically on client and server.

---

## 2. The four layers

Restating the brief's separation with the boundaries made enforceable:

| Layer | Contains | Must never contain |
|---|---|---|
| **Rules** | What D&D means. Formulas, progression tables, condition semantics, the d20 test, action economy. | Any particular character. Any campaign's content. |
| **Character state** | What is true of one character right now. Base facts only. | Derived numbers. Rules logic. |
| **Campaign content** | What the DM invented. Items, NPCs, loot, custom abilities. | Its own calculation code. |
| **Presentation** | HUD, artwork, 3D dice, theatrical reactions. | Any rule. Any derived-stat maths. |

The enforceable part matters more than the diagram. Two rules make it real:

1. **Campaign content may only express itself in the effect vocabulary**
   (section 4). A DM cannot write "on hit, do something weird"; they compose
   effects the engine already understands. This is the difference between a
   coherent system and a scripting engine you will be debugging forever.
2. **The presentation layer receives derived values and events, and sends
   intents.** It never computes a modifier. If the HUD needs to show
   "Athletics +7", it asks the engine for the number and the engine also hands
   back *why* (section 5).

---

## 3. Content identity and provenance

One namespace, with provenance attached:

```
srd:longsword
srd:spell/fireball
srd:class/fighter
campaign:<campaignId>:item/sword-of-the-fallen-king
homebrew:<userId>:feat/...
```

Everything the engine consumes — SRD or DM-created — is the same kind of
object, differing only in `source`. This is what makes the brief's requirement
work: a DM's +2 AC ring and the SRD's Ring of Protection travel identical code
paths, because they are the same shape.

Provenance earns its place beyond bookkeeping: it drives licence attribution,
lets a DM fork an SRD item to tweak it, and lets you later ship a "campaign
export" without dragging the whole SRD along.

---

## 4. The common vocabulary

This section is the actual heart of the proposal. If these primitives are
right, everything else composes. If they are wrong, no amount of good code
downstream rescues it.

### 4.1 Effect

An **effect** is a named, sourced, conditional bundle of modifiers. Every
species trait, class feature, feat, item property, spell, and condition
produces effects. Nothing else does.

An effect carries:

- **source** — what granted it (for display, and for removal when unequipped)
- **duration** — permanent, while-equipped, while-attuned, for N rounds, until
  rest, while-concentrating
- **condition** — an optional predicate deciding whether it currently applies
  (e.g. *only while wearing no armour*, *only against undead*)
- **modifiers** — the list below

### 4.2 Modifier

A modifier targets a **stat path** and changes it. The operations, in
resolution order:

| Op | Meaning | Example |
|---|---|---|
| `base` | Provides a base value; highest wins if several compete | Unarmored Defense vs armour |
| `add` | Adds; all stack unless flagged | `+1` weapon, Rage damage |
| `set` | Overrides to a fixed value | *set walking speed 0* |
| `min` / `max` | Clamps | Medium armour's *max 2 Dex* |
| `multiply` | Scales | Expertise (`×2` proficiency), heavy armour speed |
| `advantage` / `disadvantage` | Adds a roll-state flag, never a number | Restrained, Guidance |
| `reroll` / `explode` | Modifies dice behaviour | Halfling Lucky, Great Weapon Fighting |
| `grant` | Adds a capability rather than a number | Ring granting a spell; proficiency |

The `base` operation deserves emphasis. AC is not "10 + Dex plus bonuses" — the
SRD's armour table shows at least four distinct base formulas (`11 + Dex`,
`12 + Dex (max 2)`, flat `14`, and shield `+2` on top), and class features like
Unarmored Defense introduce more. Modelling AC as *competing base providers,
then additive layers, then clamps* handles all of them without special cases.
Modelling it as a single formula with exceptions does not.

`advantage`/`disadvantage` being a flag rather than a number is equally
load-bearing: D&D never stacks them, and any number of each collapses to a
single advantage, a single disadvantage, or — if both are present — neither.
Represent it as arithmetic and you will get that wrong.

### 4.3 Stat path

A stable dotted identifier naming anything a modifier can target:

```
ability.str.score          skill.athletics.bonus
ability.str.modifier       save.dex.bonus
proficiency.bonus          ac.base / ac.bonus / ac.dexCap
hp.max                     attack.melee.bonus
speed.walk                 damage.weapon.bonus
spell.saveDC               resistance.fire
```

The path list is engine-owned and closed. A DM item may target any path but
cannot invent one — which is exactly the constraint that keeps DM content from
becoming arbitrary code.

### 4.4 Roll request and roll result

The boundary to the existing dice system:

- **RollRequest** — what to roll and why: dice expression, assembled modifiers
  with their sources, roll state (advantage/disadvantage/normal), and a
  **context** (`attack` / `save` / `check` / `damage` / `initiative` /
  `death-save` / `hit-dice`), plus what it targets.
- **RollResult** — the dice that came up and the total.

The engine builds requests and consumes results. It never renders. This is
already almost true in the current code — `RollRequest` exists, and the dice
layer is purely presentational — but today's request has **no context field**.
Adding one is the single smallest change that lets the rules engine reuse the
existing dice pipeline unchanged (section 8).

### 4.5 Action

An action is data, never code:

- **cost** — action / bonus action / reaction / free / movement, plus resource
  costs (spell slot, ki, rage use, charges)
- **prerequisites** — predicates over character state (proficiency, equipped
  item, spell prepared, slot available, not incapacitated)
- **targeting** — self / creature / point / area, with range and shape
- **effects** — what it does, in the vocabulary above
- **rolls** — the roll requests it generates, in order

The HUD's "contextual actions" is then a query, not bespoke logic: *give me
every action whose prerequisites are currently satisfied.* Greyed-out actions
come with the failed predicate attached, so the UI can say **why** — "no spell
slots", "requires a shield" — which is precisely the video-game feel the brief
asks for.

---

## 5. Derived stat resolution

The engine's core loop, run whenever a derived value is requested:

```
1. Collect active effects
     species + class features + feats + equipped items + attuned items
     + active conditions + temporary effects + concentration
2. Filter by each effect's condition predicate against current state
3. Gather modifiers targeting the requested stat path
4. Fold in operation order:  base → multiply → add → min/max → set
5. Return { value, breakdown[] }
```

**Always return the breakdown.** Not for debugging — for the product. A HUD
that shows `AC 17` and, on hover, `14 chain shirt · +2 Dex (capped) · +1 ring
of protection` is the difference between a game interface and a spreadsheet
with nicer fonts. It is also the cheapest possible correctness check: wrong
numbers become visibly wrong instead of quietly wrong.

Recomputation is cheap enough to do eagerly (a character has tens of effects,
not thousands). Memoise per state-version if profiling ever says otherwise;
do not design for it up front.

---

## 6. The dependency chains, traced

The brief asks specifically for these. Each is traced to everything required.

### 6.1 Skill check

```
skill (18 fixed, each mapped to one ability)
  └─ ability score        base + species + ASI + items + effects
       └─ ability modifier  floor((score − 10) / 2)
  └─ proficiency tier      none / proficient / expertise
       ├─ granted by class, species, background, feat, or item
       └─ × proficiency bonus  = 2 + floor((totalLevel − 1) / 4)
  └─ flat bonuses          items, features, spells (Guidance, Bless)
  └─ roll state            conditions, features, circumstance
```

**Confirmed from the SRD:** proficiency bonus derives from *total character
level*, never class level — a fighter 3 / rogue 2 has +3. Multiclassing must
not be able to break this.

**Required data:** the 18 skills and their abilities; proficiency sources per
class/species/background/feat; the advancement table.

### 6.2 Attack and damage

```
weapon
  ├─ category (simple / martial) → proficient?  from class/species grants
  ├─ properties  finesse, versatile, two-handed, light, heavy, reach,
  │              thrown, ammunition, loading
  └─ ability selection
        melee    → STR
        ranged   → DEX
        finesse  → player's choice of STR or DEX
        spell    → the class's spellcasting ability

attack bonus = abilityMod + (proficient ? PB : 0) + magic bonus + effects
damage       = weapon dice + abilityMod + magic bonus + bonus damage
                (off-hand adds no ability modifier unless a feature says so)
               → damage type → target resistance / vulnerability / immunity
critical     → damage dice doubled, modifiers not
```

**Required data:** weapon table with properties; proficiency grants; damage
types; the resistance model.

### 6.3 Equipment → derived stats

```
equip item into slot
  └─ item's effects become active (while-equipped; while-attuned if required)
       └─ modifiers enter the pipeline
            └─ every derived stat recomputes on next read
```

AC is the interesting case and the reason for `base` competition:

```
base providers (highest wins)
  unarmoured default        10 + Dex
  worn armour               11 + Dex  |  12 + Dex (max 2)  |  flat 14/16/17/18
  Unarmored Defense         10 + Dex + Con  (barbarian)
                            10 + Dex + Wis  (monk)
then additive               shield +2, ring +1, fighting style
then clamps                 armour's Dex cap
```

**Confirmed from the SRD armour table:** heavy armour ignores Dex entirely,
carries a Strength requirement, and imposes Stealth disadvantage — three
different modifier kinds from one item, which is exactly why items must be able
to carry a *list* of effects rather than a single bonus.

Attunement is a separate gate from equipping, capped at three items.

### 6.4 Spellcasting

```
spell save DC     = 8 + PB + spellcasting ability modifier
spell attack      = PB + spellcasting ability modifier
slots             per-class table; multiclass uses a combined caster level
prepared vs known differs by class — a real branch, not a detail
```

Multiclass spellcasting is the single most intricate rule in character
progression. It should be isolated behind one function with heavy tests, not
spread across the codebase.

---

## 7. Partitioning the SRD

### Bucket 1 — Core rules, implemented as engine logic (not data)

The d20 test; advantage/disadvantage collapsing; ability modifier formula;
proficiency bonus progression; AC resolution; damage application with
resistance/vulnerability/immunity; death saving throws; the action economy;
rest mechanics; condition semantics; concentration.

These are *behaviour*, not content. Encoding them as data buys nothing and
costs clarity.

### Bucket 2 — Character creation and progression data

Species and their traits; the 12 classes with level-by-level feature tables;
subclasses; backgrounds; feats; the skill list; the advancement table;
multiclassing prerequisites and the multiclass proficiency table.

### Bucket 3 — Spell data

~320 SRD spells: level, school, casting time, range, components, duration,
concentration, targeting, effects, scaling.

### Bucket 4 — Equipment and item rules

Weapon table and properties; armour table with base formulas, Str requirements
and stealth penalties; the attunement rules; magic item bonuses; ammunition;
carrying capacity.

### Bucket 5 — Combat and actions

Action economy; attack rules; opportunity attacks; cover; grappling and shoving;
two-weapon fighting; hiding; initiative.

### Bucket 6 — Deferred (design for, don't build yet)

Monster statblocks as a bestiary; downtime; traps; vehicles and mounts;
crafting; environmental hazards. The *shapes* should be anticipated — an NPC is
a character-like entity — but the content can wait.

### Bucket 7 — Explicitly out of MVP

The full monster manual as data; CR and encounter building; treasure tables;
planes, deities and lore text; madness; the variant/optional rules.

**On content volume:** build the systems against a deliberately small slice —
two or three classes and a couple of dozen spells — and only bulk-load the rest
once the engine is proven. The brief already says this; it is worth restating
because the temptation to start typing in all 320 spells will be strong, and
doing it before the effect vocabulary has settled means typing them twice.

---

## 8. Integration with what already exists

The good news is that v1's architecture does not fight this.

**What slots in cleanly:**

- **`characters.sheet` is already JSONB.** It was designed for exactly this and
  is currently unused. Character state lands there with no migration against a
  live campaign.
- **The dice pipeline is already a request/result boundary.** `RollRequest` →
  presentation → `DiceRoll`. The rules engine becomes the thing that *builds*
  requests and *consumes* results, replacing the DiceTray's hand-entered
  notation without touching the 3D layer at all.
- **State already flows one way.** The hub owns state, renderers are pure views
  receiving snapshots and returning commands. A rules engine is a new state
  owner alongside it, not a new pattern.
- **`stage-ui` is host-agnostic.** Both apps already render the same stage from
  the same component. The HUD can follow that precedent exactly.

**What needs to change, minimally:**

1. **`DiceRoll` needs a context field.** Today it carries notation, dice,
   modifier, total — but no notion of *why* it was rolled. Without that, the
   engine cannot correlate a returned result with the attack that asked for it,
   and the theatrical layer cannot react differently to a save than to a
   damage roll. This is additive and does not break v1.
2. **Character identity needs reconciling.** v1's `Character` is a *theatrical*
   entity — name, portrait, colour, scale. The rules engine's character is a
   *mechanical* entity. These are the same character. My recommendation is to
   keep them as one row with two facets (`presentation` and `sheet`) rather than
   splitting into two tables that must be kept in sync.
3. **The rules engine must be pure and shared.** It should live next to
   `shared/` and `stage-ui/`, importable by the Electron main process, the
   player web app, and — critically — a server context, with no DOM and no
   Electron dependency. This is what keeps server-side validation possible
   later without a rewrite.

**What must not change:** the Discord RPC path, the speaking pipeline, the
stage renderer, the dice physics. None of them need to know a rules engine
exists.

---

## 9. Authority, and the honest problem

The brief says state changes must ultimately be validated server-side. Today,
dice are rolled on the roller's own machine and broadcast as a finished result.
A modified client could roll a 20 every time.

Three options, and they are not equal:

| Model | Trust | Cost |
|---|---|---|
| **Client-authoritative** (today) | Any client can lie | None — already built |
| **Server-validated state** | Clients can lie about dice, not about consequences | Moderate — engine runs in an edge function; RLS already blocks the crude attacks |
| **Server-authoritative dice** | Nobody can lie | Higher — dice values come from the server, presentation animates to them |

The physics work already done makes the third option *cheaper than it sounds*:
the dice renderer already accepts predetermined values and animates to them.
Moving the source of those values from the local client to the server is a
smaller change than it appears, precisely because the presentation layer was
built not to care where the numbers came from.

My recommendation: **build the engine pure and side-effect-free from day one**
so it can run in either place, adopt server-validated state for anything
durable (inventory, HP, slots, trades), and defer server-authoritative dice
until you actually want it. For a table of friends, cheating is a social
problem rather than a technical one — but the architecture should not *foreclose*
the fix, and a pure engine keeps that door open at no extra cost today.

Trades specifically need server authority regardless of the dice decision: a
two-party item transfer with confirmation is the one place where a lying client
can steal from another *player* rather than merely from the fiction.

---

## 10. Extensibility beyond D&D

The brief asks not to over-engineer this into a generic RPG framework, which is
right. The cheap insurance is:

- Keep the six ability names, the 18 skills, and the d20 test in a **ruleset
  module**, not scattered through the engine or the UI.
- Have the HUD render from **engine-described data** — "here are the resources,
  each with a name, current, max, and recharge" — rather than hardcoding "spell
  slots" and "ki points".
- Keep `DieSides` and dice expressions general; they already are.

That is roughly a day of discipline and it avoids the specific trap of a UI
that cannot render a system without a Charisma score. Anything more
(pluggable dice systems, non-d20 resolution) is speculative and should wait for
a second real ruleset to exist.

---

## 11. Decisions I need from you

1. **SRD 5.1 or 5.2.1?** This changes character creation materially. The file
   supplied is 5.1.
2. **How much of the 12 classes and ~320 spells is actually MVP?** My
   recommendation: two classes, ~20 spells, all systems.
3. **Is combat in scope for v2, or is this character/inventory/actions first?**
   Turn order, positioning and enemy statblocks are a large, separable body of
   work; the brief's MVP list stops short of them.
4. **Does the DM need NPC statblocks with mechanics**, or do NPCs remain
   theatrical (as in v1) for now?
5. **How much authority moves server-side, and when?** Section 9.

---

## 12. Proposed build order

Each step is independently verifiable, and nothing later invalidates anything
earlier.

1. **Effect / modifier / stat-path vocabulary** — the primitives, with a
   resolution engine and a test suite. No content, no UI.
2. **Character state model and derived stats** — ability scores through skills,
   saves, AC. Proven with hand-built fixtures.
3. **Progression** — class, level, features, proficiency. Two classes only.
4. **Equipment and inventory** — slots, equip/unequip, attunement, effects
   feeding derived stats. This is where "equip helmet → AC updates" becomes
   real and is the first genuinely demoable moment.
5. **Actions and the dice bridge** — declarative actions, prerequisite
   evaluation, roll requests wired into the existing 3D dice.
6. **Spellcasting** — slots, prepared/known, DC and attack, concentration.
7. **The HUD** — only now, once there is something correct to render.
8. **DM content creation** — items composed from the same effect vocabulary.
9. **Trading and server validation.**

Steps 1–4 are the ones worth being slow and pedantic about. If the vocabulary
is right, 5 onward are mostly assembly. If it is wrong, everything after step 4
becomes progressively harder to change, which is the failure mode this document
exists to prevent.

---

> **SUPERSEDED.** This document was written *before* the SRD read and is wrong
> in several places. See `architecture.md` for the final architecture, and
> `architecture.md` §16 for a table of the specific corrections.
