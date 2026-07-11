import { NextResponse } from 'next/server'

export interface HomeChallengeData {
  slug: string
  title: string
  description: string
  badge_slug: string
  badge_name: string
  cta_href: string
}

const MOCK: HomeChallengeData = {
  slug: 'week-explorer-july',
  title: 'Weekly Explorer Challenge',
  description: 'Visit 3 K-Culture spots this week and earn the Cultural Navigator badge.',
  badge_slug: 'cultural-navigator',
  badge_name: 'Cultural Navigator',
  cta_href: '/explore/k-culture',
}

export async function GET() {
  return NextResponse.json(MOCK)
}
