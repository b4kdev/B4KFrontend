import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // Stub — real impl queries accounts.users for the profile row + visibility settings, plus:
  //   trips_count  = COUNT(ai.plans WHERE author_id = params.id AND is_published = TRUE AND deleted_at IS NULL)
  //   saves_count  = COUNT(social.poi_saves WHERE user_id = params.id)
  //   badges_count = COUNT(social.user_badges WHERE user_id = params.id)
  return NextResponse.json({
    id: params.id,
    display_name: 'Hana Kim',
    avatar_url: null,
    trips_count: 2,
    saves_count: 11,
    badges_count: 4,
    trips_public: true,
    saved_public: false,
    badges_public: true,
  })
}
