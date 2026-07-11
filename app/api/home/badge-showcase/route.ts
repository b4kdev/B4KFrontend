import { NextResponse } from 'next/server'

export interface HomeBadgeShowcase {
  badge_id: string
  badge_name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  earner_name: string
  image_url: string | null
}

const MOCK: HomeBadgeShowcase = {
  badge_id: 'badge-01',
  badge_name: 'Cultural Navigator',
  rarity: 'rare',
  earner_name: '@yuna_travels',
  image_url: null,
}

export async function GET() {
  return NextResponse.json(MOCK)
}
