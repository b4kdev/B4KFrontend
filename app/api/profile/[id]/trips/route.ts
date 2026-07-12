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
  void params
  const items: OtherUserTrip[] = [
    { id: 'plan-201', title: 'Seoul K-Drama Weekend', day_count: 2, stop_count: 8, save_count: 42, is_saved: false },
    { id: 'plan-202', title: 'Hongdae Indie & Beauty Crawl', day_count: 1, stop_count: 5, save_count: 17, is_saved: true },
  ]
  return NextResponse.json({ items })
}
