import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// DELETE /api/profile/delete
// Soft-deletes the authenticated user's account via the BFF Edge Function.
// The BFF performs the actual DB write (SET deleted_at = NOW()) with service role.
export async function DELETE() {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bff = process.env.NEXT_PUBLIC_API_URL
  if (!bff) return NextResponse.json({ error: 'BFF not configured' }, { status: 503 })

  const res = await fetch(`${bff}/me`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return NextResponse.json({ error: body.error ?? 'Delete failed' }, { status: res.status })
  }

  return NextResponse.json({ ok: true })
}
