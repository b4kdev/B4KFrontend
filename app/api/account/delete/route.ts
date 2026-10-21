import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// DELETE /api/account/delete
// Soft-deletes the authenticated user's account via the BFF Edge Function.
// The BFF performs the actual DB write (SET deleted_at = NOW()) with service role.
export async function DELETE() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Same 10-minute window as /api/account/recent-login: an older sign-in has to re-authenticate first.
  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0
  if (Date.now() - lastSignIn >= 10 * 60 * 1000) return NextResponse.json({ error: 'reauth_required' }, { status: 403 })
  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bff = process.env.API_URL
  if (!bff) return NextResponse.json({ error: 'BFF not configured' }, { status: 503 })

  const res = await fetch(`${bff}/me`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return NextResponse.json({ error: body.error ?? 'Delete failed' }, { status: res.status })
  }

  return NextResponse.json({ ok: true })
}
