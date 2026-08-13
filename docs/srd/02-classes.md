# Classes — complete extraction

Every class, every feature, losslessly. Flavour text omitted; all mechanics
kept. Subclass content included (the SRD ships exactly one subclass per class).

## Shape common to every class

- **Hit Dice** — one die type per class. HP at L1 = die max + CON mod.
  HP per level after = roll (or fixed average) + CON mod.
- **Proficiencies** — armour, weapons, tools, **two saving throws**, and
  *choose N from a list* of skills.
- **Starting equipment** — a list of choices, some referencing categories
  ("any martial melee weapon") and some conditional ("if proficient").
- **Level table** — Level, Proficiency Bonus, Features, plus **class-specific
  columns** (Rages, Cantrips Known, Spells Known, Spell Slots 1–9, Ki, etc.).
- **Ability Score Improvement** at 4/8/12/16/19 — +2 to one or +1 to two,
  cap 20 (modifiable, see Primal Champion).
- **Subclass** chosen at a class-specific level, granting features at set levels.

---

## Barbarian (p8–10) — no spellcasting

**Hit Die** d12. **Saves** STR, CON. **Armour** light, medium, shields.
**Weapons** simple, martial. **Skills** choose 2 from Animal Handling,
Athletics, Intimidation, Nature, Perception, Survival.

Table columns: Rages, Rage Damage.

| Level | Feature |
|---|---|
| 1 | Rage, Unarmored Defense |
| 2 | Reckless Attack, Danger Sense |
| 3 | Primal Path (subclass) |
| 5 | Extra Attack, Fast Movement |
| 7 | Feral Instinct |
| 9/13/17 | Brutal Critical (1/2/3 dice) |
| 11 | Relentless Rage |
| 15 | Persistent Rage |
| 18 | Indomitable Might |
| 20 | Primal Champion |

- **Rage** — bonus action. Requires not wearing heavy armour. Grants advantage
  on STR checks and STR saves; bonus melee damage when attacking with STR
  (table column); resistance to bludgeoning/piercing/slashing. **Forbids**
  casting and concentration. Lasts 1 minute; ends early if knocked unconscious,
  or if the turn ends without having attacked a hostile creature or taken
  damage since the last turn. Can end as a bonus action. Limited uses per long
  rest; "Unlimited" at L20.
- **Unarmored Defense** — AC = 10 + DEX + CON while wearing no armour.
  **Shield explicitly permitted.**
- **Reckless Attack** — declared on first attack of the turn. Advantage on STR
  melee attacks this turn; **attack rolls against you have advantage** until
  your next turn.
- **Danger Sense** — advantage on DEX saves against effects you can **see**.
  Requires not blinded, deafened or incapacitated.
- **Extra Attack** — two attacks with the Attack action.
- **Fast Movement** — +10 speed while not in heavy armour.
- **Feral Instinct** — advantage on initiative; may act while surprised if
  raging first.
- **Brutal Critical** — extra weapon damage die/dice on a crit (melee).
- **Relentless Rage** — dropping to 0 while raging: DC 10 CON save to drop to 1
  instead. **DC +5 per subsequent use; resets on a short or long rest.**
- **Persistent Rage** — rage ends early only on unconsciousness or by choice.
- **Indomitable Might** — if a STR check total is below your STR score, use the
  score instead.
- **Primal Champion** — STR and CON +4; **maximum for those scores becomes 24**.

**Path of the Berserker:** Frenzy (L3, bonus-action attack while raging; one
level of **exhaustion** when rage ends), Mindless Rage (L6, can't be charmed or
frightened while raging; existing instances **suspended** for the duration),
Intimidating Presence (L10, action, WIS save DC 8 + PB + CHA), Retaliation
(L14, reaction melee attack when damaged within 5 ft).

---

## Bard (p11–14) — spells **known**, CHA

**Hit Die** d8. **Saves** DEX, CHA. **Armour** light. **Weapons** simple, hand
crossbows, longswords, rapiers, shortswords. **Tools** three musical
instruments. **Skills** choose **any three**.

Table columns: Cantrips Known, Spells Known, Spell Slots 1–9.

- **Spellcasting** — cantrips known 2→4; spells known 4→22; **may swap one
  known spell on each level up**. Slots regained on long rest.
  DC = 8 + PB + CHA; attack = PB + CHA. Ritual casting (known spells with the
  ritual tag). Focus: musical instrument.
- **Bardic Inspiration** — bonus action, one creature within 60 ft that can
  hear you. Gives a die (d6 → d8 L5 → d10 L10 → d12 L15) usable within 10
  minutes on one ability check, attack roll or saving throw. **The recipient
  may decide after rolling the d20, before success is announced.** One die at a
  time per creature. Uses = **CHA modifier (min 1)**, regained on long rest
  (short rest from L5 via Font of Inspiration).
- **Jack of All Trades** (L2) — add **half** PB (rounded down) to any ability
  check that doesn't already include PB.
- **Song of Rest** (L2) — allies regain an extra 1d6 (→d8 L9, d10 L13, d12 L17)
  when spending Hit Dice on a short rest.
- **Expertise** (L3, again L10) — two skill proficiencies, PB doubled.
- **Countercharm** (L6) — action; you and allies within 30 ft that can hear you
  gain advantage on saves against being frightened or charmed until end of next
  turn.
- **Magical Secrets** (L10, 14, 18) — two spells **from any class list**, of a
  level you can cast; count as bard spells.
- **Superior Inspiration** (L20) — regain one use on rolling initiative if none
  remain.

**College of Lore:** Bonus Proficiencies (L3, three skills), **Cutting Words**
(L3, reaction, expend Bardic Inspiration to subtract the die from **another
creature's** attack roll, ability check or damage roll — decided *after* their
roll; immune if it can't hear you or is immune to charm), Additional Magical
Secrets (L6, two spells from any class, not counted against known),
Peerless Skill (L14, expend inspiration to add to own ability check after
rolling).

---

## Cleric (p15–18) — spells **prepared**, WIS

**Hit Die** d8. **Saves** WIS, CHA. **Armour** light, medium, shields.
**Weapons** simple. **Skills** choose 2 from History, Insight, Medicine,
Persuasion, Religion.

Table columns: Cantrips Known, Spell Slots 1–9.

- **Spellcasting** — cantrips 3→5. **Prepared:** choose WIS modifier + cleric
  level spells (min 1) from the cleric list, of levels you have slots for.
  Casting does **not** remove a spell from the prepared list. Changeable on a
  long rest (1 minute per spell level of preparation time).
  DC = 8 + PB + WIS; attack = PB + WIS. Ritual casting requires the spell be
  **prepared**. Focus: holy symbol.
- **Divine Domain** (L1) — grants domain spells and features at 1/2/6/8/17.
- **Domain Spells** — **always prepared** and **do not count against** the
  prepared limit. If not on the cleric list, they are cleric spells for you
  anyway. *(Spell-list membership is extensible per character.)*
- **Channel Divinity** (L2) — choose an effect; recharge on **short or long
  rest**. 1/rest → 2 at L6 → 3 at L18. Save DC = cleric spell save DC.
  - *Turn Undead* — action; undead within 30 ft that can see or hear make a WIS
    save or are **turned** for 1 minute or until damaged (forced movement +
    action restriction — a behavioural condition).
- **Destroy Undead** (L5+) — turned undead **destroyed** if CR ≤ threshold
  (1/2 → 1 → 2 → 3 → 4 by level). **Requires CR data, absent from this SRD.**
- **Divine Intervention** (L10) — action; roll percentile, success if ≤ cleric
  level. On success **7-day cooldown**; on failure retry after a long rest.
  Automatic success at L20.

**Life Domain:** spells at 1/3/5/7/9 (bless, cure wounds; lesser restoration,
spiritual weapon; beacon of hope, revivify; death ward, guardian of faith;
mass cure wounds, raise dead). Bonus Proficiency (heavy armour), Disciple of
Life (healing spells restore an extra 2 + spell level), Preserve Life (Channel
Divinity: pool of 5 × cleric level HP divided among creatures within 30 ft, no
creature above half maximum, not undead or constructs), Blessed Healer (healing
others also heals you 2 + spell level), Divine Strike (L8, **once per turn**,
extra 1d8 radiant on a weapon hit; 2d8 at L14), Supreme Healing (L17, **use the
maximum on every healing die instead of rolling**).

---

## Druid (p19–23) — spells **prepared**, WIS

**Hit Die** d8. **Saves** INT, WIS. **Armour** light, medium, shields —
*"druids will not wear armour or use shields made of metal"* (a flavour
restriction with no mechanical penalty stated). **Weapons** clubs, daggers,
darts, javelins, maces, quarterstaffs, scimitars, sickles, slings, spears.
**Tools** herbalism kit. **Skills** choose 2 from Arcana, Animal Handling,
Insight, Medicine, Nature, Perception, Religion, Survival.

- **Druidic** (L1) — secret language; hidden messages found on DC 15 WIS
  (Perception).
- **Spellcasting** — same prepared model as cleric (WIS mod + druid level).
  Focus: druidic focus.
- **Wild Shape** (L2) — action; assume the form of a beast previously seen.
  Two uses, recharged on **short or long rest**. Max CR and limitations by
  level (L2: CR 1/4, no fly/swim; L4: CR 1/2, no fly; L8: CR 1). Duration:
  hours equal to half druid level; revert as a bonus action, or automatically
  on unconsciousness, 0 HP, or death.
  - Statistics **replaced** by the beast's, **retaining** alignment,
    personality, INT/WIS/CHA, and all skill and save proficiencies (use the
    higher bonus of the two).
  - Assume the beast's HP and Hit Dice; on reverting, return to previous HP;
    **excess damage carries over**.
  - Cannot cast spells; concentration on already-cast spells persists.
  - Retain class/race features usable by the new form; lose special senses
    unless the form has them.
  - Equipment: falls, merges, or is worn — merged equipment has no effect.
  - **Requires beast statblocks, absent from this SRD.**
- **Timeless Body** (L18), **Beast Spells** (L18, cast with V/S while in beast
  form, no material components), **Archdruid** (L20, unlimited Wild Shape;
  ignore V and S components and material components without cost).

**Circle of the Land:** Bonus Cantrip (L2), **Natural Recovery** (L2, on a
short rest recover spell slots totalling half druid level rounded up, none
6th+; once per long rest), Circle Spells (L3/5/7/9 by chosen land — arctic,
coast, desert, forest, grassland, mountain, swamp — **always prepared, not
counted against the limit**), Land's Stride (L6, nonmagical difficult terrain
costs no extra movement; advantage on saves vs magically-created plants),
Nature's Ward (L10, can't be charmed or frightened **by elementals or fey**;
**immune to poison and disease**), Nature's Sanctuary (L14, a beast or plant
attacking you must make a WIS save vs your spell save DC or choose another
target / automatically miss; immune for 24 h on success).

---

## Fighter (p24–25) — no spellcasting

**Hit Die** d10. **Saves** STR, CON. **Armour** all armour, shields.
**Weapons** simple, martial. **Skills** choose 2 from Acrobatics, Animal
Handling, Athletics, History, Insight, Intimidation, Perception, Survival.

**ASI at 4, 6, 8, 12, 14, 16, 19 — seven, not five.** ASI levels are
per-class data, not a global rule.

- **Fighting Style** (L1) — choose one, never twice even if chosen again:
  - *Archery* — +2 attack rolls with ranged weapons
  - *Defense* — +1 AC while wearing armour
  - *Dueling* — +2 damage when wielding a melee weapon in one hand and no
    other weapon
  - *Great Weapon Fighting* — reroll 1s and 2s on damage dice, must keep the
    new roll; two-handed or versatile weapons only
  - *Protection* — reaction, impose disadvantage on an attack against a
    creature within 5 ft; **requires a shield**
  - *Two-Weapon Fighting* — add the ability modifier to the **second** attack's
    damage *(confirming off-hand attacks normally add none)*
- **Second Wind** (L1) — bonus action, regain 1d10 + fighter level HP;
  short or long rest.
- **Action Surge** (L2) — one extra action; short or long rest. Two uses at
  L17 but **only once on the same turn**.
- **Extra Attack** — 2 at L5, **3 at L11, 4 at L20** (fighter-specific; does
  not stack with other classes' Extra Attack).
- **Indomitable** (L9) — reroll a failed saving throw, must use the new roll;
  long rest. 2 uses at L13, 3 at L17.

**Champion:** Improved Critical (L3, **crit on 19–20**), Remarkable Athlete
(L7, add **half PB rounded up** to STR/DEX/CON checks not already including PB;
running long jump +STR modifier feet), Additional Fighting Style (L10),
Superior Critical (L15, **crit on 18–20**), Survivor (L18, regain 5 + CON
modifier HP at the start of each turn while at or below half HP; not at 0 HP).

---

## Monk (p26–29) — no spellcasting, **ki points**

**Hit Die** d8. **Saves** STR, DEX. **Armour** none. **Weapons** simple,
shortswords. **Tools** one artisan's tools or one musical instrument.
**Skills** choose 2 from Acrobatics, Athletics, History, Insight, Religion,
Stealth.

Table columns: Martial Arts die, Ki Points, Unarmored Movement.

- **Unarmored Defense** (L1) — AC = 10 + DEX + WIS while wearing no armour
  **and not wielding a shield**. *(Barbarian's version permits a shield —
  the two variants differ.)*
- **Martial Arts** (L1) — while unarmed or wielding only monk weapons
  (shortswords and simple melee weapons without two-handed or heavy), and
  wearing no armour or shield:
  - **use DEX instead of STR** for attack and damage
  - **roll the Martial Arts die in place of the weapon's normal damage**
    (d4 → d6 L5 → d8 L11 → d10 L17)
  - bonus-action unarmed strike after taking the Attack action
- **Ki** (L2) — points = monk level. Recharge on a short or long rest,
  requiring **30 minutes of the rest spent meditating**.
  **Ki save DC = 8 + PB + WIS.**
  - *Flurry of Blows* — 1 ki, two unarmed strikes as a bonus action after Attack
  - *Patient Defense* — 1 ki, Dodge as a bonus action
  - *Step of the Wind* — 1 ki, Disengage or Dash as a bonus action, jump doubled
- **Unarmored Movement** (L2) — +10 ft rising to +30 ft, while no armour or
  shield. At L9, move along vertical surfaces and across liquids.
- **Deflect Missiles** (L3) — reaction when hit by a ranged weapon attack;
  reduce damage by 1d10 + DEX + monk level. If reduced to 0, may catch it and
  spend 1 ki to throw it back **with proficiency regardless of weapon
  proficiencies**.
- **Slow Fall** (L4) — reaction, reduce falling damage by 5 × monk level.
- **Stunning Strike** (L5) — on a melee weapon hit, spend 1 ki; CON save or
  **stunned** until the end of your next turn.
- **Ki-Empowered Strikes** (L6) — unarmed strikes **count as magical** for
  overcoming resistance and immunity to nonmagical damage.
- **Evasion** (L7) — on an effect allowing a DEX save for half damage: **no
  damage on success, half on failure**.
- **Stillness of Mind** (L7) — action, end one charm or fright effect on self.
- **Purity of Body** (L10) — immune to disease and poison.
- **Tongue of the Sun and Moon** (L13) — understand and be understood in all
  spoken languages.
- **Diamond Soul** (L14) — **proficiency in all saving throws**; spend 1 ki to
  reroll a failed save and take the second result.
- **Timeless Body** (L15) — no ageing frailty; need no food or water.
- **Empty Body** (L18) — 4 ki: invisible 1 minute with **resistance to all
  damage except force**. 8 ki: cast *astral projection* without materials.
- **Perfect Self** (L20) — regain 4 ki on rolling initiative if none remain.

**Way of the Open Hand:** Open Hand Technique (L3, on a Flurry of Blows hit
impose one of — DEX save or prone; STR save or pushed 15 ft; no reactions until
end of your next turn), Wholeness of Body (L6, action, heal 3 × monk level,
long rest), Tranquility (L11, gain *sanctuary* after a long rest, DC 8 + WIS +
PB), Quivering Palm (L17, 3 ki on an unarmed hit; vibrations last **days equal
to monk level**; action to end them, CON save or reduced to 0 HP, 10d10 necrotic
on success; only one creature at a time).
