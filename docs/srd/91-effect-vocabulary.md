# The consolidated effect vocabulary

**Status:** derived from the complete sequential read of all 253 pages.
`90-vocabulary-findings.md` holds the raw running notes taken during the races
and classes read; **this file supersedes it** as the distilled result, gathering
evidence from every section.

**What this is for.** The user's brief requires that DM-authored content use the
**same** Effect → Modifier → Derived Stat mechanism as SRD content. That is only
achievable if the vocabulary is derived from what the SRD actually does rather
than guessed at. Everything below is grounded in specific cited rules.

**What this is not.** This is not a schema. It is the list of things a schema
must be able to express, plus the things that provably cannot be expressed and
must be handled another way.

---

## 1. The eight operations on a derived stat

The architecture draft proposed `base | add | set | min | max | multiply |
advantage | disadvantage | reroll | explode | grant`. The read confirms most of
these and adds several, but more importantly it shows that **the operation alone
is not enough — each operation has its own combination rule**.

| Operation | Evidence | Combination rule |
|---|---|---|
| **base** | Armour AC, Unarmoured Defense ×2, *mage armor*, Draconic Resilience, *robe of the archmagi* | **Highest wins.** Six competing providers for AC alone. |
| **add** | Ability modifiers, *ring of protection*, cover, *bless*'s 1d4 | **Sums**, except where a source says otherwise. |
| **set** | *Amulet of Health* (CON 19), *belt of giant strength*, *feeblemind* (INT and CHA 1) | **Last applied wins**, and each is gated on "no effect if already higher". |
| **min** (floor) | *Barkskin* — "AC can't be less than 16" | Applies after everything else. |
| **max** (cap) | Ability cap 20, raised to 24 by the Star card, to 30 by *hammer of thunderbolts*, and permanently by the manuals and tomes | **The cap is itself a derived stat.** |
| **multiply** | Expertise (×2), Jack of All Trades (×½ round down), Remarkable Athlete (×½ round up), Stonecunning, Artificer's Lore | **Applied once and only once**, and **multiplying a non-proficiency yields zero, not a bonus**. |
| **suppress** | Dwarf speed ("not reduced by heavy armour"), *mithral armor* (deletes the Stealth penalty and the Str requirement), *freedom of movement*, *elven chain* (waives its own proficiency requirement) | **Removes a specific tagged modifier or requirement.** Not in the draft; required. |
| **replace** | *Shillelagh* (ability and damage die), *sun blade* (damage type), *glibness* (substitutes 15 for a d20 roll) | **Overrides a computed value outright.** Not in the draft; required. |

---

## 2. Roll modification is five separate mechanisms, not one

The draft treated advantage as a modifier. It is not. The read produces **five
mutually distinct** ways to alter a roll, each needing its own representation:

1. **Numeric modifier** — `+2`, `+1d4` (*bless*), `−1d4` (*bane*), `+10`
   (*pass without trace*). Note that **a modifier can be a die**, resolved at
   the time of the later roll, so a pending roll must carry pending dice.
2. **Advantage / disadvantage** — a **tri-state reduced from two boolean sets**.
   They never stack; any advantage plus any disadvantage yields **neither**;
   and in **passive** form the same state becomes **±5**. The contributing
   sources must remain enumerable in the breakdown even when they cancel, or the
   HUD cannot explain the result.
3. **Reroll** — Halfling Lucky (triggered by the **die face**, not the total),
   *luck blade*, Portent-style effects, and *wish* (which can reroll **any roll
   made within the last round**, including another creature's resolved save).
   With advantage active you **reroll one of the two dice and choose which**.
4. **Replacement** — *glibness* substitutes a flat 15.
5. **Outcome conversion** — *ring of evasion* (failed DEX save → success),
   *scarab of protection*, *staff of charming*, *portent*. This operates on the
   **verdict**, not the number.

---

## 3. The proficiency term is its own thing

`proficiencyTerm = isProficient ? round(PB × multiplier) : 0`

- **Added once**, no matter how many rules say to add it.
- **Multiplied once**, no matter how many say to double it — multipliers do not
  compose.
- **Zero stays zero.** A feature that doubles your proficiency bonus on a check
  you are not proficient in gives **nothing**.
- **Three different wordings exist and are not interchangeable:** Stonecunning
  **grants proficiency and doubles**; Artificer's Lore **doubles only**;
  Expertise **doubles only, on a chosen skill**.
- Rounding is **per-source**: Jack of All Trades rounds **down**, Remarkable
  Athlete rounds **up**.
- **The proficiency bonus itself is derived** and can be modified — *Ioun stone
  of mastery* adds +1.

---

## 4. A roll request is not `{ability, skill}`

An ability check has **three orthogonal inputs**, and the proficiency bonus
applies if **either** relevant proficiency is held:

```
{ ability, skill?, tool?, advantageSources[], disadvantageSources[],
  pendingDiceModifiers[], dmOverride? }
```

- **Ability and skill are independent.** The SRD's own variant explicitly calls
  for **Constitution (Athletics)** and **Strength (Intimidation)**.
- **Tool proficiency is bound to no ability at all** — the same tool may be used
  with a DEX or a STR check.
- **Some checks name no ability** — *counterspell* and *dispel magic* use "an
  ability check with your spellcasting ability", which is per-class.
- **GM fiat is a first-class input to every roll**, not an escape hatch: "The GM
  can also decide that circumstances influence a roll."

### Rolls are not always single-player

| Shape | Evidence | Requirement |
|---|---|---|
| **Contest** | Grapple, shove, hide vs. search, *telekinesis*, sentient items | Two players roll against each other; **a tie changes nothing**; **the defender often chooses which ability to use** |
| **Group check** | Group Wisdom (Survival) to cross a swamp | Everyone rolls; **at least half must succeed** |
| **Help** | The Help action, Working Together | A second player grants advantage, and **must be eligible to attempt the task alone** |
| **Sequential decision** | Spending Hit Dice on a short rest | Roll, see the result, decide whether to roll again |
| **Post-roll window** | *Guidance*, *Resistance*, Bardic Inspiration, Cutting Words, Foe Slayer, *shield*, *wish* | Another player modifies a roll **after the dice land** |

These five argue for **one generic "pending interaction" primitive** rather than
five bespoke flows.

---

## 5. Rolled values become persistent state

- A **Stealth check total persists as a standing DC** until you are discovered.
- **Death saving throws** maintain **two counters**, reset by any healing.
- *Contagion*, *flesh to stone* and the *prismatic* indigo layer all use the
  identical **three-successes-or-three-failures** counter. One shared primitive.
- *Delayed blast fireball*'s damage **accumulates by 1d6 per round as state**.
- *Guardian of faith* terminates on a **cumulative damage budget** (60).

---

## 6. Damage is a pipeline with named stages

```
1. roll typed damage components        (a list, not a scalar — flame strike
                                        deals 4d6 fire AND 4d6 radiant)
2. apply critical rule                  (double dice only, never modifiers;
                                        extra feature dice double too;
                                        Savage Attacks adds one more die)
3. add flat modifiers                   (ability modifier, +N weapons, riders)
4. apply flat reductions                (auras, gloves of missile snaring)
5. apply resistance / vulnerability     (AFTER everything else; deduplicated
                                        by type; at most one halving and one
                                        doubling)
6. apply damage threshold               (objects only: sub-threshold damage is
                                        wholly ignored)
7. subtract from temporary hit points
8. subtract from hit points
```

**Interception hooks are required at several points**, and they are pervasive
enough to be a first-class concept rather than special cases:

| Hook | Examples |
|---|---|
| Before the attack roll is compared to AC | *shield* (+5 AC as a reaction to being hit) |
| Before targeting resolves | *sanctuary*, *mirror image*, *arrow-catching shield*, *shield of missile attraction* |
| On a failed save | *ring of evasion*, *scarab of protection*, *staff of charming* |
| On the spell itself | *counterspell*, *rod of absorption*, *staff of the magi*, Ioun stone of absorption |
| Before HP reaches 0 | *death ward*, Relentless Endurance |
| On the healing channel | *sword of wounding* (only rests heal it), *chill touch*, *harm* |

---

## 7. Resources have more than two refresh triggers

| Trigger | Evidence |
|---|---|
| **Short rest** | Hit Dice, warlock pact slots, most class uses, dragonborn breath |
| **Long rest** | Spell slots, most once-per-day features, temporary HP expiry |
| **Half on a long rest** | **Hit Dice regain only half your total, minimum one** |
| **Dawn** | The dominant magic-item trigger; usually `regains 1dN expended charges` |
| **Dusk** | *Robe of stars* (1d6 stars) — the only one |
| **Fixed multi-day cooldown** | Figurines (2–30 days), *rod of security* (10 days), *horn of Valhalla* (7 days) |
| **Cumulative-duration stopwatch** | *Boots of speed* (10 minutes total), *winged boots* (4 hours, regaining 2 per 12 unused), *candle of invocation* (4 hours, deducted in 1-minute increments) |
| **Finite lifetime** | *Chime of opening* (10 uses then cracks), *gem of brightness*, *scarab of protection*, *nine lives stealer* |
| **Campaign calendar** | Food and water clocks, *midnight tears* ("at the stroke of midnight"), disease incubation, downtime activities |
| **Burnout roll** | Nearly every staff and wand rolls a **d20 on spending its last charge**; a **1** destroys or degrades it, and two staffs regain charges on a **20** |

---

## 8. Casting is a parameterised invocation

A cast is never a fixed effect lookup. It carries:

```
{ spell, slotLevel, effectiveSpellLevel, statisticsSource,
  metamagicApplied[], componentsSatisfied, concentrationSlot }
```

- **Slot level and spell level are separately meaningful.** *Globe of
  invulnerability* compares against the **spell's own level**; *counterspell*
  and *dispel magic* compare against the **slot used**.
- **Upcasting is a lookup table, not a formula.** Linear (+1d6 per level),
  per-two-levels (*flame blade*, *spiritual weapon*), tiered (*magic weapon*
  +1/+2/+3 at 2nd/4th/6th), slot-tier-specific (*conjure animals* ×2/×3/×4 at
  5th/7th/9th), duration-tiered (*bestow curse*, the *dominate* family, *geas*,
  *mass suggestion*, *planar binding*), and **capable of removing the
  concentration requirement entirely** (*bestow curse* at 5th+).
- **Cantrips scale on a different axis**, at character level 5/11/17 — usually
  damage dice, but *eldritch blast* scales the **number of attack rolls**.
- **Metamagic makes casting time, range, duration, components, target count,
  damage dice and save outcomes all cast-time parameters.**
- **The statistics source varies**: the caster's own, the item's fixed values
  (spell scrolls, *circlet of blasting*), or **the original caster's** (*ring of
  spell storing*, Ioun stone of reserve).
- **Component satisfaction is a real precondition check** against inventory and
  body state — gagged, silenced, a free hand, a focus held, costed components
  possessed, consumed components in stock. This is one of the highest-value HUD
  wins: grey out a spell and say **why**.
- **Concentration is a singleton slot** with an automatic **CON save at
  DC = max(10, half the damage taken)**, **once per damage source**.

---

## 9. Effects need a trigger language

This is the strongest finding of the whole read, and the draft has no answer to
it. **Seven SRD spells and several items take a condition written by the player
at cast time**: *glyph of warding*, *symbol*, *magic mouth*, *programmed
illusion*, *contingency*, *sequester*, *imprisonment*, plus every trap.

The SRD even constrains the predicate language itself:

- *Magic mouth* and *programmed illusion*: **"based on visual or audible
  conditions that occur within 30 feet"**.
- *Glyph of warding* and *symbol*: refinable by **physical characteristics
  (height, weight), creature kind, or alignment**, with **password exemptions**.
- *Imprisonment*: **"must be based on observable actions or qualities and not on
  intangibles such as level, class, or hit points"**.
- *Sequester*: **"must occur or be visible within 1 mile of the target"**.

Alongside these, the engine needs **system-generated triggers**: entering an
area for the first time on a turn, starting or ending a turn somewhere, being
hit by a melee attack (*fire shield*), taking damage while concentrating,
dropping to 0 HP, a "next time you hit" rider (*branding smite*), and the
per-round tick of a scripted timeline (*storm of vengeance*).

---

## 10. What provably cannot be modelled

Being explicit about this is more useful than half-modelling it. Each of these
should be **descriptive text plus a DM roll helper**, and should be *labelled as
such in the UI* rather than silently dropped.

1. **Narratively-scoped bonuses.** Stonecunning, Artificer's Lore, Natural
   Explorer, Favored Enemy, the crowbar's leverage advantage. The engine cannot
   decide whether a History check is "about stonework". → **A player-facing
   toggle on the roll**, defaulting to off.
2. **Anything needing a creature statblock.** Wild Shape, every *conjure* spell,
   *polymorph*, *find familiar*, *find steed*, figurines, *bag of tricks*,
   *horn of Valhalla*, *animate dead*, *simulacrum*. The SRD has **exactly one
   statblock** (the avatar of death). → **Deferred to v3, DM-supplied.**
3. **Stateful machine items.** The *apparatus of the crab*'s ten levers, the
   *deck of many things*, the *wand of wonder*'s d100 table, the *rod of lordly
   might*'s six buttons. → **Bespoke or out of scope.**
4. **Sentient items.** The SRD models these as NPCs making opposed CHA checks
   against their owner. → **DM narration plus a contested-check helper.**
5. **Negotiation.** *Planar ally* is explicitly a bargain, not a mechanic.
6. **Open-ended wishes.** *Wish*'s non-duplicating uses are GM adjudication with
   deliberate risk of perverse outcomes.
7. **Lifestyle, trade goods, services.** No mechanics at all — reference data
   for a shop UI, nothing more.

**The SRD itself repeatedly instructs the GM to override the dice** ("you
shouldn't allow die rolling to override clever play"). So **every automated
resolution must be overridable by the DM at the point of resolution**. That is a
design requirement, not a nicety.

---

## 11. Multiplayer surface area

Worth listing separately, because these are the parts that touch the existing
realtime layer rather than the rules layer:

- **Contests** — two players rolling against each other, defender choosing the
  ability.
- **Group checks** — N players, half-succeed threshold.
- **Help** — one player granting another advantage, with an eligibility check.
- **Post-roll modification windows** — *guidance*, *resistance*, Bardic
  Inspiration, Cutting Words, *shield*, *wish*.
- **Warding Bond** — damage dealt to one character is applied to another.
- **Inspiration** — a **player-to-player transfer with no DM involvement**.
- **Two-party trades** — required by the user's brief; the SRD supplies the
  objects (*freezing sphere*'s held globe, *instant summons* reporting who took
  your item, handing an item to another character as a free interaction).
- **Turn-based item control** — summoned entities acting on your turn.

---

## 12. The single most important structural conclusion

**A derived stat is not a number — it is a computation with a breakdown, and
the breakdown is part of the contract.** Every finding above points the same
way: the HUD must be able to answer "why is this number what it is?", "why is
this greyed out?", and "which of my things applied?". That means the resolver
must return, for every stat and every roll:

```
{ total, terms: [{ source, operation, value, applied: bool, reason? }] }
```

including terms that **did not apply** and why — advantage that cancelled, a
proficiency multiplier that hit zero, a component that was missing, a feat whose
prerequisite lapsed. Discarding those is what makes rules engines feel opaque,
and it is the difference between a Baldur's Gate 3 tooltip and a Roll20
spreadsheet.
