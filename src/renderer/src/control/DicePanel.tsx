import { useState } from 'react'
import { DiceTray } from '@stage-ui/DiceTray'
import { DEFAULT_THEME, type DiceRoll } from '@shared/dice'
import type { AppSnapshot } from '@shared/types'
import { send } from '../shared/useSnapshot'

/**
 * The DM's dice. Same tray the players get, plus the visibility switch —
 * open rolls land on the shared stage, secret rolls tell the table something
 * was rolled without saying what, hidden rolls never leave this screen.
 */
export function DicePanel({ snapshot }: { snapshot: AppSnapshot }): React.JSX.Element {
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const { campaign, cloud } = snapshot

  // A GM-voiced NPC gets credit for the roll, so the banner matches whoever is
  // speaking on stage.
  const voiced = campaign.characters.find((c) => c.id === campaign.gmVoiceCharacterId)

  return (
    <section className="max-w-md space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40">Dice</h2>
        {voiced && <span className="text-xs text-arcane">rolling as {voiced.name}</span>}
      </div>

      <div className="rounded-lg border border-ink-line bg-ink-soft p-4">
        <DiceTray
          allowSecret
          theme={theme}
          onThemeChange={setTheme}
          onRoll={(request) => {
            const roll: DiceRoll = {
              id: crypto.randomUUID(),
              campaignId: cloud.campaignId ?? '',
              rollerId: cloud.user?.id ?? null,
              characterId: voiced?.id ?? null,
              rollerName: voiced?.name ?? 'The DM',
              color: voiced?.color ?? '#e0a458',
              notation: request.notation,
              dice: request.dice,
              modifier: request.modifier,
              total: request.total,
              visibility: request.visibility,
              theme,
              at: Date.now()
            }
            send({ type: 'dice:roll', roll })
          }}
        />
      </div>

      {!cloud.live && (
        <p className="text-xs leading-relaxed text-white/40">
          Not connected to your players yet — rolls will still appear on your own stage, but
          nobody else will see them. Sign in and push the campaign from the Player view panel.
        </p>
      )}
    </section>
  )
}
