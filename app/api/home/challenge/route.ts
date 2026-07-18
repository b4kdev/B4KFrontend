import { NextResponse } from 'next/server'

export interface HomeChallengeData {
  slug: string
  title: string
  description: string
  badge_slug: string
  badge_name: string
  cta_href: string
}

export async function GET() {
  // No active challenge yet — client hides the card on a falsy response.
  return NextResponse.json<HomeChallengeData | null>(null)
}
