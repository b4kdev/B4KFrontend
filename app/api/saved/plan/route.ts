import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// POST /api/saved/plan   body: { plan_id: string }  → social.plan_saves INSERT
// DELETE /api/saved/plan body: { plan_id: string }  → social.plan_saves DELETE

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // TODO: INSERT INTO social.plan_saves (user_id, plan_id) VALUES (user.id, body.plan_id)
  void req
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // TODO: DELETE FROM social.plan_saves WHERE user_id = user.id AND plan_id = body.plan_id
  void req
  return NextResponse.json({ ok: true })
}
