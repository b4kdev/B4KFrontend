import { NextResponse } from 'next/server'

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Badge {
  id: string
  slug: string
  name: string
  category: string
  rarity: BadgeRarity
  earned: boolean
  earned_at: string | null
  is_pinned: boolean
  // social.badge_definitions.unlock_criteria (JSONB) — description surfaced in detail sheet
  unlock_criteria: { description: string }
}

export interface BadgesData {
  badges: Badge[]
  earned_count: number
  total_count: number
}

// Badge catalog (social.badge_definitions) — these definitions exist regardless of any
// individual user's progress, so the full catalog is kept. Per-user earn status is not
// fabricated: no user has earned anything yet, so every badge is unearned and unpinned.
const CATALOG: Omit<Badge, 'earned' | 'earned_at' | 'is_pinned'>[] = [
  { id: 'b-01', slug: 'first-save',      name: 'First Save',         category: 'explorer', rarity: 'common',    unlock_criteria: { description: 'Save your first place to Saved.' } },
  { id: 'b-02', slug: 'map-maker',       name: 'Map Maker',          category: 'creator',  rarity: 'common',    unlock_criteria: { description: 'Create and publish your first trip plan.' } },
  { id: 'b-03', slug: 'social-butterfly',name: 'Social Butterfly',   category: 'social',   rarity: 'rare',      unlock_criteria: { description: 'Receive 10 likes across your published plans.' } },
  { id: 'b-04', slug: 'k-pop-pilgrim',   name: 'K-Pop Pilgrim',      category: 'kpop',     rarity: 'rare',      unlock_criteria: { description: 'Save 10 K-Pop places.' } },
  { id: 'b-05', slug: 'drama-chaser',    name: 'Drama Chaser',       category: 'kdrama',   rarity: 'rare',      unlock_criteria: { description: 'Save 10 K-Drama filming locations.' } },
  { id: 'b-06', slug: 'beauty-hunter',   name: 'Beauty Hunter',      category: 'kbeauty',  rarity: 'common',    unlock_criteria: { description: 'Save 5 K-Beauty places.' } },
  { id: 'b-07', slug: 'culture-keeper',  name: 'Culture Keeper',     category: 'kculture', rarity: 'epic',      unlock_criteria: { description: 'Save 25 K-Culture places across 3 regions.' } },
  { id: 'b-08', slug: 'jeju-explorer',   name: 'Jeju Explorer',      category: 'region',   rarity: 'epic',      unlock_criteria: { description: 'Include 15 Jeju places in your plans.' } },
  { id: 'b-09', slug: 'seoul-insider',   name: 'Seoul Insider',      category: 'region',   rarity: 'rare',      unlock_criteria: { description: 'Include 20 Seoul places in your plans.' } },
  { id: 'b-10', slug: 'taste-seeker',    name: 'Taste Seeker',       category: 'food',     rarity: 'common',    unlock_criteria: { description: 'Save 5 cafe or restaurant places.' } },
  { id: 'b-11', slug: 'leaderboard-top', name: 'Top 10 This Week',   category: 'social',   rarity: 'epic',      unlock_criteria: { description: 'Finish a week ranked in the top 10 of the weekly leaderboard.' } },
  { id: 'b-12', slug: 'legendary-guide', name: 'Legendary Guide',    category: 'creator',  rarity: 'legendary', unlock_criteria: { description: 'Publish 50 plans that each earn at least 10 saves.' } },
]

const EMPTY: BadgesData = {
  earned_count: 0,
  total_count: CATALOG.length,
  badges: CATALOG.map((b) => ({ ...b, earned: false, earned_at: null, is_pinned: false })),
}

export async function GET() {
  return NextResponse.json(EMPTY)
}
