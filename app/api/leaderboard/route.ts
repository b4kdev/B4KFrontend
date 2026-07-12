import { NextRequest, NextResponse } from 'next/server'

export type LeaderboardWindow = 'weekly' | 'rising' | 'annual'

// Trend vs previous period — mock only; formula weights are an open blocker (UI only)
export type LeaderboardTrend = 'up' | 'down' | 'same'

export interface LeaderboardUser {
  id: string
  name: string
  avatar_url: string | null
}

export interface LeaderboardEntry {
  rank: number
  user: LeaderboardUser
  score: number
  plans_count: number
  badge_count: number
  trend: LeaderboardTrend
}

// Own-user rank when not in the visible top N (social.leaderboard_entries)
export interface LeaderboardYourRank {
  rank: number
  score: number
  trend: LeaderboardTrend
}

export interface LeaderboardData {
  window: LeaderboardWindow
  entries: LeaderboardEntry[]
  your_rank: LeaderboardYourRank | null
  computed_at: string
}

const WEEKLY: LeaderboardEntry[] = [
  { rank: 1, user: { id: 'u1', name: 'JiYeon K.',   avatar_url: null }, score: 2840, plans_count: 12, badge_count: 8, trend: 'same' },
  { rank: 2, user: { id: 'u2', name: 'Takumi M.',   avatar_url: null }, score: 2310, plans_count: 9,  badge_count: 6, trend: 'up'   },
  { rank: 3, user: { id: 'u3', name: 'Mei-Lin C.',  avatar_url: null }, score: 1980, plans_count: 7,  badge_count: 7, trend: 'down' },
  { rank: 4, user: { id: 'u4', name: 'Arjun P.',    avatar_url: null }, score: 1560, plans_count: 6,  badge_count: 5, trend: 'up'   },
  { rank: 5, user: { id: 'u5', name: 'Sofia B.',    avatar_url: null }, score: 1340, plans_count: 5,  badge_count: 4, trend: 'same' },
  { rank: 6, user: { id: 'u6', name: 'Hiro W.',     avatar_url: null }, score: 1120, plans_count: 4,  badge_count: 3, trend: 'up'   },
  { rank: 7, user: { id: 'u7', name: 'Ana L.',      avatar_url: null }, score:  980, plans_count: 4,  badge_count: 3, trend: 'down' },
  { rank: 8, user: { id: 'u8', name: 'Napat S.',    avatar_url: null }, score:  840, plans_count: 3,  badge_count: 2, trend: 'up'   },
  { rank: 9, user: { id: 'u9', name: 'Min-Ji L.',   avatar_url: null }, score:  720, plans_count: 3,  badge_count: 2, trend: 'same' },
  { rank:10, user: { id:'u10', name: 'Carlos R.',   avatar_url: null }, score:  610, plans_count: 2,  badge_count: 1, trend: 'down' },
]

const RISING: LeaderboardEntry[] = [
  { rank: 1, user: { id: 'u6', name: 'Hiro W.',     avatar_url: null }, score: 380, plans_count: 4, badge_count: 3, trend: 'up'   },
  { rank: 2, user: { id: 'u8', name: 'Napat S.',    avatar_url: null }, score: 310, plans_count: 3, badge_count: 2, trend: 'up'   },
  { rank: 3, user: { id:'u10', name: 'Carlos R.',   avatar_url: null }, score: 280, plans_count: 2, badge_count: 1, trend: 'up'   },
  { rank: 4, user: { id: 'u5', name: 'Sofia B.',    avatar_url: null }, score: 240, plans_count: 5, badge_count: 4, trend: 'same' },
  { rank: 5, user: { id: 'u9', name: 'Min-Ji L.',   avatar_url: null }, score: 195, plans_count: 3, badge_count: 2, trend: 'up'   },
]

const ANNUAL: LeaderboardEntry[] = [
  { rank: 1, user: { id: 'u1', name: 'JiYeon K.',   avatar_url: null }, score: 48200, plans_count: 87, badge_count: 12, trend: 'same' },
  { rank: 2, user: { id: 'u3', name: 'Mei-Lin C.',  avatar_url: null }, score: 41600, plans_count: 74, badge_count: 11, trend: 'up'   },
  { rank: 3, user: { id: 'u2', name: 'Takumi M.',   avatar_url: null }, score: 38900, plans_count: 69, badge_count: 10, trend: 'down' },
  { rank: 4, user: { id: 'u4', name: 'Arjun P.',    avatar_url: null }, score: 29400, plans_count: 52, badge_count: 9,  trend: 'same' },
  { rank: 5, user: { id: 'u7', name: 'Ana L.',      avatar_url: null }, score: 24800, plans_count: 45, badge_count: 8,  trend: 'up'   },
]

// Mock: current user sits below the visible top N in every window
const MOCK: Record<LeaderboardWindow, LeaderboardData> = {
  weekly:  { window: 'weekly',  entries: WEEKLY,  your_rank: { rank: 47, score: 120, trend: 'up'   }, computed_at: '2026-06-09T00:00:00Z' },
  rising:  { window: 'rising',  entries: RISING,  your_rank: { rank: 23, score:  45, trend: 'same' }, computed_at: '2026-06-09T06:00:00Z' },
  annual:  { window: 'annual',  entries: ANNUAL,  your_rank: { rank: 112, score: 1840, trend: 'down' }, computed_at: '2026-01-01T00:00:00Z' },
}

export async function GET(req: NextRequest) {
  const window = (req.nextUrl.searchParams.get('window') ?? 'weekly') as LeaderboardWindow
  const data = MOCK[window] ?? MOCK.weekly
  return NextResponse.json(data)
}
