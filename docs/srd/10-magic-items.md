# Magic items (p206–253)

48 pages — the largest single section after the spells. Structurally it is the
**most important section for the user's brief**, because a magic item is
precisely "an Effect attached to an inventory object", and the SRD's own items
are the benchmark a DM-authored item must be able to match.

**Format of this file:** the general rules are transcribed in full (they are
short and every one of them is load-bearing). The item catalogue records each
item's **category, rarity, attunement requirement and mechanical signature**,
grouped alphabetically as the SRD prints them.

---

## 1. Attunement (p206) — **[CRITICAL]**

- Some items require a **bond** before their magical properties work.
- **Prerequisites** may be a **class** (a monster qualifies if it has spell
  slots and uses that class's spell list) or **"a spellcaster"** — which means
  *able to cast at least one spell from its own traits or features*, **not from
  a magic item**.
- **Without attunement you get only the item's nonmagical benefits.** A magic
  shield you are not attuned to is an ordinary shield.
- **Attuning costs a short rest** focused solely on that item while in physical
  contact with it, and **it cannot be the same short rest used to learn the
  item's properties**. **An interruption fails the attempt.** Success grants an
  intuitive understanding of activation, **including any command words**.
- **One creature per item. Three attuned items per creature.** A fourth attempt
  simply fails.
- **You cannot attune to two copies of the same item.**
- **Attunement ends** if you no longer meet the prerequisites, if the item is
  **more than 100 feet away for at least 24 hours**, if you **die**, or if
  **another creature attunes to it**.
- **Voluntary release** costs another short rest — **unless the item is
  cursed**.

*Engine:* attunement is a **three-slot resource with a live prerequisite
predicate** (the same predicate language feats and multiclassing need — see
`05-feats.md`), plus proximity and ownership invalidation rules. It is a
first-class HUD element: three slots, what fills them, and why an item is greyed
out.

## 2. Wearing and wielding (p206)

- Worn items must be **donned in the intended fashion** — boots on feet, rings
  on fingers, armour donned, a shield strapped, a cloak fastened, a weapon held.
- **Magic worn items generally fit any size or build**, self-adjusting. The GM
  may rule exceptions where the fiction demands (drow-made armour fitting only
  elves).
- **Nonhumanoids** are GM discretion — a ring may work on a tentacle; a
  snake-tailed creature cannot wear boots.

### Multiple items of the same kind
Common sense: normally **one pair of footwear, one pair of gloves/gauntlets, one
pair of bracers, one suit of armour, one item of headwear, one cloak**. The GM
may allow layering (a circlet under a helmet).

### Paired items — **[IMPORTANT]**
Boots, bracers, gauntlets and gloves **only work if both halves of the same pair
are worn**. One *boot of striding and springing* plus one *boot of elvenkind*
gives **nothing at all**.

*Engine:* the equipment model needs **body slots** with occupancy rules and a
**pair-identity** check, not a flat "equipped items" list.

## 3. Activation (p206–207)

- If an item **requires an action to activate, that action is not the Use an
  Item action** — so features that speed up Use an Item (the rogue's Fast Hands)
  **do not apply**.
- **Command word** — a spoken word or phrase. **Cannot be used in an area where
  sound is prevented** (e.g. *silence*).
- **Consumables** — potions swallowed, oils applied, scrolls' writing vanishing
  on reading. **Once used, the magic is gone.**
- **Spells from items** — cast at the **lowest possible spell level**, expending
  **none of your slots** and requiring **no components**, unless stated. Normal
  **casting time, range and duration**, and **you must concentrate if the spell
  does**. Many items (potions) **bypass casting entirely** and confer the effect
  directly.
- **Spellcasting ability from items** — some items (certain staffs) use **your
  own** spellcasting ability; with more than one you choose. **If you have
  none** (a rogue with Use Magic Device), your **spellcasting ability modifier
  is +0 but your proficiency bonus still applies**.

## 4. Charges (p207)

- Some items have **charges** spent to activate properties.
- **The remaining count is revealed by *identify*, and also on attuning.**
- **When an item regains charges, the attuned creature learns how many it
  regained.**

*Engine:* charges are a per-item resource with a **refresh rule** — and the
dominant refresh trigger in this section is **"daily at dawn"**, usually
**"1dN expended charges"**. That is the **third refresh trigger** alongside
short rest and long rest, confirming the open question logged in
`99-open-questions.md`.

## 5. Item entry schema

Every entry gives: **name · category · rarity · (requires attunement, with an
optional prerequisite) · properties**.

**Categories seen:** *Armor* (light/medium/heavy/shield, sometimes restricted —
"medium or heavy, but not hide"), *Weapon* (any / any sword / any axe / any
ammunition / dagger…), *Potion*, *Ring*, *Rod*, *Scroll*, *Staff*, *Wand*,
*Wondrous item*.

**Rarity ladder:** common · uncommon · rare · very rare · legendary
(plus *artifact*). **Rarity varies** for scaling families (*belt of giant
strength*). **Rarity correlates with bonus size** — the SRD's own convention,
visible in the +1/+2/+3 families:

| Bonus | Ammunition | Armor | Weapon | Wand of the war mage |
|---|---|---|---|---|
| +1 | uncommon | rare | uncommon | uncommon |
| +2 | rare | very rare | rare | rare |
| +3 | very rare | legendary | very rare | very rare |

*(Note armour's ladder sits one step above weapons' for the same bonus.)*

---

## 6. Catalogue: A

**Adamantine Armor** — Armor (medium or heavy, **not hide**), uncommon.
**Any critical hit against you becomes a normal hit.**
*(Modifies an opponent's roll outcome, not a stat.)*

**Ammunition, +1/+2/+3** — Weapon (any ammunition), uncommon/rare/very rare.
Bonus to **attack and damage**. **Loses its magic once it hits.**

**Amulet of Health** — Wondrous, rare (attunement).
**Your Constitution score is 19**; no effect if already 19+.
*(A `set` operation on an ability score — and via the retroactive CON rule from
`03-progression.md`, this changes hit point maximum for every level attained.
The single best proof that HP max must be a derived function.)*

**Amulet of Proof against Detection and Location** — Wondrous, uncommon
(attunement). Hidden from divination magic; cannot be targeted by it or
perceived through scrying sensors.

**Amulet of the Planes** — Wondrous, very rare (attunement).
Action to name a familiar location on another plane, then a **DC 15 INT check**:
success casts *plane shift*; failure sends you and everything within 15 ft to a
random destination — **d100: 1–60** a random location on the named plane,
**61–100** a randomly determined plane.

**Animated Shield** — Armor (shield), very rare (attunement).
**Bonus action + command word**: the shield hovers and protects you **with your
hands free** for **1 minute**, ending early on a bonus action, or on being
incapacitated or dying.

**Apparatus of the Crab** — Wondrous, legendary. A 500 lb sealed iron barrel;
**DC 20 INT (Investigation)** finds the catch. Holds **two Medium or smaller**
creatures. As a vehicle: **AC 20, HP 200, speed 30 ft / swim 30 ft** (0 if legs
retracted), **immune to poison and psychic**. Airtight and watertight;
**10 hours of air divided by occupants**; floats; **submersible to 900 ft**,
below which it takes **2d6 bludgeoning per minute**. A creature can use an
action to **move up to two of ten levers**, each returning to neutral:

| Lever | Up | Down |
|---|---|---|
| 1 | Legs and tail extend (can walk and swim) | Retract — speed 0, no speed bonuses apply |
| 2 | Forward window shutter opens | closes |
| 3 | Side window shutters open (two per side) | close |
| 4 | Two claws extend | claws retract |
| 5 | Each claw: **+8 to hit, reach 5 ft, 7 (2d6) bludgeoning** | Each claw: **target is grappled (escape DC 15)** |
| 6 | Walk/swim forward | backward |
| 7 | Turn 90° left | 90° right |
| 8 | Eye fixtures: **bright light 30 ft, dim 30 ft more** | light off |
| 9 | Sink up to 20 ft in liquid | rise up to 20 ft |
| 10 | Rear hatch unseals and opens | closes and seals |

*(An item that is a **stateful machine with a control surface** — ten
independent two-position switches. Nothing in a `{modifier, value}` vocabulary
can express this; it needs an item-level state model and a bespoke UI. Worth
flagging as an explicit out-of-scope example.)*

**Armor, +1/+2/+3** — Armor (light, medium or heavy), rare/very rare/legendary.
Bonus to **AC**.

**Armor of Invulnerability** — Armor (plate), legendary (attunement).
**Resistance to nonmagical damage**; **action** to become **immune to nonmagical
damage for 10 minutes** or until removed. **Recharges at the next dawn.**

**Armor of Resistance** — Armor (any), rare (attunement). **Resistance to one
damage type**, GM's choice or random: **d10 — 1 acid, 2 cold, 3 fire, 4 force,
5 lightning, 6 necrotic, 7 poison, 8 psychic, 9 radiant, 10 thunder**.

**Armor of Vulnerability** — Armor (plate), rare (attunement).
**Resistance to one of bludgeoning, piercing or slashing.**
**Curse** — revealed only by *identify* or on attuning: while cursed you have
**vulnerability to the other two** of those three types. **Removing the armour
does not end the curse**; only *remove curse* or similar does.
*(The canonical cursed-item shape: a **hidden effect revealed on attunement**,
plus **attunement that cannot be voluntarily released**.)*

**Arrow-Catching Shield** — Armor (shield), rare (attunement).
**+2 AC against ranged attacks, in addition to the shield's normal bonus**, and
a **reaction to become the target of a ranged attack aimed at anyone within
5 ft of you**.
*(A conditional AC bonus scoped to an **attack category**, and a
target-redirection reaction — a genuinely multiplayer protective ability.)*

**Arrow of Slaying** — Weapon (arrow), very rare. Bound to a **type, race or
group** (arrows of *dragon* slaying, of *blue dragon* slaying). A matching
creature damaged by it makes a **DC 17 CON save** for an extra **6d10
piercing**, half on success. **Becomes nonmagical once it deals that damage.**

---

## 7. Catalogue: B

**Bag of Beans** — Wondrous, rare. **3d4 beans**; **½ lb + ¼ lb per bean**.
Dumping them out: **10-ft radius, DC 15 DEX save, 5d4 fire**, half on success,
igniting unattended flammables. Planting and watering one produces an effect
**1 minute later** (d100 table): toadstools with a coin-flip poison/temp-HP
effect · a geyser of water, beer, juice, tea, vinegar, wine or oil for **1d12
rounds** · a treant (**50% chaotic evil and hostile**) · an animate stone statue
of you that **denounces you to passers-by for 24 hours and always knows where
you are** · a blue campfire for 24 hours · **1d6+6 shriekers** · **1d4+8 pink
toads** that each become a Large-or-smaller monster for 1 minute when touched ·
a hungry bulette · a fruit tree with **1d10+20 fruit**, **1d8** of which are
random potions and **one an ingested poison** (the tree vanishes in an hour;
picked fruit keeps its magic **30 days**) · a nest of **1d4+3 eggs**, each a
**DC 20 CON save** for **+1 to your lowest ability score permanently** on a
success or **10d6 force** on a failure · a **60-ft-square pyramid** containing a
mummy lord's lair · **a giant beanstalk** leading wherever the GM chooses.

**Bag of Devouring** — Wondrous, very rare. Looks like a *bag of holding*.
Animal or vegetable matter placed wholly inside is **destroyed forever**.
Reaching in: **50% chance of being pulled inside**. Escape: action, **DC 15 STR**;
pulling someone out: action, **DC 20 STR**. **Anything starting its turn inside
is devoured.** Holds **1 cubic foot** of inanimate objects, but **once a day it
swallows them into another plane**. If pierced or torn it is destroyed and its
contents go to **a random location on the Astral Plane**.

**Bag of Holding** — Wondrous, uncommon. Holds **500 lb / 64 cubic feet**;
**always weighs 15 lb**. **Retrieving an item costs an action.** Overloading,
piercing or tearing **destroys it and scatters the contents in the Astral
Plane**. Turning it inside out spills the contents unharmed. Breathing creatures
inside survive **10 ÷ (number of creatures) minutes, minimum 1**.
**Putting it inside another extradimensional space (handy haversack, portable
hole) destroys both and opens a one-way gate to the Astral Plane**, sucking in
anything within 10 ft.
*(An inventory container with capacity, weight-override, retrieval cost and
destruction consequences — a direct requirement on the multiplayer inventory
model.)*

**Bag of Tricks** — Wondrous, uncommon. Action to pull out and throw a fuzzy
object up to 20 ft; it becomes a creature (**d8**, by bag colour) **friendly,
acting on your turn**, commanded with a **bonus action**, vanishing **at the
next dawn or at 0 HP**. **Three uses per day**, recharging at dawn.
*Gray:* weasel, giant rat, badger, boar, panther, giant badger, dire wolf, giant
elk. *Rust:* rat, owl, mastiff, goat, giant goat, giant boar, lion, brown bear.
*Tan:* jackal, ape, baboon, axe beak, black bear, giant weasel, giant hyena,
tiger.

**Bead of Force** — Wondrous, rare. Usually found **1d4+4** together. Action to
throw up to 60 ft: **10-ft radius, DC 15 DEX save, 5d4 force**. Then a
**transparent force sphere** encloses the area for **1 minute**, trapping those
who failed and **wholly inside**; others are pushed clear. **Only breathable air
passes**; no attack or effect does. An enclosed creature can push to roll the
sphere at **half its walking speed**; the sphere weighs **1 lb regardless of its
contents**.

**Belt of Dwarvenkind** — Wondrous, rare (attunement).
**CON +2, maximum 20**; advantage on **CHA (Persuasion) with dwarves**; **50%
chance each dawn of growing a beard**. **If you are not a dwarf**, additionally:
**advantage on saves against poison and resistance to poison damage**,
**darkvision 60 ft**, and **speak, read and write Dwarvish**.
*(An item whose effects **branch on the wearer's race** — item effects need
conditional blocks, not just flat grants.)*

**Belt of Giant Strength** — Wondrous, rarity varies (attunement).
**Sets your Strength score**; no effect if yours is already equal or higher.

| Type | Strength | Rarity |
|---|---|---|
| Hill giant | 21 | Rare |
| Stone/frost giant | 23 | Very rare |
| Fire giant | 25 | Very rare |
| Cloud giant | 27 | Legendary |
| Storm giant | 29 | Legendary |

*(Note these **exceed the normal cap of 20** — the ability-score cap is itself
overridable, as flagged in `06-core-rules.md` §1.)*

**Berserker Axe** — Weapon (any axe), rare (attunement).
**+1 to attack and damage**, and **your hit point maximum increases by 1 for
each level you have attained**.
**Curse** — you are **unwilling to part with it**, have **disadvantage on attack
rolls with any other weapon** unless no foe is within 60 ft that you can see or
hear, and whenever a hostile creature damages you, **DC 15 WIS save or go
berserk**: you must attack the nearest creature each round with the axe (using
all extra attacks, moving on to the next nearest after felling one, choosing at
random among equals), until you **start a turn with no creature within 60 ft
that you can see or hear**.

**Boots of Elvenkind** — Wondrous, uncommon. **Silent steps on any surface**,
and **advantage on DEX (Stealth) checks that rely on moving silently**.

**Boots of Levitation** — Wondrous, rare (attunement). **Action to cast
*levitate* on yourself at will.**

**Boots of Speed** — Wondrous, rare (attunement). **Bonus action** to click the
heels: **walking speed doubled** and **opportunity attacks against you have
disadvantage**; click again to end. **10 minutes of total use, then inert until
you finish a long rest.**
*(A **cumulative-duration** resource — a stopwatch, not a charge count.)*

**Boots of Striding and Springing** — Wondrous, uncommon (attunement).
**Walking speed becomes 30 ft** unless already higher, **not reduced by
encumbrance or heavy armour**, and **jump distance tripled** (still bounded by
remaining movement).

**Boots of the Winterlands** — Wondrous, uncommon (attunement).
**Resistance to cold damage**; **ignore difficult terrain from ice or snow**;
tolerate **−50 °F** unprotected, or **−100 °F** in heavy clothes.

**Bowl of Commanding Water Elementals** — Wondrous, rare. While filled with
water: **action + command word** to summon a water elemental as *conjure
elemental*. **Recharges at the next dawn.** 1 ft across, 3 lb, holds 3 gallons.

**Bracers of Archery** — Wondrous, uncommon (attunement).
**Proficiency with longbow and shortbow**, and **+2 to damage rolls** on ranged
attacks with them.
*(An item that **grants a proficiency** — proficiencies must be grantable by
effect sources, not fixed at character creation.)*

**Bracers of Defense** — Wondrous, rare (attunement).
**+2 AC if wearing no armour and using no shield.**

**Brazier of Commanding Fire Elementals** — Wondrous, rare. While a fire burns
in it: **action + command word** to summon a fire elemental. **Dawn recharge.**
5 lb.

**Brooch of Shielding** — Wondrous, uncommon (attunement).
**Resistance to force damage** and **immunity to damage from *magic missile***.

**Broom of Flying** — Wondrous, uncommon. **Flying speed 50 ft**, carrying up
to **400 lb** (**30 ft above 200 lb**). Stops hovering when you land. Can be
**sent alone to a familiar destination within 1 mile** by command word, and
recalled by another while still within 1 mile.

---

## 8. Catalogue: C

**Candle of Invocation** — Wondrous, very rare (attunement). Dedicated to a
deity and **shares its alignment** (detectable by *detect evil and good*;
**d20**: 1–2 CE, 3–4 CN, 5–7 CG, 8–9 NE, 10–11 N, 12–13 NG, 14–15 LE, 16–17 LN,
18–20 LG). Lighting it is an **action**; it **burns for 4 hours total** and is
then destroyed, but can be **snuffed and resumed, deducting burn time in
1-minute increments**. While lit: **dim light 30 ft**, and any creature in that
light **whose alignment matches** has **advantage on attack rolls, saving throws
and ability checks**; a **cleric or druid** of matching alignment can **cast
prepared 1st-level spells without expending slots**. Alternatively, **lighting it
for the first time can cast *gate*, destroying the candle**.
*(A second alignment-keyed mechanic after *Spirit Guardians*, and another
cumulative-duration resource.)*

**Cape of the Mountebank** — Wondrous, rare. **Action to cast *dimension
door***, leaving and arriving in clouds of smoke that **lightly obscure** both
spaces until the end of your next turn (dispersed by light or stronger wind).
**Dawn recharge.**

**Carpet of Flying** — Wondrous, very rare. **Action + command word**; obeys
spoken directions while you are **within 30 ft** of it.

| d100 | Size | Capacity | Flying speed |
|---|---|---|---|
| 01–20 | 3 × 5 ft | 200 lb | 80 ft |
| 21–55 | 4 × 6 ft | 400 lb | 60 ft |
| 56–80 | 5 × 7 ft | 600 lb | 40 ft |
| 81–100 | 6 × 9 ft | 800 lb | 30 ft |

**Can carry double the listed weight at half speed.**

**Censer of Controlling Air Elementals** — Wondrous, rare. While incense burns:
**action + command word** to summon an air elemental. **Dawn recharge.** 1 lb.

**Chime of Opening** — Wondrous, rare. **Action** to strike it at an openable
object within **120 ft**: **one lock or latch opens** (or the object itself if
none remain), **unless the sound cannot reach it**. **Ten uses, then it cracks
and is useless.**
*(A **finite-lifetime** item — charges that never recharge and end in
destruction.)*

**Circlet of Blasting** — Wondrous, uncommon. **Action to cast *scorching
ray*** with a **fixed +5 attack bonus**. **Dawn recharge.**
*(An item supplying its **own** attack bonus rather than using the wearer's —
so an item-granted spell may override the caster's derived statistics.)*

**Cloak of Arachnida** — Wondrous, very rare (attunement).
**Resistance to poison damage**; **climbing speed equal to walking speed**;
move on vertical surfaces and ceilings **hands free**; **cannot be caught in
webs** and treats them as difficult terrain; **action to cast *web* (save DC 13)
at twice its normal area**, **dawn recharge**.

**Cloak of Displacement** — Wondrous, rare (attunement).
**All attack rolls against you have disadvantage.** **If you take damage the
property stops working until the start of your next turn**, and it is
**suppressed while you are incapacitated, restrained, or otherwise unable to
move**.
*(A **self-disabling** effect with two distinct suspension rules — an ongoing
effect with its own internal state machine.)*

**Cloak of Elvenkind** — Wondrous, uncommon (attunement). **With the hood up**:
**WIS (Perception) checks to see you have disadvantage**, and you have
**advantage on DEX (Stealth) checks to hide**. **Raising or lowering the hood is
an action.**
*(An item with a **user-toggled mode** that costs an action to change.)*

**Cloak of Protection** — Wondrous, uncommon (attunement).
**+1 to AC and to saving throws.**

**Cloak of the Bat** — Wondrous, rare (attunement). **Advantage on DEX (Stealth)
checks.** In **dim light or darkness**, gripping the edges with **both hands**
grants **flying speed 40 ft** — lost the moment you release it or leave the
darkness. Also, **action to cast *polymorph* on yourself into a bat**, retaining
**INT, WIS and CHA**. **Dawn recharge.**

**Cloak of the Manta Ray** — Wondrous, uncommon. **With the hood up**: breathe
underwater and **swimming speed 60 ft**. **Hood is an action.**

**Crystal Ball** — Wondrous, very rare or legendary (attunement).
Touching it lets you **cast *scrying* (save DC 17)**. Legendary variants add:
*Mind Reading* — **action to cast *detect thoughts* (DC 17)** on creatures within
30 ft of the sensor, **without concentrating**, ending when scrying ends.
*Telepathy* — **telepathic communication** with creatures within 30 ft of the
sensor, plus **action to cast *suggestion* (DC 17)** through it without
concentrating; **dawn recharge on the suggestion only**.
*True Seeing* — **truesight 120 ft centred on the sensor**.
*(Items can **suspend the concentration requirement** of a spell they cast —
another per-cast parameter override.)*

**Cube of Force** — Wondrous, rare (attunement). **36 charges, regaining 1d20
daily at dawn.** Action to press a face, spending charges; a **15-ft cube**
barrier centred on and moving with you lasts **1 minute**, resettable by
pressing a different face. **If your movement would push the barrier into an
impassable solid object, you cannot move closer.**

| Face | Charges | Effect |
|---|---|---|
| 1 | 1 | Gases, wind and fog cannot pass |
| 2 | 2 | Nonliving matter cannot pass (walls, floors, ceilings at your discretion) |
| 3 | 3 | Living matter cannot pass |
| 4 | 4 | Spell effects cannot pass |
| 5 | 5 | Nothing can pass (walls, floors, ceilings at your discretion) |
| 6 | 0 | Deactivate |

**Charges are also lost when the barrier is hit by:** *disintegrate* **1d12** ·
*horn of blasting* **1d10** · *passwall* **1d6** · *prismatic spray* **1d20** ·
*wall of fire* **1d4**.
*(Charges drained by **external events**, not only by the user — a resource with
an inbound damage channel.)*

**Cubic Gate** — Wondrous, legendary. Six sides, each keyed to a plane (one is
the Material Plane). **Press once: cast *gate*. Press twice: cast *plane shift*
(DC 17).** **3 charges, regaining 1d3 daily at dawn.**

**Dagger of Venom** — Weapon (dagger), rare. **+1 to attack and damage.**
**Action** to coat the blade for **1 minute or until it hits**: the target makes
a **DC 15 CON save** or takes **2d10 poison** and is **poisoned for 1 minute**.
**Dawn recharge.**

**Dancing Sword** — Weapon (any sword), very rare (attunement).
**Bonus action + command word** to toss it aloft: it flies **30 ft** and attacks
a creature within 5 ft of it, **using your attack roll and your ability
modifier for damage**. **Bonus action** each turn to move it 30 ft (within 30 ft
of you) and attack again. **After its fourth attack it returns to your hand**
(or falls at your feet); it also stops if you grasp it or move more than 30 ft
away.

**Decanter of Endless Water** — Wondrous, uncommon. **Action** to remove the
stopper and speak one of three command words; water pours until the start of
your next turn: **"Stream" 1 gallon · "Fountain" 5 gallons · "Geyser" 30 gallons
in a 30-ft-long, 1-ft-wide jet**. The geyser can be aimed as a **bonus action**
at a creature within 30 ft: **DC 13 STR save or 1d4 bludgeoning and prone**; or
at an unattended object **≤200 lb**, knocking it over or **pushing it 15 ft**.

**Deck of Illusions** — Wondrous, uncommon. **34 cards**; a found deck is
usually missing **1d20 − 1**. **Cards must be drawn at random.** Action to draw
and throw a card within 30 ft: an **illusory creature** forms, real-seeming and
correctly sized but **harmless**. While within 120 ft and able to see it, you can
use an **action to move it anywhere within 30 ft of its card**. Physical
interaction reveals it; **action + DC 15 INT (Investigation)** identifies it,
after which it appears translucent. **The illusion ends if its card is moved or
it is dispelled, and the card is then spent.**
Card mapping (playing-card deck): *Hearts* — ace red dragon, king knight and
four guards, queen succubus/incubus, jack druid, ten cloud giant, nine ettin,
eight bugbear, two goblin. *Diamonds* — ace beholder, king archmage and mage
apprentice, queen night hag, jack assassin, ten fire giant, nine ogre mage,
eight gnoll, two kobold. *Spades* — ace lich, king priest and two acolytes,
queen medusa, jack veteran, ten frost giant, nine troll, eight hobgoblin, two
goblin. *Clubs* — ace iron golem, king bandit captain and three bandits, queen
erinyes, jack berserker, ten hill giant, nine ogre, eight orc, two kobold.
**Both jokers: you, the deck's owner.**

**Deck of Many Things** — Wondrous, legendary. **13 cards (75%) or 22.**
**You must declare how many cards you will draw**, then draw randomly; **excess
draws have no effect**; **each draw within 1 hour of the last**, or the
remainder **fly out and take effect at once**. Drawn cards **fade and return to
the deck** (so the same card can come twice) **except the Fool and the Jester**.

| Card | Effect |
|---|---|
| **Balance** | Alignment flips (lawful↔chaotic, good↔evil); no effect if true neutral or unaligned |
| **Comet** | Single-handedly defeat the next hostile monster or group → **gain a level**; otherwise nothing |
| **Donjon** | Entombed in suspended animation in an extradimensional sphere, gear left behind; **undetectable by divination** except *wish*; **no more draws** |
| **Euryale** | **−2 penalty on all saving throws** until ended by a god or The Fates |
| **The Fates** | **Avoid or erase one event as if it never happened** — usable at any time before you die |
| **Flames** | A powerful devil becomes your enemy until one of you dies |
| **Fool** | **Lose 10,000 XP** (never enough to lose a level) and draw again, counting both as one declared draw |
| **Gem** | 25 pieces of jewellery at 2,000 gp, or 50 gems at 1,000 gp |
| **Idiot** | **Permanently reduce INT by 1d4 + 1** (minimum 1); draw one extra card |
| **Jester** | **+10,000 XP**, or draw two extra cards |
| **Key** | A **rare or rarer magic weapon you are proficient with** appears |
| **Knight** | A loyal **4th-level fighter** of your race, under your control |
| **Moon** | Cast ***wish* 1d3 times** |
| **Rogue** | A GM-chosen NPC becomes secretly hostile; only *wish* or divine intervention ends it |
| **Ruin** | **All non-magic-item wealth and property lost**, including the documentation proving ownership |
| **Skull** | Summons an **avatar of death** you must fight **alone** — helpers summon their own; **anyone slain by it cannot be restored to life** |
| **Star** | **+2 to one ability score**, which **may exceed 20 but not 24** |
| **Sun** | **+50,000 XP** and a random wondrous item |
| **Talons** | **Every magic item you wear or carry disintegrates**; artifacts vanish instead |
| **Throne** | **Proficiency in Persuasion and double proficiency bonus on it**, plus a keep currently held by monsters |
| **Vizier** | Within one year, ask one question and receive a truthful, actionable answer |
| **The Void** | Your soul is imprisoned elsewhere and your **body is incapacitated**; ***wish* cannot restore it**, only locate it; **no more draws** |

**Avatar of Death** — Medium undead, NE. **AC 20**, **HP = half its summoner's
hit point maximum**, speed 60 ft / fly 60 ft (hover), all abilities **16 (+3)**.
**Immune to necrotic and poison damage**; **immune to charmed, frightened,
paralyzed, petrified, poisoned, unconscious**. Darkvision 60 ft, truesight
60 ft, passive Perception 13; **speaks all languages known to its summoner**;
**Challenge — (0 XP)**. *Incorporeal Movement* (moves through creatures and
objects as difficult terrain; **5 (1d10) force** if it ends its turn inside an
object). *Turning Immunity.* **Reaping Scythe:** 5 ft, **7 (1d8+3) slashing plus
4 (1d8) necrotic**.
*(The **only statblock in this edition of the SRD** — everything else that
references creature statistics points at content that was stripped out.)*

---

## 9. Catalogue: D–I

**Defender** — Weapon (any sword), legendary (attunement). **+3 to attack and
damage**, but **on your first attack each turn you may transfer any part of the
bonus to your AC instead** (e.g. +1 attack/+2 AC), lasting until the start of
your next turn and **only while you hold the sword**.
*(A **player-allocated bonus pool split across two different derived stats**,
re-declared every turn.)*

**Demon Armor** — Armor (plate), very rare (attunement). **+1 AC**; understand
and speak Abyssal; **unarmed strikes become magic weapons dealing slashing with
+1 to attack and damage and a 1d8 damage die**.
**Curse:** cannot be doffed without *remove curse*; **disadvantage on attack
rolls against demons and on saves against their spells and abilities**.

**Dimensional Shackles** — Wondrous, rare. Action to place on an
**incapacitated** creature; fits **Small to Large**. Blocks **all
extradimensional movement** (**but not passing through an interdimensional
portal**). You and designated creatures can remove them as an action.
**Once every 30 days** the prisoner may attempt a **DC 30 STR (Athletics)**
check to break free and destroy them.

**Dragon Scale Mail** — Armor (scale mail), very rare (attunement).
**+1 AC**; **advantage on saves against dragons' Frightful Presence and breath
weapons**; **resistance to one damage type by dragon colour**; **action to sense
distance and direction to the nearest dragon of that type within 30 miles**,
**dawn recharge**.
*Resistances:* black acid · blue lightning · brass fire · bronze lightning ·
copper acid · gold fire · green poison · red fire · silver cold · white cold.

**Dragon Slayer** — Weapon (any sword), rare. **+1 to attack and damage**;
**+3d6 of the weapon's damage type against any creature of the dragon type**
(including dragon turtles and wyverns).

**Dust of Disappearance** — Wondrous, uncommon. Single use. Action to throw:
you and everything within 10 ft become **invisible for 2d4 minutes** (**the same
duration for all**). **Attacking or casting ends it for that creature.**

**Dust of Dryness** — Wondrous, uncommon. **1d6 + 4 pinches.** A pinch turns a
**15-ft cube of water** into a marble-sized pellet of negligible weight;
smashing the pellet releases the water. A **mostly-water elemental** exposed to
a pinch makes a **DC 13 CON save** for **10d6 necrotic**, half on success.

**Dust of Sneezing and Choking** — Wondrous, uncommon. **Appears to be *dust of
disappearance*, and *identify* confirms the false reading.** Action to throw:
you and every breathing creature within **30 ft** make a **DC 15 CON save** or
become **unable to breathe, incapacitated and suffocating**, repeating the save
at the end of each turn while conscious. Ended by *lesser restoration*.
*(An item that **lies to *identify***. So an item record needs a **true
identity** and an **apparent identity**, and identification is not always
authoritative.)*

**Dwarven Plate** — Armor (plate), very rare. **+2 AC**, and a **reaction to
reduce forced movement along the ground by up to 10 ft**.

**Dwarven Thrower** — Weapon (warhammer), very rare (**attunement by a
dwarf**). **+3 to attack and damage**; gains **thrown (20/60)**; ranged hits
deal **+1d8**, or **+2d8 against giants**, and it **returns to your hand
immediately**.
*(Attunement prerequisite by **race**, not class or spellcasting — the
predicate language needs race as a term.)*

**Efficient Quiver** — Wondrous, uncommon. Three extradimensional compartments;
**always weighs 2 lb**. Holds **60 arrows/bolts**, **18 javelins**, and **6 long
objects** (bows, staffs, spears). Items draw as from an ordinary quiver.

**Efreeti Bottle** — Wondrous, very rare. 1 lb. Action to unstopper; at the end
of your turn an efreeti appears within 30 ft. **First opening, d100:**
**01–10** it attacks you for 5 rounds then vanishes and the bottle dies ·
**11–90** it serves for **1 hour**, then returns and the bottle **cannot be
opened for 24 hours** — the **same result on the next two openings**, and on a
**fourth** the efreeti escapes and the bottle dies · **91–00** it casts
***wish* three times** for you, then leaves and the bottle dies.

**Elemental Gem** — Wondrous, uncommon. Action to break: summons an elemental as
*conjure elemental*; the gem is spent. **Blue sapphire** air · **yellow
diamond** earth · **red corundum** fire · **emerald** water.

**Elven Chain** — Armor (chain shirt), rare. **+1 AC**, and **you count as
proficient with it even without medium armour proficiency**.
*(An item that **waives its own proficiency requirement** — proficiency is a
per-item question, not purely a per-category one.)*

**Eversmoking Bottle** — Wondrous, uncommon. 1 lb. Action to unstopper: a
**heavily obscured 60-ft-radius** cloud, **growing 10 ft per minute to a maximum
of 120 ft** while open. Closing requires an **action + command word**; the cloud
then **disperses after 10 minutes**. **Moderate wind (11–20 mph) disperses it in
1 minute; strong wind (21+ mph) in 1 round.**

**Eyes of Charming** — Wondrous, uncommon (attunement). **3 charges**, all
regained **daily at dawn**. Action + 1 charge to cast ***charm person* (DC 13)**
on a humanoid within 30 ft **you can mutually see**.

**Eyes of Minute Seeing** — Wondrous, uncommon. **Advantage on INT
(Investigation) checks that rely on sight within 1 foot.**

**Eyes of the Eagle** — Wondrous, uncommon (attunement). **Advantage on WIS
(Perception) checks that rely on sight**; in clear conditions, make out details
as small as 2 feet across at extreme distance.

**Feather Token** — Wondrous, rare. Single use; **d100: 01–20 Anchor · 21–35
Bird · 36–50 Fan · 51–65 Swan boat · 66–90 Tree · 91–00 Whip**.
*Anchor* — a vessel **cannot be moved by any means for 24 hours**.
*Bird* — a roc-statted bird that **obeys simple commands and cannot attack**;
carries **500 lb at 16 mph (144 miles/day, resting 1 hour per 3 flown)** or
**1,000 lb at half speed**.
*Fan* — fills one ship's sails, **+5 mph for 8 hours**.
*Swan Boat* — a 50 × 20 ft self-propelled boat, **6 mph**, carrying **32 Medium
creatures** (**Large counts as 4, Huge as 9**), lasting 24 hours.
*Tree* — a nonmagical 60-ft oak, 5-ft trunk, 20-ft canopy radius.
*Whip* — a floating whip for **1 hour**: **bonus action** melee spell attack at
**+9** for **1d6 + 5 force** within 10 ft of it, and **bonus action** to fly it
20 ft and repeat. Ends if you are incapacitated or die.

**Figurine of Wondrous Power** — Wondrous, rarity by figurine. **Action +
command word + throw within 60 ft**; **fails if the space is occupied or too
small**. Friendly, understands your languages, obeys spoken commands, defends
itself if uncommanded. Reverts at the end of its duration, at **0 HP**, or on an
**action + command word while touching it** — then enters a **cooldown measured
in days**.

| Figurine | Rarity | Becomes | Duration | Cooldown |
|---|---|---|---|---|
| Bronze griffon | Rare | griffon | 6 hours | 5 days |
| Ebony fly | Rare | giant fly (rideable) | 12 hours | 2 days |
| Golden lions (**a pair**) | Rare | a lion each | 1 hour | 7 days each |
| Ivory goats (**a set of three**) | Rare | see below | see below | see below |
| Marble elephant | Rare | elephant | 24 hours | 7 days |
| Obsidian steed | Very rare | nightmare | 24 hours | 5 days |
| Onyx dog | Rare | mastiff (INT 8, speaks Common, darkvision 60 ft, sees invisible) | 6 hours | 7 days |
| Serpentine owl | Rare | giant owl (telepathy at any range on the same plane) | 8 hours | 2 days |
| Silver raven | Uncommon | raven (**cast *animal messenger* on it at will**) | 12 hours | 2 days |

*Giant Fly* statistics (given in full): Large beast, unaligned, **AC 11, HP 19
(3d10+3)**, speed 30 ft / fly 60 ft, STR 14 DEX 13 CON 13 INT 2 WIS 10 CHA 3,
darkvision 60 ft, passive Perception 10.
*Ivory goats:* **goat of traveling** — a Large goat with riding-horse
statistics, **24 charges, 1 per hour or part thereof**, usable freely while
charged, **7-day recharge to full** · **goat of travail** — a giant goat for
3 hours, **30-day cooldown** · **goat of terror** — a giant goat for 3 hours
that **cannot attack**, but its horns detach (**action each**) into a **+1
lance** and a **+2 longsword**, and it radiates a **30-ft aura**: hostile
creatures starting their turn there save **DC 15 WIS or be frightened** for
1 minute (repeatable save; **a success grants 24-hour immunity**); **15-day
cooldown**.
*Obsidian steed:* **if you are good-aligned, a 10% chance per use of ignoring
your orders**; mounting it while it does so **transports you both to Hades**.

**Flame Tongue** — Weapon (any sword), rare (attunement). **Bonus action +
command word** to ignite: **bright light 40 ft, dim 40 ft more**, and **+2d6
fire on every hit**. Ends on another bonus action, or if dropped or sheathed.

**Folding Boat** — Wondrous, rare. A 12 × 6 × 6 inch box, 4 lb, that floats and
stores items. **Three command words, each an action:** unfold into a **10 × 4 ×
2 ft boat** (oars, anchor, mast, lateen sail; **4 Medium creatures**); unfold
into a **24 × 8 × 6 ft ship** (deck, rowing seats, five sets of oars, steering
oar, anchor, deck cabin, square sail; **15 Medium creatures**); or fold back —
**only if no creatures are aboard**. Contents that fit go back in the box;
the rest are left outside.

**Frost Brand** — Weapon (any sword), very rare (attunement). **+1d6 cold on
every hit**; **resistance to fire damage** while held; in freezing temperatures
**bright light 10 ft, dim 10 ft more**; **drawing it extinguishes all nonmagical
flames within 30 ft, once per hour**.

**Gauntlets of Ogre Power** — Wondrous, uncommon (attunement).
**Strength score becomes 19**; no effect if already 19+.

**Gem of Brightness** — Wondrous, uncommon. **50 charges, never recharged** —
when spent it becomes **a nonmagical jewel worth 50 gp**. Three command words:
**bright light 30 ft / dim 30 ft more** (**no charge**, ends on a bonus action
or on using another function) · **1 charge**: a beam at one creature within
60 ft, **DC 15 CON save or blinded for 1 minute** with a repeatable save ·
**5 charges**: the same save for everyone in a **30-ft cone**.

**Gem of Seeing** — Wondrous, rare (attunement). **3 charges, regaining 1d3
daily at dawn.** Action + 1 charge: **truesight 120 ft for 10 minutes while
peering through the gem**.

**Giant Slayer** — Weapon (any axe or sword), rare. **+1 to attack and damage**;
against a **giant-type** creature (including ettins and trolls), **+2d6** of the
weapon's type and a **DC 15 STR save or knocked prone**.

**Glamoured Studded Leather** — Armor (studded leather), rare. **+1 AC**, and a
**bonus action + command word** to make it look like ordinary clothing or any
other armour (**bulk and weight unchanged**), lasting until reused or removed.

**Gloves of Missile Snaring** — Wondrous, uncommon (attunement).
**Reaction** when hit by a ranged weapon attack, **with a free hand**, to reduce
the damage by **1d10 + your DEX modifier**; **reducing it to 0 lets you catch
the missile** if it fits in that hand.

**Gloves of Swimming and Climbing** — Wondrous, uncommon (attunement).
Climbing and swimming **cost no extra movement**, and **+5 to STR (Athletics)
checks to climb or swim**.

**Goggles of Night** — Wondrous, uncommon. **Darkvision 60 ft**, or **+60 ft to
existing darkvision**.
*(Two different stacking rules in one sentence — grant versus extend.)*

**Hammer of Thunderbolts** — Weapon (maul), legendary. **+1 to attack and
damage.** *Giant's Bane* **(requires attunement, and requires wearing a *belt of
giant strength* of any variety **and** *gauntlets of ogre power*; attunement ends
if either is removed)**: **STR +4, which may exceed 20 but not 30**, and a
**natural 20 against a giant forces a DC 17 CON save or death**. **5 charges,
regaining 1d4 + 1 daily at dawn**: spend 1 to throw it (thrown 20/60); on a hit
a thunderclap audible to 300 ft forces the target and everything within 30 ft to
make a **DC 17 CON save or be stunned until the end of your next turn**.
*(An attunement prerequisite **that references other attuned items** — the
predicate language must be able to query the character's own equipment.)*

**Handy Haversack** — Wondrous, rare. Central pouch **80 lb / 8 cubic feet**,
two side pouches **20 lb / 2 cubic feet** each; **always weighs 5 lb**.
**Retrieval costs an action**, and **the item you reach for is always on top**.
Overloading, piercing or tearing **destroys it and its contents forever**
(artifacts always resurface). Inside-out spills contents unharmed. A breathing
creature survives **10 minutes**. **Nesting with a *bag of holding* or *portable
hole* destroys both and opens a one-way Astral gate.**

**Hat of Disguise** — Wondrous, uncommon (attunement). **Action to cast
*disguise self* at will**; **ends if the hat is removed**.

**Headband of Intellect** — Wondrous, uncommon (attunement).
**Intelligence score becomes 19**; no effect if already 19+.

**Helm of Brilliance** — Wondrous, very rare (attunement). Set with **1d10
diamonds, 2d10 rubies, 3d10 fire opals, 4d10 opals**; **prying a gem out
destroys it**, and **losing all gems ends the item**. Benefits:
· **Action to cast (save DC 18), consuming the matching gem**: *daylight*
  (opal), *fireball* (fire opal), *prismatic spray* (diamond), *wall of fire*
  (ruby)
· **With ≥1 diamond**: dim light 30 ft when undead are within it, and **1d6
  radiant to any undead starting its turn there**
· **With ≥1 ruby**: **resistance to fire damage**
· **With ≥1 fire opal**: **action + command word** to set a held weapon ablaze
  (bright 10 ft, dim 10 ft more; harmless to you and the weapon) for **+1d6 fire
  on hits**, ending on a bonus action or if dropped or stowed
**Backfire:** if you take fire damage from failing a save against a spell, **roll
a d20; on a 1** every creature within 60 ft other than you makes a **DC 17 DEX
save or takes radiant damage equal to the number of gems**, and **the helm and
its gems are destroyed**.
*(An item whose **capabilities are a function of a consumable component
inventory it carries**, with a failure mode triggered by a specific damage
source.)*

**Helm of Comprehending Languages** — Wondrous, uncommon. **Action to cast
*comprehend languages* at will.**

**Helm of Telepathy** — Wondrous, uncommon (attunement). **Action to cast
*detect thoughts* (DC 13)**; while concentrating, **bonus action** to send a
telepathic message to the focused creature, **which may reply with its own bonus
action**; and an **action to cast *suggestion* (DC 13)** on it, **dawn
recharge**.

**Helm of Teleportation** — Wondrous, rare (attunement). **3 charges, regaining
1d3 daily at dawn**; action + 1 charge to cast *teleport*.

**Holy Avenger** — Weapon (any sword), legendary (**attunement by a paladin**).
**+3 to attack and damage**; **+2d10 radiant against fiends and undead**; and
while drawn, an aura in a **10-ft radius** (**30 ft at paladin level 17+**) in
which **you and friendly creatures have advantage on saving throws against
spells and other magical effects**.
*(An item whose effect **scales with the wielder's class level** — item effects
can reference character state.)*

**Horn of Blasting** — Wondrous, rare. Action + command word: a **30-ft cone**
audible 600 ft, **DC 15 CON save, 5d6 thunder and deafened 1 minute**, half and
no deafness on a success. **Glass or crystal creatures and objects save at
disadvantage and take 10d6 instead.** **Each use has a 20% chance of exploding
for 10d6 fire to the blower, destroying the horn.**

**Horn of Valhalla** — Wondrous, rare (silver/brass), very rare (bronze),
legendary (iron). Action to blow: warrior spirits with **berserker** statistics
appear within 60 ft for **1 hour** or until 0 HP. **7-day cooldown.**

| d100 | Type | Berserkers | Requirement |
|---|---|---|---|
| 01–40 | Silver | 2d4 + 2 | none |
| 41–75 | Brass | 3d4 + 3 | proficiency with all simple weapons |
| 76–90 | Bronze | 4d4 + 4 | proficiency with all medium armour |
| 91–00 | Iron | 5d4 + 5 | proficiency with all martial weapons |

**Failing the requirement makes the summons attack you.**
*(A prerequisite that is **not** an attunement gate but a **use-time check with
a punitive failure branch**.)*

**Horseshoes of a Zephyr** — Wondrous, very rare. **A set of four; all must be
affixed.** The creature floats **4 inches above the ground**, crossing nonsolid
or unstable surfaces (water, lava), **leaving no tracks**, **ignoring difficult
terrain**, and able to **travel at normal speed for 12 hours a day without
forced-march exhaustion**.
*(A **set of four**, extending the paired-item rule beyond pairs.)*

**Horseshoes of Speed** — Wondrous, rare. A set of four; **walking speed
+30 ft**.

**Immovable Rod** — Rod, uncommon. Action to press the button: **fixed in
place**, defying gravity, holding **up to 8,000 lb** (more deactivates and drops
it). A creature can spend an action on a **DC 30 STR check to move it 10 ft**.

**Instant Fortress** — Wondrous, rare. Action + command word: a 1-inch cube
becomes a **20-ft-square, 30-ft-high adamantine tower** with arrow slits, a
battlement, two floors, a ladder and a roof trapdoor. The door **opens only at
your command (a bonus action)** and is **immune to *knock* and to a *chime of
opening***. Creatures in the area make a **DC 15 DEX save for 10d10
bludgeoning**, half on success, and **are pushed out either way**; unattended
objects take the damage and are pushed automatically. **Cannot be tipped over.**
Roof, door and each wall have **100 HP, immunity to nonmagical weapon damage
(except siege weapons) and resistance to everything else**; **only *wish* can
repair it**, restoring **50 HP** per casting. Dismissed only **while empty**.

**Ioun Stone** — Wondrous, rarity varies (attunement). Action to toss it aloft;
it **orbits your head at 1d3 feet**. Another creature can seize it with an
action via an **attack roll against AC 24** or a **DC 24 DEX (Acrobatics)
check**; you can stow it with an action. The stone has **AC 24, 10 HP,
resistance to all damage**, and **counts as a worn object**.

| Stone | Rarity | Effect |
|---|---|---|
| Absorption | Very rare | **Reaction to cancel a spell of 4th level or lower** cast by a visible creature **targeting only you**; burns out after **20 levels**; cannot cancel a spell higher than the levels remaining |
| Greater Absorption | Legendary | as above but **8th level or lower** and **50 levels** |
| Agility | Very rare | **DEX +2, maximum 20** |
| Fortitude | Very rare | **CON +2, maximum 20** |
| Insight | Very rare | **WIS +2, maximum 20** |
| Intellect | Very rare | **INT +2, maximum 20** |
| Leadership | Very rare | **CHA +2, maximum 20** |
| Strength | Very rare | **STR +2, maximum 20** |
| Awareness | Rare | **You cannot be surprised** |
| Mastery | Legendary | **Proficiency bonus +1** |
| Protection | Rare | **+1 AC** |
| Regeneration | Legendary | **Regain 15 HP at the end of each hour**, provided you have at least 1 HP |
| Reserve | Rare | Stores **up to 3 levels of spells** (found with **1d4 − 1** stored). Any creature can cast a **1st–3rd-level** spell into it by touch; **the slot level determines the space used**. You can cast a stored spell, **using the original caster's slot level, save DC, attack bonus and spellcasting ability** |
| Sustenance | Rare | **You need not eat or drink** |

*(The **Ioun Stone of Mastery** is the only thing in the SRD that modifies the
**proficiency bonus itself**, confirming PB must be a derived stat rather than a
table lookup. **Reserve** is a stored-spell container whose casts carry
**another character's** statistics, which a cast record must therefore be able
to represent.)*

---

## 10. Catalogue: I–R

**Iron Bands of Binding** — Wondrous, rare. Action + command word, thrown at a
Huge-or-smaller creature within 60 ft: **a ranged attack at DEX modifier +
proficiency bonus**; on a hit the target is **restrained** until you release it
with a bonus action. Escape: action, **DC 20 STR check** — success **destroys
the item**; **failure means that creature auto-fails for 24 hours**.
**Dawn recharge.**

**Iron Flask** — Wondrous, legendary. Action + command word at a visible
creature within 60 ft **native to another plane**: **DC 17 WIS save or trapped**
(**advantage if it has been trapped before**). **One creature at a time**; it
does not breathe, eat, drink or age. Releasing it makes it **friendly and
obedient for 1 hour**, then it reverts to its own disposition. ***identify*
reveals that something is inside but not what.** Found contents, d100:
**1–50 empty** · 51–66 demons of types 1–6 · 67 deva · 68–69 greater devil ·
70–73 lesser devil · 74–75 djinni · 76–77 efreeti · 78–83 any elemental ·
84–86 invisible stalker · 87–90 night hag · 91 planetar · 92–95 salamander ·
96 solar · 97–99 succubus/incubus · 100 xorn.

**Javelin of Lightning** — Weapon (javelin), uncommon. Hurl + command word: a
**5-ft-wide line to a target within 120 ft**; everyone in it **except you and
the target** makes a **DC 13 DEX save for 4d6 lightning**, half on success. It
reverts to a javelin at the target: **make a ranged weapon attack** for javelin
damage **+ 4d6 lightning**. **Dawn recharge**; usable as a plain magic weapon
meanwhile.

**Lantern of Revealing** — Wondrous, uncommon. Hooded lantern; **6 hours per
pint**, **bright 30 ft / dim 30 ft more**. **Invisible creatures and objects are
visible while in the bright light.** Action to hood down to dim 5 ft.

**Luck Blade** — Weapon (any sword), legendary (attunement). **+1 to attack and
damage**; **+1 to saving throws** while on your person. *Luck:* **no action
required** — **reroll one attack roll, ability check or saving throw you
dislike; you must use the second roll**. **Dawn recharge.** *Wish:* **1d4 − 1
charges**; action + 1 charge to cast *wish*, **dawn recharge**, and **the
property is lost at 0 charges**.

**Mace of Disruption** — Weapon (mace), rare (attunement). **+2d6 radiant
against fiends and undead**; if the target is left at **25 HP or fewer**, a
**DC 15 WIS save or it is destroyed**, and on a success it is **frightened of
you until the end of your next turn**. Sheds bright light 20 ft / dim 20 ft.

**Mace of Smiting** — Weapon (mace), rare. **+1 to attack and damage**, rising
to **+3 against constructs**. On a **natural 20**: **+2d6 bludgeoning**, or
**+4d6 against a construct**, and a construct left at **25 HP or fewer is
destroyed**.

**Mace of Terror** — Weapon (mace), rare (attunement). **3 charges, 1d3 daily at
dawn.** Action + 1 charge: chosen creatures in a **30-ft radius** save
**DC 15 WIS or be frightened for 1 minute** — must move as far from you as
possible, **cannot approach within 30 ft**, **cannot take reactions**, and may
only **Dash**, try to escape movement restraints, or **Dodge** if trapped.
Repeatable save at the end of each turn.

**Mantle of Spell Resistance** — Wondrous, rare (attunement). **Advantage on
saving throws against spells.**

**Manual of Bodily Health / Gainful Exercise / Quickness of Action** and
**Tome of Clear Thought / Leadership and Influence / Understanding** —
Wondrous, very rare. **48 hours of study over 6 days or fewer** permanently
raises **CON / STR / DEX / INT / CHA / WIS respectively by 2, and raises that
score's maximum by 2**. The book **loses its magic and regains it in a
century**.
*(A **downtime activity that is also an item consumption**, and the clearest
statement that **per-ability caps are themselves mutable state**.)*

**Manual of Golems** — Wondrous, very rare. **Requires a spellcaster with at
least two 5th-level spell slots**; anyone else attempting to read it takes
**6d6 psychic**. Building requires uninterrupted work **resting no more than
8 hours per day**, plus supplies: **d20 1–5 clay, 30 days, 65,000 gp · 6–17
flesh, 60 days, 50,000 gp · 18 iron, 120 days, 100,000 gp · 19–20 stone,
90 days, 80,000 gp**. The book is **consumed**, and its ashes animate the golem.

**Marvelous Pigments** — Wondrous, very rare. **1d4 pots**; each covers
**1,000 sq ft**, creating up to **10,000 cubic feet** of inanimate objects or
terrain; **10 minutes per 100 sq ft**. Painted things become **real and
nonmagical**. **Nothing may be worth more than 25 gp** (higher-value items look
authentic but are worthless); **painted energy dissipates harmlessly**.

**Medallion of Thoughts** — Wondrous, uncommon (attunement). **3 charges, 1d3
at dawn**; action + 1 charge to cast *detect thoughts* (DC 13).

**Mirror of Life Trapping** — Wondrous, very rare. 4 ft tall, 50 lb, **AC 11,
10 HP, vulnerable to bludgeoning**; shatters at 0 HP. Activated with an action
while hanging on a vertical surface. Any creature other than you **seeing its
reflection within 30 ft** makes a **DC 15 CHA save or is trapped with its gear
in one of twelve extradimensional cells** — **advantage if it knows the mirror's
nature**, and **constructs succeed automatically**. Cells are fog-filled
infinities where occupants **do not age, eat, drink or sleep**; escape needs
planar-travel magic. **A thirteenth capture frees a random prisoner.**
**Shattering frees everyone.** You can **speak a name or cell number** to
converse with an occupant, or use a **second command word to release one**.

**Mithral Armor** — Armor (medium or heavy, **not hide**), uncommon.
**Removes the Stealth disadvantage and the Strength requirement** if the base
armour had them. *(An item that **deletes a property** rather than adding one.)*

**Necklace of Adaptation** — Wondrous, uncommon (attunement). **Breathe normally
in any environment**, and **advantage on saves against harmful gases and
vapours** (*cloudkill*, *stinking cloud*, inhaled poisons, some dragon breath).

**Necklace of Fireballs** — Wondrous, rare. **1d6 + 3 beads.** Action to detach
and throw one up to 60 ft: it detonates as a **3rd-level *fireball* (DC 15)**.
**Throwing multiple beads as one action raises the level by 1 per extra bead.**

**Necklace of Prayer Beads** — Wondrous, rare (**attunement by a cleric, druid
or paladin**). **1d4 + 2 magic beads**; **removing a bead destroys its magic**.
Each casts a spell **as a bonus action** using your spell save DC, then
**recharges at the next dawn**. **d20: 1–6 Blessing (*bless*) · 7–12 Curing
(*cure wounds* at 2nd level, or *lesser restoration*) · 13–16 Favor (*greater
restoration*) · 17–18 Smiting (*branding smite*) · 19 Summons (*planar ally*) ·
20 Wind walking (*wind walk*)**.

**Nine Lives Stealer** — Weapon (any sword), very rare (attunement).
**+2 to attack and damage**; **1d8 + 1 charges**. On a **critical hit against a
creature with fewer than 100 HP**, a **DC 15 CON save or it is slain instantly**
(**constructs and undead immune**); a kill **spends a charge**. **At 0 charges
the property is lost.**

**Oathbow** — Weapon (longbow), very rare (attunement). Declaring a **sworn
enemy** (one at a time, until it dies or **seven days later at dawn**) grants
**advantage on ranged attacks against it**, **ignores all cover except total
cover**, **no disadvantage at long range**, and **+3d6 piercing on a hit** —
but **disadvantage on attack rolls with every other weapon while it lives**.

**Oil of Etherealness** — Potion, rare. **10 minutes to apply**; covers a Medium
or smaller creature and its gear (**one extra vial per size category above
Medium**). Grants ***etherealness* for 1 hour**.

**Oil of Sharpness** — Potion, very rare. **1 minute to apply** to one slashing
or piercing weapon or **5 pieces of ammunition**: magical and **+3 to attack and
damage for 1 hour**.

**Oil of Slipperiness** — Potion, uncommon. **10 minutes to apply**: ***freedom
of movement* for 8 hours**. Or **poured on the ground as an action** for a
**10-ft square of *grease* lasting 8 hours**.

**Pearl of Power** — Wondrous, uncommon (**attunement by a spellcaster**).
Action + command word: **regain one expended spell slot**; **a 4th-level or
higher slot comes back as 3rd level**. **Dawn recharge.**

**Periapt of Health** — Wondrous, uncommon. **Immune to contracting disease**,
and any current disease is **suppressed while worn**.

**Periapt of Proof against Poison** — Wondrous, rare. **Immune to the poisoned
condition and to poison damage.**

**Periapt of Wound Closure** — Wondrous, uncommon (attunement). **You stabilise
automatically whenever you are dying at the start of your turn**, and **Hit Dice
spent to regain hit points restore double**.

**Philter of Love** — Potion, uncommon. **The next creature you see within
10 minutes charms you for 1 hour**; if it is of a species and gender you are
normally attracted to, you regard it as your true love while charmed.

**Pipes of Haunting** — Wondrous, uncommon. **Requires proficiency with wind
instruments.** **3 charges, 1d3 at dawn.** Action + 1 charge: creatures within
30 ft that hear it save **DC 15 WIS or be frightened for 1 minute** (**you may
exempt all non-hostile creatures automatically**); repeatable save; **a success
grants 24-hour immunity**.

**Pipes of the Sewers** — Wondrous, uncommon (attunement). **Requires wind
instrument proficiency.** Rats are indifferent to you. **3 charges, 1d3 at
dawn**: action to play, then a **bonus action to spend 1–3 charges** summoning
one rat swarm each **if enough rats are within half a mile** (otherwise the
charge is wasted). Swarms come to the music but are **not controlled**. An
uncontrolled swarm within 30 ft can be swayed by a **CHA check contested by its
WIS check** — winning makes it friendly **only while you keep playing each
round as an action**; losing (or the music stopping) makes it **immune for
24 hours**.

**Plate Armor of Etherealness** — Armor (plate), legendary (attunement).
Action + command word for ***etherealness* for 10 minutes**, ending if removed
or on another command word. **Dawn recharge.**

**Portable Hole** — Wondrous, rare. Unfolds into a **6-ft circle** creating a
**10-ft-deep extradimensional hole**; **it is on a different plane, so it cannot
make an open passage**. Folding it shut traps the contents; **weighs next to
nothing**. A creature inside a folded hole can spend an action on a **DC 10 STR
check** to force its way out. **Breathing creatures survive 10 minutes.**
**Nesting with a *bag of holding* or *handy haversack* destroys both and opens a
one-way Astral gate.**

**Potions** — all *Potion*; drinking is an action unless noted.
*Animal Friendship* (uncommon) — cast *animal friendship* (DC 13) **at will for
1 hour** · *Clairvoyance* (rare) — *clairvoyance* · *Climbing* (**common**) —
climb speed equal to walking speed and **advantage on STR (Athletics) to climb**
for 1 hour · *Diminution* (rare) — the **reduce** effect for **1d4 hours, no
concentration** · *Flying* (very rare) — **fly speed equal to walking speed and
hover** for 1 hour · *Gaseous Form* (rare) — **1 hour, no concentration**,
endable as a bonus action · *Growth* (uncommon) — the **enlarge** effect for
1d4 hours · *Heroism* (rare) — **10 temporary HP** and ***bless* without
concentration** for 1 hour · *Invisibility* (very rare) — 1 hour, **ending early
if you attack or cast** · *Mind Reading* (rare) — *detect thoughts* (DC 13) ·
*Resistance* (uncommon) — resistance to one type for 1 hour (**same d10 table as
*armor of resistance***) · *Speed* (very rare) — ***haste* for 1 minute, no
concentration*** · *Water Breathing* (uncommon) — 1 hour.

*Potion of Giant Strength* — **rarity varies**; **sets STR for 1 hour**:
**hill 21 (uncommon) · frost/stone 23 (rare) · fire 25 (rare) · cloud 27 (very
rare) · storm 29 (legendary)**.

*Potions of Healing* — **healing common 2d4 + 2 · greater uncommon 4d4 + 4 ·
superior rare 8d4 + 8 · supreme very rare 10d4 + 20**.

*Potion of Poison* (uncommon) — **looks, smells and tastes like a beneficial
potion**, and **only *identify* reveals it**. **3d6 poison** and a **DC 13 CON
save or poisoned**, taking **3d6 at the start of each of your turns**; a save at
the end of each turn **reduces the ongoing damage by 1d6**, ending at 0.
*(The second deliberately-misidentified item, and a **decaying damage-over-time
track** rather than a binary end.)*

**Restorative Ointment** — Wondrous, uncommon. **1d4 + 1 doses.** Action to
swallow or apply: **2d8 + 2 hit points**, **ends the poisoned condition**, and
**cures any disease**.

**Rings** — all *Ring*.
*Animal Influence* (rare) — **3 charges, 1d3 at dawn**: *animal friendship*
(DC 13), *fear* (DC 13, **beasts of INT 3 or lower only**), or *speak with
animals*.
*Djinni Summoning* (legendary, attunement) — command word summons a
**particular djinni** for **as long as you concentrate, up to 1 hour**; it obeys
**in any language**; **24-hour cooldown**, and **the ring dies if the djinni
dies**.
*Elemental Command* (legendary, attunement) — linked to one Elemental Plane;
**advantage on attacks against its elementals and disadvantage for them against
you**; **5 charges, 1d4 + 1 at dawn**, **spell DC 17**; **2 charges to
*dominate monster* an elemental of that type**, plus a plane-specific always-on
benefit (**air:** fall 60 ft/round unharmed, speak Auran · **earth:** ignore
rubble and rock difficult terrain, speak Terran · **fire:** fire resistance,
speak Ignan · **water:** walk on liquids, speak Aquan). **Helping to slay an
elemental of that plane unlocks a further tier**: air — lightning resistance,
**fly speed equal to walking speed with hover**, *chain lightning* (3) /
*gust of wind* (2) / *wind wall* (1) · earth — acid resistance, **move through
solid earth or rock as difficult terrain** (**shunted out if you end your turn
inside**), *stone shape* (2) / *stoneskin* (3) / *wall of stone* (3) · fire —
**immunity to fire**, *burning hands* (1) / *fireball* (2) / *wall of fire* (3)
· water — breathe underwater and swim at walking speed, *create or destroy
water* (1) / *control water* (3) / *ice storm* (2) / *wall of ice* (3).
*(An item that **unlocks new capabilities in response to a narrative
achievement** — an item with progression.)*
*Evasion* (rare, attunement) — **3 charges, 1d3 at dawn**; **reaction to turn a
failed DEX save into a success**.
*Feather Falling* (rare, attunement) — descend 60 ft/round, **no falling
damage**.
*Free Action* (rare, attunement) — as *freedom of movement*'s core clauses.
*Invisibility* (legendary, attunement) — **action to turn invisible**, ending
when the ring is removed, when you **attack or cast**, or on a bonus action.
*Jumping* (uncommon, attunement) — **bonus action to cast *jump* on yourself at
will**.
*Mind Shielding* (uncommon, attunement) — **immune to thought-reading,
lie-detection, alignment- and type-detection magic**; telepathy **only with your
consent**; **action to make the ring invisible**. **If you die wearing it your
soul enters the ring** (unless occupied) and can **telepathically address any
wearer, who cannot refuse**.
*Protection* (rare, attunement) — **+1 AC and +1 to saving throws**.
*Regeneration* (very rare, attunement) — **1d6 HP every 10 minutes** while above
0 HP; **lost body parts regrow in 1d6 + 1 days**.
*Resistance* (rare, attunement) — resistance to one type, **indicated by the
gem**: pearl acid · tourmaline cold · garnet fire · sapphire force · citrine
lightning · jet necrotic · amethyst poison · jade psychic · topaz radiant ·
spinel thunder.
*Shooting Stars* (very rare, **attunement outdoors at night**) — in dim light or
darkness, *dancing lights* and *light* at will; **6 charges, 1d6 at dawn**:
*faerie fire* (1); **Ball Lightning** (2 charges) creating **one to four 3-ft
spheres** for up to 1 minute of concentration, each shedding dim light 30 ft,
movable **30 ft as a bonus action** within 120 ft, discharging at any creature
coming within 5 ft for a **DC 15 DEX save** — **damage depends inversely on the
number created: 4 spheres 2d4 · 3 spheres 2d6 · 2 spheres 5d4 · 1 sphere
4d12**; and **Shooting Stars** (1–3 charges) launching one mote per charge for a
**15-ft cube, DC 15 DEX save, 5d4 fire**, half on success.
*Spell Storing* (rare, attunement) — as the **Ioun Stone of Reserve** but
**5 levels**, spells of **1st–5th**, found with **1d6 − 1** levels stored.
*Spell Turning* (legendary, attunement) — **advantage on saves against any spell
targeting only you**; **on a natural 20 against a spell of 7th level or lower
the spell instead targets the caster**, using the caster's own statistics.
*Swimming* (uncommon) — **swimming speed 40 ft**.
*Telekinesis* (very rare, attunement) — cast *telekinesis* at will, **objects
only, and only unattended ones**.
*The Ram* (rare, attunement) — **3 charges, 1d3 at dawn**; action + **1–3
charges**: an attack at **+7** for **2d10 force and a 5-ft push per charge**; or
a **STR check at +5 per charge** to break an unattended object within 60 ft.
*Three Wishes* (legendary) — **3 charges**, each casting *wish*; **nonmagical
when spent**.
*Warmth* (uncommon, attunement) — **cold resistance**, and you and your gear are
**unharmed down to −50 °F**.
*Water Walking* (uncommon) — walk on any liquid.
*X-ray Vision* (rare, attunement) — action + command word: **see through solid
matter within 30 ft for 1 minute**, penetrating **1 ft of stone, 1 inch of
common metal, or 3 ft of wood or dirt**; **blocked by thicker material or a thin
sheet of lead**. **Reusing it before a long rest requires a DC 15 CON save or
you gain a level of exhaustion.**

**Robe of Eyes** — Wondrous, rare (attunement). **See in all directions** and
**advantage on WIS (Perception) checks that rely on sight**; **darkvision
120 ft**; **see invisible creatures and into the Ethereal Plane to 120 ft**.
**The robe's eyes cannot be closed or averted** — a ***light* spell cast on the
robe, or *daylight* within 5 ft, blinds you for 1 minute** (repeatable CON save,
**DC 11 for *light*, DC 15 for *daylight***).
*(An item with a **genuine drawback that is not a curse** — a designed
vulnerability.)*

**Robe of Scintillating Colors** — Wondrous, very rare (attunement).
**3 charges, 1d3 at dawn**; action + 1 charge for a display until the end of
your next turn: **bright light 30 ft / dim 30 ft**, **creatures that can see you
have disadvantage on attack rolls against you**, and anyone in the bright light
who could see you when it activated saves **DC 15 WIS or is stunned** for the
duration.

**Robe of Stars** — Wondrous, very rare (attunement). **+1 to saving throws.**
**Six large stars**: action to pull one off and cast ***magic missile* as a
5th-level spell**; **1d6 stars reappear daily at dusk** (**the only dusk-based
refresh in the SRD**). Action to **enter the Astral Plane** with everything you
carry, and an action to return to your last space.

**Robe of the Archmagi** — Wondrous, legendary (**attunement by a sorcerer,
warlock or wizard**). **White for good, grey for neutral, black for evil** —
**you cannot attune to a robe that does not match your alignment**. Unarmoured
**base AC 15 + DEX modifier**; **advantage on saves against spells and other
magical effects**; **spell save DC and spell attack bonus each +2**.
*(A third alignment-gated mechanic, and a **sixth competing AC base provider**.)*

**Robe of Useful Items** — Wondrous, uncommon. Patches detach as an action and
become real; **when the last is gone it is an ordinary garment**. Always
**two each** of: dagger, bullseye lantern (filled and lit), steel mirror, 10-ft
pole, 50 ft coiled hempen rope, sack. Plus **4d4** others, d100: **01–08** bag
of 100 gp · **09–15** silver coffer worth 500 gp · **16–22** an iron door up to
10 × 10 ft that **conforms to and hinges itself into an opening** · **23–30**
10 gems worth 100 gp each · **31–44** 24-ft wooden ladder · **45–51** a riding
horse with saddlebags · **52–59** a 10-ft-cube pit placeable within 10 ft ·
**60–68** 4 potions of healing · **69–75** a 12-ft rowboat · **76–83** a spell
scroll of 1st–3rd level · **84–90** 2 mastiffs · **91–96** a 2 × 4 ft window up
to 2 ft deep · **97–00** a portable ram.

**Rod of Absorption** — Rod, very rare (attunement). **Reaction to absorb a
spell targeting only you** (not an area effect), **cancelling it** and storing
**energy equal to its level**. **Lifetime capacity 50 levels**; a newly found
rod already holds **1d10**. On attuning you **learn both totals**. A spellcaster
may **convert stored levels into spell slots, up to 5th level and never above
your own maximum slot level**. **Becomes nonmagical when full and empty.**

**Rod of Alertness** — Rod, very rare (attunement). **Advantage on WIS
(Perception) checks and on initiative rolls**; **action to cast *detect evil and
good*, *detect magic*, *detect poison and disease* or *see invisibility***; and
a **Protective Aura** — action to plant it for **bright light 60 ft / dim 60 ft
more** in which you and friendly creatures gain **+1 AC and +1 to saving
throws** and can **sense the location of invisible hostile creatures** in the
light. Lasts **10 minutes** or until pulled up; **dawn recharge**.

**Rod of Lordly Might** — Rod, legendary (attunement). A **+3 magic mace**.
**Six buttons, each a bonus action**, effective until another button or the same
button is pressed: **1** becomes a *flame tongue* · **2** a **+3 battleaxe** ·
**3** a **+3 spear** with a 6-ft haft · **4** a **climbing pole up to 50 ft**
that anchors in granite and unfolds a ladder, bearing **4,000 lb** (more weight
or poor anchoring reverts it) · **5** a **battering ram granting +10 to STR
checks** to break barriers · **6** normal form, **indicating magnetic north** and
**your depth or height relative to the ground**. Three further powers, each
**dawn-recharged**: *Drain Life* (**DC 17 CON**, **+4d6 necrotic** and **you
regain half that**), *Paralyze* (**DC 17 STR**, **paralyzed 1 minute** with a
repeatable save), *Terrify* (action, **DC 17 WIS** for everyone you can see
within 30 ft, **frightened 1 minute** with a repeatable save).

**Rod of Rulership** — Rod, rare (attunement). Action: chosen creatures within
**120 ft** save **DC 15 WIS or be charmed for 8 hours**, regarding you as a
trusted leader. **Ends for any creature harmed by you or your companions, or
commanded against its nature.** **Dawn recharge.**

**Rod of Security** — Rod, very rare. Action to transport **you and up to 199
willing creatures** to an **extraplanar paradise of your design**, with food and
water; **objects taken out vanish**. **Each hour there restores hit points as
though spending one Hit Die**, and **visitors do not age though time passes
normally**. Duration: **200 days ÷ the number of creatures, rounded down**.
**Ten-day cooldown.**

**Rope of Climbing** — Wondrous, uncommon. 60 ft, 3 lb, holds **3,000 lb**.
Action + command word to animate; **bonus action** to send the far end toward a
destination, moving **10 ft per turn**. It can **fasten, unfasten, knot, unknot
or coil itself**; **knotted it shortens to 50 ft and grants advantage on checks
to climb it**. **AC 20, 20 HP, regaining 1 HP every 5 minutes** while above 0.

**Rope of Entanglement** — Wondrous, rare. 30 ft. Action + command word: a
creature within 20 ft saves **DC 15 DEX or is restrained**; **bonus action +
second command word** releases it. Escape: action, **DC 15 STR *or* DEX (the
target's choice)**. Same **AC 20 / 20 HP / 1 HP per 5 minutes**.

---

## 11. Catalogue: S–Z

**Scarab of Protection** — Wondrous, legendary (attunement). Holding it for
1 round reveals its nature. **Advantage on saving throws against spells**, and
**12 charges**: **reaction to turn a failed save against a necromancy spell or a
harmful undead effect into a success**. **Crumbles when the last charge is
spent.**

**Scimitar of Speed** — Weapon (scimitar), very rare (attunement).
**+2 to attack and damage**, and **one attack with it as a bonus action each
turn**.

**Shield, +1/+2/+3** — Armor (shield), uncommon/rare/very rare. Bonus **in
addition to the shield's normal +2**.

**Shield of Missile Attraction** — Armor (shield), rare (attunement).
**Resistance to damage from ranged weapon attacks.**
**Curse:** you **become the target of any ranged weapon attack made against
anyone within 10 ft of you**; **removing the shield does not end it**.

**Slippers of Spider Climbing** — Wondrous, uncommon (attunement). Move on
vertical surfaces and ceilings **hands free**, **climbing speed equal to walking
speed** — **but not on slippery surfaces such as ice or oil**.

**Sovereign Glue** — Wondrous, legendary. **1d6 + 1 ounces**; **1 ounce covers
1 square foot**; **sets in 1 minute**. Must be stored in a container **coated
inside with *oil of slipperiness***. The bond breaks **only** with *universal
solvent*, *oil of etherealness*, or *wish*.

**Spell Scroll** — Scroll, rarity by spell level. Castable **only if the spell is
on your class's spell list**; otherwise **unintelligible**. **No material
components required**; **normal casting time**; **the scroll crumbles once cast**
(**an interrupted casting does not lose it**). **A spell above your normal
maximum level requires an ability check with your spellcasting ability, DC =
10 + the spell's level**; **failure loses the spell with no other effect**.

| Spell level | Rarity | Save DC | Attack bonus |
|---|---|---|---|
| Cantrip | Common | 13 | +5 |
| 1st | Common | 13 | +5 |
| 2nd | Uncommon | 13 | +5 |
| 3rd | Uncommon | 15 | +7 |
| 4th | Rare | 15 | +7 |
| 5th | Rare | 17 | +9 |
| 6th | Very rare | 17 | +9 |
| 7th | Very rare | 18 | +10 |
| 8th | Very rare | 18 | +10 |
| 9th | Legendary | 19 | +11 |

**A wizard spell on a scroll can be copied into a spellbook** with an **INT
(Arcana) check, DC = 10 + the spell's level**; **the scroll is destroyed either
way**.
*(The scroll's DC and attack bonus **override the reader's own**, so a cast can
originate from an item with fully independent statistics.)*

**Spellguard Shield** — Armor (shield), very rare (attunement). **Advantage on
saves against spells and other magical effects**, and **spell attacks have
disadvantage against you**.

**Sphere of Annihilation** — Wondrous, legendary. A 2-ft hole in the multiverse
that **obliterates all matter passing through it** (**artifacts excepted**);
anything touching it without being engulfed takes **4d10 force**. Stationary
until controlled: from within 60 ft, an action and a **DC 25 INT (Arcana)
check** moves it **5 × your INT modifier feet** (minimum 5) in a chosen
direction; **failure moves it 10 ft toward you**. Entering a creature's space
forces a **DC 13 DEX save or 4d10 force**. Wresting control from another
creature is an **INT (Arcana) contest**. Contact with a planar portal or
extradimensional space, d100: **01–50 the sphere is destroyed** · **51–85 it
passes through** · **86–00 a spatial rift sends everything within 180 feet,
including the sphere, to a random plane**.

**Staffs** — all *Staff*; all with a **dawn recharge** and, with two exceptions,
a **d20 burnout roll when the last charge is spent**.

| Staff | Rarity / attunement | Charges (dawn) | Effects | On expending the last charge |
|---|---|---|---|---|
| **Charming** | rare (bard, cleric, druid, sorcerer, warlock, wizard) | 10 (1d8 + 2) | *charm person*, *command* or *comprehend languages* (1 each, your DC); **turn one failed save against an enchantment targeting only you into a success (dawn)**; **reaction + 1 charge to reflect an enchantment you saved against back at its caster** | on a 1, a plain quarterstaff |
| **Fire** | very rare (druid, sorcerer, warlock, wizard) | 10 (1d6 + 4) | **fire resistance**; *burning hands* (1), *fireball* (3), *wall of fire* (4) | on a 1, crumbles to cinders |
| **Frost** | very rare (druid, sorcerer, warlock, wizard) | 10 (1d6 + 4) | **cold resistance**; *cone of cold* (5), *fog cloud* (1), *ice storm* (4), *wall of ice* (4) | on a 1, turns to water |
| **Healing** | rare (bard, cleric, druid) | 10 (1d6 + 4) | *cure wounds* (**1 charge per spell level, up to 4th**), *lesser restoration* (2), *mass cure wounds* (5) | on a 1, vanishes forever |
| **Striking** | very rare (attunement) | 10 (1d6 + 4) | **+3 quarterstaff**; **up to 3 charges on a hit for +1d6 force each** | on a 1, a plain quarterstaff |
| **Swarming Insects** | rare (six classes) | 10 (1d6 + 4) | *giant insect* (4), *insect plague* (5); **Insect Cloud** (1 charge) — a 30-ft radius **heavily obscured for everyone but you**, moving with you for 10 minutes, **dispersed by a 10 mph wind** | on a 1, insects consume the staff |
| **The Python** | uncommon (cleric, druid, warlock) | — | Action + command word to throw it within 10 ft: it becomes a **giant constrictor snake on its own initiative**, mentally commanded within 60 ft. **At 0 HP it dies and the staff shatters**; **reverting early restores its full HP** | — |
| **The Woodlands** | rare (druid) | 10 (1d6 + 4) | **+2 quarterstaff and +2 to spell attack rolls**; *animal friendship* (1), *awaken* (5), *barkskin* (2), *locate animals or plants* (2), *speak with animals* (1), *speak with plants* (3), *wall of thorns* (6); ***pass without trace* free**; **Tree Form** (1 charge) — a real 60-ft tree, reverting on a command word and **dropping anyone in it** | on a 1, a plain quarterstaff |
| **Thunder and Lightning** | very rare (attunement) | — (each property **dawn-recharged separately**) | **+2 quarterstaff**; *Lightning* (**+2d6 lightning** on a hit); *Thunder* (**DC 17 CON or stunned** until the end of your next turn, audible 300 ft); *Lightning Strike* (**5 × 120 ft line, DC 17 DEX, 9d6 lightning**); *Thunderclap* (**60 ft, DC 17 CON, 2d6 thunder and deafened 1 minute**, audible 600 ft); *Thunder and Lightning* (**both at once, spending only this property's use**) | — |
| **Withering** | rare (cleric, druid, warlock) | 3 (1d3) | Magic quarterstaff; **1 charge for +2d10 necrotic** and a **DC 15 CON save or disadvantage for 1 hour on any STR- or CON-based ability check or saving throw** | — |
| **Power** | very rare (sorcerer, warlock, wizard) | 20 (2d8 + 4) | **+2 quarterstaff**, and **+2 to AC, saving throws and spell attack rolls**; *Power Strike* (1 charge, **+1d6 force**); *cone of cold* (5), *fireball* at 5th level (5), *globe of invulnerability* (6), *hold monster* (5), *levitate* (2), *lightning bolt* at 5th level (5), *magic missile* (1), *ray of enfeeblement* (1), *wall of force* (5) | on a 1, keeps **+2 to attack and damage** and loses everything else; **on a 20 it regains 1d8 + 2 charges** |
| **The Magi** | legendary (sorcerer, warlock, wizard) | 50 (4d6 + 2) | **+2 quarterstaff and +2 to spell attack rolls**; **Spell Absorption** — advantage on saves against spells, and a **reaction to absorb a spell targeting only you, gaining charges equal to its level** — **but exceeding 50 charges triggers the retributive strike**; *conjure elemental* (7), *dispel magic* (3), *fireball* at 7th (7), *flaming sphere* (2), *ice storm* (4), *invisibility* (2), *knock* (2), *lightning bolt* at 7th (7), *passwall* (5), *plane shift* (7), *telekinesis* (5), *wall of fire* (4), *web* (2); **free: *arcane lock*, *detect magic*, *enlarge/reduce*, *light*, *mage hand*, *protection from evil and good*** | **on a 20 it regains 1d12 + 1 charges** |

**Retributive Strike** (*staff of power* and *staff of the magi*) — action to
break the staff: a **30-ft-radius** explosion. **You have a 50% chance of being
instantly transported to a random plane and avoiding it**; otherwise you take
**force damage equal to 16 × the remaining charges**. Everyone else makes a
**DC 17 DEX save**, taking **8× / 6× / 4× the charge count** at **≤10 ft /
11–20 ft / 21–30 ft**, halved on a success.
*(Damage as a **function of a resource's current value** — the most extreme case
of a derived number depending on live item state.)*

**Stone of Controlling Earth Elementals** — Wondrous, rare. While touching the
ground, action + command word to summon an earth elemental. **Dawn recharge.**

**Stone of Good Luck (Luckstone)** — Wondrous, uncommon (attunement).
**+1 to ability checks and saving throws.**

**Sun Blade** — Weapon (longsword), rare (attunement). A hilt; a **bonus action**
creates or dismisses the blade. It has **finesse**, and **shortsword or longsword
proficiency confers proficiency with it**. **+2 to attack and damage**; deals
**radiant instead of slashing**; **+1d8 radiant against undead**. Emits
**bright light 15 ft / dim 15 ft**, **and the light is sunlight**; an **action
adjusts each radius by 5 ft**, between **10 and 30 ft**.

**Sword of Life Stealing** — Weapon (any sword), rare (attunement). On a
**natural 20**, **+3d6 necrotic** (**not against constructs or undead**) and
**you gain temporary hit points equal to the extra damage**.

**Sword of Sharpness** — Weapon (any sword dealing slashing), very rare
(attunement). **Against objects, maximise the weapon damage dice.** On a
**natural 20** against a creature, **+4d6 slashing**, then **roll another d20 —
on a 20 you sever a limb** (or part of the body if it has no limbs). Command
word for **bright light 10 ft / dim 10 ft**.

**Sword of Wounding** — Weapon (any sword), rare (attunement).
**Hit points lost to this weapon can be regained only through a short or long
rest** — **not by regeneration, magic or any other means**. **Once per turn**, a
hit can **wound** the target: at the start of each of its turns it takes
**1d4 necrotic per wound**, then may make a **DC 15 CON save to end all of
them**; alternatively it or an adjacent creature can spend an action on a
**DC 15 WIS (Medicine)** check to end them.
*(A **healing-channel restriction** — damage tagged so that only certain
recovery paths apply to it.)*

**Talisman of Pure Good** — Wondrous, legendary (**attunement by a good
creature**). **A neutral creature touching it takes 6d6 radiant; an evil one
8d6**, **repeating at the end of each turn it holds or carries it**. A **good
cleric or paladin** may use it as a **holy symbol** and gains **+2 to spell
attack rolls**. **7 charges**: action + 1 charge against a visible creature on
the ground within 120 ft — **if it is evil**, a **DC 20 DEX save or it falls into
a flaming fissure and is destroyed, leaving no remains**. **Destroyed when the
last charge is spent.**

**Talisman of Ultimate Evil** — the mirror image: **attunement by an evil
creature**, **necrotic** damage, **good** creatures targeted, **6 charges**.

**Talisman of the Sphere** — Wondrous, legendary (attunement). **Double your
proficiency bonus** on INT (Arcana) checks to control a *sphere of
annihilation*, and while controlling one, an action levitates it **10 ft +
10 × your INT modifier**.

**Trident of Fish Command** — Weapon (trident), uncommon (attunement).
**3 charges, 1d3 at dawn**; action + 1 charge to cast *dominate beast* (DC 15)
**on a beast with an innate swimming speed**.

**Universal Solvent** — Wondrous, legendary. Action to pour: dissolves **up to
1 square foot of adhesive**, including *sovereign glue*.

**Vicious Weapon** — Weapon (any), rare. On a **natural 20**, the critical hit
deals **+2d6 of the weapon's damage type**.

**Vorpal Sword** — Weapon (any sword dealing slashing), legendary (attunement).
**+3 to attack and damage**, and it **ignores resistance to slashing damage**.
On a **natural 20** against a creature with at least one head, **you cut off a
head** and it dies if it cannot survive without it. **Immune:** creatures immune
to slashing, headless creatures, those with **legendary actions**, or any the GM
rules too large — **those take +6d8 slashing instead**.

**Wands** — all *Wand*; all charge-bearing wands recharge **daily at dawn**, and
most **crumble to ashes on a d20 roll of 1 after the last charge is spent**.

| Wand | Rarity / attunement | Charges (dawn) | Effects |
|---|---|---|---|
| **Binding** | rare (spellcaster) | 7 (1d6 + 1) | *hold monster* (5), *hold person* (2), DC 17; **reaction + 1 charge for advantage on a save against paralysis or restraint, or on a check to escape a grapple** |
| **Enemy Detection** | rare (attunement) | 7 (1d6 + 1) | 1 charge: for 1 minute **know the direction (not distance) of the nearest hostile creature within 60 ft**, including **ethereal, invisible, disguised or hidden** ones |
| **Fear** | rare (attunement) | 7 (1d6 + 1) | 1 charge: *command* to flee or grovel (DC 15); 2 charges: a **60-ft cone**, **DC 15 WIS or frightened 1 minute** with the full flee-and-cannot-approach-within-30-ft behaviour |
| **Fireballs** | rare (spellcaster) | 7 (1d6 + 1) | *fireball* (DC 15) at **3rd level for 1 charge, +1 level per extra charge** |
| **Lightning Bolts** | rare (spellcaster) | 7 (1d6 + 1) | *lightning bolt* (DC 15), same upcast-by-charge rule |
| **Magic Detection** | uncommon | 3 (1d3) | *detect magic* |
| **Magic Missiles** | uncommon | 7 (1d6 + 1) | *magic missile*, **1st level for 1 charge, +1 level per extra charge** |
| **Paralysis** | rare (spellcaster) | 7 (1d6 + 1) | 1 charge: a ray at a creature within 60 ft, **DC 15 CON or paralyzed 1 minute**, repeatable save |
| **Polymorph** | very rare (spellcaster) | 7 (1d6 + 1) | *polymorph* (DC 15) |
| **Secrets** | uncommon | 3 (1d3) | 1 charge: **points at the nearest secret door or trap within 30 ft** |
| **The War Mage, +1/+2/+3** | uncommon/rare/very rare (spellcaster) | — | **Bonus to spell attack rolls**, and **you ignore half cover on spell attacks** |
| **Web** | uncommon (spellcaster) | 7 (1d6 + 1) | *web* (DC 15) |
| **Wonder** | rare (spellcaster) | 7 (1d6 + 1) | 1 charge at a target within 120 ft, then a **d100 wild-magic table** — see below |

**Wand of Wonder** table (spell DC 15; spell ranges become 120 ft; areas must
include the chosen target; the GM randomises among multiple possible subjects):
**01–05** *slow* · **06–10** *faerie fire* · **11–15** **you are stunned until
the start of your next turn** · **16–20** *gust of wind* · **21–25** *detect
thoughts* on the target, or **1d6 psychic to you** if you targeted no creature ·
**26–30** *stinking cloud* · **31–33** heavy rain in a 60-ft radius, **lightly
obscured**, until the start of your next turn · **34–36** an uncontrolled animal
appears (**d100: 01–25 rhinoceros, 26–50 elephant, 51–100 rat**) · **37–46**
*lightning bolt* · **47–49** 600 butterflies **heavily obscure** a 30-ft radius
for 10 minutes · **50–53** *enlarge* on the target, **or on you** if it cannot be
affected · **54–58** *darkness* · **59–62** grass grows (or grows tenfold) in a
60-ft radius for 1 minute · **63–65** an unattended object within 120 ft, no
larger than 10 ft, **vanishes into the Ethereal Plane** · **66–69** **you
shrink** · **70–79** *fireball* · **80–84** *invisibility* on yourself ·
**85–87** leaves grow from the target, falling after 24 hours · **88–90**
**1d4 × 10 one-gp gems** in a 30 × 5 ft line, dealing **1 bludgeoning each,
divided equally among all creatures in the line** · **91–95** a 30-ft burst;
**you and everyone who can see** save **DC 15 CON or blinded 1 minute** ·
**96–97** the target's skin turns bright blue for 1d10 days · **98–00** a
**DC 15 CON save** (on **you** if you targeted no creature): **failing by 5 or
more petrifies instantly**; any other failure **restrains and begins
petrification**, repeated at the end of its next turn. Ended only by *greater
restoration* or similar.

**Weapon, +1/+2/+3** — Weapon (any), uncommon/rare/very rare. Bonus to **attack
and damage rolls**.

**Well of Many Worlds** — Wondrous, legendary. Unfolds to a **6-ft circle**
creating a **two-way portal to another world or plane**, destination chosen by
the GM. Action to close. **1d8-hour cooldown.**

**Wind Fan** — Wondrous, uncommon. Action to cast *gust of wind* (DC 13).
**Nominally dawn-recharged**, but it *can* be reused early at a **cumulative 20%
chance per use of failing and tearing into useless tatters**.
*(A resource with an **optional overuse gamble** rather than a hard lock.)*

**Winged Boots** — Wondrous, uncommon (attunement). **Flying speed equal to your
walking speed**, for **up to 4 hours total**, spendable in chunks of **at least
1 minute**. Running out mid-air means **descending 30 ft per round** until you
land. **Regain 2 hours of flight for every 12 hours unused.**

**Wings of Flying** — Wondrous, rare (attunement). Action + command word for
**flying speed 60 ft** for **1 hour** or until dismissed; then a **1d12-hour
cooldown**.

---

## 12. Sentient magic items (p251–252)

**"Sentient magic items function as NPCs under the GM's control."** Any
**activated** property is under the **item's** control, not the wielder's; a
strained relationship lets the item **suppress its properties or turn them
against the wielder**. **Consumables (potions, scrolls) are never sentient.**

A sentient item has **INT, WIS and CHA scores** (roll 4d6 drop lowest), a
**communication mode** (**d100: 01–60 transmits emotion · 61–90 speaks, reads and
understands languages · 91–00 that plus telepathy with its bearer**), **senses**
(**d4: 1** hearing and normal vision 30 ft · **2** 60 ft · **3** 120 ft ·
**4** hearing and **darkvision** 120 ft), an **alignment** (d100: 01–15 LG,
16–35 NG, 36–50 CG, 51–63 LN, 64–73 N, 74–85 CN, 86–89 LE, 90–96 NE, 97–00 CE),
and optionally a **special purpose** (**d10: 1** Aligned · **2** Bane ·
**3** Protector · **4** Crusader · **5** Templar · **6** Destroyer · **7** Glory
Seeker · **8** Lore Seeker · **9** Destiny Seeker · **10** Creator Seeker).

**Conflict** — when the wielder acts against the item's alignment or purpose,
the item makes a **CHA check contested by the wielder's CHA check**. Winning, it
may demand to be carried at all times, that repugnant possessions be discarded,
that its goals take priority, or that it be given to someone else. If refused,
it may **block attunement**, **suppress properties**, or **attempt to take
control**: the wielder makes a **CHA saving throw, DC = 12 + the item's CHA
modifier**, and on a failure is **charmed by the item for 1d12 hours**, repeating
the save whenever it takes damage. **Dawn cooldown on the control attempt.**

*Engine note:* this is the SRD explicitly modelling **an item as an agent with
its own opposed rolls against its owner**. It is a genuinely multiplayer,
DM-facing feature and a natural fit for the theatrical layer — but it sits
**outside a deterministic rules engine** and should be surfaced as DM narration
plus a contested-check helper, nothing more.

## 13. Artifacts (p252–253)

**Orb of Dragonkind** — Wondrous, **artifact** (attunement). Attuning and
speaking the command word requires a **DC 15 CHA check**: success grants control
for as long as you stay attuned; **failure charms you for as long as you stay
attuned**, and while charmed **you cannot voluntarily end attunement** and the
orb **casts *suggestion* on you at will (DC 18)**.
**Random Properties:** **2 minor beneficial, 1 minor detrimental, 1 major
detrimental** *(the tables themselves are absent from this SRD — a dangling
reference)*.
**Spells:** **7 charges, 1d4 + 3 daily at dawn**, DC 18: *cure wounds* at
5th level (3), *daylight* (1), *death ward* (2), *scrying* (3); ***detect magic*
free**.
**Call Dragons:** action to send a telepathic call **40 miles in all
directions**; **evil dragons feel compelled to come by the most direct route**
(deities excepted, and arrivals may well be hostile). **One-hour cooldown.**
**Destroying it:** impervious to almost everything **including dragon attacks and
breath**, but destroyed by ***disintegrate*** or **one good hit from a +3 magic
weapon**.

**The SRD contains exactly one artifact.** Artifacts are a rarity tier above
legendary, with **random beneficial and detrimental property tables that this
edition does not include**.

---

## 14. What the magic-item section demands of the engine

1. **Attunement is a real resource** — three slots, live prerequisites (class,
   race, alignment, spellcasting, and even *other attuned items*), proximity and
   ownership invalidation, and cursed items that cannot be released.
2. **Body slots and item sets** — one cloak, one item of headwear, paired boots
   and gloves, and a **set of four** horseshoes.
3. **More refresh triggers than short and long rest** — **dawn** dominates
   (usually `regains 1dN expended charges`), plus **dusk** (*robe of stars*),
   fixed **cooldowns in days** (figurines, *rod of security*),
   **cumulative-duration stopwatches** (*boots of speed*, *winged boots*,
   *candle of invocation*), and **finite lifetimes ending in destruction**
   (*chime of opening*, *gem of brightness*, *scarab of protection*).
4. **Burnout is a rule, not an edge case** — nearly every staff and wand rolls a
   **d20 on spending its last charge**, with a **1** destroying or degrading it
   and, for two staffs, a **20** restoring charges.
5. **Items cast spells with their own statistics** — a fixed save DC and attack
   bonus (spell scrolls, *circlet of blasting*), or the wielder's, or **the
   original caster's** (*ring of spell storing*, *Ioun stone of reserve*). A
   cast record therefore needs an explicit **statistics source**.
6. **Items override weapon and character properties** — *shillelagh*-style
   ability substitution, *mithral armor* deleting a Stealth penalty, *elven
   chain* waiving proficiency, *sun blade* changing a damage type, *vorpal
   sword* ignoring a resistance.
7. **Ability scores are `set`, `add` and `cap-raise` operations** — and the
   manuals and tomes prove that **the cap itself is mutable state**, while the
   *Ioun stone of mastery* proves **the proficiency bonus is derived**.
8. **Reaction-based interception is pervasive** — *ring of evasion*, *rod of
   absorption*, *scarab of protection*, *gloves of missile snaring*,
   *arrow-catching shield*, *staff of the magi*. The save and attack pipelines
   need documented interruption points.
9. **Identification can lie** — *potion of poison* and *dust of sneezing and
   choking* defeat *identify*; *armor of vulnerability* hides its curse until
   attunement. Items need a **true** and an **apparent** identity.
10. **Some items simply do not fit an effect vocabulary** — the *apparatus of
    the crab*'s ten-lever control surface, the *deck of many things*, the
    *wand of wonder*'s d100 table, sentient items acting as NPCs. These should
    be **explicitly out of scope**, represented as descriptive text plus a DM
    roll helper, rather than half-modelled.
