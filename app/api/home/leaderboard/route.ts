import { NextResponse } from 'next/server'

export interface HomeLeaderboardEntry {
  rank: number
  user_id: string
  display_name: string
  score: number
  avatar_url: string | null
}

const MOCK: HomeLeaderboardEntry[] = [
  { rank: 1, user_id: 'u-lb-01', display_name: '@yuna_travels',  score: 9420, avatar_url: null },
  { rank: 2, user_id: 'u-lb-02', display_name: '@jiho_explore',  score: 8810, avatar_url: null },
  { rank: 3, user_id: 'u-lb-03', display_name: '@seoultaste',    score: 7650, avatar_url: null },
]

export async function GET() {
  return NextResponse.json(MOCK)
}
