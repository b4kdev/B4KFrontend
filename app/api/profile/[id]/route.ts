import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // Stub — real impl queries accounts.users for the profile row + visibility settings, plus:
  //   trips_count  = COUNT(ai.plans WHERE author_id = params.id AND is_published = TRUE AND deleted_at IS NULL)
  //   saves_count  = COUNT(social.poi_saves WHERE user_id = params.id)
  //   badges_count = COUNT(social.user_badges WHERE user_id = params.id)
  // No backing store wired yet — every id is unknown, so honest response is 404, not a
  // fabricated-but-plausible profile.
  void params
  return NextResponse.json({ error: 'not found' }, { status: 404 })
}
