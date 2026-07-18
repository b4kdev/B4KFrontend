import { NextResponse } from 'next/server'

export interface OtherUserBadge {
  badge_id: string
  slug: string
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  earned: boolean
}

// Full 12-slot badge definition list — real impl:
//   SELECT d.*, (ub.user_id IS NOT NULL) AS earned
//   FROM social.badge_definitions d
//   LEFT JOIN social.user_badges ub ON ub.badge_id = d.id AND ub.user_id = params.id
// No backing store wired yet — matches the [id]/route.ts 404 pattern for an unknown id.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  void params
  return NextResponse.json({ error: 'not found' }, { status: 404 })
}
