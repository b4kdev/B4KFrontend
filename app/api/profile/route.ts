import { NextResponse } from 'next/server'

export interface PinnedBadge {
  id: string
  slug: string
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface ProfileData {
  id: string
  name: string
  email: string
  avatar_url: string | null
  trips_count: number
  likes_received: number
  pinned_badges: PinnedBadge[]
  preferred_lang: string
  transport_default: 'car' | 'public'
  interests: string[]
}

const MOCK: ProfileData = {
  id: 'user-1',
  name: 'Sun Min',
  email: 'technoprecarious@gmail.com',
  avatar_url: null,
  trips_count: 3,
  likes_received: 24,
  pinned_badges: [
    { id: 'b1', slug: 'first-itinerary', name: 'First Steps', rarity: 'common' },
    { id: 'b3', slug: 'bts-trail', name: 'BTS Trail', rarity: 'epic' },
  ],
  preferred_lang: 'en',
  transport_default: 'car',
  interests: ['k-pop', 'k-drama'],
}

export async function GET() {
  return NextResponse.json(MOCK)
}

export async function PATCH() {
  return NextResponse.json(MOCK)
}
