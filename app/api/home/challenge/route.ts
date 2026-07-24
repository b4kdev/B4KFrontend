import { NextResponse } from 'next/server'

export interface HomeChallengeData {
  slug: string
  title: string
  description: string
  badge_slug: string
  badge_name: string
  cta_href: string
}

// Interim content seed — game-mechanic copy (weekly badge challenge), not
// POI/user data, so no DB cross-check applies. Real impl computes the active
// weekly challenge server-side; this is a static placeholder for the current one.
const SEED: HomeChallengeData = {
  slug: 'hanok-hopper',
  title: 'Hanok Hopper',
  description: 'Save 3 traditional hanok spots this week to earn the Hanok Hopper badge.',
  badge_slug: 'hanok-hopper',
  badge_name: 'Hanok Hopper',
  cta_href: '/badges',
}

export async function GET() {
  return NextResponse.json<HomeChallengeData | null>(SEED)
}
