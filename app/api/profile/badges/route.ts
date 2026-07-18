import { NextResponse } from 'next/server'

// SC-6 — schema mandates social.badge_definitions.unlock_criteria (JSONB), not a
// flat description column. Matches the shape /api/badges already uses correctly.
export interface ProfileBadge {
  id: string
  slug: string
  name: string
  category: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  earned_at: string
  is_pinned: boolean
  unlock_criteria: { description: string }
}

// No backing store wired yet (social.user_badges) — honest empty list until then.
const MOCK: ProfileBadge[] = []

export async function GET() {
  return NextResponse.json(MOCK)
}

export async function PATCH() {
  return NextResponse.json({ success: true })
}
