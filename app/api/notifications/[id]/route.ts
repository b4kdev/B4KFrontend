import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// PATCH /api/notifications/:id  → social.notifications SET is_read = true

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // TODO: UPDATE social.notifications SET is_read = true WHERE id = params.id AND user_id = user.id
  void req
  void params.id
  return NextResponse.json({ ok: true })
}
