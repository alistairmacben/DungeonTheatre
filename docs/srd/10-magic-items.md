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
