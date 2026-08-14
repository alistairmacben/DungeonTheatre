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
