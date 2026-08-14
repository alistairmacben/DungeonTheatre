# Races (p3–7)

**Nine races, eight of which have exactly one subrace in this SRD** (human and
half-elf have none; dwarf → hill dwarf, elf → high elf, halfling → lightfoot,
gnome → rock gnome). A subrace **adds to** the parent race's traits, never
replaces them.

## The common trait vocabulary (p3)

Every race entry supplies: **Ability Score Increase**, **Age** (adulthood and
lifespan — no mechanics), **Alignment** (a tendency, **explicitly non-binding**),
**Size**, **Speed**, **Languages**, and race-specific traits.

**Size** — Medium is roughly **4 to 8 feet**; Small is **2 to 4 feet**, and the
one rule the SRD calls out here is that **Small characters have trouble wielding
heavy weapons** (i.e. disadvantage, per `04-equipment.md`).

*Engine note:* the race entry is the first and simplest **effect bundle** —
a named set of modifiers, proficiencies, senses and features applied to a
character. Because *reincarnate* can **swap a character's race and its racial
traits** (`08b-spell-descriptions.md`), that bundle must be **detachable and
replaceable at runtime**, not merged into the character at creation.

---

## Dwarf

**CON +2** · Adult at 50, lives ~350 years · Usually lawful good ·
**Medium** (4–5 ft, ~150 lb) · **Speed 25 ft**

- **[IMPORTANT] Speed is not reduced by wearing heavy armour** — a targeted
  exemption from the Str-requirement penalty in `04-equipment.md`.
- **Darkvision 60 ft** — dim light counts as bright, darkness as dim, **no
  colour, only greys**.
- **Dwarven Resilience** — **advantage on saves against poison** and
  **resistance to poison damage**.
- **Dwarven Combat Training** — proficiency with **battleaxe, handaxe, light
  hammer, warhammer**.
- **Tool Proficiency** — a **choice** of smith's tools, brewer's supplies or
  mason's tools.
- **Stonecunning** — on an **INT (History) check related to the origin of
  stonework**, you **count as proficient in History and add double your
  proficiency bonus**.
  *(Two things at once: it **grants** proficiency if absent, and **doubles** it.
  This matters because of the multiply-zero rule in `06-core-rules.md` §3 —
  without the explicit grant, doubling a non-proficiency would give nothing.
  It is also **narratively scoped** and therefore unautomatable; see
  `99-open-questions.md` Q2.)*
- **Languages** — Common and Dwarvish.

### Hill Dwarf
**WIS +1** · **Dwarven Toughness** — **hit point maximum +1, and +1 more every
time you gain a level**.
*(A per-level HP addend, so HP maximum is a **function of level**, not a stored
accumulator — the same conclusion the retroactive-CON rule reaches.)*

---

## Elf

**DEX +2** · Adult ~100, lives to 750 · Usually chaotic good ·
**Medium** (under 5 to over 6 ft) · **Speed 30 ft**

- **Darkvision 60 ft.**
- **Keen Senses** — proficiency in **Perception**.
- **Fey Ancestry** — **advantage on saves against being charmed**, and **magic
  cannot put you to sleep**.
  *(An **immunity to a specific effect category**, not to a condition — *sleep*
  already exempts creatures immune to charm, so these interlock.)*
- **Trance** — elves **do not sleep**; **4 hours of meditation gives the same
  benefit as 8 hours of human sleep**.
  *(Interacts with the long-rest rule in `06-core-rules.md` §9, and with
  *dream*, which explicitly **cannot contact creatures that don't sleep**.)*
- **Languages** — Common and Elvish.

### High Elf
**INT +1** · **Elf Weapon Training** (longsword, shortsword, shortbow, longbow)
· **Cantrip** — one cantrip **from the wizard spell list**, with **INT as its
spellcasting ability** · **Extra Language** of your choice.
*(A race granting a spell with **its own spellcasting ability**, independent of
any class — so spellcasting ability is a **per-source** property, exactly as
multiclassing requires.)*

---

## Halfling

**DEX +2** · Adult at 20, lives into its second century · Usually lawful good ·
**Small** (~3 ft, ~40 lb) · **Speed 25 ft**

- **Lucky** — **when you roll a 1 on the d20** for an **attack roll, ability
  check or saving throw**, **reroll and must use the new roll**.
  *(A reroll triggered by the **die face**, not the total. Combined with the
  advantage rule, you **reroll only one of the two dice and you choose which** —
  see `06-core-rules.md` §2.)*
- **Brave** — advantage on saves against being **frightened**.
- **Halfling Nimbleness** — **move through the space of any creature at least
  one size larger than you**.
- **Languages** — Common and Halfling.

### Lightfoot
**CHA +1** · **Naturally Stealthy** — **you can attempt to hide even when
obscured only by a creature at least one size larger than you**.

---

## Human

**+1 to every ability score** · Adult in late teens, lives under a century ·
No alignment tendency · **Medium** · **Speed 30 ft** · **Common plus one extra
language**.

**No other traits.** *(The SRD contains only the base human — no variant human,
so **the feat-instead-of-ASI rule in `05-feats.md` is the only feat vector**.)*

---

## Dragonborn

**STR +2, CHA +1** · Adult at 15, lives ~80 years · Tends to extremes ·
**Medium** (over 6 ft, ~250 lb) · **Speed 30 ft**

**Draconic Ancestry** — choose a dragon type, which fixes **both** the breath
weapon's shape and save **and** the damage resistance:

| Dragon | Damage type | Breath weapon |
|---|---|---|
| Black | Acid | 5 × 30 ft line, **DEX save** |
| Blue | Lightning | 5 × 30 ft line, **DEX save** |
| Brass | Fire | 5 × 30 ft line, **DEX save** |
| Bronze | Lightning | 5 × 30 ft line, **DEX save** |
| Copper | Acid | 5 × 30 ft line, **DEX save** |
| Gold | Fire | 15 ft cone, **DEX save** |
| Green | Poison | 15 ft cone, **CON save** |
| Red | Fire | 15 ft cone, **DEX save** |
| Silver | Cold | 15 ft cone, **CON save** |
| White | Cold | 15 ft cone, **CON save** |

- **Breath Weapon** — **action**; **DC = 8 + your CON modifier + your
  proficiency bonus**; **2d6**, half on a success. **Scales to 3d6 at 6th level,
  4d6 at 11th, 5d6 at 16th.** **Recharges on a short *or* long rest.**
  *(A racial feature with its own save DC formula — the **same shape as a spell
  save DC but keyed to CON**. So "save DC" is per-feature, not one character-wide
  number.)*
- **Damage Resistance** — to the matching type.
- **Languages** — Common and Draconic.

---

## Gnome

**INT +2** · Settles down around 40, lives 350–500 years · Usually good ·
**Small** (3–4 ft, ~40 lb) · **Speed 25 ft**

- **Darkvision 60 ft.**
- **Gnome Cunning** — **advantage on all INT, WIS and CHA saving throws against
  magic**.
  *(Advantage scoped by **three abilities at once** and by an **effect source
  tag** ("against magic") — the clearest case for tag-scoped advantage rather
  than stat-path-scoped.)*
- **Languages** — Common and Gnomish (written in Dwarvish script).

### Rock Gnome
**CON +1** ·
- **Artificer's Lore** — on an **INT (History) check about magic items,
  alchemical objects or technological devices**, **add twice your proficiency
  bonus instead of any bonus you normally apply**.
  *(Note the wording differs from Stonecunning: it does **not** grant History
  proficiency, so a non-proficient rock gnome still doubles **zero**. A genuine
  asymmetry between two nearly identical features, and exactly the kind of thing
  a naive implementation would flatten.)*
- **Tinker** — proficiency with **tinker's tools**; **1 hour and 10 gp** builds a
  **Tiny clockwork device (AC 5, 1 hp)** lasting **24 hours** (extendable by
  another hour's repair), dismantlable as an action to reclaim the materials.
  **Up to three active at once.** Options: *Clockwork Toy* (moves 5 ft in a
  random direction each turn, making appropriate noises), *Fire Starter*
  (an action to produce a flame to light a candle, torch or campfire),
  *Music Box* (plays one song until it ends or is closed).
  *(A **bounded pool of player-created object instances** — the same shape as
  *prestidigitation*'s three concurrent effects.)*

---

## Half-Elf

**CHA +2, and +1 to two other ability scores of your choice** · Adult at 20,
often exceeds 180 years · Chaotic-leaning · **Medium** (5–6 ft) ·
**Speed 30 ft**

- **Darkvision 60 ft** · **Fey Ancestry** (as elf).
- **Skill Versatility** — **proficiency in two skills of your choice**.
- **Languages** — Common, Elvish, and one extra of your choice.

*(The **only** race whose ability score increase is partly player-chosen, which
makes the race bundle itself carry **choice points**, not just fixed values.)*

---

## Half-Orc

**STR +2, CON +1** · Adult at 14, rarely lives past 75 · Chaotic-leaning ·
**Medium** (5 to well over 6 ft) · **Speed 30 ft**

- **Darkvision 60 ft.**
- **Menacing** — proficiency in **Intimidation**.
- **Relentless Endurance** — **when reduced to 0 hit points but not killed
  outright, drop to 1 hit point instead**. **Once per long rest.**
  *(A second interceptor on the damage pipeline, alongside *death ward* — and
  note the "**but not killed outright**" clause defers to the instant-death rule
  in `07-combat-spellcasting.md` §4.)*
- **Savage Attacks** — on a **critical hit with a melee weapon attack**, **roll
  one of the weapon's damage dice one additional time** and add it to the extra
  critical damage.
  *(Modifies the **critical damage calculation specifically** — so criticals need
  their own extensible step, not just "double the dice".)*
- **Languages** — Common and Orc.

---

## Tiefling

**INT +1, CHA +2** · Matures as humans, lives a few years longer ·
Chaotic-leaning · **Medium** · **Speed 30 ft**

- **Darkvision 60 ft.**
- **Hellish Resistance** — **resistance to fire damage**.
- **Infernal Legacy** — the ***thaumaturgy*** cantrip; at **3rd level**, cast
  ***hellish rebuke* as a 2nd-level spell once per long rest**; at **5th level**,
  cast ***darkness* once per long rest**. **CHA is the spellcasting ability for
  all three.**
  *(A racial feature that **unlocks in stages by character level** and grants
  spells at a **fixed upcast level** with a **per-spell once-per-long-rest**
  budget — three different resource shapes in one trait.)*
- **Languages** — Common and Infernal.

---

## Cross-cutting findings

1. **Darkvision 60 ft is near-universal** (dwarf, elf, gnome, half-elf,
   half-orc, tiefling) — only humans, halflings and dragonborn lack it. The
   *goggles of night* distinction between **granting** and **extending** it
   therefore matters in practice.
2. **Three distinct proficiency-doubling wordings** — Stonecunning (grants **and**
   doubles), Artificer's Lore (doubles only), and the rogue's Expertise
   (doubles only, chosen). They are not interchangeable.
3. **Speed exemptions are targeted, not general** — a dwarf ignores the heavy
   armour speed penalty specifically; nothing else does.
4. **Racial spellcasting carries its own ability** — high elf INT, tiefling CHA,
   dragonborn breath CON. Confirms that the spellcasting ability and save DC are
   properties of the **granting source**, not of the character.
5. **Narratively-scoped bonuses appear immediately** — Stonecunning and
   Artificer's Lore are the first two of the "cannot be automated, must be a
   player-facing toggle on the roll" family logged in `99-open-questions.md`.
6. **The race bundle must be swappable** — *reincarnate* rewrites it wholesale,
   keeping everything else about the character intact.
