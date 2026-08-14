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
