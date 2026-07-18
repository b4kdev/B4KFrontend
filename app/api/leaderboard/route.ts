import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth } from '@/lib/bff'

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

// BFF GET /leaderboard item shape (api.get_leaderboard)
interface BffLeaderboardEntry {
  rank: number
  score: number
  trend: LeaderboardTrend
  plans_count: number
  badge_count: number
  user: { id: number; name: string | null; avatar_url: string | null }
}

interface BffLeaderboardData {
  window: LeaderboardWindow
  computed_at: string
  entries: BffLeaderboardEntry[]
  your_rank: { rank: number; score: number; trend: LeaderboardTrend } | null
}

export async function GET(req: NextRequest) {
  const window = (req.nextUrl.searchParams.get('window') ?? 'weekly') as LeaderboardWindow
  const limit = req.nextUrl.searchParams.get('limit')
  const auth = await getSessionAuth()
  try {
    const data = await bffFetch<BffLeaderboardData>(
      `/leaderboard?window=${window}${limit ? `&limit=${limit}` : ''}`,
      { token: auth?.token ?? null },
    )
    const result: LeaderboardData = {
      window: data.window,
      computed_at: data.computed_at,
      entries: (data.entries ?? []).map((e) => ({
        rank: e.rank,
        score: e.score,
        trend: e.trend,
        plans_count: e.plans_count,
        badge_count: e.badge_count,
        user: { id: String(e.user.id), name: e.user.name ?? '', avatar_url: e.user.avatar_url },
      })),
      your_rank: data.your_rank,
    }
    return NextResponse.json(result)
  } catch (e) {
    return bffErrorResponse(e)
  }
}
