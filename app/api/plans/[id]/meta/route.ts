import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { MOCK } from '@/lib/mock/plan-detail'

export interface PlanMeta {
  isOwner: boolean
}

// SC-35 (S-DEGJDE) — ownership is a per-session authorization check, kept out
// of the main GET /api/plans/[id] payload on purpose: that response is the
// same for every viewer (share links, previews) and must never carry a
// client-trusted owner flag. This route re-derives it from the real session
// on every call.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const plan = MOCK[params.id]
  if (!plan) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isOwner = !!user && user.id === plan.author.id
  return NextResponse.json({ isOwner } satisfies PlanMeta)
}
