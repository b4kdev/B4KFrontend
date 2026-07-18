import { NextResponse } from 'next/server'

export interface HomeBadgeShowcase {
  badge_id: string
  badge_name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  earner_name: string
  image_url: string | null
}

export async function GET() {
  // No badge earner data yet — hide the showcase card (LeaderboardBadge handles null).
  return NextResponse.json<HomeBadgeShowcase | null>(null)
}
