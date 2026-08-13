import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface Membership {
  campaignId: string
  campaignName: string
  role: 'dm' | 'player'
}

export function useSession(): { session: Session | null; ready: boolean } {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void supabase()
      .auth.getSession()
      .then(({ data }) => {
        setSession(data.session)
        setReady(true)
      })
    const { data } = supabase().auth.onAuthStateChange((_e, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  return { session, ready }
}

/** Campaigns this account already belongs to. */
export function useMemberships(session: Session | null): {
  memberships: Membership[]
  loading: boolean
  refresh: () => void
} {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (!session) {
      setMemberships([])
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)

    void supabase()
      .from('campaign_members')
      .select('role, campaign_id, campaigns(id, name)')
      .then(({ data }) => {
        if (!alive) return
        setMemberships(
          (data ?? [])
            .filter((row: any) => row.campaigns)
            .map((row: any) => ({
              campaignId: row.campaign_id,
              campaignName: row.campaigns.name,
              role: row.role
            }))
        )
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [session, key])

  return { memberships, loading, refresh: () => setKey((k) => k + 1) }
}
