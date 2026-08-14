# Core rules: ability scores, checks, adventuring (p76–89)

This is the most architecturally important section read so far. Almost every
primitive the engine needs is defined here, and several of them contradict the
naive model in `rules-engine-architecture.md`.

---

## 1. Ability scores and modifiers (p76)

Six abilities: STR (physical power), DEX (agility), CON (endurance), INT
(reasoning and memory), WIS (perception and insight), CHA (force of
personality).

**Modifier = floor((score − 10) / 2).** Range −5 (score 1) to +10 (score 30).
Table: 1→−5, 2–3→−4, 4–5→−3, 6–7→−2, 8–9→−1, 10–11→+0, 12–13→+1, 14–15→+2,
16–17→+3, 18–19→+4, 20–21→+5, 22–23→+6, 24–25→+7, 26–27→+8, 28–29→+9, 30→+10.

Score bands: 10–11 human average · 18 usual human maximum · **20 the adventurer
cap** · **30 the absolute cap** (monsters, divine beings). The 20 cap is
imposed by the ASI rule, not here — some features raise it, so the cap must be
a **derived value**, not a constant.

**Three roll types** are built on scores: the **ability check**, the **saving
throw**, and the **attack roll**. All three are `d20 + ability modifier + …`
compared against a target number. This is the single unifying primitive of the
engine.

---

## 2. Advantage and disadvantage (p76) — **[CRITICAL]**

Read carefully; the SRD is unusually precise here and the rules are *not* what
a naive implementation would do.

1. Advantage / disadvantage = roll a **second d20**, take higher / lower.
2. **They do not stack.** Any number of sources granting advantage still yields
   **exactly one** extra d20.
3. **They cancel completely and non-numerically.** "If circumstances cause a
   roll to have both advantage and disadvantage, you are considered to have
   neither of them, and you roll one d20. **This is true even if multiple
   circumstances impose disadvantage and only one grants advantage or vice
   versa.**"
4. **Rerolls interact with it.** When you have advantage/disadvantage and an
   effect lets you reroll the d20 (Halfling's Lucky), you **reroll only one of
   the two dice, and you choose which.**

**Engine consequence.** Advantage is therefore **not** a numeric modifier and
**not** a counter. It is a **tri-state resolved from two independent boolean
sets**:

```
adv  = anySourceGrantsAdvantage
dis  = anySourceImposesDisadvantage
state = adv && dis ? 'normal' : adv ? 'advantage' : dis ? 'disadvantage' : 'normal'
```

The **sources must still be enumerable in the breakdown** even when they
cancel, or the HUD cannot explain why a roll that "should" have advantage
doesn't. So the roll request carries a **list of tagged advantage sources** and
a **list of tagged disadvantage sources**, and the resolver reduces them.

Note this also settles the dice-request contract with the existing 3D dice
system: `advantage` means *roll two d20 and keep one*, so the request must be
able to say "roll N dice, keep-highest/keep-lowest 1", and the reroll rule
means the client must be able to **re-request a single die from a prior roll**.

Sources of advantage named so far: special abilities, actions, spells,
**Inspiration**, and **GM fiat** ("the GM can also decide that circumstances
influence a roll"). GM fiat must therefore be a first-class input to every
roll — a DM toggle on the roll request, not an afterthought.

---

## 3. Proficiency bonus (p77) — **[CRITICAL]**

- Determined by **total character level** (+2 / +3 / +4 / +5 / +6, see
  `03-progression.md`).
- **"Your proficiency bonus can't be added to a single die roll or other number
  more than once."** Two rules both saying "add your proficiency bonus" still
  add it once.
- It may be **multiplied or divided** (Expertise doubles it; Jack of All Trades
  halves it) — but **"you still add it only once and multiply or divide it only
  once."** Multipliers do not compose.
- **[SUBTLE] Multiplying zero is zero.** If you are not proficient in History,
  a feature that "doubles your proficiency bonus on Intelligence (History)
  checks" gives you **nothing** — your proficiency bonus for that check is 0.
  So Expertise/Stonecunning-style effects are `multiplier` applied to a
  **proficiency term that may be zero**, never a flat bonus.
- "In general, you don't multiply your proficiency bonus for attack rolls or
  saving throws."

**Engine consequence.** The proficiency term is a *single* term in the roll
breakdown with its own resolution rule:

```
proficiencyTerm = isProficient ? round(PB * multiplier) : 0
```

where `multiplier` is the **single winning** multiplier (not a product), and
rounding is per-source (Jack of All Trades rounds **down**, Remarkable Athlete
rounds **up** — see `90-vocabulary-findings.md`). This is a genuine
"last/strongest wins" slot, unlike additive bonuses which sum.

---

## 4. Ability checks (p77–79)

**DC table:** Very easy 5 · Easy 10 · Medium 15 · Hard 20 · Very hard 25 ·
Nearly impossible 30. Success on **total ≥ DC**.

### Contests
Both parties roll ability checks with all their bonuses; **higher total wins**;
**a tie changes nothing** (the defender/status quo wins by default). Used for
grapples, hiding vs. searching, opposed shoves.
*Engine:* a contest is a **paired roll request** — two players, resolved
together. Multiplayer-relevant: it needs both clients' dice on the table.

### Skills
18 skills, mapped to abilities. **No skill maps to Constitution.**

| Ability | Skills |
|---|---|
| STR | Athletics |
| DEX | Acrobatics, Sleight of Hand, Stealth |
| CON | *(none)* |
| INT | Arcana, History, Investigation, Nature, Religion |
| WIS | Animal Handling, Insight, Medicine, Perception, Survival |
| CHA | Deception, Intimidation, Performance, Persuasion |

**[IMPORTANT] Variant: Skills with Different Abilities.** "The GM might ask for
a check using an unusual combination of ability and skill" — **Constitution
(Athletics)** to swim a long distance, **Strength (Intimidation)** for a
show of raw force. Proficiency still applies.

**Engine consequence — this kills the enum.** A check cannot be typed as one of
18 fixed `Skill` values that each imply an ability. The check request must be
an **independent pair**: `{ ability, skill?, tool? }`. The default pairing is a
UI convenience, overridable by the DM. Combined with the tool rule from
`04-equipment.md` (tool proficiency isn't bound to any ability either), a check
has **three orthogonal inputs**, and the proficiency bonus applies if the
relevant proficiency — skill *or* tool — is held.

### Passive checks (p78, restated p81)
**`passive = 10 + all modifiers that normally apply to the check`**,
**+5 if you have advantage, −5 if you have disadvantage.** Called a *score*,
not a roll.

*Engine:* the derived-stat engine must be able to produce a **rollless total**
from the same modifier pipeline as an active check — i.e. the pipeline computes
a *modifier set*, and rolling is a separate final step. Passive Perception is a
HUD-visible stat. Note advantage becomes **numeric (±5)** in passive form,
which is a second, different reduction of the same tri-state.

### Working Together / Help (p79)
The leader (or highest modifier) rolls **with advantage**. A helper must be
**able to attempt the task alone** — e.g. cannot help pick a lock without
thieves' tools proficiency. Some tasks can't be helped at all (GM call).

### Group checks (p79)
Everyone rolls; **if at least half the group succeeds, the group succeeds.**
*Engine:* a third roll shape — an **N-participant aggregate roll** with a
threshold rule. Along with contests, this means a "roll request" is not
inherently single-player.

---

## 5. What each ability governs (p79–83)

Captured because these are the DM's menu when calling for a check.

**Strength** — Athletics covers **climbing, jumping, swimming**. Other STR
checks: force a door, break bonds, squeeze through a tunnel, hang on to a
wagon, tip a statue, stop a boulder. **Adds to attack and damage with melee
weapons** (and thrown).

**Dexterity** — Acrobatics (footing, stunts), Sleight of Hand (legerdemain,
pickpocketing), Stealth (concealment). Other DEX checks: control a laden cart,
steer a chariot, pick a lock, disable a trap, tie up a prisoner, wriggle free,
play a stringed instrument, craft a detailed object. **Adds to attack and damage
with ranged weapons and finesse melee weapons.** Contributes to **AC** (per
armour category) and is rolled for **initiative**.

**Constitution** — **no skills**. Checks: hold breath, march without rest, go
without sleep, survive without food or water, drink a stein in one go.
Contributes to **hit points**.

**Intelligence** — Arcana (spells, magic items, planes), History (events,
kingdoms, wars), Investigation (clues and deduction), Nature (terrain, plants,
animals, weather), Religion (deities, rites, cults). Other: communicate without
words, appraise, assemble a disguise, forge a document, recall a craft, win a
game of skill. **Spellcasting ability: wizard.**

**Wisdom** — Animal Handling (calm an animal, control a mount in a risky
manoeuvre), Insight (true intentions), Medicine (**stabilise a dying
companion**, diagnose illness), Perception (spot/hear/detect), Survival (track,
hunt, navigate, predict weather, avoid hazards). **Spellcasting ability:
cleric, druid, ranger.**

**Charisma** — Deception, Intimidation, Performance, Persuasion. Other: find
the right person for gossip, blend into a crowd. **Spellcasting ability: bard,
paladin, sorcerer, warlock.**

### Hiding (p80–81)
`DEX (Stealth)` check, **contested by WIS (Perception)** of anyone actively
searching, **or compared against passive WIS (Perception)** for those who
aren't. You cannot hide from a creature that sees you clearly; noise gives you
away. An invisible creature can always try to hide.
*Engine:* the Stealth total **persists as state** until discovered — a rolled
value that becomes a standing DC. That is a stored roll result, not a
transient one.

---

## 6. Saving throws (p83)

- `d20 + ability modifier`, **not chosen — forced by a threat**.
- Each class grants proficiency in **at least two** saves.
- **The DC comes from the effect, not the saver.** For a spell it is the
  caster's spell save DC (`8 + PB + spellcasting modifier`).
- The **result** of success or failure is defined by the effect (usually no
  harm or half harm).

*Engine:* a save is a roll request **issued by an effect at a target**, with
the DC and both outcome branches carried in the request. This is the
DM-authored-item vocabulary again: `{ save: {ability, dc}, onFail, onSuccess }`.

---

## 7. Time and movement (p84–85)

**Time scales:** round = **6 seconds** · dungeon exploration in **minutes** ·
city/wilderness in **hours** · long journeys in **days**.

**Speed** = feet walked in 1 round.

### Travel pace

| Pace | Per minute | Per hour | Per day | Effect |
|---|---|---|---|---|
| Fast | 400 ft | 4 miles | 30 miles | **−5 to passive WIS (Perception)** |
| Normal | 300 ft | 3 miles | 24 miles | — |
| Slow | 200 ft | 2 miles | 18 miles | **Able to use stealth** |

**Forced march** — beyond 8 hours/day, each extra hour requires a **CON save,
DC 10 + 1 per hour past 8**; failure = **one level of exhaustion**.

**Mounts** — gallop for ~1 hour at **twice fast pace**. Waterborne travellers
are limited to the vessel's speed and get **neither the fast-pace penalty nor
the slow-pace benefit**; ships may travel up to 24 h/day.

**Difficult terrain** — **1 foot of movement costs 2 feet**; half distance.

**Climbing / swimming / crawling** — each foot costs **1 extra foot** (2 extra
in difficult terrain), unless the creature has a climb or swim speed. GM may
require STR (Athletics) for slippery surfaces or rough water.

### Jumping (p85)
- **Long jump** = up to **your Strength score** in feet with a 10 ft run-up;
  **half** standing. Each foot clears costs a foot of movement. DC 10 STR
  (Athletics) to clear a low obstacle (≤ ¼ the jump distance); landing in
  difficult terrain needs DC 10 DEX (Acrobatics) or you land **prone**.
- **High jump** = **3 + STR modifier** feet with a run-up; **half** standing.
  You can reach **jump height + 1½ × your height** with arms extended.

*Note:* long jump uses the **score**, high jump uses the **modifier**. Both are
derived stats worth showing in the HUD; they are cheap and they are exactly the
kind of number a BG3-style UI surfaces.

---

## 8. The environment (p86–87)

**Falling** — **1d6 bludgeoning per 10 feet, max 20d6**; you land **prone**
unless you took no damage.

**Suffocating** — hold breath for **1 + CON modifier minutes (min 30 s)**. Out
of breath: survive **CON modifier rounds (min 1)**, then at the start of your
next turn drop to **0 HP and dying**, and you cannot regain HP or be stabilised
until you can breathe.

### Vision and light — **[IMPORTANT] two orthogonal axes**

**Obscurement** (a property of the *area*):
- **Lightly obscured** (dim light, patchy fog, moderate foliage) —
  **disadvantage on WIS (Perception) checks that rely on sight**.
- **Heavily obscured** (darkness, opaque fog, dense foliage) — blocks vision
  entirely; you are **effectively blinded** when trying to see into it.

**Illumination** (a property of the *light present*): **bright light** (see
normally) · **dim light** = *creates* a lightly obscured area · **darkness** =
*creates* a heavily obscured area.

**Senses** (a property of the *creature*):
- **Blindsight** — perceive without sight within a radius.
- **Darkvision** — within range, **darkness counts as dim light** (so heavily
  obscured becomes lightly obscured), **no colour, only greys**.
- **Truesight** — see in normal and magical darkness, see invisible creatures
  and objects, **automatically detect and succeed on saves against visual
  illusions**, see a shapechanger's or transformed creature's true form, and see
  into the Ethereal Plane.

*Engine:* this closes the loop with the light-source table in
`04-equipment.md`. A visibility query is
`illumination(area) → obscurement → modified by the observer's senses →
advantage/disadvantage or blinded`. It is a small, well-defined pipeline and
worth building properly, because torches, Darkvision, the Light cantrip and
Stealth all depend on it.

### Food and water (p86–87)
- **Food:** 1 lb/day. Half a pound counts as **half a day** without food. You
  can go **3 + CON modifier days (min 1)** without food; each day beyond that is
  **one level of exhaustion, automatically**. A normal day of eating resets the
  counter to zero.
- **Water:** 1 gallon/day, **2 in hot weather**. Half that → **DC 15 CON save
  or one level of exhaustion**. Less than half → **automatic** exhaustion. If
  you already have any exhaustion, you take **two levels** instead.
- Exhaustion from starvation/thirst **cannot be removed until you eat and drink
  the full amount** — a normal long rest does not clear it.

*Engine:* three persistent per-character clocks (days without food, days
without water, and their exhaustion consequences) that tick on the campaign
calendar, not on rest. Worth flagging as a scope question — it's classic
"nobody tracks this" territory.

### Interacting with objects (p87)
GM assigns **AC and HP** to objects, and may assign resistance or immunity.
**Objects are immune to poison and psychic damage.**
**Objects always fail STR and DEX saves and are immune to all other saves.**
At 0 HP an object **breaks**. A STR check at a GM-set DC can break an object
directly.

*Engine:* objects are damageable entities with a reduced rule surface. The
"always fails STR/DEX, immune to the rest" rule is a clean special case, and it
makes the door/rope/manacle HP values from the equipment section usable.

---

## 9. Resting (p87) — **[CRITICAL] the master resource clock**

### Short rest
- **At least 1 hour**, doing nothing more strenuous than eating, drinking,
  reading, tending wounds.
- Spend **one or more Hit Dice**, up to your maximum (= character level). Each
  spent die: **roll it + CON modifier**, regain that many HP.
- **The player decides after each roll whether to spend another** — an
  interactive, sequential decision, not a batch. This is a real UI flow: roll,
  see the result, choose again.

### Long rest
- **At least 8 hours**; sleep or light activity (reading, talking, eating,
  standing watch **for no more than 2 hours**).
- **Interrupted** by ≥1 hour of strenuous activity (walking, fighting, casting)
  → **the rest restarts from zero**.
- Regain **all lost hit points**.
- Regain spent Hit Dice **up to half your total (minimum one)** — *not* all of
  them. Hit Dice are a multi-day resource.
- **At most one long rest per 24 hours**, and you must have **at least 1 HP at
  the start** to benefit.

*Engine:* every class resource read so far declares its refresh as "short rest"
or "long rest" (plus warlock pact slots on a short rest, and the once-per-long-
rest features). So `RestType` is the central resource-refresh event, and it
must fan out to: HP, Hit Dice, spell slots, per-class uses, and item charges
(magic items will add "dawn" as a third refresh trigger — to be confirmed).

---

## 10. Between adventures / downtime (p88–89)

**Lifestyle** — restated: no mechanical effect, only social reaction.

**Downtime activity rule:** each activity needs a number of **days**, with at
least **8 hours per day** spent on it; **days need not be consecutive**.

- **Crafting** — requires proficiency with the relevant tools and sometimes a
  facility (a forge for a sword). **5 gp of market value per day**, expending
  **half the market value in raw materials**. Plate armour (1,500 gp) = 300 days
  solo. **Multiple characters combine**, each contributing 5 gp/day — three
  characters make plate in 100 days for 750 gp. While crafting you sustain a
  **modest lifestyle free**, or **comfortable at half cost**.
- **Practising a profession** — modest lifestyle free; **comfortable** if
  employed by an organisation (temple, thieves' guild); **wealthy** with
  **Performance proficiency** put to use.
- **Recuperating** — after **3 days**, a **DC 15 CON save**; on success choose:
  end one effect preventing you from regaining HP, **or** gain **advantage on
  saves against one disease or poison** for 24 hours.
- **Researching** — GM determines availability and duration; may require INT
  (Investigation) or CHA (Persuasion) checks; costs **1 gp/day on top of
  lifestyle**.
- **Training** — learn a **language** or gain a **tool proficiency**:
  **250 days at 1 gp/day**, plus finding an instructor.

*Engine:* downtime is a **day-granularity progress tracker with a cost and a
completion effect** — crafting accumulates gp-of-progress, training accumulates
days toward a proficiency grant. All four fit one shape:
`{ daysRequired | progressPerDay, costPerDay, prerequisites, onComplete }`.
This is genuinely automatable and is a nice fit for the campaign layer, since
it happens between sessions.

---

## Contradictions with the architecture draft

1. **`Skill` cannot be an enum that implies an ability.** Ability, skill and
   tool are three independent inputs to a check.
2. **Advantage is not a modifier and not a counter** — it is a set-reduction to
   a tri-state, and it becomes **±5** in passive form.
3. **Proficiency is a single non-stacking term with a single multiplier**, and
   multiplying a non-proficiency yields zero, not a bonus.
4. **Rolls are not always single-player.** Contests (2 participants) and group
   checks (N participants, half-succeed threshold) are first-class.
5. **A rolled value can become persistent state** (a Stealth total standing as
   a DC until discovered).
6. **Passive totals must come out of the same modifier pipeline as active
   rolls** — so the pipeline must terminate in a *modifier set*, with the die
   applied afterwards.
7. **GM fiat is a first-class input to every roll**, not an escape hatch.
8. **Rest is the master resource clock**, and long rest returns only *half* of
   spent Hit Dice — resources have per-resource refresh fractions, not just
   "restore to full".
