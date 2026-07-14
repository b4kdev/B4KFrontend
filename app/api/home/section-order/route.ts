import { NextResponse } from 'next/server'

/**
 * Home content-section ordering (UF-8 · DEC-32 G2.2).
 *
 * MOCK STUB. Real impl weights this order by the user's behavioral signals —
 * category/tag weights derived from search history (raw queries never stored,
 * DEC-32 Model A), saves, and interests — to rank the personalizable Home
 * sections. Guests (no signals) receive DEFAULT_ORDER unchanged.
 *
 * Only the CONTENT sections are ordered here. Fixed sections (hero carousel,
 * weather widget) stay pinned client-side and are NOT included in this list.
 * Unknown keys returned here are ignored by the client; missing keys fall back
 * to their default position, so the payload can never break the page.
 */
export interface HomeSectionOrder {
  order: string[]
}

const DEFAULT_ORDER: string[] = [
  'trending',
  'exploreHub',
  'editorial',
  'new',
  'youMightLike',
  'planTrip',
  'continuePlan',
  'challenge',
  'leaderboardBadge',
  'popularPlans',
  'partnerPackages',
  'upcomingEvents',
  'promotions',
]

export async function GET() {
  // Real impl: resolve session → load behavioral weights → reorder.
  // Guests / no signals → DEFAULT_ORDER.
  return NextResponse.json<HomeSectionOrder>({ order: DEFAULT_ORDER })
}
