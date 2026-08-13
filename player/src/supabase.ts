import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env['VITE_SUPABASE_URL'] as string
const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string

let client: SupabaseClient | null = null

export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // The browser does have a URL to read the OAuth callback out of.
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: { params: { eventsPerSecond: 40 } }
    })
  }
  return client
}

/** Campaign art lives in a public bucket so the CDN can cache it. */
export function storageUrl(path: string | null): string | null {
  if (!path) return null
  return `${url}/storage/v1/object/public/campaign-art/${path}`
}
