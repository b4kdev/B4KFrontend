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
  bio: string | null
  trips_count: number
  saves_count: number
  badges_count: number
  likes_received: number
  pinned_badges: PinnedBadge[]
  preferred_lang: string
  transport_default: 'car' | 'public'
  interests: string[]
  trips_public: boolean
  saved_public: boolean
}

// Stub — real impl:
//   trips_count  = COUNT(ai.plans WHERE author_id = user AND is_published = TRUE AND deleted_at IS NULL)
//   saves_count  = COUNT(social.poi_saves WHERE user_id = user)
//   badges_count = COUNT(social.user_badges WHERE user_id = user)
const MOCK: ProfileData = {
  id: 'user-1',
  name: 'Sun Min',
  email: 'sunmin@example.com',
  avatar_url: null,
  bio: 'Chasing K-drama filming spots across Seoul.',
  trips_count: 3,
  saves_count: 18,
  badges_count: 3,
  likes_received: 24,
  pinned_badges: [
    { id: 'b1', slug: 'first-itinerary', name: 'First Steps', rarity: 'common' },
    { id: 'b3', slug: 'bts-trail', name: 'BTS Trail', rarity: 'epic' },
  ],
  preferred_lang: 'en',
  transport_default: 'car',
  interests: ['k-pop', 'k-drama'],
  trips_public: true,
  saved_public: false,
}

export async function GET() {
  return NextResponse.json(MOCK)
}

export async function PATCH() {
  return NextResponse.json(MOCK)
}
