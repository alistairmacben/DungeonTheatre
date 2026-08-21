// Builds a storable sheet for an existing character row.
//
// Seeding is a real use of the codec, not a fixture: it runs `encodeSheet` and
// then `decodeSheet` on its own output, so a sheet that would not survive
// storage fails here rather than at the table.
//
//   node scripts/make-sheet.mjs <characterId> <campaignId> <name> [template]
//
// Templates are the party archetypes in player/src/game/character.ts. The
// engine `Character.id` is set to the database row id, so the two agree — the
// reducer stamps that id into every event it emits.

import { decodeSheet, encodeSheet, loadContent, playerViewOf } from '../test/bundle/engine.mjs'

const [characterId, campaignId, name, template = 'fighter'] = process.argv.slice(2)
if (!characterId || !campaignId || !name) {
  console.error('usage: make-sheet.mjs <characterId> <campaignId> <name> [fighter|wizard|rogue|cleric]')
  process.exit(1)
}

const item = (instanceId, definitionId, extra = {}) =>
  ({ instanceId, definitionId, contentVersion: 1, identified: true, ...extra })

const TEMPLATES = {
  fighter: {
    speciesId: 'srd:species.dwarf', subspeciesId: 'srd:species.dwarf.hill',
    classLevels: [{ classId: 'srd:class.fighter', level: 5 }],
    abilityScoreBase: { str: 16, dex: 12, con: 13, int: 10, wis: 12, cha: 8 },
    buildChoices: [{ atLevel: 4, kind: 'feat', value: 'srd:feat.tough' }],
    hitPointsCurrent: 59,
    toggles: { 'wearing-armor': true },
    inventory: {
      instances: [
        item('i-mail', 'srd:armor.chain-mail'),
        item('i-shield', 'srd:armor.shield'),
        item('i-sword', 'srd:weapon.longsword'),
        item('i-cloak', 'srd:item.cloak-of-protection'),
        item('i-potion', 'srd:item.potion-of-healing', { quantity: 2 })
      ],
      equipped: { armor: 'i-mail', shield: 'i-shield', mainHand: 'i-sword', cloak: 'i-cloak' },
      attunedInstanceIds: ['i-cloak']
    }
  },
  wizard: {
    speciesId: 'srd:species.elf', subspeciesId: 'srd:species.elf.high',
    classLevels: [{ classId: 'srd:class.wizard', level: 5 }],
    abilityScoreBase: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
    buildChoices: [], hitPointsCurrent: 28, toggles: {},
    inventory: {
      instances: [
        item('w-dagger', 'srd:weapon.dagger'),
        item('w-wand', 'srd:item.wand-of-the-war-mage')
      ],
      equipped: { mainHand: 'w-dagger', offHand: 'w-wand' },
      attunedInstanceIds: ['w-wand']
    },
    spellsPrepared: [
      'srd:spell.magic-missile', 'srd:spell.mage-armor', 'srd:spell.shield',
      'srd:spell.detect-magic'
    ]
  },
  rogue: {
    speciesId: 'srd:species.halfling', subspeciesId: 'srd:species.halfling.lightfoot',
    classLevels: [{ classId: 'srd:class.rogue', level: 5 }],
    abilityScoreBase: { str: 10, dex: 16, con: 14, int: 13, wis: 12, cha: 14 },
    buildChoices: [], hitPointsCurrent: 38, toggles: {},
    inventory: {
      instances: [
        item('r-short', 'srd:weapon.shortsword'),
        item('r-leather', 'srd:armor.leather')
      ],
      equipped: { mainHand: 'r-short', armor: 'r-leather' },
      attunedInstanceIds: []
    }
  },
  cleric: {
    speciesId: 'srd:species.human',
    classLevels: [{ classId: 'srd:class.cleric', level: 5 }],
    abilityScoreBase: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 12 },
    buildChoices: [], hitPointsCurrent: 38, toggles: { 'wearing-armor': true },
    inventory: {
      instances: [
        item('c-mace', 'srd:weapon.mace'),
        item('c-mail', 'srd:armor.chain-mail'),
        item('c-shield', 'srd:armor.shield')
      ],
      equipped: { mainHand: 'c-mace', armor: 'c-mail', shield: 'c-shield' },
      attunedInstanceIds: []
    },
    spellsPrepared: ['srd:spell.detect-magic']
  }
}

const base = TEMPLATES[template]
if (!base) {
  console.error(`unknown template "${template}"; try ${Object.keys(TEMPLATES).join(', ')}`)
  process.exit(1)
}

const character = {
  id: characterId,
  campaignId,
  name,
  hitPointsTemp: 0,
  hitDiceSpent: {},
  resourcesSpent: {},
  conditions: [],
  effectInstances: [],
  exhaustionLevel: 0,
  deathSaves: { successes: 0, failures: 0 },
  ...base
}

const content = loadContent()
const doc = encodeSheet(character)

// Prove it round-trips before anybody stores it.
const back = decodeSheet(JSON.parse(JSON.stringify(doc)), content)
if (!back.character) {
  console.error('sheet would not decode:', back.problems.map((p) => p.message).join('; '))
  process.exit(1)
}
for (const p of back.problems) console.error(`  ${p.severity}: ${p.message}`)

const view = playerViewOf(back.character, content)
console.error(
  `${name}: ${view.progression.level} ${view.progression.classes.map((c) => c.label).join('/')}`
  + ` — ${view.vitals.hitPoints.current}/${view.vitals.hitPoints.max.value} hp,`
  + ` AC ${view.vitals.armorClass.value}, ${view.actions.filter((a) => a.available).length} actions`
)

// Only the JSON goes to stdout, so this can be piped.
process.stdout.write(JSON.stringify(doc))
