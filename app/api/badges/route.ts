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

const MOCK: BadgesData = {
  earned_count: 4,
  total_count: 12,
  badges: [
    { id: 'b-01', slug: 'first-save',      name: 'First Save',         category: 'explorer', rarity: 'common',    earned: true,  earned_at: '2026-06-05T10:00:00Z', is_pinned: true,  unlock_criteria: { description: 'Save your first place to Saved.' } },
    { id: 'b-02', slug: 'map-maker',       name: 'Map Maker',          category: 'creator',  rarity: 'common',    earned: true,  earned_at: '2026-06-06T14:00:00Z', is_pinned: true,  unlock_criteria: { description: 'Create and publish your first trip plan.' } },
    { id: 'b-03', slug: 'social-butterfly',name: 'Social Butterfly',   category: 'social',   rarity: 'rare',      earned: true,  earned_at: '2026-06-07T09:00:00Z', is_pinned: false, unlock_criteria: { description: 'Receive 10 likes across your published plans.' } },
    { id: 'b-04', slug: 'k-pop-pilgrim',   name: 'K-Pop Pilgrim',      category: 'kpop',     rarity: 'rare',      earned: true,  earned_at: '2026-06-08T11:00:00Z', is_pinned: true,  unlock_criteria: { description: 'Save 10 K-Pop places.' } },
    { id: 'b-05', slug: 'drama-chaser',    name: 'Drama Chaser',       category: 'kdrama',   rarity: 'rare',      earned: false, earned_at: null,                   is_pinned: false, unlock_criteria: { description: 'Save 10 K-Drama filming locations.' } },
    { id: 'b-06', slug: 'beauty-hunter',   name: 'Beauty Hunter',      category: 'kbeauty',  rarity: 'common',    earned: false, earned_at: null,                   is_pinned: false, unlock_criteria: { description: 'Save 5 K-Beauty places.' } },
    { id: 'b-07', slug: 'culture-keeper',  name: 'Culture Keeper',     category: 'kculture', rarity: 'epic',      earned: false, earned_at: null,                   is_pinned: false, unlock_criteria: { description: 'Save 25 K-Culture places across 3 regions.' } },
    { id: 'b-08', slug: 'jeju-explorer',   name: 'Jeju Explorer',      category: 'region',   rarity: 'epic',      earned: false, earned_at: null,                   is_pinned: false, unlock_criteria: { description: 'Include 15 Jeju places in your plans.' } },
    { id: 'b-09', slug: 'seoul-insider',   name: 'Seoul Insider',      category: 'region',   rarity: 'rare',      earned: false, earned_at: null,                   is_pinned: false, unlock_criteria: { description: 'Include 20 Seoul places in your plans.' } },
    { id: 'b-10', slug: 'taste-seeker',    name: 'Taste Seeker',       category: 'food',     rarity: 'common',    earned: false, earned_at: null,                   is_pinned: false, unlock_criteria: { description: 'Save 5 cafe or restaurant places.' } },
    { id: 'b-11', slug: 'leaderboard-top', name: 'Top 10 This Week',   category: 'social',   rarity: 'epic',      earned: false, earned_at: null,                   is_pinned: false, unlock_criteria: { description: 'Finish a week ranked in the top 10 of the weekly leaderboard.' } },
    { id: 'b-12', slug: 'legendary-guide', name: 'Legendary Guide',    category: 'creator',  rarity: 'legendary', earned: false, earned_at: null,                   is_pinned: false, unlock_criteria: { description: 'Publish 50 plans that each earn at least 10 saves.' } },
  ],
}

export async function GET() {
  return NextResponse.json(MOCK)
}
