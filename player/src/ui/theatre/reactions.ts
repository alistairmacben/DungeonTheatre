// Turning what happened into something to watch.
//
// The reducer has emitted domain events since the first slice and nothing has
// ever consumed them. This is the consumer: it maps an event to a "beat" — a
// short-lived thing the stage shows — and that mapping is the whole of Phase
// L's judgement. Everything downstream is animation.
//
// The split the engine insists on is preserved here and matters: `Bloodied` is
// a domain event, `screen shake` is not. The engine says what happened; this
// file decides what that looks like. Nothing in `src/rules` knows this exists,
// and a beat can be re-styled, muted or dropped without touching a rule.
//
// Deliberately pure and free of React so it can be reasoned about (and tested)
// on its own, and so the same mapping serves a locally-dispatched event in the
// solo harness and one streamed from another player's client.

/** The minimum an event must carry. Satisfied by DomainEvent and StreamedEvent. */
export interface BeatSource {
  type: string
  payload: Record<string, unknown>
}

export type BeatTone = 'harm' | 'heal' | 'arcane' | 'grim' | 'neutral'

export interface Beat {
  /** Unique per occurrence, so React can key repeats of the same event. */
  id: string
  kind: 'number' | 'flourish' | 'chip' | 'proclaim'
  tone: BeatTone
  /** The big text: "12", "Fire Bolt", "DOWNED". */
  headline: string
  /** Smaller supporting text, when there is something worth adding. */
  detail?: string
  /** Content id an icon can be looked up from, resolved by the renderer. */
  spellId?: string
  damageType?: string
}

const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined
const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.length > 0 ? v : undefined

/** "srd:condition.frightened" -> "Frightened". */
function readable(id: string): string {
  const last = id.split('.').at(-1) ?? id
  return last.split('-').map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1)).join(' ')
}

let counter = 0

/**
 * One event in, at most one beat out.
 *
 * Returning undefined is the common case and the important one: most of the
 * 27 event types are bookkeeping — a toggle flipped, a selection answered —
 * and a stage that reacted to all of them would be a log with animation. Only
 * events a person at the table would *notice* earn a beat.
 */
export function beatFrom(event: BeatSource): Beat | undefined {
  const id = `beat-${++counter}`
  const p = event.payload

  switch (event.type) {
    case 'DamageTaken': {
      const amount = num(p['amount'])
      if (amount === undefined || amount <= 0) return undefined
      return {
        id, kind: 'number', tone: 'harm',
        headline: `−${amount}`,
        ...(str(p['damageType']) ? { detail: str(p['damageType'])!, damageType: str(p['damageType'])! } : {})
      }
    }
    case 'Healed': {
      const amount = num(p['amount'])
      // A heal that restored nothing (already at full) is a non-event.
      if (amount === undefined || amount <= 0) return undefined
      return { id, kind: 'number', tone: 'heal', headline: `+${amount}`, detail: 'healed' }
    }
    case 'TemporaryHitPointsGained': {
      const amount = num(p['amount'])
      if (amount === undefined || amount <= 0) return undefined
      return { id, kind: 'number', tone: 'arcane', headline: `+${amount}`, detail: 'temporary' }
    }
    case 'SpellCast': {
      const label = str(p['label'])
      if (!label) return undefined
      const level = num(p['level'])
      return {
        id, kind: 'flourish', tone: 'arcane', headline: label,
        detail: level === 0 ? 'cantrip' : level ? `level ${level}` : undefined,
        ...(str(p['spellId']) ? { spellId: str(p['spellId'])! } : {})
      } as Beat
    }
    case 'Bloodied':
      return { id, kind: 'proclaim', tone: 'harm', headline: 'Bloodied' }
    case 'Downed':
      return { id, kind: 'proclaim', tone: 'grim', headline: 'Downed' }
    case 'ConcentrationBroken':
      return { id, kind: 'chip', tone: 'harm', headline: 'Concentration broken' }
    case 'ConditionApplied': {
      const conditionId = str(p['conditionId'])
      return conditionId
        ? { id, kind: 'chip', tone: 'harm', headline: readable(conditionId) }
        : undefined
    }
    case 'ConditionRemoved': {
      const conditionId = str(p['conditionId'])
      return conditionId
        ? { id, kind: 'chip', tone: 'neutral', headline: `${readable(conditionId)} ended` }
        : undefined
    }
    case 'LeveledUp': {
      const level = num(p['level'])
      return {
        id, kind: 'proclaim', tone: 'arcane', headline: 'Level Up',
        ...(level ? { detail: `level ${level}` } : {})
      }
    }
    // Everything else — ToggleChanged, SelectionAnswered, ResourceSpent, the
    // rest — is bookkeeping the sheet already shows. Silence is the feature.
    default:
      return undefined
  }
}

export function beatsFrom(events: BeatSource[]): Beat[] {
  const out: Beat[] = []
  for (const e of events) {
    const beat = beatFrom(e)
    if (beat) out.push(beat)
  }
  return out
}
