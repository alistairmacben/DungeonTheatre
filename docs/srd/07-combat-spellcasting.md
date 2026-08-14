# Combat and spellcasting rules (p90–104)

**Scope note.** The user has put **combat out of scope** for v2. But this
chapter is not only combat: it also contains the **hit point, damage, healing,
death and temporary-HP model**, which is core character state, and the
**entire spellcasting engine**, which is unavoidable. Both are captured in
full. The turn-structure material is captured more briefly, marked
`[COMBAT-ONLY]`, because it will be needed in v3 and because several
non-combat rules (Help, Hide, Ready, cover, concentration) are defined here and
leak outward.

---

## 1. `[COMBAT-ONLY]` The order of combat (p90–92)

**Round = 6 seconds.** Steps: determine surprise → establish positions → roll
initiative → take turns in order → repeat.

**Surprise** — the GM compares hiders' **DEX (Stealth)** against each opposing
creature's **passive WIS (Perception)**. A surprised creature **cannot move or
act on its first turn and cannot take a reaction until that turn ends**.
Surprise is per-creature, not per-side.

**Initiative** — a **DEX check** (not a d20 + DEX modifier by another name; it
is literally an ability check, so anything that modifies DEX checks modifies
initiative). One roll per group of identical creatures. Order is fixed for the
whole combat. Ties: GM decides among its creatures, players among theirs,
optionally re-rolled with a d20.

**A turn** = move up to your speed **and** one action, in either order.

**Bonus action** — only available when a feature explicitly grants one;
**at most one per turn**; anything that denies actions denies bonus actions.

**Free interaction** — you may **interact with one object or environment
feature for free** per turn (draw a weapon, open a door). A second interaction
costs your action. Long list of examples on p92 (draw/sheathe a sword, quaff a
flagon, hand an item to another character, turn a key…).

**Reaction** — an instant response to a trigger, on anyone's turn. **One per
round**, refreshing at the start of your turn. The interrupted creature resumes
its turn afterwards.

**Movement** — may be broken up before and after the action, and **between
attacks** of a multi-attack. **Multiple speeds** (walk + fly): when switching,
subtract distance already moved from the new speed; if ≤ 0 you cannot use it.

**Difficult terrain** — 1 extra foot per foot, **not cumulative** even with
several sources. **Another creature's space is difficult terrain.**

**Prone** — dropping prone is free; **standing costs half your speed**; you
cannot stand with insufficient movement or speed 0. Crawling costs 1 extra foot
(so 3 ft per foot in difficult terrain).

**Moving around creatures** — through a non-hostile creature's space freely;
through a hostile's only if **two sizes** apart; **never end your move in
another creature's space**. Leaving a hostile creature's reach **provokes an
opportunity attack**.

**Flying** — a flying creature that is knocked prone, reduced to speed 0, or
otherwise unable to move **falls**, unless it can hover or is held aloft by
magic.

### Creature size (p92) — *needed outside combat too*

| Size | Space |
|---|---|
| Tiny | 2½ × 2½ ft |
| Small | 5 × 5 ft |
| Medium | 5 × 5 ft |
| Large | 10 × 10 ft |
| Huge | 15 × 15 ft |
| Gargantuan | 20 × 20 ft or larger |

Size already matters outside combat: **carrying capacity doubles per size above
Medium and halves for Tiny** (`06-core-rules.md`), **Heavy weapons give Small
creatures disadvantage**, **armour as barding**, **a net affects Large or
smaller**, **grapple/shove require within one size**, **manacles bind Small or
Medium**. So `size` is a required character/creature field regardless of combat
scope.

**Squeezing** — into a space one size smaller: 1 extra foot per foot,
**disadvantage on attack rolls and DEX saves**, and **attacks against you have
advantage**.

---

## 2. Actions in combat (p93–94)

`[COMBAT-ONLY]` **Attack** (one melee or ranged attack; Extra Attack grants
more), **Dash** (extra movement equal to your speed *after modifiers* — so a
speed reduced to 15 gives 30 total), **Disengage** (movement provokes no
opportunity attacks this turn), **Dodge** (attacks against you have
disadvantage **if you can see the attacker**, and you make **DEX saves with
advantage**; lost if incapacitated or speed 0).

**Cast a Spell** — **casting a spell is not necessarily an action.** The
casting time may be an action, bonus action, reaction, minutes or hours.

**Help** *(also used outside combat)* — the aided creature gains **advantage on
its next ability check** for that task, if made before the start of your next
turn. Alternatively, aid an attack against a creature within 5 ft: the ally's
**first attack roll before your next turn has advantage**.

**Hide** — a DEX (Stealth) check per the hiding rules.

**Ready** — declare a **perceivable trigger** and an action (or a move) to take
in response, using your reaction. When the trigger fires you may take it **or
ignore it**. **A readied spell must have a casting time of 1 action, is cast
immediately, and is held with concentration** — so readying a spell **breaks
any concentration you already had**, and losing concentration wastes it.

**Search** — WIS (Perception) or INT (Investigation), GM's choice.

**Use an Object** — for objects whose use requires an action, or for a second
object interaction in a turn.

---

## 3. Making an attack (p94–96)

**Structure:** choose a target → determine modifiers (cover, advantage/
disadvantage, bonuses) → resolve (attack roll; on a hit, roll damage).

**"If you're making an attack roll, you're making an attack."** — the SRD's own
definition, and a useful one for tagging effects that trigger "on an attack".

**Attack roll** = `d20 + ability modifier + proficiency bonus (if proficient)`
vs. the target's **AC**. Hits on **total ≥ AC**.

- Melee weapon → **STR**; ranged weapon → **DEX**; **finesse and thrown break
  this rule** (see `04-equipment.md`).
- Spell attack → the caster's **spellcasting ability**.
- **Proficiency applies to weapons you are proficient with, and always to
  spells.**

**Natural 20 = automatic hit (critical). Natural 1 = automatic miss.**
Both **regardless of modifiers or AC**. Note: this applies to **attack rolls
only** — the SRD does *not* give ability checks or (non-death) saving throws
auto-success/failure on 1 or 20. That is a very commonly houseruled point and
worth getting right.

**Unseen attackers and targets** — attacking a target you cannot see gives
**disadvantage**; if the target isn't where you targeted, you **automatically
miss**. Attacking while the target cannot see you gives **advantage**. A hidden
attacker **gives away their position on a hit or a miss**.

**Ranged attacks** — single-range spells cannot exceed that range; two-range
weapons give **disadvantage beyond normal range** and cannot exceed long range.
**Ranged attacks within 5 ft of a hostile creature that can see you and is not
incapacitated have disadvantage.**

**Melee attacks** — typical reach 5 ft. **Unarmed strike: `1 + STR modifier`
bludgeoning, and everyone is proficient with it.** (Note the flat `1`, not a
die — a second confirmation that damage must express constants.)

**Opportunity attacks** — reaction, one melee attack, when a hostile creature
you can see **leaves your reach**, resolved **before** it leaves. Avoided by
Disengage, by teleporting, or by being moved without using your own movement/
action/reaction.

**Two-weapon fighting** — Attack action with a **light** melee weapon in one
hand → **bonus action** attack with a **different light** melee weapon in the
other. **You do not add your ability modifier to the bonus attack's damage
unless the modifier is negative.** Either weapon with **thrown** may be thrown
instead.

**Grappling** — a special melee attack replacing one attack of the Attack
action. Target at most **one size larger**, within reach, and you need **at
least one free hand**. **STR (Athletics) contested by the target's STR
(Athletics) *or* DEX (Acrobatics) — the target chooses.** Success applies the
**grappled** condition. Release is free. Escape: the grappled creature uses its
**action** for the same contest. Moving a grappled creature **halves your
speed** unless it is two or more sizes smaller.

**Shoving** — same contest and size/reach rules; on a win, **knock prone or
push 5 feet**.

*Engine note:* grapple and shove are the **contest** primitive from
`06-core-rules.md` §4 with a twist — **the defender chooses which ability to
use**. So a contest request must let the responding player pick from a set of
allowed check types. That is a player-facing decision inside a roll, which
reinforces the "pending interaction" primitive in `99-open-questions.md` Q10.

### Cover (p96)
Three degrees. **Only the most protective applies — they never add.**

| Cover | Effect |
|---|---|
| Half | **+2 AC and +2 to DEX saves** |
| Three-quarters | **+5 AC and +5 to DEX saves** |
| Total | **cannot be targeted directly** by an attack or spell (but can be caught in an area of effect) |

*Engine:* cover is a **transient, situational modifier to a derived stat
(AC) and to a save**, chosen by max rather than summed — another
"strongest wins" slot rather than an additive one.

---

## 4. Damage and healing (p96–99) — **IN SCOPE, core character state**

### Hit points
Current HP ranges from the **maximum down to 0**. **Losing hit points has no
effect on capability until you reach 0** — there are no wound penalties. HP max
is a derived stat (see the retroactive CON rule).

### Damage rolls
Roll the dice, add modifiers, apply. **With a weapon you add the same ability
modifier used for the attack roll.** A penalty can reduce damage to **0 but
never below**. **If an effect damages multiple targets at once, the damage is
rolled once for all of them** (one fireball roll, applied to everyone).

*Engine:* this matters for the dice UI — an area spell is **one dice request,
many applications**, not one per target.

### Critical hits
**Roll all of the attack's damage dice twice and add them together**, then add
modifiers **once**. Extra dice from features (Sneak Attack) **are also
doubled**. Modifiers are not.

### Damage types (13, exhaustive)
**acid, bludgeoning, cold, fire, force, lightning, necrotic, piercing, poison,
psychic, radiant, slashing, thunder.**
"Damage types have no rules of their own" — they exist purely so resistance,
vulnerability and immunity can key off them.

### Resistance and vulnerability — **[IMPORTANT] ordering rule**
- **Resistance halves; vulnerability doubles.**
- **Applied after all other modifiers to damage.** The SRD's own worked example:
  25 bludgeoning, a −5 aura, resistance → `(25 − 5) / 2 = 10`, **not**
  `25/2 − 5`.
- **Multiple instances of resistance to the same type count once.** Resistance
  to fire *and* to all nonmagical damage still halves once, never quarters.
- Immunity is referenced throughout but defined in the conditions/creature
  material (objects are immune to poison and psychic, `06-core-rules.md` §8).

*Engine:* damage application is a fixed pipeline —
`sum dice and modifiers → apply flat reductions → apply resistance/vulnerability
(deduplicated by type, at most one halving and one doubling) → subtract from
temporary HP first → subtract from HP`.

### Healing
Healing adds to current HP and **cannot exceed the maximum** (excess is lost).
**A dead creature cannot regain hit points** until magic restores it to life.

### Dropping to 0 hit points
**Instant death** — if damage reduces you to 0 **and the remaining damage
equals or exceeds your hit point maximum**, you die outright.

**Falling unconscious** — otherwise you fall **unconscious**; this ends as soon
as you regain **any** hit points.

### Death saving throws — **[IMPORTANT] a unique roll type**
- Made **at the start of each of your turns while at 0 HP**.
- **Not tied to any ability score.** No modifiers from abilities — only from
  effects that improve saving throws generally.
- **d20; 10 or higher succeeds.**
- **Three successes → stable. Three failures → death.** Not required to be
  consecutive; both counters **reset to zero when you regain any HP or become
  stable**.
- **Natural 1 counts as two failures. Natural 20 restores you to 1 hit point.**
- **Taking damage at 0 HP = one failure; from a critical hit = two failures;**
  damage ≥ your HP maximum = **instant death**.

*Engine:* death saves need two counters as first-class character state, a
distinct roll type with no ability term, and its own 1/20 rules that differ
from attack rolls. This is a prime HUD element and a strong dramatic beat for
the theatrical layer — exactly the kind of structured game event the
presentation layer should consume.

### Stabilising
**Action + DC 10 WIS (Medicine)** check on an unconscious creature. A stable
creature **makes no death saves but stays unconscious**, and **regains 1 HP
after 1d4 hours** if not healed. It **stops being stable if it takes any
damage**. (The **healer's kit** from `04-equipment.md` stabilises with no check,
expending one of ten charges.)

**Knocking out** — an attacker reducing a creature to 0 with a **melee** attack
may choose, **at the instant damage is dealt**, to knock it out instead: it
falls **unconscious and stable**.

### Temporary hit points — **[IMPORTANT] a separate pool, not healing**
- A **buffer consumed before real HP**.
- **Can exceed your hit point maximum**; you can be at full HP and gain them.
- **Healing cannot restore them.**
- **They never stack.** Receiving more while you have some is a **player
  choice**: keep the old pool or take the new one (12 vs 10 — not 22).
- **At 0 HP they do not restore consciousness or stabilise you**, though they
  still absorb damage.
- Unless the granting feature states a duration, they last **until depleted or
  until you finish a long rest**.

*Engine:* `tempHP` is a distinct scalar with a **replace-by-choice** write
semantic — the only resource so far that prompts the player on assignment.

---

## 5. `[COMBAT-ONLY]` Mounted and underwater combat (p99)

**Mounting/dismounting** costs **half your speed**, once per move, on a
creature within 5 ft that is **at least one size larger** with appropriate
anatomy. Forced movement of the mount, or being knocked prone while mounted,
forces a **DC 10 DEX save or you fall prone within 5 ft**. If the mount is
knocked prone you may use your **reaction** to dismount and land on your feet.

**Controlled mount** — must be trained to accept a rider (horses, donkeys are
assumed to be); its **initiative changes to match yours**; it has only **Dash,
Disengage and Dodge** as actions, and can act on the turn you mount it.
**Independent mount** — keeps its own initiative and acts freely. Either way,
an opportunity attack provoked by the mount may target **rider or mount**.

**Underwater** — melee weapon attacks have **disadvantage without a swim
speed**, except **dagger, javelin, shortsword, spear, trident**. Ranged weapon
attacks **automatically miss beyond normal range** and have **disadvantage**
within it, except **crossbow, net, and thrown weapons like javelin/spear/
trident/dart**. **Creatures and objects fully immersed have resistance to fire
damage.**

---

## 6. Spellcasting (p100–104) — **fully in scope**

### What a spell is
Spells have a **level 0–9**. **Cantrips are level 0.** Spell level and
character level do not correspond (9th-level spells need a 17th-level
character).

### Known vs prepared
Some classes (bard, sorcerer) have a **fixed list of spells known**; others
(cleric, wizard) **prepare** spells, per their class rules. Either way the
number "fixed in mind" depends on character level. *(Four distinct models, per
`00-index.md`.)*

### Spell slots — **[CRITICAL]**
- Casting expends a slot **of the spell's level or higher**.
- **A long rest restores all expended slots** (warlock pact slots are the
  exception — short rest, per `02-classes.md`).
- Some features cast spells **without using slots at all**.

**Casting at a higher level** — "the spell **assumes the higher level** for that
casting… effectively, the spell expands to fill the slot it is put into." Some
spells have explicitly stronger effects when upcast.

*Engine:* **effective spell level is a cast-time parameter**, and every spell
effect is potentially a **function of that level**, not a constant. Combined
with Metamagic (which parameterises range, duration, targets, components and
casting time — see `90-vocabulary-findings.md`), a "cast" is a **parameterised
invocation**, not a fixed effect lookup. This is the single most important
shape in the spell system.

**Casting in armour** — "**you must be proficient with the armor you are
wearing to cast a spell.**" Restates the armour rule from `04-equipment.md`.

**Cantrips** — cast **at will**, no slot, no preparation.

**Rituals** — a spell tagged *ritual* may be cast as one: **+10 minutes casting
time, no slot expended**, and therefore **cannot be upcast**. Requires a class
feature granting ritual casting, **and** the spell must be prepared or known —
*unless* the feature says otherwise (**the wizard's does**: any ritual in the
spellbook).

### The spell statblock
Every spell has: **name, level, school, casting time, range, components,
duration**, then its effect text. That is the schema for the spell dataset.

**Casting time** — action, **bonus action**, **reaction**, or minutes/hours.
- **Bonus-action spells:** you may not cast **another spell that turn except a
  cantrip with a casting time of 1 action**. (A hard, frequently-missed rule
  worth enforcing in the UI.)
- **Reaction spells** specify their own trigger.
- **Longer casting times** require **your action every turn** plus
  **concentration** throughout; broken concentration means the spell fails but
  **no slot is expended**, and you must start over.

**Range** — a distance in feet, **touch**, or **self** (including cones and
lines originating from you). **Once cast, effects are not limited by range**
unless stated.

**Components**
- **V** — blocked by being gagged or in a *silence* effect.
- **S** — requires **free use of at least one hand**.
- **M** — a component pouch or spellcasting focus substitutes, **except for
  components with a listed cost**, which must be held specifically. Components
  marked **consumed** must be provided **per casting**. You need **a free hand
  to access materials or hold a focus — and it may be the same hand used for
  somatic components**.

*Engine:* component satisfaction is a genuine **precondition check** against
inventory and body state (hands free, gagged, silenced, focus held). This is
one of the highest-value automation wins for a HUD: grey out a spell and say
*why*.

**Duration** — rounds, minutes, hours, years; **instantaneous** (cannot be
dispelled); or **until dispelled/destroyed**.

### Concentration — **[CRITICAL]**
- **Only one concentration spell at a time**; casting a second **ends the
  first**.
- **Ending it is free**, no action.
- **Normal activity (moving, attacking) does not break it.**
- **Taking damage → CON saving throw, DC = 10 or half the damage taken,
  whichever is higher.**
- **Separate save per source of damage.**
- **Being incapacitated or dying ends it.**
- The GM may require **DC 10 CON** for environmental phenomena.

*Engine:* concentration is a **singleton slot on the character**, with an
automatic save prompt on every damage event. It is the most-forgotten rule at
real tables and therefore one of the highest-value things to automate. It is
also a **structured game event** the theatrical layer can dramatise.

### Targets and areas
- A target may not be behind **total cover**; an area's point of origin placed
  behind an unseen obstruction **comes into being on the near side**.
- **You may target yourself** whenever a spell targets "a creature of your
  choice", unless it must be hostile or another creature.
- A creature **may not know it was targeted** unless the effect is perceptible.

**Five area shapes**, each with a defined point of origin:

| Shape | Origin | Geometry |
|---|---|---|
| **Cone** | a point you choose, **not** included | width at any point = distance from origin; length given |
| **Cube** | anywhere on a **face**, **not** included | side length given |
| **Cylinder** | centre of a circle of given radius, **included** | circle on the ground or at effect height; effect extends up or down by the height |
| **Line** | a point, **not** included | length and width given |
| **Sphere** | a point, **included** | radius given |

Effects **expand in straight lines** from the origin; a location with no
unblocked straight line is **excluded**, and only **total cover** blocks a line.

### Spell save DC and attack bonus — **[CRITICAL]**
```
spell save DC     = 8 + spellcasting ability modifier + proficiency bonus + special modifiers
spell attack bonus =     spellcasting ability modifier + proficiency bonus
```
Both are **derived stats** and both belong in the HUD.

### Schools of magic (8)
**Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion,
Necromancy, Transmutation.** "They have no rules of their own, although some
rules refer to the schools" — so `school` is a **tag** other effects key off
(e.g. wizard subclass features, *counterspell*-style interactions).

### Combining magical effects — **[IMPORTANT] stacking rule**
- **Different spells stack** while their durations overlap.
- **The same spell cast multiple times does not.** The **most potent effect
  (e.g. the highest bonus) applies** for the overlap. Two *bless* spells give
  one bonus die.

*Engine:* effect sources need a **source identity** (which spell), and the
resolver must deduplicate by that identity, keeping the strongest. This is a
third distinct combination rule alongside additive modifiers, max-wins slots
(cover, proficiency multiplier) and set-reduction (advantage).

---

## Additions to the modifier-combination taxonomy

The read has now produced **five distinct combination semantics**, and the
architecture draft only had one (additive):

1. **Additive** — most bonuses sum (ability modifier + proficiency + item).
2. **Max-wins slot** — cover (only the best degree), competing AC base
   formulas, same-spell stacking (highest bonus).
3. **Single-application with a single multiplier** — the proficiency bonus:
   added once, multiplied once, and **zero stays zero**.
4. **Set-reduction to a tri-state** — advantage/disadvantage, which becomes
   **±5** in passive form.
5. **Ordered pipeline stage** — damage resistance/vulnerability, applied
   **after** all other modifiers, **deduplicated by type**, at most one halving
   and one doubling.

Any effect the DM authors must declare **which** of these it participates in.
That is the concrete answer to "DM items must use the same mechanism as SRD
content".
