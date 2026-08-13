import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { isWhisper, type DiceRoll } from '@shared/dice'
import type { RollRequest } from '@stage-ui/DiceTray'
import { supabase } from './supabase'

/**
 * Sending and receiving dice on the campaign channel.
 *
 * The roller decides the values and everyone else animates to them, so a roll
 * goes out over Broadcast immediately and is written to the durable log
 * afterwards — the table should never wait on a database insert to see dice
 * hit the scene.
 */
export function useDice({
  campaignId,
  rollerId,
  rollerName,
  color,
  characterId
}: {
  campaignId: string | null
  rollerId: string | null
  rollerName: string
  color: string
  characterId: string | null
}): { roll: DiceRoll | null; send: (request: RollRequest, theme: string) => void } {
  const [roll, setRoll] = useState<DiceRoll | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!campaignId) return

    const channel = supabase().channel(`campaign:${campaignId}`, {
      config: { broadcast: { self: false } }
    })

    channel.on('broadcast', { event: 'dice' }, ({ payload }) => {
      if (payload) setRoll(payload as DiceRoll)
    })
    channel.subscribe()
    channelRef.current = channel

    return () => {
      channelRef.current = null
      void supabase().removeChannel(channel)
    }
  }, [campaignId])

  const send = useCallback(
    (request: RollRequest, theme: string) => {
      if (!campaignId) return

      const built: DiceRoll = {
        id: crypto.randomUUID(),
        campaignId,
        rollerId,
        characterId,
        rollerName,
        color,
        notation: request.notation,
        dice: request.dice,
        modifier: request.modifier,
        total: request.total,
        visibility: request.visibility,
        theme,
        at: Date.now()
      }

      // Play it locally straight away rather than waiting for the round trip.
      setRoll(built)

      // Whispers never leave the roller's screen.
      if (!isWhisper(built.visibility)) {
        void channelRef.current?.send({ type: 'broadcast', event: 'dice', payload: built })
      }

      // Whispers are never written down, which is the whole point of them.
      if (rollerId && !isWhisper(built.visibility)) {
        void supabase()
          .from('dice_rolls')
          .insert({
            id: built.id,
            campaign_id: campaignId,
            roller_id: rollerId,
            character_id: characterId,
            notation: built.notation,
            dice: built.dice,
            modifier: built.modifier,
            total: built.total,
            visibility: built.visibility
          })
          .then(({ error }) => {
            // The log is a convenience; losing a row must not break the roll
            // everyone just watched land.
            if (error) console.warn('Could not record the roll:', error.message)
          })
      }
    },
    [campaignId, rollerId, rollerName, color, characterId]
  )

  return { roll, send }
}
