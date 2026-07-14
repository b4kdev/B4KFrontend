import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// GET /api/notifications/unread-count  → { count: number }

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // TODO: SELECT COUNT(*) FROM social.notifications WHERE user_id = user.id AND is_read = false
  return NextResponse.json({ count: 2 })
}
