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
}

export interface BadgesData {
  badges: Badge[]
  earned_count: number
  total_count: number
}

const MOCK: BadgesData = {
  earned_count: 4,
  total_count: 12,
  badges: [
    { id: 'b-01', slug: 'first-save',      name: 'First Save',         category: 'explorer', rarity: 'common',    earned: true,  earned_at: '2026-06-05T10:00:00Z', is_pinned: true  },
    { id: 'b-02', slug: 'map-maker',       name: 'Map Maker',          category: 'creator',  rarity: 'common',    earned: true,  earned_at: '2026-06-06T14:00:00Z', is_pinned: true  },
    { id: 'b-03', slug: 'social-butterfly',name: 'Social Butterfly',   category: 'social',   rarity: 'rare',      earned: true,  earned_at: '2026-06-07T09:00:00Z', is_pinned: false },
    { id: 'b-04', slug: 'k-pop-pilgrim',   name: 'K-Pop Pilgrim',      category: 'kpop',     rarity: 'rare',      earned: true,  earned_at: '2026-06-08T11:00:00Z', is_pinned: true  },
    { id: 'b-05', slug: 'drama-chaser',    name: 'Drama Chaser',       category: 'kdrama',   rarity: 'rare',      earned: false, earned_at: null,                   is_pinned: false },
    { id: 'b-06', slug: 'beauty-hunter',   name: 'Beauty Hunter',      category: 'kbeauty',  rarity: 'common',    earned: false, earned_at: null,                   is_pinned: false },
    { id: 'b-07', slug: 'culture-keeper',  name: 'Culture Keeper',     category: 'kculture', rarity: 'epic',      earned: false, earned_at: null,                   is_pinned: false },
    { id: 'b-08', slug: 'jeju-explorer',   name: 'Jeju Explorer',      category: 'region',   rarity: 'epic',      earned: false, earned_at: null,                   is_pinned: false },
    { id: 'b-09', slug: 'seoul-insider',   name: 'Seoul Insider',      category: 'region',   rarity: 'rare',      earned: false, earned_at: null,                   is_pinned: false },
    { id: 'b-10', slug: 'taste-seeker',    name: 'Taste Seeker',       category: 'food',     rarity: 'common',    earned: false, earned_at: null,                   is_pinned: false },
    { id: 'b-11', slug: 'leaderboard-top', name: 'Top 10 This Week',   category: 'social',   rarity: 'epic',      earned: false, earned_at: null,                   is_pinned: false },
    { id: 'b-12', slug: 'legendary-guide', name: 'Legendary Guide',    category: 'creator',  rarity: 'legendary', earned: false, earned_at: null,                   is_pinned: false },
  ],
}

export async function GET() {
  return NextResponse.json(MOCK)
}
