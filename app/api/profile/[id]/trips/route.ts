import { NextResponse } from 'next/server'

export interface OtherUserTrip {
  id: string
  title: string
  day_count: number
  stop_count: number
  save_count: number
  is_saved: boolean
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // Stub — real impl queries ai.plans WHERE author_id = params.id AND is_published = TRUE
  //   AND is_partner = FALSE AND deleted_at IS NULL ORDER BY updated_at DESC.
  // is_saved = EXISTS(social.plan_saves WHERE user_id = viewer AND plan_id = plan.id)
  // No backing store wired yet — matches the [id]/route.ts 404 pattern for an unknown id.
  void params
  return NextResponse.json({ error: 'not found' }, { status: 404 })
}
