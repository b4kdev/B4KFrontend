// No 'server-only' — this runs in browser
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// True singleton — every call site (AuthContext, auth callback, AuthGateModal,
// Sidebar, MobileDrawer, settings page, lib/api.ts) must share ONE GoTrueClient
// instance. Each instance tracks auth state independently in memory; a second
// instance calling exchangeCodeForSession()/signOut()/etc never fires
// onAuthStateChange on the first instance's listeners (same-tab localStorage
// writes don't emit `storage` events, which is the only cross-instance sync
// path). Without this singleton, logging in via the OAuth callback page (its
// own client instance) never updated AuthContext's client — the app kept
// showing "signed out" and re-prompting for login right after a successful sign-in.
let client: SupabaseClient | undefined

export function createSupabaseBrowserClient(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
