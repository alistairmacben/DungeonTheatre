# Traps, diseases, madness, objects, poisons (p194–205)

DM-facing content. Most of it is **exactly the kind of thing the user's brief
says a DM must be able to author**, so this section is the best available
worked example of "DM-created content using the same mechanism as SRD content".

---

## 1. Traps (p195–198)

**Two kinds.** *Mechanical* (pits, arrow traps, falling blocks, blades) and
*magical* — which subdivides into **magical device traps** (initiate a spell
effect on activation) and **spell traps** (*glyph of warding*, *symbol* — i.e.
the player-authored triggers from `08b-spell-descriptions.md`).

**A trap is fully described by four things:** its **trigger**, its **effect**,
its **detection** rule, and its **disable/avoid** rule.

### Triggers
Stepping on a pressure plate or false floor, pulling a trip wire, turning a
doorknob, using the wrong key. Magic traps typically fire on **entering an area
or touching an object**, and may carry **password exemptions**.

### Detection
- **Active search:** WIS (Perception) against the trap's DC.
- **Passive:** compare the same DC against each character's **passive WIS
  (Perception)** to see who notices it in passing.
- **Magic traps:** *any* character may attempt **INT (Arcana)** to detect or
  disarm, **at the same DC** as any other listed check.
- **[IMPORTANT] No roll where the fiction settles it.** "You should allow a
  character to discover a trap without making an ability check if an action
  would clearly reveal the trap's presence" — lifting a rug over a pressure
  plate finds it, full stop.

### Disabling
Typically **INT (Investigation)** to work out what to do, then a **DEX check
with thieves' tools** to do it. ***Dispel magic* can disable most magic traps**,
and a magic trap's description gives the **DC for that ability check**.
Traps often include **built-in bypasses** (a hidden lever, a secret door) so
their builders can pass safely.

### Severity tables — **[IMPORTANT] the DM's authoring dials**

| Trap danger | Save DC | Attack bonus |
|---|---|---|
| Setback | 10–11 | +3 to +5 |
| Dangerous | 12–15 | +6 to +8 |
| Deadly | 16–20 | +9 to +12 |

| Character level | Setback | Dangerous | Deadly |
|---|---|---|---|
| 1st–4th | 1d10 | 2d10 | 4d10 |
| 5th–10th | 2d10 | 4d10 | 10d10 |
| 11th–16th | 4d10 | 10d10 | 18d10 |
| 17th–20th | 10d10 | 18d10 | 24d10 |

*This is the single most useful thing in the section for the product:* a DM
authoring a hazard picks **severity + party level** and the system proposes a
**DC, an attack bonus and a damage expression**. That is a concrete,
implementable authoring aid built entirely from SRD data.

### Complex traps
Once activated, a complex trap **rolls initiative** (its description gives an
initiative bonus) and **acts every round**. Otherwise detected and disabled
normally. *(A trap becomes a turn-taking entity — the same "non-creature actor
with a turn" shape as summoned objects.)*

### Sample traps (the SRD's own worked examples)

- **Collapsing Roof** — trip wire 3 inches up; **spot DC 10**; **DC 15 DEX with
  thieves' tools** to disable (**with disadvantage** using any edged weapon or
  tool instead — *a proficiency substitution rule*). Trigger: **DC 15 DEX save,
  22 (4d10) bludgeoning**, half on success; area becomes difficult terrain.
  Also **deliberately triggerable as an action** by knocking a beam over.
- **Falling Net** — trip wire, **spot DC 10**, **DC 15 DEX** to disable.
  **10-ft square**; those under it are **restrained**, and **DC 10 STR save or
  also prone**. Escape: action, **DC 10 STR check**, freeing yourself **or
  another creature within reach**. Net: **AC 10, 20 HP**; **5 slashing frees a
  5-ft section**.
- **Fire-Breathing Statue** *(magic)* — **spot DC 15**; *detect magic* shows an
  **evocation** aura. Triggers on **>20 lb** on the plate: **30-ft cone**,
  **DC 13 DEX save, 22 (4d10) fire**, half on success. **Wedging a spike under
  the plate prevents it**; ***dispel magic* (DC 13) destroys it**.
- **Pits** — four variants, each a small rules delta:
  *Simple* (spot DC 10, falling damage by depth) · *Hidden* (**DC 15 WIS
  (Perception)** to notice the lack of foot traffic, **DC 15 INT
  (Investigation)** to confirm) · *Locking* (spring-shut cover; **DC 20 STR** to
  pry open, or **DC 15 DEX with thieves' tools from inside**) · *Spiked*
  (**+11 (2d10) piercing**, optionally poisoned for **DC 13 CON, 22 (4d10)
  poison**, half on success).
- **Poison Darts** — **spot DC 15**; **DC 15 INT (Investigation)** deduces the
  plate. Fires on **>20 lb**: **four darts**, each **+8 ranged attack against a
  random target within 10 ft** — **"vision is irrelevant to this attack roll"**.
  Hit: **2 (1d4) piercing** and **DC 15 CON save, 11 (2d10) poison**, half on
  success. **Wedging a spike, or stuffing the holes with cloth or wax, prevents
  it.**
- **Poison Needle** — **DC 20 INT (Investigation)** to spot, **DC 15 DEX with
  thieves' tools** to disarm; **failing a lock-pick attempt triggers it**.
  **1 piercing + 11 (2d10) poison**, and **DC 15 CON or poisoned for 1 hour**.
- **Rolling Sphere** — **DC 15 WIS (Perception)** or **DC 15 INT
  (Investigation)**. A **complex trap**: **initiative +8**, moves **60 ft in a
  straight line** each turn; entering or being entered means **DC 15 DEX save or
  55 (10d10) bludgeoning and prone**. Stops at a wall; **cannot turn corners**.
  A creature within 5 ft may spend an action on a **DC 20 STR check to reduce its
  speed by 15 ft** — **at 0 it stops**.
- **Sphere of Annihilation** *(magic)* — **DC 20 INT (Arcana)** identifies it;
  **anything entering is obliterated**. May carry an added **sympathy**
  enchantment (as *antipathy/sympathy*) removable by ***dispel magic* (DC 18)**.

**Note the SRD's notation convention:** damage is written as **average (dice)** —
"22 (4d10)". The dataset should store the expression and derive the average, not
store both.

---

## 2. Diseases (p199–200)

**[IMPORTANT] The SRD explicitly declines to give diseases a unified rule set:**
"the specifics of how a disease works aren't bound by a common set of rules…
A disease that does more than infect a few party members is **primarily a plot
device**." Diseases may be species-selective in arbitrary ways.

So a disease is a **DM-authored condition template** with fields observable from
the three examples: an **infection save**, an **incubation period**, **ongoing
symptoms**, a **recovery mechanism**, and optionally **contagion** and a
**bespoke cure**.

- **Cackle Fever** — humanoids only, **gnomes immune**. Symptoms after **1d4
  hours**: **one level of exhaustion that cannot be removed until cured**.
  Any great stress (**entering combat, taking damage, fear, a nightmare**) forces
  a **DC 13 CON save**: failure means **5 (1d10) psychic** and **incapacitated
  with mad laughter for 1 minute**, repeating the save at the end of each turn.
  **Contagion:** any humanoid starting its turn **within 10 ft** of a laughing
  victim saves **DC 10 CON** or is infected; **one success grants 24-hour
  immunity to that particular carrier**.
  **Recovery:** **DC 13 CON at the end of each long rest**; each success
  **lowers both DCs by 1d6**, and at **DC 0** the creature recovers.
  **Three failures → a randomly determined indefinite madness.**
- **Sewer Plague** — contracted on a bite or contact with contaminated filth:
  **DC 11 CON** or infected. **1d4 days** incubation. Symptoms: **one level of
  exhaustion**, **only half the normal HP from spending Hit Dice**, and **no HP
  at all from a long rest**. **DC 11 CON at the end of each long rest**: failure
  **adds** a level of exhaustion, success **removes** one; dropping below 1 cures
  it.
- **Sight Rot** — from tainted water: **DC 15 CON** or infected. After a day,
  **−1 to attack rolls and ability checks that rely on sight**, **worsening by 1
  after every long rest**; at **−5 the victim is blinded** until magically
  restored. **Bespoke cure:** the flower **Eyebright**, worked for an hour by
  someone **proficient with a herbalism kit** into one dose of ointment; applied
  before a long rest it **halts progression**, and **three doses cure it
  entirely**.

*Engine notes:* these confirm several patterns — a **cumulative counter with a
decreasing DC** (Cackle Fever), a **worsening scalar penalty** (Sight Rot), an
**exhaustion level that resists the normal removal path**, and a **modification
of rest recovery itself** (Sewer Plague). Rest is not a fixed routine; effects
can rewrite what a rest restores.

---

## 3. Madness (p201–202)

Optional, horror-flavoured. Sources: spells (*contact other plane*, *symbol* —
"you can use the madness rules here instead of the spell effects of those
spells"), diseases, poisons, planar effects, and some artifacts.
**Resisting usually requires a WIS or CHA saving throw.**

Three durations:
- **Short-term** — one effect for **1d10 minutes**
- **Long-term** — one effect for **1d10 × 10 hours**
- **Indefinite** — a **new character flaw** lasting **until cured**

### Short-term madness (d100, 1d10 minutes)
01–20 retreats inward, **paralyzed** (**ends if the character takes damage**) ·
21–30 **incapacitated**, screaming/laughing/weeping · 31–40 **frightened**, must
use action and movement to flee the source · 41–50 babbling — **no normal speech
or spellcasting** · 51–60 must use its action to **attack the nearest creature**
· 61–70 hallucinations — **disadvantage on ability checks** · 71–75 **obeys
anything told to it that isn't obviously self-destructive** · 76–80 urge to eat
something strange · 81–90 **stunned** · 91–100 **unconscious**.

### Long-term madness (d100, 1d10 × 10 hours)
01–10 compulsive repetition · 11–20 hallucinations, **disadvantage on ability
checks** · 21–30 paranoia, **disadvantage on WIS and CHA checks** · 31–40
revulsion toward something, as *antipathy* · 41–45 delusion of being under a
chosen potion's effects · 46–55 attachment to a lucky charm — **disadvantage on
attack rolls, ability checks and saving throws while more than 30 ft from it** ·
56–65 **blinded (25%) or deafened (75%)** · 66–75 tremors — **disadvantage on
attack rolls, ability checks and saves involving STR or DEX** · 76–85 partial
amnesia — **keeps racial traits and class features**, loses people and past ·
86–90 on taking damage, **DC 15 WIS save or affected as by *confusion* for
1 minute** · 91–95 **loses the ability to speak** · 96–100 **unconscious, and
nothing wakes them**.

### Indefinite madness (d100, until cured)
A **flaw**, i.e. a roleplaying prompt rather than a mechanic: 01–15 "Being drunk
keeps me sane." · 16–25 "I keep whatever I find." · 26–30 imitates someone else
· 31–35 compulsive exaggeration · 36–45 monomania about their goal · 46–50
apathy · 51–55 resentment of judgement · 56–70 grandiosity · 71–80 persecution
delusion · 81–85 an imaginary friend only they can see · 86–95 "I can't take
anything seriously." · 96–100 "I've discovered that I really like killing
people."

### Curing madness
***calm emotions*** suppresses · ***lesser restoration*** cures short-term or
long-term · ***remove curse*** or ***dispel evil*** may work depending on the
source · ***greater restoration*** or stronger is required for **indefinite**
madness.

*Engine note:* short- and long-term madness are **mechanical conditions with
durations** and belong in the state model; **indefinite madness is a flaw
string** and belongs in the roleplay layer — but it is still a tracked, curable
state, and it is the natural place for the theatrical layer to react.

---

## 4. Objects (p203)

Restates and expands `06-core-rules.md` §8.

**Scope:** "an object is a **discrete, inanimate item** — a window, door, sword,
book, table, chair, or stone — **not a building or a vehicle** composed of many
objects."

### Object Armor Class

| Substance | AC |
|---|---|
| Cloth, paper, rope | 11 |
| Crystal, glass, ice | 13 |
| Wood, bone | 15 |
| Stone | 17 |
| Iron, steel | 19 |
| Mithral | 21 |
| Adamantine | 23 |

### Object hit points

| Size | Fragile | Resilient |
|---|---|---|
| Tiny (bottle, lock) | 2 (1d4) | 5 (2d4) |
| Small (chest, lute) | 3 (1d6) | 10 (3d6) |
| Medium (barrel, chandelier) | 4 (1d8) | 18 (4d8) |
| Large (cart, 10 × 10 ft window) | 5 (1d10) | 27 (5d10) |

**Huge and Gargantuan objects** — either hand-wave the duration, or **divide the
object into Large-or-smaller sections and track each separately**; destroying
one section may ruin the whole.

**Damage types** — objects are **immune to poison and psychic**. Beyond that it
is GM judgement: bludgeoning smashes but does not cut rope; paper and cloth may
be **vulnerable to fire and lightning**.

**[IMPORTANT] Damage threshold** — a resilience mechanism for large objects:
**immunity to all damage unless a single attack or effect meets or exceeds the
threshold**, in which case damage applies normally. Sub-threshold damage is
**superficial and does not reduce hit points at all**.
*Engine:* a **fifth** stage in the damage pipeline (`07-combat-spellcasting.md`
§4), applied per-instance rather than per-total.

---

## 5. Poisons (p204–205)

**Four delivery types**, which is the classification a DM authoring a poison
must pick:
- **Contact** — smeared on an object; potent **until touched or washed off**;
  affects exposed skin.
- **Ingested** — a **full dose** must be swallowed; the GM may rule a partial
  dose gives **advantage on the save or half damage**.
- **Inhaled** — a powder or gas affecting a **5-ft cube**, dissipating
  immediately. **Holding your breath does not help.**
- **Injury** — applied to weapons, ammunition or trap components; potent until
  **delivered through a wound or washed off**; triggered by **piercing or
  slashing damage** from the coated object.

### Price list

| Poison | Type | Price per dose |
|---|---|---|
| Assassin's blood | Ingested | 150 gp |
| Burnt othur fumes | Inhaled | 500 gp |
| Crawler mucus | Contact | 200 gp |
| Drow poison | Injury | 200 gp |
| Essence of ether | Inhaled | 300 gp |
| Malice | Inhaled | 250 gp |
| Midnight tears | Ingested | 1,500 gp |
| Oil of taggit | Contact | 400 gp |
| Pale tincture | Ingested | 250 gp |
| Purple worm poison | Injury | 2,000 gp |
| Serpent venom | Injury | 200 gp |
| Torpor | Ingested | 600 gp |
| Truth serum | Ingested | 150 gp |
| Wyvern poison | Injury | 1,200 gp |

### Effects

- **Assassin's Blood** — **DC 10 CON**: **6 (1d12) poison and poisoned 24
  hours**; half damage and no condition on a success.
- **Burnt Othur Fumes** — **DC 13 CON** or **10 (3d6) poison**, then **repeat at
  the start of each turn**, taking **3 (1d6)** on each further failure.
  **Three successes ends it.**
- **Crawler Mucus** — **DC 13 CON** or **poisoned 1 minute**, and **paralyzed**
  while poisoned. Save again at the end of each turn.
  *(Harvested from a dead or incapacitated crawler.)*
- **Drow Poison** — **DC 13 CON** or **poisoned 1 hour**; **failing by 5 or more
  also makes it unconscious**, waking on damage or a shake.
  *(A **degree-of-failure** rule — the margin matters, not just the outcome.)*
- **Essence of Ether** — **DC 15 CON** or **poisoned 8 hours** and
  **unconscious**; wakes on damage or a shake.
- **Malice** — **DC 15 CON** or **poisoned 1 hour** and **blinded**.
- **Midnight Tears** — **no effect until the stroke of midnight**; then
  **DC 17 CON, 31 (9d6) poison**, half on success — unless neutralised first.
  *(A delayed effect keyed to the **campaign clock**, not a turn counter.)*
- **Oil of Taggit** — **DC 13 CON** or **poisoned 24 hours** and
  **unconscious**; **wakes only on damage**.
- **Pale Tincture** — **DC 16 CON** or **3 (1d6) poison and poisoned**;
  **repeat every 24 hours for another 3 (1d6)**. **Damage from this poison
  cannot be healed by any means** until it ends. **Seven successes** ends it.
- **Purple Worm Poison** — **DC 19 CON, 42 (12d6) poison**, half on success.
- **Serpent Venom** — **DC 11 CON, 10 (3d6) poison**, half on success.
- **Torpor** — **DC 15 CON** or **poisoned 4d6 hours** and **incapacitated**.
- **Truth Serum** — **DC 11 CON** or **poisoned 1 hour** and **cannot knowingly
  lie**, as *zone of truth*.
- **Wyvern Poison** — **DC 15 CON, 24 (7d6) poison**, half on success.

*Engine note:* every poison decomposes into
`{ delivery, save: {CON, DC}, damage?, condition?, duration, repeatRule?,
endRule?, specialClauses[] }`. The special clauses are the interesting part —
"cannot be healed by any means", "wakes only on damage", "failing by 5 or more",
"at the stroke of midnight". These are exactly the kind of thing a naive
`{damage, condition}` item schema would silently drop.

---

## What this section proves about DM authoring

The user's brief requires DM content to use the **same** Effect → Modifier →
Derived Stat mechanism as SRD content. This chapter is the strongest test of
that, and it mostly passes:

1. **Traps, poisons and diseases are all the same shape** —
   `trigger → save or attack → damage and/or condition → recurrence → end
   condition`. One authoring form covers all three.
2. **The severity tables give the DM real assistance**, not a blank field:
   pick setback/dangerous/deadly and a party level, get a DC, an attack bonus and
   a damage die.
3. **But the special clauses do not fit a fixed schema.** "Gnomes are immune",
   "damage cannot be healed by any means", "the DC drops by 1d6 on each success",
   "no effect until midnight", "failing by 5 or more". Some of these are
   expressible as tagged modifiers; several are not. The honest conclusion is
   that the authoring model needs **a structured core plus a small set of
   composable clause types**, and an explicit **escape hatch that is presented
   to the player as text rather than silently ignored**.
4. **The SRD repeatedly says "use your judgement"** and warns against letting
   die rolls override clever play. Any automation must therefore be
   **overridable by the DM at the point of resolution**, which reinforces the
   "GM fiat is a first-class input to every roll" finding from
   `06-core-rules.md`.
