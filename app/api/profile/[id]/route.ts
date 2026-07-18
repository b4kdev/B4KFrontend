import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse } from '@/lib/bff'

// GET /api/profile/:id → BFF GET /profiles/:id (anonymous allowed).
// Consumer contract (app/[locale]/profile/[id]/page.tsx OtherUserProfile):
//   { id, display_name, avatar_url, trips_count, saves_count, badges_count,
//     trips_public, saved_public, badges_public }
// Unknown/inactive user → BFF 404 passed through unchanged.

interface BffPublicProfile {
  id: number
  name: string | null
  avatar_url: string | null
  trips_count: number
  saves_count: number
  badges_count: number
  trips_public: boolean
  saved_public: boolean
  badges_public: boolean
  created_at: string
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!/^\d+$/.test(params.id)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  try {
    const p = await bffFetch<BffPublicProfile>(`/profiles/${params.id}`)
    return NextResponse.json({
      id: String(p.id),
      display_name: p.name ?? null,
      avatar_url: p.avatar_url ?? null,
      trips_count: p.trips_count,
      saves_count: p.saves_count,
      badges_count: p.badges_count,
      trips_public: p.trips_public,
      saved_public: p.saved_public,
      badges_public: p.badges_public,
    })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
