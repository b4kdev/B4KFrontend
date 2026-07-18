import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

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

// Real impl (dev friend, backend hookup):
//   trips_count  = COUNT(ai.plans WHERE author_id = user AND is_published = TRUE AND deleted_at IS NULL)
//   saves_count  = COUNT(social.poi_saves WHERE user_id = user)
//   badges_count = COUNT(social.user_badges WHERE user_id = user)
// No backing store wired yet — content fields honestly zeroed/empty until then.
async function buildEmptyProfile(): Promise<ProfileData> {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return {
    id: user?.id ?? '',
    name: user?.email ?? '',
    email: user?.email ?? '',
    avatar_url: null,
    bio: null,
    trips_count: 0,
    saves_count: 0,
    badges_count: 0,
    likes_received: 0,
    pinned_badges: [],
    preferred_lang: 'en',
    transport_default: 'car',
    interests: [],
    trips_public: true,
    saved_public: false,
  }
}

export async function GET() {
  return NextResponse.json(await buildEmptyProfile())
}

export async function PATCH() {
  return NextResponse.json(await buildEmptyProfile())
}
