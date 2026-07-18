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

// No data yet — real rankings come from social.leaderboard_entries (Wilson score,
// saves+likes) once backend computes them. Formula weights are an open blocker (BLK — UI only).
function empty(window: LeaderboardWindow): LeaderboardData {
  return { window, entries: [], your_rank: null, computed_at: new Date(0).toISOString() }
}

export async function GET(req: NextRequest) {
  const window = (req.nextUrl.searchParams.get('window') ?? 'weekly') as LeaderboardWindow
  return NextResponse.json(empty(window))
}
