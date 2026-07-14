import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export interface PlanDraft {
  id: string
  title: string
  stop_count: number
  updated_at: string
}

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Stub — real impl: ai.plans WHERE author_id = user.id AND is_published = false LIMIT 1
  return NextResponse.json(null)
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Stub — real impl: check existing draft (T1 conflict) → INSERT ai.plans is_published=false
  await request.json()
  return NextResponse.json({ ok: true })
}
