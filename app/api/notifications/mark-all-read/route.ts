import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// SC-5 — spec mandates POST /api/notifications/mark-all-read (was PATCH /api/notifications).
// social.notifications SET is_read = true WHERE user_id = user.id
export async function POST() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // TODO: UPDATE social.notifications SET is_read = true WHERE user_id = user.id
  return NextResponse.json({ ok: true })
}
