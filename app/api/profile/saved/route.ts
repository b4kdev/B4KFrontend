import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export interface ProfileSavedPoi {
  place_id: string
  name_preferred: string | null
  name_en: string | null
  name_ko: string | null
  display_region: string | null
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Stub — real impl queries social.poi_saves JOIN service.places_snapshot
  // WHERE user_id = session.user.id AND is_active = TRUE ORDER BY saved_at DESC LIMIT 50
  const items: ProfileSavedPoi[] = []
  return NextResponse.json({ items })
}
