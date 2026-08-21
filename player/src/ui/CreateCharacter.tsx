// Building your character.
//
// Shown when a player has been cast to a stage character — the DM already gave
// them a name, portrait and colour — but nobody has built a rules sheet for it
// yet. Five short steps: species, class, abilities, a look at the starting
// kit, a name. Level 1 only, so there is nothing to pick beyond this: feats and
// subclasses are level-4+ concerns that simply do not exist yet for a
// brand-new character.
//
// Every number shown is `createCharacter`'s own answer, recomputed on every
// change — this component never computes a modifier or a hit point itself.

import { useMemo, useState } from 'react'
import {
  createCharacter, playerViewOf, STANDARD_ARRAY, startingKitFor,
  type Ability, type ContentIndex, type SpeciesId
} from '@engine'

const ABILITY_LABEL: Record<Ability, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma'
}
const ABILITY_ORDER: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

type Step = 'species' | 'class' | 'abilities' | 'equipment' | 'name'
const STEPS: Step[] = ['species', 'class', 'abilities', 'equipment', 'name']

export function CreateCharacter({
  content, characterId, campaignId, suggestedName, onSubmit, onCancel
}: {
  content: ContentIndex
  characterId: string
  campaignId: string
  /** The name the DM already gave this stage character, offered as a default. */
  suggestedName: string
  onSubmit(
    character: ReturnType<typeof createCharacter>['character']
  ): Promise<string | undefined>
  onCancel?: () => void
}): React.JSX.Element {
  const [step, setStep] = useState<Step>('species')
  const [speciesId, setSpeciesId] = useState<SpeciesId | null>(null)
  const [subspeciesId, setSubspeciesId] = useState<string | undefined>(undefined)
  const [classId, setClassId] = useState<string | null>(null)
  // Index into STANDARD_ARRAY per ability, so "which value did I put where" is
  // unambiguous even when two abilities would otherwise want the same number.
  const [assignment, setAssignment] = useState<Record<Ability, number | null>>({
    str: null, dex: null, con: null, int: null, wis: null, cha: null
  })
  const [name, setName] = useState(suggestedName)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const species = useMemo(
    () => [...content.species.values()].sort((a, b) => a.name.localeCompare(b.name)),
    [content]
  )
  const classes = useMemo(
    () => [...content.classes.values()].sort((a, b) => a.name.localeCompare(b.name)),
    [content]
  )
  const selectedSpecies = speciesId ? content.species.get(speciesId) : undefined
  const needsSubspecies = (selectedSpecies?.subspecies?.length ?? 0) > 0

  const remainingValues = STANDARD_ARRAY.filter(
    (v) => !Object.values(assignment).includes(v)
  )
  const abilitiesComplete = ABILITY_ORDER.every((a) => assignment[a] !== null)

  // A live preview, built the same way the final character will be — so what
  // the player sees while assigning scores is never a lie about what they get.
  const preview = useMemo(() => {
    if (!speciesId || !classId || !abilitiesComplete) return null
    const scores = Object.fromEntries(
      ABILITY_ORDER.map((a) => [a, assignment[a] as number])
    ) as Record<Ability, number>
    const result = createCharacter({
      id: characterId, campaignId, name: name || suggestedName,
      speciesId, ...(subspeciesId ? { subspeciesId } : {}), classId,
      abilityScores: scores
    }, content)
    return result.character
      ? { character: result.character, view: playerViewOf(result.character, content) }
      : null
  }, [speciesId, subspeciesId, classId, assignment, abilitiesComplete, name])

  const kit = classId ? startingKitFor(classId) : undefined
  const kitLabels = (kit?.items ?? []).map((i) => {
    const def = content.items.get(i.definitionId)
    return def ? `${def.name}${i.quantity ? ` ×${i.quantity}` : ''}` : i.definitionId
  })

  const stepIndex = STEPS.indexOf(step)
  const canAdvance =
    (step === 'species' && speciesId !== null && (!needsSubspecies || subspeciesId !== undefined))
    || (step === 'class' && classId !== null)
    || (step === 'abilities' && abilitiesComplete)
    || (step === 'equipment')
    || (step === 'name' && name.trim().length > 0)

  const advance = (): void => {
    if (!canAdvance) return
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next)
  }
  const back = (): void => {
    const prev = STEPS[stepIndex - 1]
    if (prev) setStep(prev)
    else onCancel?.()
  }

  const submit = async (): Promise<void> => {
    if (!preview) return
    setSubmitting(true)
    setError(null)
    const rejected = await onSubmit(preview.character)
    setSubmitting(false)
    if (rejected) setError(rejected)
  }

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-ink/85 backdrop-blur-sm">
      <div className="flex h-[85%] w-[90%] max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink/95 shadow-2xl">

        <header className="border-b border-white/10 px-6 py-4">
          <h2 className="text-lg text-parchment">Build {suggestedName}</h2>
          <p className="mt-0.5 text-xs text-parchment/50">
            A level 1 character. Species, class, abilities, equipment, name.
          </p>
          <div className="mt-3 flex gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  i <= stepIndex ? 'bg-arcane' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'species' && (
            <div className="space-y-6">
              <Section title="Species">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {species.map((s) => (
                    <PickCard
                      key={s.id}
                      label={s.effects.name}
                      selected={speciesId === s.id}
                      onClick={() => { setSpeciesId(s.id); setSubspeciesId(undefined) }}
                    />
                  ))}
                </div>
              </Section>
              {needsSubspecies && (
                <Section title="Subspecies">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {selectedSpecies!.subspecies!.map((sub) => (
                      <PickCard
                        key={sub.id}
                        label={sub.name}
                        selected={subspeciesId === sub.id}
                        onClick={() => setSubspeciesId(sub.id)}
                      />
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}

          {step === 'class' && (
            <Section title="Class">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {classes.map((c) => (
                  <PickCard
                    key={c.id}
                    label={c.name}
                    sublabel={`d${c.hitDie} hit die`}
                    selected={classId === c.id}
                    onClick={() => setClassId(c.id)}
                  />
                ))}
              </div>
            </Section>
          )}

          {step === 'abilities' && (
            <Section title="Ability scores">
              <p className="mb-3 text-[12px] text-parchment/50">
                The standard array — {STANDARD_ARRAY.join(', ')} — assigned once each.
                {remainingValues.length > 0 && (
                  <span className="ml-1 text-parchment/70">
                    Remaining: {remainingValues.join(', ')}
                  </span>
                )}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ABILITY_ORDER.map((a) => (
                  <div key={a} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-widest text-parchment/40">
                      {ABILITY_LABEL[a]}
                    </p>
                    <select
                      value={assignment[a] ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : Number(e.target.value)
                        setAssignment((prev) => ({ ...prev, [a]: value }))
                      }}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-parchment"
                    >
                      <option value="">—</option>
                      {[assignment[a], ...remainingValues]
                        .filter((v): v is number => v !== null)
                        .sort((x, y) => y - x)
                        .map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {preview && (
                <div className="mt-5 flex flex-wrap gap-6 border-t border-white/10 pt-4">
                  <Stat label="Hit Points" value={String(preview.view.vitals.hitPoints.max.value)} />
                  <Stat label="Armour Class" value={String(preview.view.vitals.armorClass.value)} />
                  <Stat label="Speed" value={preview.view.vitals.speed.display} />
                </div>
              )}
            </Section>
          )}

          {step === 'equipment' && (
            <Section title="Starting equipment">
              <p className="mb-3 text-[12px] text-parchment/50">
                A curated kit for the class you chose — you can trade for other gear
                once you are playing.
              </p>
              <ul className="space-y-1.5">
                {kitLabels.map((label, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-parchment/80"
                  >
                    {label}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {step === 'name' && (
            <Section title="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={suggestedName}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-parchment"
              />
              {preview && (
                <div className="mt-5 rounded-xl border border-arcane/30 bg-arcane/5 p-4">
                  <p className="text-sm text-parchment">
                    {name || suggestedName} — Level 1 {selectedSpecies?.subspecies?.find((s) => s.id === subspeciesId)?.name ?? selectedSpecies?.effects.name} {content.classes.get(classId!)?.name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-6">
                    <Stat label="Hit Points" value={String(preview.view.vitals.hitPoints.max.value)} />
                    <Stat label="Armour Class" value={String(preview.view.vitals.armorClass.value)} />
                  </div>
                </div>
              )}
              {error && (
                <p className="mt-3 rounded-lg border border-ember/40 bg-ember/10 px-3 py-2 text-sm text-ember">
                  {error}
                </p>
              )}
            </Section>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={back}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-parchment/70 transition hover:border-white/30 hover:text-parchment"
          >
            {stepIndex === 0 ? 'Cancel' : 'Back'}
          </button>
          {step === 'name' ? (
            <button
              type="button"
              disabled={!preview || submitting}
              onClick={() => { void submit() }}
              className="rounded-lg border border-arcane/50 bg-arcane/15 px-5 py-2 text-sm text-parchment transition hover:bg-arcane/25 disabled:opacity-40"
            >
              {submitting ? 'Creating…' : 'Begin'}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canAdvance}
              onClick={advance}
              className="rounded-lg border border-arcane/50 bg-arcane/10 px-5 py-2 text-sm text-parchment transition hover:bg-arcane/20 disabled:opacity-40"
            >
              Next
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <section>
      <h3 className="mb-3 text-[11px] uppercase tracking-widest text-parchment/40">{title}</h3>
      {children}
    </section>
  )
}

function PickCard({
  label, sublabel, selected, onClick
}: { label: string; sublabel?: string; selected: boolean; onClick(): void }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-left transition ${
        selected
          ? 'border-arcane/60 bg-arcane/10 text-parchment'
          : 'border-white/10 bg-white/[0.03] text-parchment/70 hover:border-white/25 hover:text-parchment'
      }`}
    >
      <p className="text-sm">{label}</p>
      {sublabel && <p className="text-[11px] text-parchment/40">{sublabel}</p>}
    </button>
  )
}

function Stat({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-parchment/40">{label}</p>
      <p className="text-xl tabular-nums text-parchment">{value}</p>
    </div>
  )
}
