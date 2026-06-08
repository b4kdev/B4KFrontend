import { NextResponse } from 'next/server'

export interface ProfileBadge {
  id: string
  slug: string
  name: string
  category: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  earned_at: string
  is_pinned: boolean
  description: string
}

const MOCK: ProfileBadge[] = [
  {
    id: 'b1',
    slug: 'first-itinerary',
    name: 'First Steps',
    category: 'Milestone',
    rarity: 'common',
    earned_at: '2026-05-20T10:00:00Z',
    is_pinned: true,
    description: 'Save your first itinerary.',
  },
  {
    id: 'b2',
    slug: 'k-pop-pilgrim',
    name: 'K-Pop Pilgrim',
    category: 'Category',
    rarity: 'rare',
    earned_at: '2026-05-25T12:00:00Z',
    is_pinned: false,
    description: 'Visit 3 K-Pop related POIs.',
  },
  {
    id: 'b3',
    slug: 'bts-trail',
    name: 'BTS Trail',
    category: 'Special',
    rarity: 'epic',
    earned_at: '2026-06-01T08:00:00Z',
    is_pinned: true,
    description: 'Complete the full BTS Seoul trail itinerary.',
  },
]

export async function GET() {
  return NextResponse.json(MOCK)
}

export async function PATCH() {
  return NextResponse.json({ success: true })
}
