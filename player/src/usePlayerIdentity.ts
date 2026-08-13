import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { DEFAULT_THEME } from '@shared/dice'
import type { AppSnapshot } from '@shared/types'
import { supabase } from './supabase'

/**
 * Who this player is at the table.
 *
 * Their Discord id came from the login, and the DM has already cast that id to
 * a character — so their character, and the colour their dice and roll banner
 * use, are resolved with no linking step.
 */
export interface PlayerIdentity {
  profileId: string | null
  discordUserId: string | null
  characterId: string | null
  name: string
  color: string
  diceTheme: string
  setDiceTheme: (id: string) => void
  /** Size of this player's own figure on the shared stage. */
  characterScale: number
  setCharacterScale: (value: number) => void
}

export function usePlayerIdentity(
  session: Session | null,
  snapshot: AppSnapshot
): PlayerIdentity {
  const [diceTheme, setTheme] = useState(DEFAULT_THEME)
  const [loadedTheme, setLoadedTheme] = useState(false)
  // Held locally so the slider stays responsive while the write lands and the
  // campaign refetch comes back around.
  const [pendingScale, setPendingScale] = useState<number | null>(null)

  const discordUserId =
    (session?.user.user_metadata?.['provider_id'] as string | undefined) ?? null
  const profileId = session?.user.id ?? null

  // The dice set follows the player between campaigns, so it lives on their
  // profile rather than in local storage.
  useEffect(() => {
    if (!profileId || loadedTheme) return
    void supabase()
      .from('profiles')
      .select('dice_theme')
      .eq('id', profileId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.dice_theme) setTheme(data.dice_theme)
        setLoadedTheme(true)
      })
  }, [profileId, loadedTheme])

  const setDiceTheme = (id: string): void => {
    setTheme(id)
    if (profileId) {
      void supabase().from('profiles').update({ dice_theme: id }).eq('id', profileId)
    }
  }

  const characterId = discordUserId
    ? (snapshot.campaign.casting[discordUserId] ?? null)
    : null
  const character = snapshot.campaign.characters.find((c) => c.id === characterId)

  // Players may adjust their own figure's size; RLS already allows a player to
  // update the character they own, and nothing else.
  const setCharacterScale = (value: number): void => {
    if (!characterId) return
    setPendingScale(value)
    void supabase().from('characters').update({ scale: value }).eq('id', characterId)
  }

  return {
    profileId,
    discordUserId,
    characterId,
    characterScale: pendingScale ?? character?.scale ?? 1,
    setCharacterScale,
    name:
      character?.name ??
      (session?.user.user_metadata?.['full_name'] as string | undefined) ??
      'Adventurer',
    color: character?.color ?? '#8b7ee8',
    diceTheme,
    setDiceTheme
  }
}
