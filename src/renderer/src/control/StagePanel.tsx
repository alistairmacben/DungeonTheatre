import type { StageSettings } from '@shared/campaign'
import type { AppSnapshot } from '@shared/types'
import { send } from '../shared/useSnapshot'

export function StagePanel({ snapshot }: { snapshot: AppSnapshot }): React.JSX.Element {
  const s = snapshot.campaign.stage
  const set = (patch: Partial<StageSettings>): void => send({ type: 'stage:settings', patch })

  return (
    <section className="max-w-2xl space-y-6">
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
          Stage style
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <ModeCard
            active={s.mode === 'novel'}
            onClick={() => set({ mode: 'novel' })}
            title="Visual novel"
            blurb="Characters stand on the scene, side by side. Use cut-out PNGs with transparent backgrounds."
          />
          <ModeCard
            active={s.mode === 'cards'}
            onClick={() => set({ mode: 'cards' })}
            title="Portrait cards"
            blurb="Framed portraits in a grid. Better for square headshots and busts."
          />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40">Display</h2>

        <Toggle label="Show names" value={s.showNames} onChange={(v) => set({ showNames: v })} />
        <Toggle
          label="Show titles"
          hint="The subtitle under the name, e.g. “Half-elf Rogue”."
          value={s.showTitles}
          onChange={(v) => set({ showTitles: v })}
        />
        <Toggle
          label="Dim characters who aren't talking"
          hint="Off means everyone stays lit and only the glow marks the speaker."
          value={s.dimIdle}
          onChange={(v) => set({ dimIdle: v })}
        />
        <Toggle
          label="Hide my card while voicing an NPC"
          hint="On, your own character steps aside for the NPC. Off, you both stay on stage."
          value={s.hideGmCardWhileVoicing}
          onChange={(v) => set({ hideGmCardWhileVoicing: v })}
        />

        <Slider
          label="Background dim"
          hint="0 leaves your scene art untouched. Raise it if portraits get lost in busy artwork."
          value={s.backgroundDim}
          min={0}
          max={0.85}
          onChange={(v) => set({ backgroundDim: v })}
          format={(v) => `${Math.round(v * 100)}%`}
        />

        {s.mode === 'novel' && (
          <Slider
            label="Character height"
            hint="How tall the cast stands, relative to the stage."
            value={s.characterScale}
            min={0.4}
            max={0.95}
            onChange={(v) => set({ characterScale: v })}
            format={(v) => `${Math.round(v * 100)}%`}
          />
        )}
      </div>

      <p className="rounded-md border border-ink-line bg-ink-soft p-3 text-xs leading-relaxed text-white/45">
        <strong className="text-white/70">Art tip:</strong> in visual-novel mode, full-body
        character art on a transparent background looks best — the figure stands on the scene with
        no frame around it. Portraits with a solid background still work, they just read as a
        standing panel.
      </p>
    </section>
  )
}

function ModeCard({
  active,
  onClick,
  title,
  blurb
}: {
  active: boolean
  onClick: () => void
  title: string
  blurb: string
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition ${
        active ? 'border-ember/60 bg-ember/10' : 'border-ink-line hover:border-white/25'
      }`}
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-0.5 text-xs leading-snug text-white/45">{blurb}</div>
    </button>
  )
}

function Toggle({
  label,
  hint,
  value,
  onChange
}: {
  label: string
  hint?: string
  value: boolean
  onChange: (v: boolean) => void
}): React.JSX.Element {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${
          value ? 'bg-ember' : 'bg-white/15'
        }`}
      >
        <span
          className={`block size-4 rounded-full bg-ink transition-transform ${
            value ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
      <span className="min-w-0">
        <span className="block text-sm">{label}</span>
        {hint && <span className="block text-xs leading-snug text-white/40">{hint}</span>}
      </span>
    </label>
  )
}

function Slider({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  format
}: {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  format: (v: number) => string
}): React.JSX.Element {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm">{label}</span>
        <span className="text-xs tabular-nums text-white/45">{format(value)}</span>
      </div>
      {hint && <p className="text-xs leading-snug text-white/40">{hint}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-[var(--color-ember)]"
      />
    </div>
  )
}
