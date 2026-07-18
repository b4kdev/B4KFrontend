import { NextResponse } from 'next/server'

export interface ProfileTrip {
  id: string
  title: string
  is_published: boolean
  like_count: number
  save_count: number
  thumbnail_url: string | null
  stop_count: number
  created_at: string
}

// No backing store wired yet (ai.plans WHERE author_id = user) — honest empty list until then.
const MOCK: ProfileTrip[] = []

export async function GET() {
  return NextResponse.json(MOCK)
}

export async function DELETE() {
  return NextResponse.json({ success: true })
}
