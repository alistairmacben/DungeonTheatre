// Am I the DM of this campaign?
//
// `campaign_members.role` is the authoritative answer and the same one the edge
// function reads, so asking the same table here keeps the client's idea of what
// it may do aligned with what the server will actually permit.

import { useEffect, useState } from 'react'
import type { Role } from '@engine'
import { supabase } from './supabase'

export function useCampaignRole(
  campaignId: string | null, profileId: string | null
): { role: Role; isDm: boolean; loading: boolean } {
  // Defaults to 'owner' rather than 'dm': assuming the lesser privilege means a
  // momentary wrong guess hides a control rather than offering one that the
  // server is about to refuse.
  const [role, setRole] = useState<Role>('owner')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!campaignId || !profileId) { setLoading(false); return }
    let cancelled = false

    void supabase()
      .from('campaign_members')
      .select('role')
      .eq('campaign_id', campaignId)
      .eq('profile_id', profileId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setRole(data?.role === 'dm' ? 'dm' : 'owner')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [campaignId, profileId])

  return { role, isDm: role === 'dm', loading }
}
