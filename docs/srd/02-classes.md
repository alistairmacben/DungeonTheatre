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

---

## Paladin (p30–34) — spells **prepared**, CHA, **half-caster**

**Hit Die** d10. **Saves** WIS, CHA. **Armour** all, shields. **Weapons**
simple, martial. **Skills** choose 2 from Athletics, Insight, Intimidation,
Medicine, Persuasion, Religion.

**Half-caster:** slots begin at L2 and reach only 5th level. **No cantrips.**
**Prepared = CHA modifier + half paladin level rounded down** (min 1) — a
*different formula* from full casters (ability + full level).

- **Divine Sense** (L1) — action; detect celestials, fiends, undead within
  60 ft (type, not identity), and consecrated/desecrated places. Uses =
  **1 + CHA modifier**, long rest.
- **Lay on Hands** (L1) — a **pool of HP equal to paladin level × 5**,
  replenished on a long rest. Spend any amount as an action to heal by touch,
  or **5 points to cure one disease or neutralise one poison**. No effect on
  undead or constructs.
- **Fighting Style** (L2) — Defense, Dueling, Great Weapon Fighting,
  Protection. *(A subset of the fighter's list — no Archery, no Two-Weapon.)*
- **Divine Smite** (L2) — on a melee weapon hit, **expend a spell slot** for
  2d8 radiant + 1d8 per slot level above 1st, max 5d8; **+1d8 against undead
  or fiends**.
- **Divine Health** (L3) — immune to disease.
- **Sacred Oath** (L3) — oath spells (**always prepared, don't count against
  the limit, become paladin spells even if off-list**) and Channel Divinity
  (short or long rest; DC = paladin spell save DC).
- **Aura of Protection** (L6) — you and friendly creatures within 10 ft add
  **your CHA modifier (min +1) to all saving throws**. Requires you be
  conscious. **Radius 30 ft at L18.**
- **Aura of Courage** (L10) — you and friendly creatures within the aura
  can't be frightened.
- **Improved Divine Smite** (L11) — every melee weapon hit deals +1d8 radiant,
  stacking with Divine Smite.
- **Cleansing Touch** (L14) — action, end one spell on self or a willing
  touched creature. Uses = CHA modifier (min 1), long rest.

**Oath of Devotion:** oath spells at 3/5/9/13/17. Channel Divinity — *Sacred
Weapon* (1 min: add CHA modifier, min +1, to attack rolls with a held weapon;
it sheds bright light 20 ft and **becomes magical** if it wasn't) and *Turn the
Unholy* (fiends and undead, as Turn Undead). Aura of Devotion (L7, can't be
charmed), Purity of Spirit (L15, **permanently under *protection from evil and
good***), Holy Nimbus (L20, 1 min: 30 ft bright light, enemies starting their
turn in it take 10 radiant; advantage on saves vs spells cast by fiends and
undead; long rest).

**Breaking your oath** is explicitly narrative — GM discretion, no mechanics.

---

## Ranger (p35–38) — spells **known**, WIS, **half-caster**

**Hit Die** d10. **Saves** STR, DEX. **Armour** light, medium, shields.
**Weapons** simple, martial. **Skills** choose **three** from Animal Handling,
Athletics, Insight, Investigation, Nature, Perception, Stealth, Survival.

**Half-caster, spells known, no cantrips.** Slots from L2, max 5th level.
May swap one known spell per level-up.

- **Favored Enemy** (L1, more at 6 and 14) — choose a creature type (or two
  humanoid races). Advantage on WIS (Survival) to track them and INT checks to
  recall lore about them; learn a language they speak.
- **Natural Explorer** (L1, more at 6 and 10) — choose a favoured terrain.
  **Proficiency bonus is doubled** on INT or WIS checks related to that terrain
  when using a proficient skill. Travel benefits: difficult terrain doesn't
  slow the group, can't get lost non-magically, stay alert while occupied,
  stealth at normal pace when alone, double foraging, detailed tracking info.
- **Fighting Style** (L2) — Archery, Defense, Dueling, Two-Weapon.
- **Primeval Awareness** (L3) — action, **expend a ranger spell slot** to sense
  creature types within 1 mile (6 in favoured terrain), duration 1 min per slot
  level. No location or number.
- **Land's Stride** (L8) — as druid.
- **Hide in Plain Sight** (L10) — 1 minute to camouflage; **+10 to DEX
  (Stealth)** while pressed motionless against a surface.
- **Vanish** (L14) — Hide as a bonus action; can't be tracked non-magically.
- **Feral Senses** (L18) — no disadvantage attacking creatures you can't see;
  aware of invisible creatures within 30 ft.
- **Foe Slayer** (L20) — once per turn, add WIS modifier to the attack roll
  **or** the damage roll against a favoured enemy. **May choose before or
  after the roll, but before effects are applied.**

**Hunter** — every tier is a *choice of one*:
- L3 *Hunter's Prey*: Colossus Slayer (+1d8 if target is below its HP maximum,
  once per turn) / Giant Killer (reaction attack when a Large+ creature within
  5 ft hits or misses you) / Horde Breaker (once per turn, a second attack
  against a different creature within 5 ft of the first).
- L7 *Defensive Tactics*: Escape the Horde (opportunity attacks against you
  have disadvantage) / Multiattack Defense (**+4 AC against all subsequent
  attacks from a creature that hit you, for the rest of that turn**) / Steel
  Will (advantage on saves vs frightened).
- L11 *Multiattack*: Volley (ranged attack against any number of creatures
  within 10 ft of a point) / Whirlwind Attack (melee against any number within
  5 ft).
- L15 *Superior Hunter's Defense*: Evasion / Stand Against the Tide (reaction:
  a creature that misses you repeats the attack against another creature of
  your choice) / Uncanny Dodge (reaction: halve an attack's damage).

---

## Rogue (p39–41) — no spellcasting

**Hit Die** d8. **Saves** DEX, INT. **Armour** light. **Weapons** simple, hand
crossbows, longswords, rapiers, shortswords. **Tools** thieves' tools.
**Skills** choose **four** from a list of eleven.

**ASI at 4, 8, 10, 12, 16, 19 — six** (an extra at 10). Table column: Sneak
Attack dice (1d6 → 10d6, rising every odd level).

- **Expertise** (L1, again L6) — two proficiencies, **including thieves' tools**
  (not only skills), PB doubled.
- **Sneak Attack** (L1) — **once per turn**, extra damage on a hit **if**:
  - you have advantage on the attack, **or**
  - another enemy of the target is within 5 ft of it, that enemy isn't
    incapacitated, **and** you don't have disadvantage;
  - and the attack uses a **finesse or ranged** weapon.
- **Thieves' Cant** (L1) — secret language.
- **Cunning Action** (L2) — bonus action for Dash, Disengage or Hide.
- **Uncanny Dodge** (L5) — reaction, halve an attack's damage.
- **Evasion** (L7).
- **Reliable Talent** (L11) — on any ability check that adds PB, **treat a d20
  of 9 or lower as 10**.
- **Blindsense** (L14) — locate hidden/invisible creatures within 10 ft if you
  can hear.
- **Slippery Mind** (L15) — proficiency in WIS saving throws.
- **Elusive** (L18) — **no attack roll has advantage against you** while you
  aren't incapacitated.
- **Stroke of Luck** (L20) — turn a miss into a **hit**, or treat a failed
  ability check's d20 as a **20**. Short or long rest.

**Thief:** Fast Hands (L3, use Cunning Action's bonus action for Sleight of
Hand, thieves' tools, or Use an Object), Second-Story Work (L3, climbing costs
no extra movement; running jump +DEX feet), Supreme Sneak (L9, advantage on
Stealth if you move no more than half speed), **Use Magic Device** (L13,
**ignore all class, race and level requirements on magic items**), Thief's
Reflexes (L17, **two turns in the first round** of combat, the second at
initiative −10; not while surprised).

---

## Sorcerer (p42–45) — spells **known**, CHA, **sorcery points**

**Hit Die** d6. **Saves** CON, CHA. **Armour** none. **Weapons** daggers,
darts, slings, quarterstaffs, light crossbows. **Skills** choose 2 from Arcana,
Deception, Insight, Intimidation, Persuasion, Religion.

Table columns: Sorcery Points, Cantrips Known, Spells Known, Slots 1–9.

- **Spellcasting** — cantrips 4→6, spells known 2→15, swap one per level-up.
  Focus: arcane focus. DC = 8 + PB + CHA.
- **Font of Magic** (L2) — **sorcery points**, max per the table, regained on a
  long rest.
  - **Creating spell slots** (bonus action): 1st = 2 pts, 2nd = 3, 3rd = 5,
    4th = 6, 5th = 7. Max 5th level. **Slots created this way vanish on a long
    rest.**
  - **Converting a slot** (bonus action): gain sorcery points equal to the
    slot's level.
- **Metamagic** (L3, more at 10 and 17) — **only one option per casting unless
  stated**:
  - *Careful Spell* (1) — up to CHA modifier creatures **automatically succeed**
    on their save
  - *Distant Spell* (1) — double range; touch becomes 30 ft
  - *Empowered Spell* (1) — reroll up to CHA modifier damage dice, must use the
    new rolls; **may be combined with another Metamagic**
  - *Extended Spell* (1) — double duration, max 24 hours
  - *Heightened Spell* (3) — one target has **disadvantage on its first save**
  - *Quickened Spell* (2) — casting time action → bonus action
  - *Subtle Spell* (1) — cast with **no somatic or verbal components**
  - *Twinned Spell* (spell level, or 1 for a cantrip) — target a second creature;
    only for spells that cannot already target more than one
- **Sorcerous Restoration** (L20) — regain 4 sorcery points on a short rest.

**Draconic Bloodline:** Dragon Ancestor (L1, choose a dragon → damage type;
speak Draconic; **PB doubled on CHA checks when interacting with dragons**),
**Draconic Resilience** (L1, HP max +1 per sorcerer level; **AC = 13 + DEX when
not wearing armour** — a *third distinct* unarmoured formula), Elemental
Affinity (L6, add CHA modifier to one damage roll of your ancestry's type;
1 sorcery point for resistance to it for 1 hour), Dragon Wings (L14, bonus
action, flying speed equal to current speed; not in unaccommodating armour),
Draconic Presence (L18, 5 points, 60 ft aura of awe or fear, WIS save or
charmed/frightened, **requires concentration**).

---

## Warlock (p46–51) — **pact magic**, CHA

**Hit Die** d8. **Saves** WIS, CHA. **Armour** light. **Weapons** simple.
**Skills** choose 2 from Arcana, Deception, History, Intimidation,
Investigation, Nature, Religion.

**Pact Magic is a distinct slot model:**
- Very few slots (1 → 4 across 20 levels)
- **All slots are the same level**, rising 1st → 5th; spells are always cast at
  that level
- **Regained on a short *or* long rest** — a completely different cadence from
  every other caster
- Spells known (swap one per level-up), cantrips known

- **Eldritch Invocations** (L2) — a second "known" list, count per the table,
  **swappable one per level-up**, each with optional **prerequisites** (class
  level, a specific cantrip, or a Pact Boon). Architecturally these are feats
  by another name. Observed kinds:
  - *cast a spell at will without a slot* (Armor of Shadows, Beast Speech,
    Eldritch Sight, Mask of Many Faces, Misty Visions, Otherworldly Leap,
    Master of Myriad Forms, Whispers of the Grave, Visions of Distant Realms,
    Ascendant Step, Fiendish Vigor, Chains of Carceri)
  - *cast a spell once per long rest using a warlock slot* (Bewitching
    Whispers, Dreadful Word, Minions of Chaos, Mire the Mind, Sculptor of
    Flesh, Sign of Ill Omen, Thief of Five Fates)
  - *modify a specific cantrip* (Agonizing Blast — add CHA to *eldritch blast*
    damage; Eldritch Spear — range 300 ft; Repelling Blast — push 10 ft)
  - *grant proficiency or a sense* (Beguiling Influence, Devil's Sight 120 ft
    in magical darkness, Eyes of the Rune Keeper, Witch Sight)
  - *modify the pact boon* (Thirsting Blade — two attacks with the pact weapon;
    Lifedrinker — +CHA necrotic; Voice of the Chain Master; Book of Ancient
    Secrets)
- **Pact Boon** (L3) — choose one:
  - *Chain* — *find familiar* free and as a ritual; special forms (imp,
    pseudodragon, quasit, sprite); forgo an attack to let the familiar attack
  - *Blade* — create a melee **pact weapon** of any chosen form; **proficient
    while wielding it**; counts as magical; can bond an existing magic weapon
    via a 1-hour ritual
  - *Tome* — three cantrips **from any class list**, cast at will, not counted
    against cantrips known, and they become warlock spells for you
- **Mystic Arcanum** (L11/13/15/17) — one 6th/7th/8th/9th-level spell each,
  **cast once per long rest without expending a slot**.
- **Eldritch Master** (L20) — 1 minute of entreaty regains all pact slots;
  once per long rest.

**The Fiend:** Expanded Spell List (**adds spells to the warlock list for
you**), Dark One's Blessing (L1, **temporary HP** = CHA modifier + warlock
level on reducing a hostile creature to 0 HP), **Dark One's Own Luck** (L6,
add a d10 to an ability check or save — **after seeing the roll, before its
effects occur**; short or long rest), Fiendish Resilience (L10, **choose a
damage type on each rest** and gain resistance to it until you change it;
**bypassed by magical or silver weapons**), Hurl Through Hell (L14, on a hit,
banish the target for a round; 10d10 psychic unless it is a fiend; long rest).

---

## Wizard (p52–55) — **spellbook**, INT

**Hit Die** d6. **Saves** INT, WIS. **Armour** none. **Weapons** daggers,
darts, slings, quarterstaffs, light crossbows. **Skills** choose 2 from Arcana,
History, Insight, Investigation, Medicine, Religion.

- **Spellbook** — the repository of known spells (cantrips are not in it).
  Starts with **six** 1st-level spells; **two added free per wizard level**.
  Found spells can be copied at **2 hours and 50 gp per spell level**.
  Copying from your own book to a backup: 1 hour and 10 gp per level.
- **Prepared** = INT modifier + wizard level, **chosen from the spellbook**,
  changed on a long rest (1 minute per spell level to prepare).
- **Ritual casting requires the spell be in the spellbook — *not* prepared.**
  *(Cleric and druid require it prepared; bard requires it known. All three
  rules differ.)*
- **Arcane Recovery** (L1) — once per day on a short rest, recover slots
  totalling half wizard level rounded up, none 6th level or higher.
- **Spell Mastery** (L18) — choose a 1st- and a 2nd-level spell in the book;
  cast them **at will at their lowest level** while prepared.
- **Signature Spells** (L20) — two 3rd-level spells: always prepared, don't
  count against the limit, and each castable **once without a slot** per short
  or long rest.

**School of Evocation:** Evocation Savant (L2, halve gold and time to copy
evocation spells), **Sculpt Spells** (L2, 1 + spell level chosen creatures
**automatically succeed** and take **no** damage where they would take half),
Potent Cantrip (L6, a creature succeeding against your cantrip still takes
**half** damage), Empowered Evocation (L10, add INT modifier to one damage roll
of a wizard evocation spell), **Overchannel** (L14, deal **maximum** damage
with a damaging spell of 1st–5th level; free the first time, then **2d12
necrotic per spell level**, escalating by 1d12 each further use before a long
rest, and this damage **ignores resistance and immunity**).

---

## Progression (p56)

- **Character Advancement table** — XP thresholds L1–20 and the proficiency
  bonus (+2 at 1–4, +3 at 5–8, +4 at 9–12, +5 at 13–16, +6 at 17–20).
- **HP per level** — roll the Hit Die + CON modifier, or take the fixed average
  (rounded up).
- **[IMPORTANT] When the CON modifier increases, HP maximum increases by 1 for
  every level already attained** — a retroactive recalculation, not a
  going-forward change.
- **Multiclass prerequisites** — you must meet ability minimums for **both**
  the class you are leaving and the one you are entering:
  Barbarian STR 13 · Bard CHA 13 · Cleric WIS 13 · Druid WIS 13 ·
  Fighter STR 13 or DEX 13 · Monk DEX 13 **and** WIS 13 ·
  Paladin STR 13 **and** CHA 13 · Ranger DEX 13 **and** WIS 13 ·
  Rogue DEX 13 · Sorcerer CHA 13 · Warlock CHA 13 · Wizard INT 13
