import { NextResponse } from 'next/server'

export interface HomeLeaderboardEntry {
  rank: number
  user_id: string
  display_name: string
  score: number
  avatar_url: string | null
}

const MOCK: HomeLeaderboardEntry[] = []

export async function GET() {
  return NextResponse.json(MOCK)
}
