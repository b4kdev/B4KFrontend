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
const BADGE_DEFINITIONS: Omit<OtherUserBadge, 'earned'>[] = [
  { badge_id: 'b1',  slug: 'first-itinerary',  name: 'First Steps',      rarity: 'common' },
  { badge_id: 'b2',  slug: 'k-pop-pilgrim',    name: 'K-Pop Pilgrim',    rarity: 'rare' },
  { badge_id: 'b3',  slug: 'bts-trail',        name: 'BTS Trail',        rarity: 'epic' },
  { badge_id: 'b4',  slug: 'drama-scout',      name: 'Drama Scout',      rarity: 'common' },
  { badge_id: 'b5',  slug: 'beauty-insider',   name: 'Beauty Insider',   rarity: 'rare' },
  { badge_id: 'b6',  slug: 'hanok-wanderer',   name: 'Hanok Wanderer',   rarity: 'common' },
  { badge_id: 'b7',  slug: 'night-owl',        name: 'Night Owl',        rarity: 'rare' },
  { badge_id: 'b8',  slug: 'trendsetter',      name: 'Trendsetter',      rarity: 'epic' },
  { badge_id: 'b9',  slug: 'super-saver',      name: 'Super Saver',      rarity: 'common' },
  { badge_id: 'b10', slug: 'seoul-marathon',   name: 'Seoul Marathon',   rarity: 'epic' },
  { badge_id: 'b11', slug: 'first-week',       name: 'Day One',          rarity: 'common' },
  { badge_id: 'b12', slug: 'all-rounder',      name: 'All-Rounder',      rarity: 'legendary' },
]

const EARNED = new Set(['b1', 'b2', 'b3', 'b6'])

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  void params
  const items: OtherUserBadge[] = BADGE_DEFINITIONS.map((d) => ({ ...d, earned: EARNED.has(d.badge_id) }))
  return NextResponse.json({ items })
}
