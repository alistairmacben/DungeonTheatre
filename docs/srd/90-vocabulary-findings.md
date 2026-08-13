# SRD 5.1 — sequential read notes

Working notes taken while reading the SRD front to back. Purpose: catch every
mechanic that the effect vocabulary must be able to express, *before* any
schema is designed. Findings that contradict or extend
`rules-engine-architecture.md` are flagged **[EXTENDS]** or **[CONTRADICTS]**.

Document: SRD 5.1, CC-BY-4.0, 253 pages, ~903k chars after normalisation.
**Contains no bestiary** — no statblocks, no challenge ratings. Filename "min"
means monsters are stripped.

---

## Races (p3–7) — COMPLETE

9 races: Dwarf, Elf, Halfling, Human, Dragonborn, Gnome, Half-Elf, Half-Orc,
Tiefling. Only **one subrace each** where subraces exist: Hill Dwarf, High Elf,
Lightfoot Halfling, Rock Gnome. (The full PHB has more; the SRD is deliberately
reduced.)

### Common trait slots
Ability Score Increase, Age, Alignment, Size, Speed, Languages, Subrace.
Only ASI, Size and Speed are mechanical. Age/Alignment are pure flavour —
**do not model as rules**.

### Mechanics that extend the vocabulary

**[EXTENDS] Roll-state modifiers need tag scoping, not just a stat path.**
- *Dwarven Resilience*: advantage on saves **against poison**
- *Brave* (halfling): advantage on saves **against being frightened**
- *Fey Ancestry*: advantage on saves **against being charmed**
- *Gnome Cunning*: advantage on INT/WIS/CHA saves **against magic**

"Against poison" is not a stat path — it is a predicate over the *incoming
effect's* tags. So a roll request must carry tags describing its source
(damage type, condition inflicted, magical/non-magical), and roll-state
modifiers must be able to filter on them. This is a real addition to §4.2.

**[EXTENDS] Modifiers must be able to cancel other modifiers.**
- *Dwarf Speed*: "your speed is **not reduced** by wearing heavy armor"

This is not a bonus; it suppresses a specific penalty from another source.
Needs an explicit `suppress` operation targeting a modifier tag, or armour
penalties must be expressed as suppressible tagged modifiers.

**[EXTENDS] Some conditions are narrative and cannot be auto-evaluated.**
- *Stonecunning*: double proficiency on History checks **"related to the
  origin of stonework"**
- *Artificer's Lore*: double proficiency on History checks **about magic items,
  alchemical objects, or technological devices**

The engine cannot decide whether a given History check is about stonework.
These must surface as a **player-toggleable option on the roll**, presented in
the HUD when rolling that skill. Trying to automate them is wrong; hiding them
is also wrong. This pattern will recur throughout the SRD.

**[EXTENDS] Dice-behaviour modifiers are needed.**
- *Halfling Lucky*: reroll a natural 1 on any d20 test, must use the new roll
- *Savage Attacks* (half-orc): on a crit with a melee weapon, roll one extra
  weapon damage die

Confirms `reroll` and crit-damage modifiers belong in the vocabulary.

**[EXTENDS] Effects need level-scaled values.**
- *Dwarven Toughness*: HP max +1, **and +1 every level**
- *Breath Weapon*: 2d6, → 3d6 at L6, → 4d6 at L11, → 5d6 at L16
- *Infernal Legacy*: cantrip at L1, *hellish rebuke* at L3, *darkness* at L5

Values must be expressible as functions of level, not constants.

**[EXTENDS] Triggered/reactive effects need event hooks.**
- *Relentless Endurance*: when reduced to 0 HP but not killed, drop to 1 HP
  instead; once per long rest

This fires on a game event, not on a stat read. The engine needs an event bus
with interceptable outcomes, not just a modifier pipeline.

**[EXTENDS] Creation-time player choices parameterise effects.**
- *Half-Elf*: +2 CHA and **+1 to two abilities of your choice**
- *Draconic Ancestry*: choose a dragon → determines breath weapon damage type,
  area, save type, **and** damage resistance
- *High Elf Cantrip*: choose one wizard cantrip; INT is its ability
- *Tool/skill/language choices* across several races

Choices are structured data (`choose N from set`), resolved at creation or
level-up, and stored on the character as the *resolution*, with the effect
referencing it. This is a first-class concept, not an afterthought.

**[EXTENDS] `grant` covers more kinds than anticipated.**
Observed grants: weapon proficiency (Dwarven Combat Training, Elf Weapon
Training), skill proficiency (Keen Senses, Menacing, Skill Versatility), tool
proficiency, language, sense (Darkvision 60), spell (High Elf, Tiefling), and
an **action** (Breath Weapon).

**[EXTENDS] Granted spells carry their own ability and their own resource.**
- *Infernal Legacy*: CHA is the ability for these spells even though a tiefling
  may be any class; each granted spell recharges on a long rest,
  independent of spell slots.

Directly confirms the brief's "ring grants a spell" requirement, and shows the
granted spell needs its own casting ability + recharge, not the character's.

**[EXTENDS] Save DC formula is shared, not spellcasting-specific.**
- *Breath Weapon* DC = 8 + CON modifier + proficiency bonus

Same shape as spell save DC but a different ability. So "save DC" is a general
derived value parameterised by ability, not a spellcasting-only concept.

**[EXTENDS] Size affects equipment legality.**
Small creatures (Halfling, Gnome) "have trouble wielding heavy weapons".
Size is therefore an input to equipment prerequisites.

### Resistances observed
Poison (Dwarf), Fire (Tiefling), and one of acid/lightning/fire/poison/cold
(Dragonborn, by ancestry choice). Confirms `resistance.<damageType>` as a
stat path.

---

## Classes — Barbarian (p8–10), Bard (p11–14)

### The single most important finding so far

**[CONTRADICTS] A roll is not atomic. It needs a reaction window.**

- *Bardic Inspiration*: the recipient "can wait until after it rolls the d20
  before deciding to use the die, but must decide before the GM says whether
  the roll succeeds or fails."
- *Cutting Words*: a bard uses their **reaction** to subtract a die from
  **another creature's** attack roll, ability check or damage roll — and may
  choose to do so *after* the creature rolls, before success is determined.
- *Peerless Skill*: same pattern on the bard's own check.

My architecture draft modelled a roll as `request → result`. That is wrong.
The real lifecycle is:

```
build request → roll dice → OPEN REACTION WINDOW → apply late modifiers → resolve
```

This matters enormously for a **multiplayer** app: the window is where another
player, at their own screen, chooses to spend a resource to change someone
else's roll. It is a networked, interactive pause — not a calculation step.
It also has to interact with the existing 3D dice presentation: the dice have
physically landed but the outcome is not yet final.

This needs to be designed in from the start. Retrofitting it later would touch
every roll path in the system.

### Resources are class-specific, table-driven, and varied

| Resource | Max | Recharge |
|---|---|---|
| Rages | class table column (→ "Unlimited" at L20) | long rest |
| Rage damage | class table column | n/a (a modifier, not a pool) |
| Bardic Inspiration | **CHA modifier, min 1** | long rest → short rest at L5 |
| Spell slots | table, per spell level 1–9 | long rest |

So a resource's maximum can come from a table lookup *or* an ability modifier
*or* be unlimited, and its recharge tier can itself change with level. Model
resources generically with a computed max, not as named fields.

**[EXTENDS] Class tables carry class-specific columns.** The Barbarian table
has Rages and Rage Damage; the Bard table has Cantrips Known, Spells Known and
nine slot columns. The level table is a per-class data structure, not a fixed
shape.

### Proficiency has four tiers, not three

**[EXTENDS]** *Jack of All Trades*: add **half** proficiency bonus (rounded
down) to any ability check **that doesn't already include** proficiency.

So the tiers are none / half / proficient / expertise — and "half" is
conditional on not already being proficient. Expertise (bard, L3 and L10) is
the doubling case.

### Effects that do more than add numbers

- **Replace a result with a floor** — *Indomitable Might*: if a STR check total
  is less than your STR score, use the score instead.
- **Raise the ability score cap** — *Primal Champion*: STR and CON maximum
  becomes 24 (normally 20). The cap is itself a derived stat.
- **Suspend existing conditions** — *Mindless Rage*: charm/fright are suspended
  for the rage's duration, then resume.
- **Forbid actions** — *Rage*: you cannot cast or concentrate on spells while
  raging.
- **Stateful, escalating DCs** — *Relentless Rage*: DC 10, **+5 per use**,
  resets on a rest. The character must store per-feature counters.
- **Accept a drawback for a benefit** — *Reckless Attack*: advantage on your
  STR melee attacks this turn, but **attacks against you have advantage** until
  your next turn. An opt-in effect that modifies *incoming* rolls.
- **Grant a resource to another creature** — *Bardic Inspiration* hands a die
  to a different character, who holds it for 10 minutes.

### Conditional activation is layered

*Rage* applies only if not wearing heavy armour. *Danger Sense* requires the
character not be blinded, deafened or incapacitated, and only applies to
effects they can **see**. *Unarmored Defense* requires no armour but explicitly
**permits a shield**. Effect predicates must be able to read equipment state,
condition state, and perception.

### Spell preparation models differ per class

Bard is **spells known** with a swap-one-on-level-up rule, plus *Magical
Secrets* which lets it learn from **any class list**. Other classes use
prepared or spellbook models (to be read). Spell list access is therefore
itself modifiable, not a fixed property of the class.

Also present: **ritual casting** (spells tagged ritual) and **spellcasting
focus** (a class-specific item category).

### Starting equipment is a structured choice
"(a) a greataxe or (b) any martial melee weapon" — choices that reference a
**category**, not just specific items. Same `choose N from set` primitive as
racial choices, where the set can be a query.

---

## Classes — Cleric (p15–18), Druid (p19–23)

### Two mechanics that do not fit a modifier pipeline at all

**[CONTRADICTS] Wild Shape is entity substitution, not modification.**
The druid's statistics are *replaced* by a beast's — HP, Hit Dice, physical
ability scores, size, speed, senses — while retaining INT/WIS/CHA, alignment,
and **all skill and save proficiencies, taking whichever bonus is higher**.
Damage taken in the form overflows back to the true body on reverting.
Equipment may fall, merge, or be worn.

No amount of `add`/`set` modelling makes this clean. It needs a **form stack**:
the character has a true form and an optional active form, and derived-stat
resolution reads from the active one with explicit fall-through rules for what
the true form retains. Worth designing the shape for now even though it is not
MVP, because retrofitting a form stack later would touch every derived stat.

**Practical note:** Wild Shape is *unusable in this SRD* — beast statblocks are
in the bestiary, which this edition strips out. Same for Destroy Undead, which
keys off challenge rating. **Any feature referencing CR or a creature statblock
is inert until NPC mechanics exist**, which the brief defers.

### The four casting models are genuinely different resource shapes

| Model | Class | Selection | Change when |
|---|---|---|---|
| **Known** | Bard | fixed count of spells, chosen at level-up | swap one per level-up |
| **Prepared** | Cleric, Druid | ability mod + class level, from the **whole class list** | every long rest |
| **Spellbook** | Wizard *(to read)* | — | — |
| **Pact magic** | Warlock *(to read)* | — | — |

Prepared casters do **not** lose a spell by casting it. Ritual casting requires
the spell be prepared (cleric/druid) but only *known* for a bard.

**[EXTENDS] Spell-list membership is per-character and extensible.**
Domain spells (cleric) and Circle spells (druid) are **always prepared, do not
count against the prepared limit**, and are treated as class spells *even if
they are not on the class list*. Bard's *Magical Secrets* pulls from **any**
class list. So "which spells can this character access" is a computed set, not
a static class property.

### More effect kinds observed

- **Maximise dice instead of rolling** — *Supreme Healing*: use the highest
  possible value on every healing die. A dice-behaviour modifier alongside
  reroll/explode.
- **Once per turn limiters** — *Divine Strike*: extra damage once on each of
  your turns. Distinct from per-rest resources; needs turn-scoped tracking.
- **Cooldowns measured in days** — *Divine Intervention*: 7 days on success,
  long rest on failure. Recharge is not just short/long rest.
- **Spell slots as a recoverable resource** — *Natural Recovery*: recover slots
  totalling half druid level on a short rest. A resource that restores another
  resource.
- **Creature-type-scoped effects** — Turn Undead (undead only), Nature's
  Sanctuary (beasts and plants), Nature's Ward (charm/fright immunity **only
  from elementals and fey**). Requires creature type on targets.
- **Condition and damage immunities** — *Nature's Ward*: immune to poison
  **and disease**. Disease is not a damage type nor a standard condition —
  a separate tag namespace is needed.
- **Behavioural conditions** — *Turned*: must move away, cannot willingly
  approach within 30 ft, cannot take reactions, restricted actions. Conditions
  can constrain the action economy, not just apply numbers.
- **Component substitution/waiver** — *Archdruid* ignores verbal and somatic
  components and material components lacking a cost. So spell components must
  be modelled as requirements that effects can waive.
- **Healing amplification** — *Disciple of Life* adds 2 + spell level to any
  healing spell; *Blessed Healer* heals the caster when healing others. Healing
  needs the same modifier pipeline as damage.
- **Pooled, divisible effects** — *Preserve Life*: a pool of 5 × level HP
  divided freely among chosen targets, capped at half maximum each. Targeting
  is not always one-target-one-value.
