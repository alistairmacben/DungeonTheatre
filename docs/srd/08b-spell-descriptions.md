# Spell descriptions (p114–193)

**How this file is organised.** The SRD prints ~320 spells alphabetically. For
each one this file records its **complete mechanical signature** — the header
block (level, school, ritual tag, casting time, range, components including
costed and consumed materials, duration and concentration) plus the
**mechanical shape** of its effect and its **At Higher Levels** rule. That is
everything the engine needs; the prose flavour lives in the source PDF.

**Notation used throughout:**
- `conc` = requires concentration · `(R)` = ritual
- `M*` = material component with a **listed gp cost** (a component pouch or
  focus does **not** substitute) · `M**` = **consumed** by the casting
- `save X` = target makes an X saving throw · `atk` = spell attack roll
- `↑` = the At Higher Levels scaling rule
- `[cantrip-scale]` = scales at character level 5/11/17, not by slot

---

## Recurring shapes found so far

Recorded as they appear, so the effect vocabulary can be derived from evidence
rather than guessed. Cross-referenced into `90-vocabulary-findings.md` at the
end of the read.

1. **Damage on a failed save, half on success** — the single most common shape.
2. **Spell attack roll → damage on hit**, sometimes with a partial effect on a
   miss (*Acid Arrow* deals half the initial damage on a miss).
3. **Delayed damage** — *Acid Arrow* deals 2d4 more "at the end of its next
   turn". Damage can be scheduled, not just immediate.
4. **Cantrip damage scaling by character level** (5/11/17), a completely
   different axis from slot upcasting.
5. **Repeating saves to end** — *Blindness/Deafness* allows a CON save at the
   end of each of the target's turns. So a condition instance carries its own
   "save to end, when, which ability, against what DC".
6. **Escape checks against your spell save DC** — *Black Tentacles* lets a
   restrained creature use its action for a STR **or DEX (its choice)** check
   vs. your DC. Confirms the "defender chooses the ability" pattern from
   grapple.
7. **HP maximum manipulation** — *Aid* raises **both** hit point maximum and
   current HP. Distinct from healing and from temporary HP; a third mechanism.
8. **AC floor** — *Barkskin* sets "AC can't be less than 16, regardless of
   armour". A `min` operation on a derived stat, exactly as the architecture
   draft proposed.
9. **Dice-bonus riders on future rolls** — *Bless* (+1d4 to attacks and saves)
   and *Bane* (−1d4). A modifier that is itself a **die**, resolved at the time
   of the later roll — so a queued roll must carry pending dice modifiers.
10. **Upcast changes the duration *and* the concentration requirement** —
    *Bestow Curse* at 5th level or higher "grants a duration that doesn't
    require concentration". Upcasting can change the *kind* of effect, not just
    its magnitude.
11. **Advantage/disadvantage granted to others' rolls against you** —
    *Blur* imposes disadvantage on all attacks against you, with an explicit
    **immunity clause** (blindsight, truesight). Effects need exception
    predicates.
12. **Maximised healing** — *Beacon of Hope* makes targets "regain the maximum
    number of hit points possible from any healing". A modifier that changes
    how a **later, unrelated** dice roll resolves. Same family as reroll and
    explode.
13. **"Next time you hit"** riders — *Branding Smite* attaches an effect to the
    next weapon attack that hits. A pending trigger consumed by a future event.
14. **Ongoing area effects with entry/start-of-turn triggers** —
    *Black Tentacles*, *Blade Barrier*: "when a creature enters the area for
    the first time on a turn or starts its turn there". A standard trigger
    phrase worth encoding once.
15. **Type-conditional effects** — *Blight* has no effect on undead or
    constructs, gives plants disadvantage **and maximum damage**. Effects key
    off creature type, which the SRD has no creatures to carry (see
    `99-open-questions.md` Q1).
16. **Anti-magic and suppression** — *Antimagic Field* suppresses spells, magic
    items and summons within a moving area, and suppressed time **still counts
    against duration**. Suppression is distinct from dispelling and needs a
    "suspended but running" state on every active effect.
17. **Spells that create controllable entities** — *Animate Dead*,
    *Animate Objects*, *Arcane Hand*, *Arcane Eye*, *Arcane Sword*. These have
    their own statblocks, HP and actions, commanded with a bonus action. With
    combat and NPCs out of scope these are largely inert, but they prove the
    data model needs a **summoned-entity** concept.

---

## A

**Acid Arrow** — 2nd evocation · 1 action · 90 ft · V, S, M · Instantaneous.
Ranged spell atk. Hit: **4d4 acid** immediately **+ 2d4 acid at the end of the
target's next turn**. Miss: **half the initial damage**, no delayed damage.
↑ +1d4 to **both** initial and delayed per slot above 2nd.

**Acid Splash** — Conjuration cantrip · 1 action · 60 ft · V, S · Instantaneous.
One creature, **or two within 5 ft of each other**. save DEX or **1d6 acid**.
[cantrip-scale] 2d6/3d6/4d6.

**Aid** — 2nd abjuration · 1 action · 30 ft · V, S, M · **8 hours**.
Up to three creatures: **hit point maximum and current HP +5**.
↑ +5 more per slot above 2nd.

**Alarm** — 1st abjuration **(R)** · **1 minute** · 30 ft · V, S, M · 8 hours.
Wards a door/window/area up to a **20-ft cube**. Alerts on a **Tiny or larger**
creature entering. Designate exempt creatures at cast time. Choose **mental**
(ping within 1 mile, wakes you) or **audible** (hand bell, 10 s, 60 ft).

**Alter Self** — 2nd transmutation · 1 action · Self · V, S · **conc, 1 hour**.
Choose one option; **swap options as an action** during the duration:
*Aquatic Adaptation* (breathe underwater, **swim speed = walking speed**);
*Change Appearance* (no statistic changes, same size and basic shape, change
again as an action); *Natural Weapons* (unarmed strikes deal **1d6**
bludgeoning/piercing/slashing, you are proficient, and the weapon is **magic
with +1 to attack and damage**).

**Animal Friendship** — 1st enchantment · 1 action · 30 ft · V, S, M ·
**24 hours**. Beast that can see and hear you. **Fails automatically if the
beast's INT is 4 or higher.** save WIS or **charmed**. **Ends if you or a
companion harms it.** ↑ one additional beast per slot above 1st.

**Animal Messenger** — 2nd enchantment **(R)** · 1 action · 30 ft · V, S, M ·
24 hours. A **Tiny beast** carries a **25-word** message to a location you have
visited and a recipient matching a general description. **50 miles/24 h flying,
25 miles otherwise.** Fails → message lost, beast returns.
↑ **duration +48 hours** per slot above 2nd.

**Animal Shapes** — 8th transmutation · 1 action · 30 ft · V, S ·
**conc, up to 24 hours**. Any number of **willing** creatures → **Large or
smaller beast, CR 4 or lower**. Retain alignment and **INT, WIS, CHA**; assume
the form's HP; reverting restores prior HP; **excess damage carries over**.
Cannot speak or cast; gear melds in.
*(Inert in this edition — no beast statblocks. See Q1.)*

**Animate Dead** — 3rd necromancy · **1 minute** · 10 ft · V, S, M ·
Instantaneous. Raises a Medium/Small humanoid corpse or bones as a **skeleton
or zombie**. **Bonus action** to command within 60 ft. **Control lasts 24
hours**; recasting reasserts control over **up to four** existing creatures
instead of animating a new one. ↑ **two additional** creatures per slot above
3rd (each from a different body).

**Animate Objects** — 5th transmutation · 1 action · 120 ft · V, S ·
**conc, 1 minute**. Up to **ten** nonmagical unattended objects. **Medium
counts as 2, Large as 4, Huge as 8**; nothing larger than Huge.

| Size | HP | AC | Attack | STR | DEX |
|---|---|---|---|---|---|
| Tiny | 20 | 18 | +8, 1d4+4 | 4 | 18 |
| Small | 25 | 16 | +6, 1d8+2 | 6 | 14 |
| Medium | 40 | 13 | +5, 2d6+1 | 10 | 12 |
| Large | 50 | 10 | +6, 2d10+2 | 14 | 10 |
| Huge | 80 | 10 | +8, 2d12+4 | 18 | 6 |

Construct; CON 10, INT and WIS 3, CHA 1; speed 30 ft (or **fly 30 ft and hover**
if it has no legs; **speed 0** if attached); **blindsight 30 ft, blind beyond**.
At 0 HP it reverts and excess damage carries to the object.
↑ two additional objects per slot above 5th.

**Antilife Shell** — 5th abjuration · 1 action · **Self (10-ft radius)** · V, S
· **conc, 1 hour**. Moving barrier that hedges out all creatures **except
undead and constructs**; they may still cast and use ranged/reach weapons
through it. **The spell ends if you force an affected creature through it.**

**Antimagic Field** — 8th abjuration · 1 action · **Self (10-ft-radius
sphere)** · V, S, M · **conc, 1 hour**. Within: spells cannot be cast, summons
vanish, magic items become mundane. **Suppressed effects still burn their
duration**, and **a slot spent on a suppressed spell is consumed**. Covers
targeted effects, areas of magic (partial overlap creates a gap), ongoing
spells, magic items (a +1 longsword is mundane; magic resumes the instant a
weapon or ammunition fully leaves), magical travel and portals, and summoned
creatures (they wink out and reappear when the sphere moves off).
**Dispel magic has no effect on it, and two antimagic fields do not cancel.**
*Exception: artifacts and deities.*

**Antipathy/Sympathy** — 8th enchantment · **1 hour** · 60 ft · V, S, M ·
**10 days**. Target a Huge-or-smaller object/creature or a **200-ft cube**.
Name a kind of intelligent creature. *Antipathy:* save WIS or **frightened**
while within 60 ft or in sight, and must move to the nearest spot out of sight.
*Sympathy:* save WIS or must move toward and cannot willingly leave; a new save
is allowed if the target harms it. **A save is allowed each time it ends its
turn out of range/sight, and again every 24 hours.** Success → **immune for
1 minute**.

**Arcane Eye** — 4th divination · 1 action · 30 ft · V, S, M · **conc, 1 hour**.
Invisible eye, normal vision + **darkvision 30 ft**, **action to move it 30 ft**,
unlimited distance but **cannot change plane**; passes through a **1-inch**
opening.

**Arcane Hand** — 5th evocation · 1 action · 120 ft · V, S, M · **conc,
1 minute**. Large hand of force: **AC 20**, **HP equal to your hit point
maximum**, **STR 26 (+8)**, DEX 10. Cast and then **bonus action** each turn to
move 60 ft and use one option:
*Clenched Fist* — melee spell atk, **4d8 force**.
*Forceful Hand* — hand's STR vs. target's STR (Athletics); advantage if the
target is Medium or smaller; push **5 ft + 5 × your spellcasting modifier**.
*Grasping Hand* — grapple a Huge or smaller creature using the hand's STR;
bonus action to crush for **2d6 + your spellcasting modifier** bludgeoning.
*Interposing Hand* — **half cover** against a chosen creature; blocks movement
if the target's STR ≤ the hand's, else difficult terrain.
↑ clenched fist **+2d8** and grasping hand **+2d6** per slot above 5th.

**Arcane Lock** — 2nd abjuration · 1 action · Touch · V, S, **M\*\*** (gold dust
**≥25 gp, consumed**) · **Until dispelled**. Locks an entryway; you and
designated creatures pass freely; a **password** suppresses it for 1 minute.
**The DC to break it or pick its locks increases by 10.** *Knock* suppresses it
for 10 minutes.

**Arcane Sword** — 7th evocation · 1 action · 60 ft · V, S, **M\*** (platinum
sword worth **250 gp**) · **conc, 1 minute**. On appearing, melee spell atk for
**3d10 force**. **Bonus action** each turn to move it 20 ft and repeat.

**Arcanist's Magic Aura** — 2nd illusion · 1 action · Touch · V, S, M ·
24 hours. Choose one or both: *False Aura* (change how it reads to
**detect magic** — mundane↔magical, or a chosen school; optionally apparent to
anyone handling it) and *Mask* (change the **creature type or alignment** that
type-detecting effects — Divine Sense, a *symbol* trigger — perceive).
**Cast daily for 30 days with the same effect → lasts until dispelled.**

**Astral Projection** — 9th necromancy · **1 hour** · 10 ft · V, S, **M\*\***
(per creature: a jacinth **≥1,000 gp** and a carved silver bar **≥100 gp**,
both consumed) · **Special**. You and up to eight willing creatures project into
the Astral Plane; bodies fall unconscious in suspended animation, needing no
food or air and not ageing. A **silver cord** tethers you; **cutting it kills
you instantly**. Damage to the astral form does not persist. Ends by your
action, by *dispel magic* on either body, or when **either body drops to 0 HP**.

**Augury** — 2nd divination **(R)** · **1 minute** · Self · V, S, **M\***
(tokens **≥25 gp**) · Instantaneous. An omen about a course of action **within
the next 30 minutes**: **weal / woe / weal and woe / nothing**. Ignores
subsequent changes. **Each casting after the first before a long rest carries a
cumulative 25% chance of a random reading**, rolled secretly by the GM.

**Awaken** — 5th transmutation · **8 hours** · Touch · V, S, **M\*\*** (agate
**≥1,000 gp**, consumed) · Instantaneous. A Huge-or-smaller beast or plant with
**no INT score or INT ≤ 3** gains **INT 10** and one language you know. Plants
gain movement and human-like senses. **Charmed by you for 30 days** or until
harmed; afterwards its attitude depends on your treatment of it.

---

## B

**Bane** — 1st enchantment · 1 action · 30 ft · V, S, M · **conc, 1 minute**.
Up to three creatures, save CHA. Failures **subtract 1d4 from every attack roll
and saving throw** for the duration. ↑ one additional target per slot above 1st.

**Banishment** — 4th abjuration · 1 action · 60 ft · V, S, M · **conc,
1 minute**. save CHA or banished. Native to this plane → a **harmless
demiplane**, **incapacitated**, returning when the spell ends. Native
elsewhere → returned home; **if the spell runs the full minute it does not
return**. ↑ one additional target per slot above 4th.

**Barkskin** — 2nd transmutation · 1 action · Touch · V, S, M · **conc,
1 hour**. Willing creature's **AC cannot be less than 16**, regardless of armour.

**Beacon of Hope** — 3rd abjuration · 1 action · 30 ft · V, S · **conc,
1 minute**. Any number of creatures gain **advantage on WIS saves and death
saving throws**, and **regain the maximum possible HP from any healing**.

**Bestow Curse** — 3rd necromancy · 1 action · Touch · V, S · **conc,
1 minute**. save WIS or cursed; choose one:
· **disadvantage on checks and saves with one chosen ability**
· **disadvantage on attack rolls against you**
· **WIS save at the start of each turn or waste its action**
· **your attacks and spells deal +1d8 necrotic to it**.
Ended by *remove curse*. GM may authorise an alternative of comparable power.
↑ **4th → conc 10 min · 5th → 8 hours · 7th → 24 hours · 9th → until
dispelled**, and **5th or higher removes the concentration requirement**.

**Black Tentacles** — 4th conjuration · 1 action · 90 ft · V, S, M · **conc,
1 minute**. A **20-ft square** becomes difficult terrain. On entering for the
first time on a turn or starting a turn there: save DEX or **3d6 bludgeoning
and restrained**. Already restrained and starting there: **3d6** automatically.
Escape: action, **STR or DEX check (its choice) vs. your spell save DC**.

**Blade Barrier** — 6th evocation · 1 action · 90 ft · V, S · **conc,
10 minutes**. A wall up to **100 × 20 × 5 ft**, or a **ring 60 ft across, 20 ft
high, 5 ft thick**. Provides **three-quarters cover**; its space is difficult
terrain. Entering first time on a turn or starting there: save DEX,
**6d10 slashing**, half on success.

**Bless** — 1st enchantment · 1 action · 30 ft · V, S, M · **conc, 1 minute**.
Up to three creatures **add 1d4 to every attack roll and saving throw**.
↑ one additional target per slot above 1st.

**Blight** — 4th necromancy · 1 action · 30 ft · V, S · Instantaneous.
save CON, **8d8 necrotic**, half on success. **No effect on undead or
constructs.** A **plant creature or magical plant** saves with **disadvantage
and takes maximum damage**. A **nonmagical plant that isn't a creature** gets
no save and **simply dies**. ↑ +1d8 per slot above 4th.

**Blindness/Deafness** — 2nd necromancy · 1 action · 30 ft · **V only** ·
1 minute. save CON or **blinded or deafened (your choice)**. **CON save at the
end of each of its turns to end.** ↑ one additional target per slot above 2nd.

**Blink** — 3rd transmutation · 1 action · Self · V, S · 1 minute.
**Roll a d20 at the end of each of your turns; on 11 or higher** you shift to
the **Ethereal Plane**, returning at the start of your next turn to a space of
your choice within 10 ft. While there you see and hear the origin plane in grey
out to 60 ft and can only interact with other ethereal creatures.
*(A spell whose own operation requires a recurring die roll.)*

**Blur** — 2nd illusion · 1 action · Self · **V only** · **conc, 1 minute**.
**Disadvantage on all attack rolls against you.** **Immune:** attackers not
relying on sight (blindsight) or seeing through illusions (truesight).

**Branding Smite** — 2nd evocation · **1 bonus action** · Self · **V only** ·
**conc, 1 minute**. **The next weapon attack that hits** deals **+2d6 radiant**;
the target **becomes visible, sheds dim light in a 5-ft radius, and cannot turn
invisible** until the spell ends. ↑ +1d6 per slot above 2nd.

**Burning Hands** — 1st evocation · 1 action · **Self (15-ft cone)** · V, S ·
Instantaneous. save DEX, **3d6 fire**, half on success. **Ignites unattended
flammable objects.** ↑ +1d6 per slot above 1st.

---

## C

**Call Lightning** — 3rd conjuration · 1 action · 120 ft · V, S · **conc,
10 minutes**. A storm cloud **cylinder 10 ft tall, 60-ft radius**, centred
100 ft directly above you; **the spell fails if there is no room for it**.
Choose a point: creatures within 5 ft save DEX, **3d10 lightning**, half on
success. **Action on each later turn to repeat.** **Outdoors in stormy
conditions** you commandeer the existing storm and **damage increases by
1d10**. ↑ +1d10 per slot above 3rd.

**Calm Emotions** — 2nd enchantment · 1 action · 60 ft · V, S · **conc,
1 minute**. **20-ft-radius sphere**, humanoids only, save CHA — **a creature may
choose to fail**. Choose either: **suppress charmed or frightened** (suppressed
effects **resume** when this ends if their duration has not expired), or make a
target **indifferent** toward creatures of your choice (ending if it is
attacked or harmed, or if it sees a friend harmed). Hostility returns when the
spell ends.

**Chain Lightning** — 6th evocation · 1 action · 150 ft · V, S, M ·
Instantaneous. One target, then **three bolts leap to up to three others within
30 ft of the first**; **each target may be hit by only one bolt**; targets may
be creatures or objects. save DEX, **10d8 lightning**, half on success.
↑ **one additional bolt** per slot above 6th.

**Charm Person** — 1st enchantment · 1 action · 30 ft · V, S · **1 hour**.
Humanoid, save WIS — **with advantage if you or your companions are fighting
it**. Charmed; regards you as a friendly acquaintance. **Ends if you or a
companion harms it**, and **the creature knows it was charmed** afterwards.
↑ one additional target per slot above 1st; **all targets must be within 30 ft
of each other**.

**Chill Touch** — Necromancy cantrip · 1 action · **120 ft** · V, S ·
**1 round**. Ranged spell atk, **1d8 necrotic**, and the target **cannot regain
hit points until the start of your next turn**. **Undead additionally have
disadvantage on attack rolls against you** until the end of your next turn.
[cantrip-scale] 2d8/3d8/4d8.

**Circle of Death** — 6th necromancy · 1 action · 150 ft · V, S, **M\***
(crushed black pearl **≥500 gp**) · Instantaneous. **60-ft-radius sphere**,
save CON, **8d6 necrotic**, half on success. ↑ **+2d6** per slot above 6th.

**Clairvoyance** — 3rd divination · **10 minutes** · **1 mile** · V, S, **M\***
(focus **≥100 gp** — jewelled horn for hearing, glass eye for seeing) ·
**conc, 10 minutes**. An invisible, **uninteractable** sensor in a familiar or
obvious location. Choose **seeing or hearing** at cast time; **action to
switch**. Visible as a fist-sized orb to *see invisibility* or truesight.

**Clone** — 8th necromancy · **1 hour** · Touch · V, S, **M\*\*** (diamond
**≥1,000 gp** and **1 cubic inch of the creature's flesh**, both consumed, plus
a sealable vessel **≥2,000 gp** large enough for a Medium creature) ·
Instantaneous. Grows an inert duplicate, **mature after 120 days** (optionally
younger). On the original's death the **soul transfers**, if free and willing.
Same personality, memories and abilities, **no equipment**; the original remains
become **permanently unrestorable**.

**Cloudkill** — 5th conjuration · 1 action · 120 ft · V, S · **conc,
10 minutes**. **20-ft-radius sphere** of fog that **spreads around corners** and
is **heavily obscured**. Entering first time on a turn or starting there:
save CON, **5d8 poison**, half on success — **holding your breath or not
needing to breathe does not help**. **Moves 10 ft away from you at the start of
each of your turns**, sinking to the lowest level and pouring down openings.
**Strong wind disperses it and ends the spell.** ↑ +1d8 per slot above 5th.

**Color Spray** — 1st illusion · 1 action · **Self (15-ft cone)** · V, S, M ·
**1 round**. **Roll 6d10** — a **hit-point pool**. Affects creatures in the cone
**in ascending order of current HP** (ignoring unconscious creatures and those
that cannot see), **blinding** each and subtracting its current HP from the
pool; a creature is only affected if its HP ≤ the remaining pool.
↑ **+2d10** per slot above 1st.
*(A unique resolution shape: no save, no attack — a consumable budget spent
against a sorted target list.)*

**Command** — 1st enchantment · 1 action · 60 ft · **V only** · **1 round**.
save WIS or obey a **one-word command** on its next turn. **No effect on
undead**, on a creature that does not understand your language, or if the
command is **directly harmful**. Sample commands: *Approach* (move to you, end
turn within 5 ft), *Drop*, *Flee*, *Grovel* (fall prone, end turn), *Halt*
(no movement, no actions; a flier stays aloft with minimum movement). If the
target cannot follow it, the spell ends. ↑ one additional creature per slot
above 1st, **all within 30 ft of each other**.

**Commune** — 5th divination **(R)** · 1 minute · Self · V, S, M · 1 minute.
**Three yes/no questions** to your deity or a proxy, answered correctly —
though "unclear" is possible beyond the deity's knowledge, and the GM may
substitute a short phrase. **Cumulative 25% chance of no answer for each
casting after the first before a long rest**, rolled secretly.

**Commune with Nature** — 5th divination **(R)** · 1 minute · Self · V, S ·
Instantaneous. Knowledge of the land within **3 miles** outdoors, **300 ft**
underground; **does not function where nature has been replaced by
construction**. **Three facts of your choice** from: terrain and water;
prevalent plants, minerals, animals or peoples; powerful celestials, fey,
fiends, elementals or undead; planar influence; buildings.

**Comprehend Languages** — 1st divination **(R)** · 1 action · Self · V, S, M ·
1 hour. Understand any **spoken** language you hear, and any **written** one you
**touch** (~1 minute per page). **Does not decode secret messages or non-language
glyphs.**

**Compulsion** — 4th enchantment · 1 action · 30 ft · V, S · **conc, 1 minute**.
Creatures **that can hear you**, save WIS — **automatic success if it can't be
charmed**. **Bonus action** each turn to name a horizontal direction; each
target must **use as much movement as possible** that way, may act first, and
**makes another WIS save afterwards to end the effect**. Will not walk into an
obviously deadly hazard, **but will provoke opportunity attacks**.

**Cone of Cold** — 5th evocation · 1 action · **Self (60-ft cone)** · V, S, M ·
Instantaneous. save CON, **8d8 cold**, half on success. **A creature killed
becomes a frozen statue until it thaws.** ↑ +1d8 per slot above 5th.

**Confusion** — 4th enchantment · 1 action · 90 ft · V, S, M · **conc,
1 minute**. **10-ft-radius sphere**, save WIS. Affected targets **cannot take
reactions** and **roll a d10 at the start of each turn**:

| d10 | Behaviour |
|---|---|
| 1 | All movement in a **random direction** (roll d8); no action |
| 2–6 | No movement, no action |
| 7–8 | Melee attack against a **randomly determined** creature in reach; nothing if none |
| 9–10 | Act and move normally |

**WIS save at the end of each of its turns** to end. ↑ **radius +5 ft** per slot
above 4th.
*(Note the nested random tables — a d10 behaviour roll that may require a d8
direction roll and a random target selection. The dice system must support
table lookups and random target choice, not just numeric rolls.)*

**Conjure Animals** — 3rd conjuration · 1 action · 60 ft · V, S · **conc,
1 hour**. Choose: **1 beast CR 2 · 2 × CR 1 · 4 × CR ½ · 8 × CR ¼**. Also count
as fey; vanish at 0 HP or when the spell ends. Friendly; **roll initiative as a
group**; obey verbal commands (**no action required**); otherwise only defend
themselves. ↑ **×2 at 5th, ×3 at 7th, ×4 at 9th** — note this is **slot-tier
specific, not per-level**.

**Conjure Celestial** — 7th conjuration · **1 minute** · 90 ft · V, S ·
**conc, 1 hour**. A **celestial CR 4 or lower**; obeys commands **that don't
violate its alignment**. ↑ **CR 5 with a 9th-level slot**.

**Conjure Elemental** — 5th conjuration · **1 minute** · 90 ft · V, S, M
(material varies by element) · **conc, 1 hour**. Requires a **10-ft cube** of
the matching element in range. An elemental **CR 5 or lower** appears within
10 ft of it. **[IMPORTANT] If your concentration breaks the elemental does not
vanish — it becomes hostile**, cannot be dismissed, and disappears **1 hour
after summoning**. ↑ **CR +1** per slot above 5th.

**Conjure Fey** — 6th conjuration · 1 minute · 90 ft · V, S · **conc, 1 hour**.
A fey creature **CR 6 or lower** (or a fey spirit in beast form). Same
**hostile-on-broken-concentration** rule as *Conjure Elemental*. ↑ **CR +1** per
slot above 6th.

**Conjure Minor Elementals** — 4th conjuration · 1 minute · 90 ft · V, S ·
**conc, 1 hour**. **1 × CR 2 · 2 × CR 1 · 4 × CR ½ · 8 × CR ¼**.
↑ **×2 at 6th, ×3 at 8th**.

**Conjure Woodland Beings** — 4th conjuration · 1 action · 60 ft · V, S, M
(**one holly berry per creature summoned** — a per-target component cost) ·
**conc, 1 hour**. **1 × CR 2 · 2 × CR 1 · 4 × CR ½ · 8 × CR ¼** fey.
↑ **×2 at 6th, ×3 at 8th**.

**Contact Other Plane** — 5th divination **(R)** · 1 minute · Self · **V only**
· 1 minute. **DC 15 INT saving throw.** Failure: **6d6 psychic** and **insane
until you finish a long rest** — cannot act, cannot understand speech, cannot
read, speaks gibberish; ended by *greater restoration*. Success: **five
questions**, answered in **one word** ("yes", "no", "maybe", "never",
"irrelevant", "unclear").
*(A spell whose cost is paid by the caster's own save — the caster is the
target of their own effect.)*

**Contagion** — 5th necromancy · 1 action · Touch · V, S · **7 days**. Melee
spell atk; on a hit, inflict a chosen disease. **CON save at the end of each of
the target's turns: three failures locks the disease in for the duration
(saves stop); three successes cures it and ends the spell.** Because it is a
*natural* disease, **anything that removes or ameliorates disease applies**.
Diseases:
· **Blinding Sickness** — disadvantage on WIS checks and saves; **blinded**
· **Filth Fever** — disadvantage on STR checks, STR saves and STR attack rolls
· **Flesh Rot** — disadvantage on CHA checks; **vulnerability to all damage**
· **Mindfire** — disadvantage on INT checks and saves; behaves as under
  *confusion* in combat
· **Seizure** — disadvantage on DEX checks, DEX saves and DEX attack rolls
· **Slimy Doom** — disadvantage on CON checks and saves; **stunned until the end
  of its next turn whenever it takes damage**
*(This is the SRD's only concrete disease mechanic — see `99-open-questions.md`.
Note the **three-strikes counter**, structurally identical to death saves.)*

**Contingency** — 6th evocation · **10 minutes** · Self · V, S, **M\***
(gem-decorated ivory statuette of yourself, **≥1,500 gp**) · **10 days**.
Store a spell of **5th level or lower, casting time 1 action, that can target
you** — **both slots are expended now**. It fires **automatically the first time
your described circumstance occurs**, whether you want it to or not, and only
**on you**. **One contingency at a time**; recasting ends the previous one; it
also ends **if the material component ever leaves your person**.

**Continual Flame** — 2nd evocation · 1 action · Touch · V, S, **M\*\*** (ruby
dust **50 gp, consumed**) · **Until dispelled**. Torch-bright flame with **no
heat and no oxygen use**; can be covered but **not smothered or quenched**.

**Control Water** — 4th transmutation · 1 action · 300 ft · V, S, M · **conc,
10 minutes**. A **100-ft cube** of freestanding water. **Action to repeat or
switch effects.**
*Flood* — raise water up to 20 ft, or a **20-ft wave**; Huge-or-smaller vehicles
are carried along and have a **25% chance of capsizing**; the wave repeats each
turn.
*Part Water* — a trench with walls of water; refills over a round when ended.
*Redirect Flow* — water flows any direction, even up walls, until it leaves the
area.
*Whirlpool* — needs water **≥50 ft square and 25 ft deep**; a vortex 5 ft wide
at the base, 50 ft at the top, 25 ft tall. Creatures/objects within 25 ft are
**pulled 10 ft** toward it. Swimming away is a **STR (Athletics) check vs. your
spell save DC**. Entering or starting a turn in it: save STR, **2d8
bludgeoning** and caught, half and free on success; **a creature already caught
has disadvantage** on the escape check. Objects take **2d8** the first time each
turn and each round they remain.

**Control Weather** — 8th transmutation · **10 minutes** · **Self (5-mile
radius)** · V, S, M · **conc, 8 hours**. **Must be outdoors**; losing a clear
path to the sky ends it. Change precipitation, temperature and wind **by one
stage** each, taking **1d4 × 10 minutes** to take effect, then changeable again.
Wind direction is also settable. Weather returns to normal gradually when it
ends.

| Precipitation | Temperature | Wind |
|---|---|---|
| 1 Clear | 1 Unbearable heat | 1 Calm |
| 2 Light clouds | 2 Hot | 2 Moderate wind |
| 3 Overcast or ground fog | 3 Warm | 3 Strong wind |
| 4 Rain, hail, or snow | 4 Cool | 4 Gale |
| 5 Torrential rain, driving hail, or blizzard | 5 Cold | 5 Storm |
| | 6 Arctic cold | |

*(Directly relevant to the theatrical layer: these three ladders map cleanly
onto the existing scene effects — fog, rain, wind, sunny, gloom.)*

**Counterspell** — 3rd abjuration · **1 reaction, taken when you see a creature
within 60 ft casting a spell** · 60 ft · **S only** · Instantaneous.
Against a spell of **3rd level or lower**: it **automatically fails**. Against
**4th or higher**: **an ability check using your spellcasting ability, DC =
10 + the spell's level**. ↑ automatic against any spell **of level ≤ the slot
you used**.
*(An **ability check with no ability-score name** — it uses "your spellcasting
ability", which is per-class. Another argument for ability being a free
parameter rather than an enum position.)*

**Create Food and Water** — 3rd conjuration · 1 action · 30 ft · V, S ·
Instantaneous. **45 lb of food and 30 gallons of water** — enough for **fifteen
humanoids or five steeds for 24 hours**. Food **spoils after 24 hours**.
*(Directly interacts with the survival clocks in `06-core-rules.md` §8.)*

**Create or Destroy Water** — 1st transmutation · 1 action · 30 ft · V, S, M ·
Instantaneous. **10 gallons** created in an open container, or as **rain in a
30-ft cube** that extinguishes exposed flames; or **destroy 10 gallons**, or
**destroy fog in a 30-ft cube**. ↑ **+10 gallons or cube +5 ft** per slot above
1st.

**Create Undead** — 6th necromancy · 1 minute · 10 ft · V, S, **M\*** (grave
dirt, brackish water, and a **150 gp black onyx per corpse**) · Instantaneous.
**Only castable at night.** Up to **three** Medium/Small humanoid corpses become
**ghouls**. **Bonus action** to command within **120 ft**; control lasts
**24 hours**, reasserted by recasting. ↑ **7th → four ghouls · 8th → five
ghouls, or two ghasts or wights · 9th → six ghouls, three ghasts or wights, or
two mummies**.

**Creation** — 5th illusion · **1 minute** · 30 ft · V, S, M (a tiny piece of
the intended material) · **Special**. A nonliving object up to a **5-ft cube**,
of a form and material **you have seen before**. Duration by material — use the
**shortest** if mixed:

| Material | Duration |
|---|---|
| Vegetable matter | 1 day |
| Stone or crystal | 12 hours |
| Precious metals | 1 hour |
| Gems | 10 minutes |
| Adamantine or mithral | 1 minute |

**Material created this way cannot serve as another spell's material
component** — that spell fails. ↑ cube **+5 ft** per slot above 5th.

**Cure Wounds** — 1st evocation · 1 action · Touch · V, S · Instantaneous.
**1d8 + your spellcasting ability modifier** hit points. **No effect on undead
or constructs.** ↑ **+1d8** per slot above 1st.

---

## D

**Dancing Lights** — Evocation cantrip · 1 action · 120 ft · V, S, M ·
**conc, 1 minute**. Up to **four** torch-sized lights, or **one Medium humanoid
shape**; each sheds **dim light in a 10-ft radius**. **Bonus action** to move
them up to 60 ft; **each light must stay within 20 ft of another**, and winks
out if it leaves range.

**Darkness** — 2nd evocation · 1 action · 60 ft · **V, M** (no somatic) ·
**conc, 10 minutes**. **15-ft-radius sphere** of magical darkness that spreads
around corners. **Darkvision cannot see through it and nonmagical light cannot
illuminate it.** May be anchored to an object and moves with it; **covering the
source with something opaque blocks it**. **Dispels any light created by a spell
of 2nd level or lower** that it overlaps.

**Darkvision** — 2nd transmutation · 1 action · Touch · V, S, M · **8 hours**.
Grants **darkvision 60 ft** to a willing creature.

**Daylight** — 3rd evocation · 1 action · 60 ft · V, S · **1 hour**.
**60-ft-radius sphere of bright light**, dim for a further 60 ft. Anchorable to
an object; blocked by opaque covering. **Dispels any darkness created by a spell
of 3rd level or lower** that it overlaps.
*(Together with *Darkness* this is a level-comparison dispel — an effect whose
interaction is decided by comparing the two source spells' levels.)*

**Death Ward** — 4th abjuration · 1 action · Touch · V, S · **8 hours**.
**The first time the target would drop to 0 HP from damage, it drops to 1
instead** and the spell ends. Also **negates one instantaneous-death effect that
deals no damage**, then ends.
*(A pre-emptive interceptor on the damage pipeline — the damage application
model must have a hook point before HP reaches 0.)*

**Delayed Blast Fireball** — 7th evocation · 1 action · 150 ft · V, S, M ·
**conc, 1 minute**. A bead lingers; **when the spell ends** (concentration broken
or you dismiss it) it explodes in a **20-ft-radius sphere** that spreads around
corners. save DEX, **fire damage equal to the total accumulated damage**, half
on success. **Base 12d6, +1d6 at the end of each of your turns it has not
detonated.** Touching the bead: save DEX — **failure detonates it immediately**,
**success lets that creature throw it up to 40 ft**. Ignites unattended
flammables. ↑ base **+1d6** per slot above 7th.
*(An effect whose damage **accumulates over time as state** — a damage value
that is neither fixed nor rolled at cast time.)*

**Demiplane** — 8th conjuration · 1 action · 60 ft · **S only** · **1 hour**.
A shadowy door to an empty **30-ft cube** room. **When the spell ends anything
inside is trapped there.** Later castings can reconnect to a demiplane you
made before, or to another caster's if you know its nature and contents.

**Detect Evil and Good** — 1st divination · 1 action · Self · V, S · **conc,
10 minutes**. Know the presence and location of **aberration, celestial,
elemental, fey, fiend or undead** within 30 ft, and of consecrated or
desecrated places/objects. **Blocked by 1 ft stone, 1 inch common metal, a thin
sheet of lead, or 3 ft wood or dirt.**

**Detect Magic** — 1st divination **(R)** · 1 action · Self · V, S · **conc,
10 minutes**. Sense magic within 30 ft; **action to see the aura and learn its
school**. Same barrier rule.

**Detect Poison and Disease** — 1st divination **(R)** · 1 action · Self ·
V, S, M · **conc, 10 minutes**. Sense and **identify** poisons, poisonous
creatures and diseases within 30 ft. Same barrier rule.

**Detect Thoughts** — 2nd divination · 1 action · Self · V, S, M · **conc,
1 minute**. **Action** to focus on a creature within 30 ft. **No effect on INT
≤ 3 or creatures with no language.** Surface thoughts initially; **action to
probe deeper → save WIS**: failure reveals reasoning, emotional state and
something looming large; success **ends the spell**. **The target always knows**,
and may spend its action on an **INT check contested by your INT check** to end
it. Also detects unseen thinking creatures within 30 ft; **blocked by 2 ft rock,
2 inches of non-lead metal, or a thin sheet of lead**.

**Dimension Door** — 4th conjuration · 1 action · **500 ft** · **V only** ·
Instantaneous. Teleport to a spot you can see, visualise, **or describe by
distance and direction**. Carry objects up to your capacity, plus **one willing
creature of your size or smaller** within 5 ft carrying up to its own capacity.
**Arriving in an occupied space: 4d6 force to each traveller and the teleport
fails.**

**Disguise Self** — 1st illusion · 1 action · Self · V, S · **1 hour**.
Change your and your gear's appearance; **±1 foot of height**, any build, **same
body type and limb arrangement**. **Fails physical inspection.** Detected by an
**INT (Investigation) check vs. your spell save DC**, as an action.

**Disintegrate** — 6th transmutation · 1 action · 60 ft · V, S, M ·
Instantaneous. A creature, object, or **creation of magical force**. save DEX,
**10d6 + 40 force**. **If reduced to 0 HP the target is disintegrated** —
it and everything it wears and carries **except magic items** become dust, and
**only *true resurrection* or *wish* can restore it**. **Automatically
disintegrates** a Large-or-smaller nonmagical object or force creation; a **10-ft
cube** of anything Huge or larger. **Magic items are unaffected.**
↑ **+3d6** per slot above 6th.

**Dispel Evil and Good** — 5th abjuration · 1 action · Self · V, S, M · **conc,
1 minute**. **Celestials, elementals, fey, fiends and undead have disadvantage
on attack rolls against you.** End it early with either:
*Break Enchantment* (action, touch — end charmed/frightened/possessed **by one
of those creature types**), or *Dismissal* (action, melee spell atk; on a hit
save CHA or be **sent to its home plane** — undead to the Shadowfell, fey to the
Feywild).

**Dispel Magic** — 3rd abjuration · 1 action · 120 ft · V, S · Instantaneous.
**Ends any spell of 3rd level or lower** on the target automatically. For each
spell of **4th or higher**, an **ability check with your spellcasting ability,
DC = 10 + the spell's level**. ↑ automatic for spells **of level ≤ the slot
used**.

**Divination** — 4th divination **(R)** · 1 action · Self · V, S, **M\*\***
(incense and an offering, together **≥25 gp, consumed**) · Instantaneous.
**One question** about something within **7 days**; a truthful reply as a short
phrase, cryptic rhyme or omen. **Cumulative 25% chance of a random reading** per
casting after the first before a long rest.

**Divine Favor** — 1st evocation · **1 bonus action** · Self · V, S · **conc,
1 minute**. **Your weapon attacks deal +1d4 radiant on a hit.**

**Divine Word** — 7th evocation · **1 bonus action** · 30 ft · **V only** ·
Instantaneous. Any number of creatures **that can hear you**, save CHA.
**Effect depends on the target's current hit points:**

| Current HP | Effect |
|---|---|
| ≤ 50 | deafened 1 minute |
| ≤ 40 | deafened and blinded 10 minutes |
| ≤ 30 | blinded, deafened and stunned 1 hour |
| ≤ 20 | **killed instantly** |

Regardless of HP, a failing **celestial, elemental, fey or fiend** is forced to
its home plane and **cannot return for 24 hours** short of *wish*.
*(A second HP-threshold effect after *Color Spray* — current HP is an input to
effect selection, not merely a resource.)*

**Dominate Beast** — 4th enchantment · 1 action · 60 ft · V, S · **conc,
1 minute**. save WIS (**with advantage if you or your allies are fighting it**)
or charmed. **Telepathic link on the same plane**; issue general commands with
**no action required**. **Action to take total precise control until the end of
your next turn**, including spending **your own reaction** to make it use its
reaction. **A new WIS save each time it takes damage** ends the spell on a
success. ↑ **5th → conc 10 min · 6th → 1 hour · 7th+ → 8 hours**.

**Dominate Monster** — 8th enchantment · same structure, **any creature**,
base **conc, 1 hour**. ↑ **9th → 8 hours**.

**Dominate Person** — 5th enchantment · same structure, **humanoid**, base
**conc, 1 minute**. ↑ **6th → 10 min · 7th → 1 hour · 8th+ → 8 hours**.

**Dream** — 5th illusion · **1 minute** · **Special** · V, S, M · 8 hours.
A creature known to you on the same plane. **Creatures that don't sleep (elves)
cannot be contacted.** You or a willing touched creature enters a trance as the
**messenger** — aware but unable to act or move — and appears in the target's
dream, able to converse and shape the dreamscape. **The target recalls the dream
perfectly.** If the target is awake the messenger may wait or end the spell.
**Nightmare option:** appear monstrous, deliver **≤10 words**, then save WIS —
failure means the target **gains no benefit from that rest** and takes **3d6
psychic** on waking. **Disadvantage on the save if you have a body part, hair,
or nail clipping of the target.**
*(A "sympathetic material grants disadvantage" pattern — the components a caster
possesses can alter a target's save.)*

**Druidcraft** — Transmutation cantrip · 1 action · 30 ft · V, S ·
Instantaneous. One of: a **24-hour weather prediction** sensory effect lasting
1 round; make a flower bloom or seed pod open; a harmless sensory effect within
a **5-ft cube** (falling leaves, a puff of wind, an animal sound, an odour);
**light or snuff a candle, torch or small campfire**.
*(The weather-prediction and sensory-effect options map directly onto the
existing theatrical scene-effect system.)*

---

## E

**Earthquake** — 8th evocation · 1 action · 500 ft · V, S, M · **conc,
1 minute**. A **100-ft-radius circle** of ground becomes difficult terrain.
**Every concentrating creature on the ground makes a CON save or loses
concentration.** On casting and **at the end of each turn you concentrate**,
every creature on the ground makes a **DEX save or is knocked prone**.
*Fissures* — at the start of your next turn, **1d6** fissures, each
**1d10 × 10 ft deep, 10 ft wide**, spanning the area; DEX save or fall in;
a successful save moves you with the edge. A fissure under a structure
**collapses it automatically**.
*Structures* — **50 bludgeoning to every structure** on casting and at the start
of each of your turns. A collapsing structure forces creatures within **half its
height** to save DEX or take **5d6 bludgeoning, be knocked prone and buried**
(escape: action, **DC 20 STR (Athletics)**, GM-adjustable).

**Eldritch Blast** — Evocation cantrip · 1 action · **120 ft** · V, S ·
Instantaneous. Ranged spell atk, **1d10 force**. **[cantrip-scale] by beam
count: 2 at 5th, 3 at 11th, 4 at 17th** — **separate attack roll each**, at the
same or different targets.
*(The cantrip scaling axis is not always damage dice. It can be **number of
attacks**, which changes the dice request shape entirely.)*

**Enhance Ability** — 2nd transmutation · 1 action · Touch · V, S, M · **conc,
1 hour**. Choose one:
· *Bear's Endurance* — advantage on **CON checks**, **+2d6 temporary HP** (lost
  when the spell ends)
· *Bull's Strength* — advantage on **STR checks**, **carrying capacity doubles**
· *Cat's Grace* — advantage on **DEX checks**, **no damage from falls of 20 ft
  or less** while not incapacitated
· *Eagle's Splendor* — advantage on **CHA checks**
· *Fox's Cunning* — advantage on **INT checks**
· *Owl's Wisdom* — advantage on **WIS checks**
↑ one additional creature per slot above 2nd.
*(Note: **checks only**, not saves or attacks — advantage is scoped to a roll
*kind* as well as an ability.)*

**Enlarge/Reduce** — 2nd transmutation · 1 action · 30 ft · V, S, M · **conc,
1 minute**. A creature or an unworn/uncarried object; **unwilling creatures save
CON to negate**. Worn and carried gear changes with it; **dropped items revert
immediately**.
*Enlarge* — **double all dimensions, ×8 weight, size +1 category**; advantage on
**STR checks and STR saves**; weapons grow and deal **+1d4** damage.
*Reduce* — **halve all dimensions, ⅛ weight, size −1 category**; disadvantage on
STR checks and saves; weapons deal **−1d4** (**never below 1**).
*(Size is a mutable derived stat here, feeding carrying capacity, weapon
restrictions, grapple eligibility and squeezing.)*

**Entangle** — 1st conjuration · 1 action · 90 ft · V, S · **conc, 1 minute**.
A **20-ft square** becomes difficult terrain; creatures in it at cast time save
**STR** or are **restrained**. Escape: action, **STR check vs. your spell save
DC**.

**Enthrall** — 2nd enchantment · 1 action · 60 ft · V, S · **1 minute**.
Creatures **that can hear you**, save WIS — **automatic success if it can't be
charmed**, **advantage if you or your companions are fighting it**. Failure:
**disadvantage on WIS (Perception) checks to perceive anyone other than you**.
**Ends if you are incapacitated or can no longer speak.**

**Etherealness** — 7th transmutation · 1 action · Self · V, S · **up to
8 hours**. Enter the **Border Ethereal**. Vertical movement costs **1 extra foot
per foot**. See and hear the origin plane in grey out to 60 ft; **interact only
with ethereal creatures**; **move through objects**. On return, if you occupy a
solid object you are **shunted to the nearest free space and take force damage
equal to twice the feet moved**. **No effect if cast on the Ethereal Plane or a
plane that doesn't border it.** ↑ **up to three willing creatures within 10 ft
per slot above 7th**.

**Expeditious Retreat** — 1st transmutation · **1 bonus action** · Self · V, S ·
**conc, 10 minutes**. **Bonus action each turn to take the Dash action.**

**Eyebite** — 6th necromancy · 1 action · Self · V, S · **conc, 1 minute**.
One creature within 60 ft, save WIS. **Action each turn to target another**, but
**never one that has already saved against this casting**. Effects:
· *Asleep* — **unconscious**; wakes on any damage or if a creature uses its
  action to shake it
· *Panicked* — **frightened of you**; must **Dash away** each turn by the safest
  route; ends if it gets **60 ft away and out of sight**
· *Sickened* — **disadvantage on attack rolls and ability checks**; **WIS save at
  the end of each of its turns** to end

---

## F

**Fabricate** — 4th transmutation · **10 minutes** · 120 ft · V, S ·
Instantaneous. Convert raw materials into finished products **of the same
material**. Up to **Large (a 10-ft cube, or eight connected 5-ft cubes)**;
**Medium (one 5-ft cube) for metal, stone or mineral**. **Quality matches the
raw material.** **Cannot create creatures or magic items.** High-craftsmanship
items (jewellery, weapons, glass, armour) require **proficiency with the
relevant artisan's tools**.
*(A spell gated on a **tool proficiency** — reinforcing that tool proficiency is
a first-class character property, not just a check bonus.)*

**Faerie Fire** — 1st evocation · 1 action · 60 ft · **V only** · **conc,
1 minute**. Objects in a **20-ft cube** are outlined; creatures there save DEX
or are outlined too. Outlined things shed **dim light in a 10-ft radius**,
**attacks against them have advantage if the attacker can see them**, and they
**cannot benefit from invisibility**.

**Faithful Hound** — 4th conjuration · 1 action · 30 ft · V, S, M · **8 hours**.
An **invisible, unharmable** watchdog; ends if you move **more than 100 ft**
from it or dismiss it. Barks when a **Small or larger** creature comes within
30 ft without the **password**. **Sees invisible creatures and into the Ethereal
Plane; ignores illusions.** At the start of each of your turns it bites one
hostile creature within 5 ft: **attack bonus = your spellcasting modifier +
proficiency bonus**, **4d8 piercing**.

**False Life** — 1st necromancy · 1 action · Self · V, S, M · **1 hour**.
**1d4 + 4 temporary hit points.** ↑ **+5** per slot above 1st.

**Fear** — 3rd illusion · 1 action · **Self (30-ft cone)** · V, S, M · **conc,
1 minute**. save WIS or **drop what you are holding** and be **frightened**.
Must **Dash away** each turn by the safest route. **WIS save to end at the end
of any turn it ends without line of sight to you.**

**Feather Fall** — 1st transmutation · **1 reaction, taken when you or a
creature within 60 ft falls** · 60 ft · **V, M** (no somatic) · 1 minute.
Up to **five** falling creatures descend at **60 ft per round**; on landing they
take **no falling damage**, land on their feet, and the spell ends for them.

**Feeblemind** — 8th enchantment · 1 action · 150 ft · V, S, M · Instantaneous.
**4d6 psychic** and save INT. Failure: **INT and CHA become 1**; cannot cast
spells, activate magic items, understand language or communicate. Can still
recognise, follow and protect friends. **Repeats the save every 30 days.**
Also ended by *greater restoration*, *heal* or *wish*.
*(An instantaneous-duration spell with an **indefinite** ongoing effect — proof
that "duration" and "how long the consequences last" are separate fields.)*

**Find Familiar** — 1st conjuration **(R)** · **1 hour** · 10 ft · V, S,
**M\*\*** (**10 gp** of charcoal, incense and herbs, **consumed by fire in a
brass brazier**) · Instantaneous. A familiar in one of: **bat, cat, crab, frog
(toad), hawk, lizard, octopus, owl, poisonous snake, fish (quipper), rat,
raven, sea horse, spider, weasel** — with that form's statistics but the type
**celestial, fey or fiend (your choice)**. Acts independently but always obeys;
**rolls its own initiative**; **cannot attack**. At 0 HP it vanishes and returns
on a recast. Within **100 ft** you communicate telepathically; **as an action
you can see and hear through it** (gaining its special senses) **while blind and
deaf yourself**. Action to **temporarily dismiss** it to a pocket dimension, or
dismiss it forever; action to recall it within 30 ft. **Only one familiar at a
time**; recasting **changes its form**. **It can deliver your touch spells** as
its reaction within 100 ft, using **your** attack modifier.

**Find Steed** — 2nd conjuration · **10 minutes** · 30 ft · V, S ·
Instantaneous. A **warhorse, pony, camel, elk or mastiff** with that form's
statistics but the type **celestial, fey or fiend**. **INT becomes 6 if it was
5 or less**, and it understands one language you speak. **While mounted, any
spell you cast that targets only you also targets the steed.** At 0 HP it
vanishes; recasting summons **the same steed at full HP**. Telepathy within
**1 mile**. **One steed at a time**; action to release the bond.

**Find the Path** — 6th divination · **1 minute** · Self · V, S, **M\***
(divinatory tools worth **100 gp** **and an object from the location**) ·
**conc, up to 1 day**. The shortest physical route to a **specific fixed
location you are familiar with on the same plane**. **Fails** for another plane,
a moving destination, or a non-specific one ("a green dragon's lair"). You know
its distance and direction, and **automatically pick the shortest path** at
every choice (**not necessarily the safest**).

**Find Traps** — 2nd divination · 1 action · 120 ft · V, S · Instantaneous.
Senses the **presence** of any trap **in line of sight** within range — defined
as anything **specifically intended by its creator** to cause a sudden harmful
effect (so *alarm*, *glyph of warding*, a pit trap — **but not** a weak floor,
an unstable ceiling or a sinkhole). **Does not reveal locations**, only the
general nature of the danger.

**Finger of Death** — 7th necromancy · 1 action · 60 ft · V, S · Instantaneous.
save CON, **7d8 + 30 necrotic**, half on success. **A humanoid killed rises at
the start of your next turn as a zombie permanently under your command.**

**Fireball** — 3rd evocation · 1 action · 150 ft · V, S, M · Instantaneous.
**20-ft-radius sphere**, spreads around corners. save DEX, **8d6 fire**, half on
success. Ignites unattended flammables. ↑ **+1d6** per slot above 3rd.

**Fire Bolt** — Evocation cantrip · 1 action · 120 ft · V, S · Instantaneous.
Ranged spell atk against a creature **or object**, **1d10 fire**; ignites
unattended flammable objects. [cantrip-scale] 2d10/3d10/4d10.

**Fire Shield** — 4th evocation · 1 action · Self · V, S, M · **10 minutes**
(no concentration). Sheds **bright light 10 ft, dim 10 ft more**; action to
dismiss. Choose **warm shield** (**resistance to cold**) or **chill shield**
(**resistance to fire**). **Whenever a creature within 5 ft hits you with a
melee attack it takes 2d8** — fire from a warm shield, cold from a chill shield.
*(A retaliation trigger: an effect that fires on *being hit*.)*

**Fire Storm** — 7th evocation · 1 action · 150 ft · V, S · Instantaneous.
**Up to ten 10-ft cubes**, freely arranged, **each sharing a face with another**.
save DEX, **7d10 fire**, half on success. Ignites unattended flammables.
**You may choose to leave plant life unaffected.**
*(A **caster-composed area** — the shape is authored at cast time from unit
cubes with an adjacency constraint, not a fixed geometric primitive.)*

**Flame Blade** — 2nd evocation · **1 bonus action** · Self · V, S, M · **conc,
10 minutes**. A scimitar-like fiery blade in a free hand; **disappears if you
let go, re-evoked as a bonus action**. **Action** for a melee spell atk,
**3d6 fire**. Sheds bright light 10 ft, dim 10 ft more.
↑ **+1d6 per *two* slot levels above 2nd** — a **non-linear upcast step**.

**Flame Strike** — 5th evocation · 1 action · 60 ft · V, S, M · Instantaneous.
A **10-ft-radius, 40-ft-high cylinder**. save DEX, **4d6 fire *and* 4d6
radiant**, half on success. ↑ **+1d6 to fire *or* radiant (your choice)** per
slot above 5th.
*(Two damage types in one effect, each resisted separately — damage is a **list
of typed components**, not a single value.)*

**Flaming Sphere** — 2nd conjuration · 1 action · 60 ft · V, S, M · **conc,
1 minute**. A **5-ft-diameter** sphere. Any creature **ending its turn within
5 ft** saves DEX, **2d6 fire**, half on success. **Bonus action to move it
30 ft**; ramming a creature forces the save and **stops the sphere's movement**.
Crosses barriers up to 5 ft tall and pits up to 10 ft wide. Ignites unattended
flammables; bright light 20 ft, dim 20 ft more. ↑ **+1d6** per slot above 2nd.

**Flesh to Stone** — 6th transmutation · 1 action · 60 ft · V, S, M · **conc,
1 minute**. Flesh-bodied creature, save CON: failure → **restrained**.
**CON save at the end of each of its turns; three successes end the spell,
three failures mean petrified for the duration** (non-consecutive; track both).
**Physical breakage while petrified causes matching deformities on reverting.**
**Concentrating for the full duration makes the petrification permanent** until
removed.
*(A third three-strikes counter, after death saves and *Contagion*. Worth one
shared primitive.)*

**Floating Disk** — 1st conjuration **(R)** · 1 action · 30 ft · V, S, M ·
**1 hour**. A **3-ft-diameter, 1-inch-thick** plane of force floating 3 ft up,
carrying **up to 500 lb** — **exceeding it ends the spell** and everything
falls. Immobile while you are within 20 ft; otherwise it follows to stay within
20 ft. **Cannot cross an elevation change of 10 ft or more.** Ends if you move
**more than 100 ft** from it.

**Fly** — 3rd transmutation · 1 action · Touch · V, S, M · **conc, 10 minutes**.
**Flying speed 60 ft**; **the target falls when it ends** if still aloft.
↑ one additional creature per slot above 3rd.

**Fog Cloud** — 1st conjuration · 1 action · 120 ft · V, S · **conc, 1 hour**.
**20-ft-radius sphere**, spreads around corners, **heavily obscured**.
**Dispersed by wind of ≥10 mph.** ↑ **radius +20 ft** per slot above 1st.

**Forbiddance** — 6th abjuration **(R)** · **10 minutes** · Touch · V, S,
**M\*** (holy water, rare incense and **powdered ruby ≥1,000 gp**) · **1 day**.
Wards up to **40,000 sq ft of floor, 30 ft high** against **teleportation,
portals and all planar travel** (Astral, Ethereal, Feywild, Shadowfell,
*plane shift*). Choose one or more of **celestials, elementals, fey, fiends,
undead**: they take **5d10 radiant or necrotic (your choice at cast time)** on
entering first time on a turn or starting there. **A password exempts a speaker
from the damage.** **Cannot overlap another *forbiddance*.** **Cast daily for
30 days → permanent**, consuming the components on the last casting.

**Forcecage** — 7th evocation · 1 action · 100 ft · V, S, **M\*** (ruby dust
worth **1,500 gp**) · **1 hour**. Choose a **cage** (up to 20 ft per side, ½-inch
bars ½ inch apart) or a **solid box** (up to 10 ft per side, blocking all matter
and all spells in or out). Creatures **fully inside** are trapped; those
partially inside or too large are **pushed out**. Escape by teleport or planar
travel requires a **CHA save**; **failure wastes the effect**. **Extends into
the Ethereal Plane.** **Cannot be dispelled by *dispel magic*.**

**Foresight** — 9th divination · **1 minute** · Touch · V, S, M · **8 hours**
(no concentration). The target **cannot be surprised**, has **advantage on
attack rolls, ability checks and saving throws**, and **other creatures have
disadvantage on attack rolls against it**. **Ends immediately if you cast it
again.**

**Freedom of Movement** — 4th abjuration · 1 action · Touch · V, S, M ·
**1 hour**. Movement **unaffected by difficult terrain**; magic **cannot reduce
the target's speed or paralyse or restrain it**; **5 ft of movement automatically
escapes nonmagical restraints** (manacles, a grapple); **no underwater penalties
to movement or attacks**.
*(An immunity expressed as "effects of category X cannot apply" — the condition
system needs prevention, not only removal.)*

**Freezing Sphere** — 6th evocation · 1 action · 300 ft · V, S, M ·
Instantaneous. **60-ft-radius sphere**, save CON, **10d6 cold**, half on
success. Striking water **freezes it 6 inches deep over a 30-ft square for
1 minute**, trapping surface swimmers (escape: action, **STR check vs. your
spell save DC**). **You may hold the globe instead** — it can be thrown 40 ft or
slung at normal sling range, detonating on impact, or **set down; it explodes on
its own after 1 minute**. ↑ **+1d6** per slot above 6th.
*(A spell whose effect can be **stored as a physical object and handed to
another player** — a genuine multiplayer inventory interaction.)*

---

## G

**Gaseous Form** — 3rd transmutation · 1 action · Touch · V, S, M · **conc,
1 hour**. A willing creature and its gear become a misty cloud; **ends at 0 HP**;
**no effect on incorporeal creatures**. **Flying speed 10 ft only**; may occupy
another creature's space; **resistance to nonmagical damage**; **advantage on
STR, DEX and CON saves**; passes through cracks but **treats liquids as solid**;
**cannot fall** and hovers even while incapacitated. **Cannot talk, manipulate
objects, attack or cast spells**, and carried objects are inaccessible.

**Gate** — 9th conjuration · 1 action · 60 ft · V, S, **M\*** (diamond
**≥5,000 gp**) · **conc, 1 minute**. A **5–20 ft diameter** portal to a precise
location on another plane, oriented as you choose. **Travel only through the
front.** **Deities and planar rulers can prevent it opening in their domains.**
Naming a **specific creature** (no pseudonyms or titles) on another plane
**draws it through**; **you gain no power over it**.

**Geas** — 5th enchantment · **1 minute** · 60 ft · **V only** · **30 days**.
A creature **that can understand you**, save WIS or **charmed**. It takes
**5d10 psychic each time it acts directly counter to your instructions, at most
once per day**. **A suicidal command ends the spell.** Ended by your action, or
by *remove curse*, *greater restoration* or *wish*.
↑ **7th–8th → 1 year · 9th → until ended by one of those spells**.

**Gentle Repose** — 2nd necromancy **(R)** · 1 action · Touch · V, S, M
(**salt and a copper piece on each eye, which must remain for the duration**) ·
**10 days**. Protects remains from decay and from becoming undead, and **days
under this spell do not count against the time limit of *raise dead***.
*(An effect that pauses another effect's clock — the raise-dead deadline is a
countdown that can be suspended.)*

**Giant Insect** — 4th transmutation · 1 action · 30 ft · V, S · **conc,
10 minutes**. Transform **ten centipedes, three spiders, five wasps, or one
scorpion** into giant versions. They **obey verbal commands and act on your turn
each round**. Ends per creature at 0 HP or by your action.

**Glibness** — 8th transmutation · 1 action · Self · **V only** · **1 hour**.
**When you make a Charisma check you may replace the roll with a 15.**
**Magic that detects lies always reports you as truthful.**
*(A **roll replacement**, distinct from a bonus, a reroll or advantage — a
fourth kind of roll modification.)*

**Globe of Invulnerability** — 6th abjuration · 1 action · **Self (10-ft
radius)** · V, S, M (a bead that **shatters when the spell ends**) · **conc,
1 minute**. **Any spell of 5th level or lower cast from outside cannot affect
anything inside** — **even if cast with a higher slot** (i.e. the comparison is
against the **spell's own level**, not the slot). Areas are excluded from the
interior. ↑ **blocks one level higher** per slot above 6th.
*(Contrast *Counterspell* and *Dispel Magic*, which compare against the **slot**
used. Both "spell level" and "slot level" are separately meaningful, so a cast
record must carry both.)*

**Glyph of Warding** — 3rd abjuration · **1 hour** · Touch · V, S, **M\*\***
(incense and **powdered diamond ≥200 gp, consumed**) · **Until dispelled or
triggered**. Inscribe on a surface (**≤10 ft across**) or inside a closable
object (**moved more than 10 ft → the glyph breaks and the spell ends
untriggered**). Found only with an **INT (Investigation) check vs. your spell
save DC**. You author the **trigger** — touching, standing on, uncovering,
approaching within a distance, opening, reading — and may refine it by
**physical characteristics (height, weight), creature kind, or alignment**, and
set **password exemptions**.
*Explosive Runes* — **20-ft-radius sphere**, spreads around corners, save DEX,
**5d8 acid, cold, fire, lightning or thunder (chosen at creation)**, half on
success.
*Spell Glyph* — store a **prepared spell of 3rd level or lower** (cast, and its
slot spent, as part of creating the glyph) that targets **a single creature or
an area**. On trigger it is cast at the triggering creature or centred on it;
**summons and traps appear next to the intruder and attack**; **a concentration
spell runs its full duration** without anyone concentrating.
↑ explosive runes **+1d8** per slot above 3rd; a spell glyph may store **any
spell of level ≤ the slot used**.
*(The single strongest evidence for a general **trigger/condition language** —
this is a player-authored event handler with a predicate and a stored payload.)*

**Goodberry** — 1st transmutation · 1 action · Touch · V, S, M ·
Instantaneous. **Ten berries**; eating one is an **action** and restores
**1 hit point** and **a full day's nourishment**. **Lose potency after
24 hours.**
*(Directly feeds the food clock from `06-core-rules.md` §8.)*

**Grease** — 1st conjuration · 1 action · 60 ft · V, S, M · **1 minute** (no
concentration). A **10-ft square** of difficult terrain. Creatures there when it
appears, **and any creature entering or ending its turn there**, save DEX or
fall **prone**.

**Greater Invisibility** — 4th illusion · 1 action · Touch · V, S · **conc,
1 minute**. The target and its carried gear become invisible. *(No "ends when
you attack" clause — unlike *Invisibility*.)*

**Greater Restoration** — 5th abjuration · 1 action · Touch · V, S, **M\*\***
(diamond dust **≥100 gp, consumed**) · Instantaneous. **Reduce exhaustion by one
level**, or end **one** of:
· one effect that **charmed or petrified** the target
· one **curse**, including **attunement to a cursed magic item**
· **any reduction to an ability score**
· one effect **reducing the hit point maximum**
*(Enumerates four distinct debuff categories the state model must be able to
name and remove individually.)*

**Guardian of Faith** — 4th conjuration · 1 action · 30 ft · **V only** ·
**8 hours**. A Large spectral guardian. A hostile creature **moving within 10 ft
for the first time on a turn** saves DEX, **20 radiant** (a **flat value**, not
dice), half on success. **Vanishes after dealing a total of 60 damage.**
*(A **damage budget** as the termination condition — an effect with a
cumulative-output resource.)*

**Guards and Wards** — 6th abjuration · **10 minutes** · Touch · V, S, **M\***
(various, plus a **silver rod ≥10 gp**) · **24 hours**. Wards **2,500 sq ft of
floor, up to 20 ft tall**, freely shaped and divisible across storeys.
Designate exempt individuals and a **password**. Effects:
· *Corridors* — fog, **heavily obscured**; **50% chance** at each junction that a
  creature believes it is going the opposite way
· *Doors* — magically locked as *arcane lock*; **up to ten** disguised as walls
  (as *minor illusion*'s illusory object)
· *Stairs* — filled with webs as *web*; **regrow in 10 minutes** if burned or
  torn
· *Other Spell Effect* — **one** of: *dancing lights* in four corridors with a
  repeating program; *magic mouth* in two locations; *stinking cloud* in two
  locations (**returning within 10 minutes** if dispersed); a constant *gust of
  wind* in one corridor; a *suggestion* delivered to anyone entering a chosen
  **5-ft square**
The whole area radiates magic; **a successful *dispel magic* removes only the
one effect targeted**. **Cast daily for one year → permanent.**

**Guidance** — Divination cantrip · 1 action · Touch · V, S · **conc,
1 minute**. **Once** before it ends, the target adds **1d4 to one ability check
of its choice**, and **may roll the die before or after making the check**.
Then the spell ends.
*(Explicitly permits deciding **after** seeing the d20 — the post-roll
modification window from `99-open-questions.md` Q3 applies to a **cantrip**, not
just class features. It is unavoidable.)*

**Guiding Bolt** — 1st evocation · 1 action · 120 ft · V, S · **1 round**.
Ranged spell atk, **4d6 radiant**, and **the next attack roll against the target
before the end of your next turn has advantage**. ↑ **+1d6** per slot above 1st.

**Gust of Wind** — 2nd evocation · 1 action · **Self (60-ft line, 10 ft wide)**
· V, S, M · **conc, 1 minute**. Creatures **starting their turn** in the line
save STR or are **pushed 15 ft** along it. Moving toward you costs **2 ft per
foot**. Disperses gas and vapour; **extinguishes unprotected flames**, and
**50% chance** for protected ones. **Bonus action to change the direction.**

---

## H

**Hallow** — 5th evocation · **24 hours** · Touch · V, S, **M\*\*** (herbs, oils
and incense **≥1,000 gp, consumed**) · **Until dispelled**. Radius up to
**60 ft**; **fails if it would overlap another *hallow***.
**Base effect:** celestials, elementals, fey, fiends and undead **cannot enter**,
nor **charm, frighten or possess** anyone inside, and existing such effects
**end on entering**. You may **exclude** any of those types.
**Plus one bound extra effect**, applicable to all creatures, to followers of a
deity or leader, or to a specified sort. An affected creature entering first time
on a turn or starting there may make a **CHA save to ignore the extra effect
until it leaves**. Options: *Courage* (cannot be frightened) · *Darkness*
(**normal light and magical light from lower-level spells than your slot cannot
illuminate**) · *Daylight* (converse) · *Energy Protection* (**resistance to one
damage type except bludgeoning/piercing/slashing**) · *Energy Vulnerability*
(converse) · *Everlasting Rest* (interred bodies cannot become undead) ·
*Extradimensional Interference* · *Fear* · *Silence* · *Tongues*.

**Hallucinatory Terrain** — 4th illusion · **10 minutes** · 300 ft · V, S, M ·
**24 hours**. Make natural terrain in a **150-ft cube** look, sound and smell
like other natural terrain. **Structures, equipment and creatures are
unchanged**, and **tactile characteristics are unchanged**. Disbelief:
**INT (Investigation) check vs. your spell save DC**.

**Harm** — 6th necromancy · 1 action · 60 ft · V, S · Instantaneous.
save CON, **14d6 necrotic**, half on success. **Cannot reduce the target below
1 HP.** On a failed save the target's **hit point maximum is reduced by the
damage taken for 1 hour**; **anything that removes a disease restores it
early**.

**Haste** — 3rd transmutation · 1 action · 30 ft · V, S, M · **conc, 1 minute**.
A willing creature: **speed doubled**, **+2 AC**, **advantage on DEX saves**, and
**one additional action each turn** usable only for **Attack (one weapon attack
only), Dash, Disengage, Hide, or Use an Object**. **When it ends the target
cannot move or act until after its next turn.**

**Heal** — 6th evocation · 1 action · 60 ft · V, S · Instantaneous.
**Regain 70 hit points** (a flat value). **Ends blindness, deafness and any
diseases.** **No effect on constructs or undead.** ↑ **+10** per slot above 6th.

**Healing Word** — 1st evocation · **1 bonus action** · 60 ft · **V only** ·
Instantaneous. **1d4 + your spellcasting ability modifier** HP. No effect on
undead or constructs. ↑ **+1d4** per slot above 1st.

**Heat Metal** — 2nd transmutation · 1 action · 60 ft · V, S, M · **conc,
1 minute**. A manufactured metal object (a weapon, medium or heavy metal
armour). Anyone **in physical contact** takes **2d8 fire** on casting, and again
whenever you spend a **bonus action** on later turns. A creature holding or
wearing it saves **CON or drops it**; **if it does not drop it, it has
disadvantage on attack rolls and ability checks until the start of your next
turn**.
*(Targets an **item**, and its effect depends on who is **wearing or wielding**
that item — the inventory model must support "who has this equipped" as a
queryable relation.)*

**Hellish Rebuke** — 1st evocation · **1 reaction, taken in response to being
damaged by a creature within 60 ft that you can see** · 60 ft · V, S ·
Instantaneous. save DEX, **2d10 fire**, half on success. ↑ **+1d10** per slot
above 1st.

**Heroes' Feast** — 6th conjuration · **10 minutes** · 30 ft · V, S, **M\*\***
(gem-encrusted bowl **≥1,000 gp, consumed**) · Instantaneous.
**Takes 1 hour to consume; benefits begin only when the hour is over.**
Up to **twelve other creatures**. Each: **cured of all diseases and poison**,
**immune to poison and to being frightened**, **advantage on all WIS saves**,
and **hit point maximum +2d10 with the same number of hit points gained**.
**Lasts 24 hours.**

**Heroism** — 1st enchantment · 1 action · Touch · V, S · **conc, 1 minute**.
**Immune to being frightened**, and gains **temporary HP equal to your
spellcasting ability modifier at the start of each of its turns**. Remaining
temporary HP from this spell is **lost when it ends**. ↑ one additional target
per slot above 1st.
*(Temporary HP that **refreshes every round** and is **tagged to its source** so
it can be stripped — the tempHP field needs provenance, not just a number.)*

**Hideous Laughter** — 1st enchantment · 1 action · 30 ft · V, S, M · **conc,
1 minute**. save WIS or **fall prone, incapacitated, and unable to stand**.
**No effect on INT ≤ 4.** New WIS save **at the end of each of its turns and
each time it takes damage** — **with advantage if the save was triggered by
damage**.

**Hold Monster** — 5th enchantment · 1 action · 90 ft · V, S, M · **conc,
1 minute**. save WIS or **paralyzed**. **No effect on undead.** WIS save at the
end of each of its turns to end. ↑ one additional target per slot above 5th,
**all within 30 ft of each other**.

**Hold Person** — 2nd enchantment · 1 action · 60 ft · V, S, M · **conc,
1 minute**. **Humanoid** only; otherwise identical to *Hold Monster*.
↑ one additional humanoid per slot above 2nd, **all within 30 ft of each other**.

**Holy Aura** — 8th abjuration · 1 action · Self · V, S, **M\*** (reliquary
**≥1,000 gp** containing a sacred relic) · **conc, 1 minute**. Chosen creatures
within **30 ft** at cast time shed **dim light 5 ft**, have **advantage on all
saving throws**, and **others have disadvantage on attack rolls against them**.
When a **fiend or undead hits an affected creature with a melee attack**, it
saves **CON or is blinded until the spell ends**.

**Hunter's Mark** — 1st **divination** · **1 bonus action** · 90 ft · **V only**
· **conc, 1 hour**. **+1d6 damage whenever you hit the target with a weapon
attack**, and **advantage on WIS (Perception) and WIS (Survival) checks to find
it**. **If the target drops to 0 HP you may re-mark a new creature as a bonus
action.** ↑ **3rd–4th → conc 8 hours · 5th+ → conc 24 hours** (duration only —
the damage never scales).

**Hypnotic Pattern** — 3rd illusion · 1 action · 120 ft · **S, M** (no verbal) ·
**conc, 1 minute**. A **30-ft cube**; creatures **that see it** save WIS or are
**charmed, incapacitated, and speed 0**. **Ends for a creature that takes any
damage, or if another creature uses its action to shake it out of it.**

---

## I

**Ice Storm** — 4th evocation · 1 action · 300 ft · V, S, M · Instantaneous.
A **20-ft-radius, 40-ft-high cylinder**. save DEX, **2d8 bludgeoning *and*
4d6 cold**, half on success. **Difficult terrain until the end of your next
turn.** ↑ **bludgeoning +1d8** per slot above 4th (**the cold does not scale**).

**Identify** — 1st divination **(R)** · **1 minute** · Touch · **M\*** (pearl
**≥100 gp** and an owl feather — **not consumed**) · Instantaneous.
On an object: **its properties and how to use them, whether it needs attunement,
how many charges it has**, what spells affect it, and **which spell created it**.
On a creature: **what spells are currently affecting it**.
*(The natural "inspect item" action in a HUD — and it names exactly the fields a
magic item record must expose.)*

**Illusory Script** — 1st illusion **(R)** · 1 minute · Touch · **S, M\*\***
(lead-based ink **≥10 gp, consumed**) · **10 days**. Writing legible to you and
designated creatures; **unintelligible to everyone else**, or **replaced by a
different message in a different hand and a language you know**.
**Dispelling destroys both the original script and the illusion.**
**Truesight reads the hidden message.**

**Imprisonment** — 9th abjuration · **1 minute** · 30 ft · V, S, **M\***
(a likeness of the target, plus a version-specific component worth **≥500 gp per
Hit Die of the target** — a component cost that **scales with the target**) ·
**Until dispelled**. save WIS or bound; **a success grants permanent immunity to
your future castings**. While bound: **no need to breathe, eat or drink; does not
age; undetectable by divination**. Versions: *Burial* (a sphere of force deep
underground; mithral orb) · *Chaining* (**restrained**, immovable; fine chain of
precious metal) · *Hedged Prison* (a warded demiplane; jade miniature) ·
*Minimus Containment* (**shrunk to 1 inch inside a gemstone** that light passes
through but nothing else, and **cannot be cut or broken**; a large transparent
gem) · *Slumber* (asleep and unwakeable; rare soporific herbs).
**Ending condition** authored at cast time — the GM must agree it is reasonable
and plausible; it **may reference name, identity or deity** but otherwise must
rest on **observable actions or qualities, never intangibles like level, class
or hit points**. **Only a 9th-level *dispel magic*** on the prison or the
component ends it. **One prison per component**; reusing it frees the previous
prisoner.

**Incendiary Cloud** — 8th conjuration · 1 action · 150 ft · V, S · **conc,
1 minute**. **20-ft-radius sphere**, spreads around corners, **heavily
obscured**; **dispersed by wind ≥10 mph**. save DEX, **10d8 fire**, half on
success, **on appearing, on entering first time on a turn, and on ending a turn
there**. **Moves 10 ft directly away from you** at the start of each of your
turns, in a direction you choose.

**Inflict Wounds** — 1st necromancy · 1 action · Touch · V, S · Instantaneous.
Melee spell atk, **3d10 necrotic**. ↑ **+1d10** per slot above 1st.

**Insect Plague** — 5th conjuration · 1 action · 300 ft · V, S, M · **conc,
10 minutes**. **20-ft-radius sphere**, spreads around corners, **lightly
obscured** and **difficult terrain**. save CON, **4d10 piercing**, half on
success, on appearing / entering / ending a turn there. ↑ **+1d10** per slot
above 5th.

**Instant Summons** — 6th conjuration **(R)** · 1 minute · Touch · V, S, **M\***
(sapphire worth **1,000 gp** — **a different one per casting**) · **Until
dispelled**. Mark an object **≤10 lb and ≤6 ft in its longest dimension**.
Later, **action** to speak its name and **crush the sapphire**: it appears in
your hand **across any distance or plane**. **If another creature holds it, it
does not come — instead you learn who has it and roughly where they are.**
*(A multiplayer inventory interaction with a built-in theft-detection
consolation prize.)*

**Invisibility** — 2nd illusion · 1 action · Touch · V, S, M · **conc, 1 hour**.
Target and carried gear invisible. **Ends for a target that attacks or casts a
spell.** ↑ one additional creature per slot above 2nd.

**Irresistible Dance** — 6th enchantment · 1 action · 30 ft · **V only** ·
**conc, 1 minute**. **Creatures that can't be charmed are immune.** The target
**uses all its movement to dance in place**, has **disadvantage on DEX saves and
attack rolls**, and **others have advantage on attack rolls against it**.
**Action to make a WIS save to end it.**
*(Note there is **no save on the initial application** — only an ongoing one.)*

---

## J–K

**Jump** — 1st transmutation · 1 action · Touch · V, S, M · **1 minute**.
**Jump distance tripled.** *(A multiplier on the derived long/high jump stats
from `06-core-rules.md` §7.)*

**Knock** — 2nd transmutation · 1 action · 60 ft · **V only** · Instantaneous.
Unlocks, unsticks or unbars a target; **only one lock if there are several**;
**suppresses *arcane lock* for 10 minutes**. **A loud knock audible up to 300 ft
away.**

---

## L

**Legend Lore** — 5th divination · **10 minutes** · Self · V, S, **M\*\***
(incense **≥250 gp, consumed**, plus **four ivory strips ≥50 gp each**) ·
Instantaneous. A summary of significant lore about a named person, place or
object. **Nothing if it is not of legendary importance.** **The more you already
know, the more precise the answer**; accurate but possibly figurative.

**Lesser Restoration** — 2nd abjuration · 1 action · Touch · V, S ·
Instantaneous. End **one disease** or **one condition** from:
**blinded, deafened, paralyzed, poisoned**.

**Levitate** — 2nd transmutation · 1 action · 60 ft · V, S, M · **conc,
10 minutes**. A creature or object **up to 500 lb** rises **up to 20 ft** and
hangs there. **Unwilling creatures save CON to negate.** The target moves only
by pushing or pulling against a fixed surface, **as if climbing**. You may
change its altitude by **20 ft** on your turn — as part of your move if you are
the target, otherwise with your **action**, and it must stay in range.
**Floats gently down when the spell ends.**

**Light** — Evocation cantrip · 1 action · Touch · **V, M** (no somatic) ·
**1 hour**. An object **≤10 ft in any dimension** sheds **bright light 20 ft,
dim 20 ft more**, in a colour you choose. **Blocked by opaque covering.** Ends
if recast or dismissed as an action. **An object held or worn by a hostile
creature allows a DEX save to avoid it.**

**Lightning Bolt** — 3rd evocation · 1 action · **Self (100-ft line, 5 ft
wide)** · V, S, M · Instantaneous. save DEX, **8d6 lightning**, half on success.
Ignites unattended flammables. ↑ **+1d6** per slot above 3rd.

**Locate Animals or Plants** — 2nd divination **(R)** · 1 action · Self ·
V, S, M · Instantaneous. **Direction and distance to the nearest** creature or
plant of a named kind **within 5 miles**.

**Locate Creature** — 4th divination · 1 action · Self · V, S, M · **conc,
1 hour**. **Direction** (and direction of movement) to a familiar creature
within **1,000 ft**. Either a **specific creature you know**, or the **nearest of
a kind you have seen within 30 ft at least once**. **Fails if the creature is in
a different form** (e.g. *polymorph*ed) or if **running water ≥10 ft wide**
blocks the path.

**Locate Object** — 2nd divination · 1 action · Self · V, S, M · **conc,
10 minutes**. As above for an object within **1,000 ft**; specific-and-seen or
nearest-of-a-kind. **Blocked by any thickness of lead.**

**Longstrider** — 1st transmutation · 1 action · Touch · V, S, M · **1 hour**.
**Speed +10 ft.** ↑ one additional creature per slot above 1st.

---

## M

**Mage Armor** — 1st abjuration · 1 action · Touch · V, S, M · **8 hours**.
A willing creature **not wearing armour**: **base AC becomes 13 + DEX
modifier**. **Ends if the target dons armour** or you dismiss it as an action.
*(A **competing AC base provider** — the fifth so far, alongside armour,
Unarmoured Defense (barbarian), Unarmoured Defense (monk), and Draconic
Resilience. Confirms AC needs a "highest base wins" resolution.)*

**Mage Hand** — Conjuration cantrip · 1 action · 30 ft · V, S · **1 minute**.
A spectral hand; vanishes beyond 30 ft or on a recast. **Action to control**;
move it **30 ft** per use. Can manipulate an object, open an **unlocked** door or
container, stow or retrieve from an **open** container, pour out a vial.
**Cannot attack, activate magic items, or carry more than 10 lb.**

**Magic Circle** — 3rd abjuration · **1 minute** · 10 ft · V, S, **M\*\***
(holy water or powdered silver and iron **≥100 gp, consumed**) · **1 hour**.
A **10-ft-radius, 20-ft-tall cylinder**. Against chosen types (**celestials,
elementals, fey, fiends, undead**): **cannot willingly enter by nonmagical
means** (teleport/planar entry requires a **CHA save**); **disadvantage on attack
rolls against targets inside**; targets inside **cannot be charmed, frightened or
possessed** by them. **Reversible** — trap them in and protect those outside.
↑ **+1 hour** per slot above 3rd.

**Magic Jar** — 6th necromancy · **1 minute** · Self · V, S, **M\*** (ornamental
container **≥500 gp**) · **Until dispelled**. Your body falls catatonic; your
soul enters the container, aware but **unable to move or use reactions**. Your
only action is to **project up to 100 ft** — either back to your body (ending
the spell) or to **possess a humanoid** (save CHA; **success grants 24-hour
immunity**). **Warded by *protection from evil and good* or *magic circle***.
While possessing: **their statistics, your alignment and INT/WIS/CHA**, **your
class features but not theirs**; the host's soul sits in the container, sensing
but unable to act. If the host body **dies**, so does the host, and you make a
**CHA save against your own spell save DC** — success returns you to the
container within 100 ft, **failure kills you**. If the container is destroyed or
the spell ends your soul returns; **you die if your body is over 100 ft away or
dead**. **When the spell ends the container is destroyed.**

**Magic Missile** — 1st evocation · 1 action · 120 ft · V, S · Instantaneous.
**Three darts**, each **1d4 + 1 force**, **no attack roll and no save**,
distributed as you like; **all strike simultaneously**. ↑ **+1 dart** per slot
above 1st.
*(The canonical "automatic hit" shape — the roll pipeline must support an attack
with neither an attack roll nor a save.)*

**Magic Mouth** — 2nd illusion **(R)** · 1 minute · 30 ft · V, S, **M\*\***
(honeycomb and **jade dust ≥10 gp, consumed**) · **Until dispelled**.
A **≤25-word** message (deliverable over up to 10 minutes) implanted in an
unattended object, spoken in your voice and volume when a trigger fires.
**One-shot or repeating**, your choice. The trigger may be as general or
detailed as you like but must rest on **visual or audible conditions within
30 ft of the object**.
*(A second player-authored trigger, after *Glyph of Warding*, with an explicit
**sensory scope** constraint on the predicate.)*

**Magic Weapon** — 2nd transmutation · **1 bonus action** · Touch · V, S ·
**conc, 1 hour**. A nonmagical weapon becomes magical with **+1 to attack and
damage rolls**. ↑ **4th → +2 · 6th → +3** — a **tiered**, not linear, upcast.

**Magnificent Mansion** — 7th conjuration · 1 minute · 300 ft · V, S, **M\***
(three items **≥5 gp each**) · **24 hours**. An extradimensional dwelling with
one **5 × 10 ft** shimmering entrance, openable and closable from within 30 ft
and **invisible while closed**. Up to **50 cubes of 10 ft per side**, furnished
as you choose, with **food for a nine-course banquet for 100** and **100
near-transparent obedient servants** who can do anything a human servant could
but **cannot attack or directly harm**, and **cannot leave**. **Objects created
by the spell dissipate if removed.** Occupants are **expelled to the nearest
open space** when it ends.

**Major Image** — 3rd illusion · 1 action · 120 ft · V, S, M · **conc,
10 minutes**. An image up to a **20-ft cube**, with **sound, smell and
temperature**, but **never enough to deal damage, deafen, or sicken**.
**Action to move it** anywhere in range and alter its appearance and sounds to
match. **Physical interaction reveals it**; an **action to examine** plus an
**INT (Investigation) check vs. your spell save DC** discerns it, after which the
creature **sees through it**. ↑ **6th+ → lasts until dispelled, no
concentration**.

**Mass Cure Wounds** — 5th evocation · 1 action · 60 ft · V, S · Instantaneous.
**Up to six creatures** in a **30-ft-radius sphere**, each **3d8 + your
spellcasting ability modifier**. No effect on undead or constructs.
↑ **+1d8** per slot above 5th.

**Mass Heal** — 9th evocation · 1 action · 60 ft · V, S · Instantaneous.
**Restore up to 700 hit points, divided as you choose** among any number of
creatures in range; also **cures all diseases and any blindness or deafness**.
No effect on undead or constructs.
*(A **divisible healing pool** — the caster allocates a budget across targets,
which is an interactive allocation UI, not a simple roll.)*

**Mass Healing Word** — 3rd evocation · **1 bonus action** · 60 ft · **V only**
· Instantaneous. **Up to six creatures**, each **1d4 + your spellcasting ability
modifier**. ↑ **+1d4** per slot above 3rd.

**Mass Suggestion** — 6th enchantment · 1 action · 60 ft · **V, M** (no somatic)
· **24 hours**. Up to **twelve** creatures that can **hear and understand** you;
**immune if they can't be charmed**. A **one-or-two-sentence** course of action
that must **sound reasonable** — **an obviously harmful command automatically
negates the spell**. save WIS or pursue it; **ends early when the task is
finished**. May include a **conditional trigger** ("give your money to the first
beggar you meet"); **unmet conditions simply never fire**. **Damage from you or
your companions ends it for that creature.** ↑ **7th → 10 days · 8th → 30 days ·
9th → a year and a day**.

**Maze** — 8th conjuration · 1 action · 60 ft · V, S · **conc, 10 minutes**.
Banish a creature to a labyrinthine demiplane. **Action to attempt escape:
DC 20 INT check** (minotaurs and goristro demons **succeed automatically**). On
ending it reappears in the space it left, or the nearest free one.
*(No saving throw at all — an unavoidable effect resisted only by escaping.)*

**Meld into Stone** — 3rd transmutation **(R)** · 1 action · Touch · V, S ·
**8 hours**. Merge with a stone object large enough to contain you, along with
your equipment; **undetectable by nonmagical senses**. You **cannot see out**,
**hear at disadvantage**, remain aware of time, and **can cast spells on
yourself**. Leaving ends the spell; you **cannot otherwise move**. **Partial
destruction or reshaping expels you for 6d6 bludgeoning; complete destruction or
transmutation expels you for 50 bludgeoning**, and you **fall prone**.

**Mending** — Transmutation cantrip · **1 minute** · Touch · V, S, M ·
Instantaneous. Repairs **one break or tear ≤1 foot in any dimension**, leaving
no trace. **Can physically repair a magic item or construct but cannot restore
its magic.**

**Message** — Transmutation cantrip · 1 action · 120 ft · V, S, M · **1 round**.
A whispered message to one target, who **can reply in a whisper only you hear**.
Works through solid objects if you know the target is beyond them. **Blocked by
magical silence, 1 ft stone, 1 inch common metal, a thin sheet of lead, or 3 ft
wood.** **Travels around corners** — it need not follow a straight line.

**Meteor Swarm** — 9th evocation · 1 action · **1 mile** · V, S ·
Instantaneous. **Four** separate **40-ft-radius spheres**, spreading around
corners. save DEX, **20d6 fire *and* 20d6 bludgeoning**, half on success.
**A creature in more than one burst is affected only once.** Ignites unattended
flammables.

**Mind Blank** — 8th abjuration · 1 action · Touch · V, S · **24 hours**.
Immune to **psychic damage**, **any emotion-sensing or thought-reading effect**,
**divination spells**, and the **charmed** condition. **Explicitly foils *wish***
and comparable effects aimed at the target's mind or information about them.

**Minor Illusion** — Illusion cantrip · 1 action · 30 ft · **S, M** (no verbal)
· **1 minute**. **Either** a sound **or** an image of an object (not both).
Sound ranges from a whisper to a scream, continuous or in discrete bursts.
An object image is **≤5-ft cube** and **creates no sound, light, smell or other
sensory effect**. **Physical interaction reveals it**; **action + INT
(Investigation) vs. your spell save DC** to discern it, after which it becomes
faint.

**Mirage Arcane** — 7th illusion · **10 minutes** · **Sight** · V, S ·
**10 days**. Terrain up to **1 mile square** looks, sounds, smells **and feels**
like other terrain; the **general shape is unchanged**. Structures may be
altered or **added**; **creatures are never disguised, concealed or added**.
Because it includes **tactile** elements it **can genuinely create or remove
difficult terrain**. Removed pieces **vanish**. **Truesight sees the true terrain
but the illusion's other elements persist and can still be physically
interacted with.**

**Mirror Image** — 2nd illusion · 1 action · Self · V, S · **1 minute** (no
concentration). **Three** duplicates. Each time a creature targets you with an
attack, **roll a d20**: with three duplicates **6+** redirects it, with two
**8+**, with one **11+**. A duplicate's **AC = 10 + your DEX modifier**;
**a hit destroys it**, and **only a hit can** — it ignores all other damage and
effects. **Immune:** anything that cannot see, relies on non-sight senses, or
has truesight.
*(A targeting-interception roll — a die rolled by the *defender* in the middle
of resolving the attacker's attack. Another networked mid-roll interaction.)*

**Mislead** — 5th illusion · 1 action · Self · **S only** · **conc, 1 hour**.
You turn **invisible** (**ending if you attack or cast a spell**) and an
**illusory double** appears. **Action** to move the double **twice your speed**
and make it act. **See and hear through it**; **bonus action to switch senses**;
**while using its senses you are blind and deaf to your own**.

**Misty Step** — 2nd conjuration · **1 bonus action** · Self · **V only** ·
Instantaneous. **Teleport up to 30 ft** to an unoccupied space you can see.

**Modify Memory** — 5th enchantment · 1 action · 30 ft · V, S · **conc,
1 minute**. save WIS (**advantage if you are fighting it**) or **charmed,
incapacitated and unaware**, though it can still hear you. **Any damage or being
targeted by another spell ends the spell with no memories changed.**
You may affect a memory of an event **within the last 24 hours lasting no more
than 10 minutes**: erase it, sharpen it, alter details, or **fabricate a
different event**. **You must describe it aloud in a language it understands**;
**if the spell ends before you finish, nothing changes**. A memory that
contradicts the creature's inclinations, alignment or beliefs **may simply be
dismissed**. Undone by *remove curse* or *greater restoration*.
↑ **6th → 7 days · 7th → 30 days · 8th → 1 year · 9th → any time in its past**.

**Moonbeam** — 2nd evocation · 1 action · 120 ft · V, S, M · **conc, 1 minute**.
A **5-ft-radius, 40-ft-high cylinder** of **dim light**. On entering first time
on a turn or starting there: save CON, **2d10 radiant**, half on success.
**Shapechangers save at disadvantage** and on a failure **instantly revert and
cannot change form until they leave the light**. **Action** to move the beam
**60 ft**. ↑ **+1d10** per slot above 2nd.

**Move Earth** — 6th transmutation · 1 action · 120 ft · V, S, M · **conc,
up to 2 hours**. Reshape dirt, sand or clay in an area **≤40 ft on a side** —
raise or lower elevation, dig a trench, raise a wall or pillar — by **at most
half the area's largest dimension**. **Takes 10 minutes to complete**, and you
may **pick a new area every 10 minutes**. Because it is slow, creatures are
**not trapped or injured**. **Cannot manipulate natural stone or stonework**;
structures shift and **may collapse if destabilised**; plants ride along.

---

## N–P

**Nondetection** — 3rd abjuration · 1 action · Touch · V, S, **M\*\*** (diamond
dust **25 gp, consumed**) · **8 hours**. Hides a willing creature, or a place or
object **≤10 ft in any dimension**, from **all divination magic and magical
scrying sensors**.

**Pass without Trace** — 2nd abjuration · 1 action · Self · V, S, M · **conc,
1 hour**. Chosen creatures within **30 ft** (including you) gain **+10 to DEX
(Stealth) checks**, **cannot be tracked except magically**, and **leave no
tracks or traces**.

**Passwall** — 5th transmutation · 1 action · 30 ft · V, S, M · **1 hour**.
A passage in wood, plaster or stone: **up to 5 ft wide, 8 ft tall, 20 ft deep**,
causing **no structural instability**. Occupants are **safely ejected** when it
closes.

**Phantasmal Killer** — 4th illusion · 1 action · 120 ft · V, S · **conc,
1 minute**. save WIS or **frightened**. **At the end of each of its turns**, a
further WIS save or **4d10 psychic**; **a success ends the spell**.
↑ **+1d10** per slot above 4th.

**Phantom Steed** — 3rd illusion **(R)** · 1 minute · 30 ft · V, S · **1 hour**.
A Large quasi-real steed with **saddle, bit and bridle** (which **vanish more
than 10 ft from the steed**). Uses **riding horse** statistics but **speed
100 ft**, travelling **10 miles per hour, or 13 at a fast pace**. **Fades over
1 minute** when the spell ends, giving the rider time to dismount. **Ends if
dismissed or if the steed takes any damage.**

**Planar Ally** — 6th conjuration · **10 minutes** · 60 ft · V, S ·
Instantaneous. Beseech a **known** cosmic entity; it sends a celestial,
elemental or fiend. **The creature is under no compulsion** — you must
**bargain**, and you must be able to communicate. Rule-of-thumb payment:
**100 gp per minute · 1,000 gp per hour · 10,000 gp per day (up to 10 days)**;
**halved or waived** if aligned with its ethos, **halved** for non-hazardous
tasks, **more** for especially dangerous ones. **Suicidal tasks are rarely
accepted.** Failure to agree sends it home immediately. **A creature that joins
the group takes a full share of experience points.**
*(Explicitly a **negotiation**, not a mechanic — the engine can only track the
gold and the contract; the outcome is DM adjudication.)*

**Planar Binding** — 5th abjuration · **1 hour** · 60 ft · V, S, **M\*\***
(jewel **≥1,000 gp, consumed**) · **24 hours**. The target (**celestial,
elemental, fey or fiend**) must remain in range for the whole casting — typically
held by an inverted *magic circle*. save CHA or **bound to serve**. **If it was
summoned by another spell, that spell's duration extends to match this one.**
It **obeys the letter of your instructions** and, if hostile, **twists your
words**. ↑ **6th → 10 days · 7th → 30 days · 8th → 180 days · 9th → a year and
a day**.

**Plane Shift** — 7th conjuration · 1 action · Touch · V, S, **M\*** (forked
metal rod **≥250 gp, attuned to a particular plane**) · Instantaneous.
You and **up to eight willing creatures linking hands** travel to a plane you
name in **general terms** — you arrive in or near it, at the GM's discretion.
Alternatively, travel to a **teleportation circle whose sigil sequence you
know**. **Offensive use:** melee spell atk against a creature in reach; on a hit
save CHA or be **banished to a random location on a plane you name**, left to
find its own way back.
*(The material component is **plane-specific** — an item whose identity encodes a
destination. Items can carry arbitrary typed parameters.)*

**Plant Growth** — 3rd transmutation · **1 action *or* 8 hours** · 150 ft ·
V, S · Instantaneous.
*1 action:* plants in a **100-ft radius** become overgrown — **4 ft of movement
per 1 ft moved** (worse than ordinary difficult terrain). **You may exclude
areas of any size.**
*8 hours:* plants in a **half-mile radius** are enriched for **1 year**, yielding
**double food when harvested**.
*(A spell with **two entirely different casting times producing different
effects** — casting time is a cast-time parameter like slot level.)*

**Poison Spray** — Conjuration cantrip · 1 action · **10 ft** · V, S ·
Instantaneous. save CON or **1d12 poison**. [cantrip-scale] 2d12/3d12/4d12.

**Polymorph** — 4th transmutation · 1 action · 60 ft · V, S, M · **conc,
1 hour**. Unwilling creatures save **WIS**. **No effect on a shapechanger or a
creature at 0 HP.** New form: **any beast of CR ≤ the target's CR (or level)**.
**All statistics including mental ability scores are replaced**; alignment and
personality are retained. **Assumes the new form's HP**; reverting restores the
prior HP, and **excess damage carries over** (without knocking it unconscious
unless it would drop the true form to 0). **Cannot speak, cast, or do anything
requiring hands or speech.** Gear melds in and is unusable.

**Power Word Kill** — 9th enchantment · 1 action · 60 ft · **V only** ·
Instantaneous. **If the target has 100 hit points or fewer, it dies.**
Otherwise **nothing happens**. **No save, no attack roll.**

**Power Word Stun** — 8th enchantment · 1 action · 60 ft · **V only** ·
Instantaneous. **If the target has 150 hit points or fewer, it is stunned**;
otherwise nothing. **CON save at the end of each of its turns** to end.

**Prayer of Healing** — 2nd evocation · **10 minutes** · 30 ft · **V only** ·
Instantaneous. **Up to six creatures**, each **2d8 + your spellcasting ability
modifier**. ↑ **+1d8** per slot above 2nd.

**Prestidigitation** — Transmutation cantrip · 1 action · 10 ft · V, S ·
**up to 1 hour**. One of: a harmless instantaneous sensory effect; light or snuff
a candle/torch/small campfire; clean or soil an object **≤1 cubic foot**; chill,
warm or flavour **1 cubic foot** of nonliving material for **1 hour**; make a
mark, colour or symbol appear for **1 hour**; create a nonmagical trinket or
hand-sized illusory image lasting **until the end of your next turn**.
**Up to three non-instantaneous effects active at once**, dismissible as an
action.
*(A cantrip that maintains a **bounded pool of concurrent instances** — three
independent effect instances from one spell.)*

**Prismatic Spray** — 7th evocation · 1 action · **Self (60-ft cone)** · V, S ·
Instantaneous. Every creature saves DEX; **roll a d8 per target** for the ray:

| d8 | Ray | Effect |
|---|---|---|
| 1 | Red | **10d6 fire**, half on success |
| 2 | Orange | **10d6 acid**, half on success |
| 3 | Yellow | **10d6 lightning**, half on success |
| 4 | Green | **10d6 poison**, half on success |
| 5 | Blue | **10d6 cold**, half on success |
| 6 | Indigo | **restrained**; then CON save each turn — **three successes ends it, three failures = permanently petrified** |
| 7 | Violet | **blinded**; WIS save at the start of your next turn — success ends the blindness, failure **transports it to another plane** |
| 8 | Special | **struck by two rays** — roll twice more, rerolling 8s |

*(A per-target random effect table with a **recursive** entry.)*

**Prismatic Wall** — 9th abjuration · 1 action · 60 ft · V, S · **10 minutes**.
A wall up to **90 × 30 × 1 inch**, or a **30-ft-diameter sphere**. **The spell
fails and the slot is wasted if it would pass through a creature's space.**
Sheds **bright light 100 ft, dim 100 ft more**. You and designated creatures pass
freely. Others coming **within 20 ft** or starting there save **CON or blinded
for 1 minute**. Passing through means a **DEX save against each of the seven
layers in turn**. Layers are destroyed **in order, red to violet**, each by its
own means; **a *rod of cancellation* destroys the whole wall; an *antimagic
field* has no effect on it.**

| # | Layer | On failed DEX save | Blocks | Destroyed by |
|---|---|---|---|---|
| 1 | Red | 10d6 fire (half on success) | nonmagical ranged attacks | ≥25 cold damage |
| 2 | Orange | 10d6 acid | magical ranged attacks | a strong wind |
| 3 | Yellow | 10d6 lightning | — | ≥60 force damage |
| 4 | Green | 10d6 poison | — | *passwall* or an equal/higher spell that opens a portal |
| 5 | Blue | 10d6 cold | — | ≥25 fire damage |
| 6 | Indigo | restrained → three-strikes CON, petrified on three failures | spells cast through the wall | bright light from *daylight* or an equal/higher spell |
| 7 | Violet | blinded → WIS save or **planar transport** | — | *dispel magic* or an equal/higher spell |

**Private Sanctum** — 4th abjuration · **10 minutes** · 120 ft · V, S, M ·
**24 hours**. A cube **5 to 100 ft** per side; action to dismiss. Choose any or
all: **sound cannot pass**; **the barrier is dark and foggy, blocking vision
including darkvision**; **divination sensors cannot enter or pass**; **creatures
inside cannot be targeted by divination**; **no teleportation in or out**;
**planar travel blocked**. **Cast daily for a year → permanent.**
↑ **cube +100 ft** per slot above 4th.

**Produce Flame** — Conjuration cantrip · 1 action · Self · V, S ·
**10 minutes**. A flame in your hand; **bright light 10 ft, dim 10 ft more**.
**Attacking with it ends the spell**: on casting or as an **action** later, hurl
it at a creature within **30 ft** — ranged spell atk, **1d8 fire**.
[cantrip-scale] 2d8/3d8/4d8.
*(A cantrip that is simultaneously a light source and a weapon, where using one
mode destroys the other.)*

**Programmed Illusion** — 6th illusion · 1 action · 120 ft · V, S, **M\***
(fleece and **jade dust ≥25 gp**) · **Until dispelled**. An imperceptible
illusion up to a **30-ft cube** with a scripted performance of **up to
5 minutes**, triggered by a condition **based on visual or audible conditions
within 30 ft**. **After performing it goes dormant for 10 minutes**, then can
fire again. Disbelief: **action + INT (Investigation) vs. your spell save DC**.
*(A third authored trigger, this one with a **cooldown**.)*

**Project Image** — 7th illusion · 1 action · **500 miles** · V, S, **M\***
(a replica of you **≥5 gp**) · **conc, up to 1 day**. An intangible illusory
copy at any location in range **you have seen before**, regardless of
obstacles. **Any damage destroys it and ends the spell.** **Action** to move it
**twice your speed** and make it act; see and hear through it; **bonus action to
switch senses**, blind and deaf to your own while using its. Disbelief as above.

**Protection from Energy** — 3rd abjuration · 1 action · Touch · V, S · **conc,
1 hour**. **Resistance to one of: acid, cold, fire, lightning, thunder.**

**Protection from Evil and Good** — 1st abjuration · 1 action · Touch · V, S,
**M\*\*** (holy water or powdered silver and iron, **consumed**) · **conc,
10 minutes**. Against **aberrations, celestials, elementals, fey, fiends and
undead**: they have **disadvantage on attack rolls** against the target; the
target **cannot be charmed, frightened or possessed** by them; and **existing
such effects grant advantage on any new saving throw**.

**Protection from Poison** — 2nd abjuration · 1 action · Touch · V, S ·
**1 hour**. **Neutralises one poison** (a known one, or one at random if several).
For the duration: **advantage on saves against being poisoned** and
**resistance to poison damage**.

**Purify Food and Drink** — 1st transmutation **(R)** · 1 action · 10 ft ·
V, S · Instantaneous. All nonmagical food and drink in a **5-ft-radius sphere**
becomes **free of poison and disease**.

---

## R

**Raise Dead** — 5th necromancy · **1 hour** · Touch · V, S, **M\*\*** (diamond
**≥500 gp, consumed**) · Instantaneous. **Dead no longer than 10 days**; soul
**willing and at liberty**. Returns at **1 hit point**. **Neutralises poisons and
cures nonmagical diseases** present at death, but **not magical diseases, curses
or similar** — those take effect on return. **Cannot raise an undead creature.**
**Closes mortal wounds but does not restore missing body parts**, and
**automatically fails if a part integral to survival (a head) is missing.**
**Ordeal penalty: −4 to all attack rolls, saving throws and ability checks,
reduced by 1 per long rest until gone.**
*(A **decaying penalty tied to the rest clock** — a modifier whose magnitude is a
function of long rests taken since an event.)*

**Ray of Enfeeblement** — 2nd necromancy · 1 action · 60 ft · V, S · **conc,
1 minute**. Ranged spell atk; on a hit the target **deals only half damage with
weapon attacks that use Strength**. **CON save at the end of each of its turns**
to end.

**Ray of Frost** — Evocation cantrip · 1 action · 60 ft · V, S ·
Instantaneous. Ranged spell atk, **1d8 cold**, and **speed −10 ft until the
start of your next turn**. [cantrip-scale] 2d8/3d8/4d8.

**Regenerate** — 7th transmutation · **1 minute** · Touch · V, S, M ·
**1 hour**. **4d8 + 15 hit points** immediately, then **1 HP at the start of each
of its turns (10 per minute)**. **Severed body parts regrow after 2 minutes**, or
**reattach instantly** if you hold the part to the stump.

**Reincarnate** — 5th transmutation · **1 hour** · Touch · V, S, **M\*\*** (rare
oils **≥1,000 gp, consumed**) · Instantaneous. A humanoid **dead no longer than
10 days** gets a **new adult body**, likely of a different race. GM rolls d100
(or chooses):

| d100 | Race |
|---|---|
| 01–04 | Dragonborn |
| 05–13 | Dwarf, hill |
| 14–21 | Dwarf, mountain |
| 22–25 | Elf, dark |
| 26–34 | Elf, high |
| 35–42 | Elf, wood |
| 43–46 | Gnome, forest |
| 47–52 | Gnome, rock |
| 53–56 | Half-elf |
| 57–60 | Half-orc |
| 61–68 | Halfling, lightfoot |
| 69–76 | Halfling, stout |
| 77–96 | Human |
| 97–00 | Tiefling |

**Retains all capabilities and memories**, but **swaps its racial traits for the
new race's**.
*(A spell that **rewrites a character's race**, so racial traits must be a
detachable, swappable effect bundle — not baked in at creation. Note this table
is also an exact enumeration of the SRD's playable races.)*

**Remove Curse** — 3rd abjuration · 1 action · Touch · V, S · Instantaneous.
**All curses on one creature or object end.** On a **cursed magic item** the
curse **remains**, but **the owner's attunement is broken** so it can be removed
or discarded.

**Resilient Sphere** — 4th evocation · 1 action · 30 ft · V, S, M · **conc,
1 minute**. Encloses a **Large or smaller** creature or object; unwilling
creatures save **DEX**. **Nothing — objects, energy or spell effects — passes in
or out**, though the occupant can breathe. **The sphere is immune to all
damage**, and neither side can harm the other. Weightless and exactly sized.
The occupant may **push to roll it at half its speed**; others can pick it up.
***Disintegrate* destroys the sphere without harming the contents.**

**Resistance** — Abjuration cantrip · 1 action · Touch · V, S, M · **conc,
1 minute**. **Once**, the target adds **1d4 to one saving throw of its choice**,
**rolling the die before or after the save**. Then the spell ends.
*(The saving-throw twin of *Guidance* — and another post-roll modification
window.)*

**Resurrection** — 7th necromancy · **1 hour** · Touch · V, S, **M\*\***
(diamond **≥1,000 gp, consumed**) · Instantaneous. **Dead up to a century**,
**not of old age**, **not undead**. Returns at **full hit points**, with poisons
and normal diseases cured and **all missing body parts restored**. Same **−4
ordeal penalty** decaying per long rest.
**Caster cost for a body dead a year or more: until you finish a long rest you
cannot cast spells, and you have disadvantage on all attack rolls, ability
checks and saving throws.**

**Reverse Gravity** — 7th transmutation · 1 action · 100 ft · V, S, M · **conc,
1 minute**. A **50-ft-radius, 100-ft-high cylinder**. Everything unanchored
**falls upward**; a **DEX save** grabs a fixed object to avoid it. Striking a
ceiling resolves as a normal fall. Anything reaching the top **hangs there**,
and **falls back down when the spell ends**.

**Revivify** — 3rd necromancy · 1 action · Touch · V, S, **M\*\*** (diamonds
**300 gp, consumed**) · Instantaneous. A creature **dead within the last
minute** returns with **1 hit point**. **Cannot restore a death from old age or
any missing body parts.**

**Rope Trick** — 2nd transmutation · 1 action · Touch · V, S, M · **1 hour**.
A rope **up to 60 ft** stands upright with an **invisible entrance** to an
extradimensional space at its top, holding **up to eight Medium or smaller
creatures**. The rope can be pulled in. **Attacks and spells cannot cross the
entrance**, but occupants see out **as through a 3 × 5 ft window**. Everything
**drops out** when the spell ends.

---

## S

**Sacred Flame** — Evocation cantrip · 1 action · 60 ft · V, S ·
Instantaneous. save DEX or **1d8 radiant**. **The target gains no benefit from
cover for this save.** [cantrip-scale] 2d8/3d8/4d8.
*(An explicit cover exemption — so cover bonuses to DEX saves need a
per-effect override flag.)*

**Sanctuary** — 1st abjuration · **1 bonus action** · 30 ft · V, S, M ·
**1 minute**. Any creature **targeting the warded creature with an attack or a
harmful spell must first save WIS**; on a failure it **must choose a new target
or lose the attack or spell**. **No protection against area effects.**
**Ends if the warded creature attacks or casts a spell affecting an enemy.**
*(An interception that fires **before target selection resolves** — another
mid-resolution hook.)*

**Scorching Ray** — 2nd evocation · 1 action · 120 ft · V, S · Instantaneous.
**Three rays**, distributed freely; **a separate ranged spell attack per ray**,
**2d6 fire** each. ↑ **+1 ray** per slot above 2nd.

**Scrying** — 5th divination · **10 minutes** · Self · V, S, **M\*** (focus
**≥1,000 gp** — crystal ball, silver mirror, font of holy water) · **conc,
10 minutes**. The target saves **WIS**, **modified by your knowledge of and
physical connection to them** — and may **choose to fail** if it knows you are
casting:

| Knowledge | Save modifier |
|---|---|
| Secondhand (heard of them) | **+5** |
| Firsthand (met them) | **+0** |
| Familiar (know them well) | **−5** |

| Connection | Save modifier |
|---|---|
| Likeness or picture | **−2** |
| Possession or garment | **−4** |
| Body part, hair, nail clipping | **−10** |

Success grants **24-hour immunity** to your castings. Failure creates an
invisible sensor **within 10 ft of the target that follows it**; you see and
hear through it. Visible as a fist-sized orb to anyone who sees invisible
objects. **Alternatively target a location you have seen** — the sensor appears
there and does not move.
*(A **save DC modified by relationship and evidence**, not by the caster's
statistics. The DM/UI needs to expose these two dropdowns at cast time.)*

**Secret Chest** — 4th conjuration · 1 action · Touch · V, S, **M\*** (a chest
of rare materials **≥5,000 gp** and a **Tiny replica ≥50 gp**) ·
Instantaneous. Hides a chest holding **≤12 cubic feet** of nonliving material on
the Ethereal Plane. **Action + touch the replica to recall it** within 5 ft;
**action + touch both to send it back**. **After 60 days there is a cumulative
5% chance per day that the spell ends.** Ends if recast, if the **replica is
destroyed**, or by your action — **and if the chest is ethereal when it ends, it
is irretrievably lost**.

**See Invisibility** — 2nd divination · 1 action · Self · V, S, M · **1 hour**.
See **invisible creatures and objects**, and **into the Ethereal Plane** (which
appears ghostly and translucent).

**Seeming** — 5th illusion · 1 action · 30 ft · V, S · **8 hours**.
**Any number** of creatures get illusory appearances covering **clothing, armour,
weapons and equipment**. Unwilling targets save **CHA**. **±1 foot of height**,
any build, **same body type**. **Fails physical inspection**; an **action +
INT (Investigation) vs. your spell save DC** reveals the disguise.

**Sending** — 3rd evocation · 1 action · **Unlimited** · V, S, M · **1 round**.
A **≤25-word** message to a familiar creature, who **can answer immediately in
kind**. Understood by anything with **INT ≥ 1**. Works **across planes**, with a
**5% chance the message does not arrive** if you are on different planes.

**Sequester** — 7th transmutation · 1 action · Touch · V, S, **M\*\*** (gem-dust
powder **≥5,000 gp, consumed**) · **Until dispelled**. A willing creature or
object becomes **invisible and undetectable by divination or scrying**. A
creature falls into **suspended animation — time stops for it and it does not
age**. **Set an ending condition** that must **occur or be visible within
1 mile** ("after 1,000 years", "when the tarrasque awakens").
**Also ends if the target takes any damage.**

**Shapechange** — 9th transmutation · 1 action · Self · V, S, **M\*** (jade
circlet **≥1,500 gp**, **worn before casting**) · **conc, 1 hour**.
Any creature of **CR ≤ your level**, **not a construct or undead**, **that you
have seen**. An **average example** — no class levels, no Spellcasting trait.
Statistics replaced, but you keep **alignment and INT/WIS/CHA**, and **all your
skill and saving-throw proficiencies plus the creature's** (**the higher bonus
wins** where both have it). **No legendary or lair actions.** Take the form's HP
and Hit Dice; reverting restores your prior HP with excess damage carrying over.
**You keep class, race and other features and may use them if the form is
physically capable**; **you cannot use special senses the form lacks**; **you can
speak only if the form can**. Equipment may **drop, merge, or be worn** (merged
equipment does nothing). **Action to change form again** — but **if the new form
has more HP than your current total, your HP stays where it is** (blocking
re-shifting as a heal).

**Shatter** — 2nd evocation · 1 action · 60 ft · V, S, M · Instantaneous.
**10-ft-radius sphere**, save CON, **3d8 thunder**, half on success.
**Creatures made of inorganic material (stone, crystal, metal) save at
disadvantage.** **Unattended nonmagical objects in the area also take the
damage.** ↑ **+1d8** per slot above 2nd.

**Shield** — 1st abjuration · **1 reaction, taken when you are hit by an attack
or targeted by *magic missile*** · Self · V, S · **1 round**.
**+5 AC, including against the triggering attack**, and **no damage from *magic
missile***.
*(An AC bonus applied **retroactively to an attack already rolled** — the attack
resolution pipeline must be interruptible after the roll but before the
hit/miss verdict is committed.)*

**Shield of Faith** — 1st abjuration · **1 bonus action** · 60 ft · V, S, M ·
**conc, 10 minutes**. **+2 AC.**

**Shillelagh** — Transmutation cantrip · **1 bonus action** · Touch · V, S, M
(**a club or quarterstaff**) · **1 minute**. For that weapon: **use your
spellcasting ability instead of Strength for attack and damage**, **the damage
die becomes a d8**, and **the weapon becomes magical**. **Ends if recast or if
you let go of the weapon.**
*(Overrides a weapon's ability and its damage die — weapon statistics must be
computed through an effect pipeline, not read straight off the item.)*

**Shocking Grasp** — Evocation cantrip · 1 action · Touch · V, S ·
Instantaneous. Melee spell atk, **advantage if the target wears metal armour**.
Hit: **1d8 lightning** and **it cannot take reactions until the start of its next
turn**. [cantrip-scale] 2d8/3d8/4d8.

**Silence** — 2nd illusion **(R)** · 1 action · 120 ft · V, S · **conc,
10 minutes**. **No sound is created within or passes through a 20-ft-radius
sphere.** Creatures and objects entirely inside are **immune to thunder damage**;
creatures are **deafened**; **spells with verbal components cannot be cast**
there.

**Silent Image** — 1st illusion · 1 action · 60 ft · V, S, M · **conc,
10 minutes**. A **purely visual** image up to a **15-ft cube** — **no sound,
smell or other sensory effects**. **Action to move it** in range and alter its
appearance to match. Disbelief: **action + INT (Investigation) vs. your spell
save DC**.

**Simulacrum** — 7th illusion · **12 hours** · Touch · V, S, **M\*\*** (snow or
ice enough for a life-size copy, **a piece of the creature's body**, and
**powdered ruby 1,500 gp, consumed**) · **Until dispelled**. An illusory but
**real, actable** duplicate of one **beast or humanoid** with **half its hit
point maximum** and **no equipment**; all other statistics identical. Friendly and
obedient, acting on your turn. **It cannot learn, level, or regain expended
spell slots.** Repairable in an alchemical laboratory at **100 gp per hit
point**. **Reverts to melting snow at 0 HP.** **Recasting destroys any active
duplicate.**

**Sleep** — 1st enchantment · 1 action · 90 ft · V, S, M · **1 minute**.
**Roll 5d8** as a **hit-point pool**. Creatures within **20 ft of a point**
are affected in **ascending order of current HP** (ignoring unconscious ones),
each falling **unconscious** and subtracting its HP from the pool; a creature is
only affected if its HP ≤ the remaining pool. **Wakes on damage or if someone
uses an action to shake or slap it.** **Undead and creatures immune to charm are
unaffected.** ↑ **+2d8** per slot above 1st.

**Sleet Storm** — 3rd conjuration · 1 action · 150 ft · V, S, M · **conc,
1 minute**. A **20-ft-tall, 40-ft-radius cylinder**: **heavily obscured**,
**exposed flames doused**, **ground is difficult terrain**. On entering first
time on a turn or starting there: **DEX save or fall prone**. **Anyone
concentrating in the area must make a CON save against your spell save DC or
lose concentration.**

**Slow** — 3rd transmutation · 1 action · 120 ft · V, S, M · **conc, 1 minute**.
**Up to six creatures in a 40-ft cube**, save WIS. Affected: **speed halved**,
**−2 AC and −2 to DEX saves**, **no reactions**, **either an action or a bonus
action, not both**, and **at most one melee or ranged attack per turn regardless
of any ability or item**. **Casting a 1-action spell: roll a d20 — on 11 or
higher the spell is delayed to the creature's next turn**, which it must spend
completing it or the spell is wasted. **WIS save at the end of its turn** to
end.

**Spare the Dying** — Necromancy cantrip · 1 action · Touch · V, S ·
Instantaneous. A living creature at **0 HP becomes stable**. No effect on undead
or constructs.

**Speak with Animals** — 1st divination **(R)** · 1 action · Self · V, S ·
**10 minutes**. Comprehend and verbally communicate with beasts. They can at
minimum report **nearby locations and monsters**, including anything perceived
**within the past day**. Small favours are possible at the GM's discretion.

**Speak with Dead** — 3rd necromancy · 1 action · 10 ft · V, S, M ·
**10 minutes**. A corpse **that still has a mouth** and **is not undead**.
**Fails if the corpse was targeted by this spell within the last 10 days.**
**Five questions.** It knows only what it knew in life, answers **briefly,
cryptically or repetitively**, and is **under no compulsion to tell the truth**
if hostile. **It has no soul** — it cannot learn, know what has happened since
death, or speculate.

**Speak with Plants** — 3rd transmutation · 1 action · **Self (30-ft radius)** ·
V, S · **10 minutes**. Question plants about **events in the area within the past
day**. **Turn plant-caused difficult terrain into ordinary terrain, or ordinary
terrain with plants into difficult terrain**, for the duration. Plants cannot
uproot but can move branches and tendrils. Plant creatures can be communicated
with but **not influenced**. **Can make *entangle*'s plants release a restrained
creature.**

**Spider Climb** — 2nd transmutation · 1 action · Touch · V, S, M · **conc,
1 hour**. Move on vertical surfaces and ceilings **with hands free**, and gain a
**climbing speed equal to walking speed**.

**Spike Growth** — 2nd transmutation · 1 action · 150 ft · V, S, M · **conc,
10 minutes**. A **20-ft radius** of difficult terrain dealing **2d4 piercing per
5 feet travelled** within it. **Camouflaged** — a creature that could not see the
casting must make a **WIS (Perception) check vs. your spell save DC** to
recognise the hazard before entering.
*(Damage proportional to **distance moved**, not to a turn or an event.)*

**Spirit Guardians** — 3rd conjuration · 1 action · **Self (15-ft radius)** ·
V, S, M (a holy symbol) · **conc, 10 minutes**. **Designate any number of
creatures to be unaffected at cast time.** Affected creatures have **speed
halved** in the area, and on entering first time on a turn or starting there
save **WIS**, taking **3d8 radiant (if you are good or neutral) or 3d8 necrotic
(if you are evil)**, half on success. ↑ **+1d8** per slot above 3rd.
*(Damage type determined by the **caster's alignment** — the one place the SRD
attaches a mechanic to alignment, contradicting "alignment is purely
descriptive" in `03-progression.md`. Worth noting as an exception.)*

**Spiritual Weapon** — 2nd evocation · **1 bonus action** · 60 ft · V, S ·
**1 minute** (no concentration). A floating weapon; **recasting replaces it**.
On casting, a melee spell atk within 5 ft of it for **1d8 + your spellcasting
ability modifier force**. **Bonus action** to move it **20 ft** and attack again.
↑ **+1d8 per *two* slot levels above 2nd**.

**Stinking Cloud** — 3rd conjuration · 1 action · 90 ft · V, S, M · **conc,
1 minute**. **20-ft-radius sphere**, spreads around corners, **heavily
obscured**. A creature **completely inside at the start of its turn** saves CON
or **spends its action retching**. **Creatures that don't breathe or are immune
to poison automatically succeed.** **Moderate wind (≥10 mph) disperses it after
4 rounds; strong wind (≥20 mph) after 1 round.**

**Stone Shape** — 4th transmutation · 1 action · Touch · V, S, M ·
Instantaneous. Reshape a **Medium or smaller** stone object, or a section of
stone **≤5 ft in any dimension**, into any form — a weapon, an idol, a coffer, a
passage through a wall under 5 ft thick, a sealed door. **Up to two hinges and a
latch**; **no finer mechanical detail**.

**Stoneskin** — 4th abjuration · 1 action · Touch · V, S, **M\*\*** (diamond
dust **100 gp, consumed**) · **conc, 1 hour**. **Resistance to nonmagical
bludgeoning, piercing and slashing damage.**

**Storm of Vengeance** — 9th conjuration · 1 action · **Sight** · V, S ·
**conc, 1 minute**. A **360-ft-radius** storm cloud. On appearing, every creature
beneath it (**within 5,000 ft below**) saves **CON** or takes **2d6 thunder** and
is **deafened for 5 minutes**. Then, per round of concentration:

| Round | Effect |
|---|---|
| 2 | **1d6 acid** to every creature and object beneath, no save |
| 3 | **Six lightning bolts** at six chosen creatures or objects (one bolt each): DEX save, **10d6 lightning**, half on success |
| 4 | **2d6 bludgeoning** hail to everything beneath, no save |
| 5–10 | Area becomes **difficult terrain and heavily obscured**; **1d6 cold** per creature; **ranged weapon attacks impossible**; **severe distraction for concentration**; winds of 20–50 mph **automatically disperse fog and mist, mundane or magical** |

*(A **scripted multi-round sequence** — the effect is a timeline keyed to the
round counter, not a single application.)*

**Suggestion** — 2nd enchantment · 1 action · 30 ft · **V, M** (no somatic) ·
**conc, up to 8 hours**. One creature that can **hear and understand** you;
**immune if it can't be charmed**. A **one-or-two-sentence** reasonable course of
action — **an obviously harmful command ends the spell**. save WIS or pursue it;
**ends early on completion**. May carry a **conditional trigger**. **Damage from
you or your companions ends it.**

**Sunbeam** — 6th evocation · 1 action · **Self (5-ft-wide, 60-ft line)** ·
V, S, M · **conc, 1 minute**. save CON, **6d8 radiant** and **blinded until your
next turn**; half and no blindness on a success. **Undead and oozes save at
disadvantage.** **Action on any turn to fire a new line.** A mote in your hand
sheds **bright light 30 ft, dim 30 ft more** — **and this light is sunlight**.

**Sunburst** — 8th evocation · 1 action · 150 ft · V, S, M · Instantaneous.
**60-ft radius**, save CON, **12d6 radiant** and **blinded for 1 minute**; half
and no blindness on a success. **Undead and oozes save at disadvantage.**
**CON save at the end of each of its turns** to end the blindness.
**Dispels any spell-created darkness in the area.**

**Symbol** — 7th abjuration · **1 minute** · Touch · V, S, **M\*\*** (mercury,
phosphorus, powdered diamond and opal **≥1,000 gp total, consumed**) ·
**Until dispelled or triggered**. Same inscription, concealment, discovery
(**INT (Investigation) vs. your spell save DC**), trigger authoring and password
rules as *Glyph of Warding* — refinable by **physical characteristics or physical
kind** (hags, shapechangers). On trigger it **fills a 60-ft-radius sphere with
dim light for 10 minutes**, affecting everyone inside then, **plus anyone
entering first time on a turn or ending a turn there**. Choose one effect:

| Effect | Save | On failure |
|---|---|---|
| Death | CON | **10d10 necrotic**, half on success |
| Discord | CON | bickers for 1 minute: **no meaningful communication, disadvantage on attack rolls and ability checks** |
| Fear | WIS | **frightened 1 minute**; drops what it holds and must move ≥30 ft from the glyph each turn |
| Hopelessness | CHA | 1 minute: **cannot attack or target any creature with harmful abilities, spells or magical effects** |
| Insanity | INT | 1 minute: **cannot act, understand speech or read; speaks gibberish; the GM controls its erratic movement** |
| Pain | CON | **incapacitated** 1 minute |
| Sleep | WIS | **unconscious 10 minutes**; wakes on damage or a shake |
| Stunning | WIS | **stunned** 1 minute |

---

## T

**Telekinesis** — 5th transmutation · 1 action · 60 ft · V, S · **conc,
10 minutes**. On casting **and as your action each round**, affect one target;
switching targets **releases the previous one**.
*Creature* — **Huge or smaller**: an **ability check with your spellcasting
ability contested by the creature's STR check**. On a win, move it **30 ft** in
any direction (including upward) within range, and it is **restrained in your
grip until the end of your next turn**; **repeat the contest each round to
maintain**.
*Object* — **up to 1,000 lb**: unattended objects move **30 ft automatically**;
**a worn or carried object requires the same contest**. **Fine control**
possible — use a simple tool, open a door or container, stow or retrieve, pour a
vial.

**Telepathic Bond** — 5th divination **(R)** · 1 action · 30 ft · V, S, M ·
**1 hour**. Links **up to eight willing creatures** telepathically, **regardless
of shared language**, **over any distance but not across planes**. **No effect on
INT ≤ 2.**
