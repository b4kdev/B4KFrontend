import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// SC-6 — earned-only badge list for the profile badges tab (earned_at is
// non-null by contract; the page always renders the earn date).
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

interface BffBadge {
  badge_id: number
  slug: string
  name: string
  category: string
  rarity: ProfileBadge['rarity']
  unlock_criteria: { description?: string } | null
  earned: boolean
  earned_at: string | null
  is_pinned: boolean
}

// GET /api/profile/badges → BFF GET /me/badges, filtered to earned badges.
// Soft guard preserved: signed out → [] (the tab shows its empty state instead
// of an error, matching the previous stub behavior).
export async function GET() {
  const auth = await getSessionAuth()
  if (!auth) return NextResponse.json([])
  try {
    const data = await bffFetch<{ badges: BffBadge[] }>('/me/badges', { token: auth.token })
    const earned: ProfileBadge[] = (data.badges ?? [])
      .filter((b) => b.earned && b.earned_at)
      .map((b) => ({
        id: String(b.badge_id),
        slug: b.slug,
        name: b.name,
        category: b.category,
        rarity: b.rarity,
        earned_at: b.earned_at as string,
        is_pinned: b.is_pinned,
        unlock_criteria: { description: b.unlock_criteria?.description ?? '' },
      }))
    return NextResponse.json(earned)
  } catch (e) {
    return bffErrorResponse(e)
  }
}

// PATCH /api/profile/badges  body: { id, is_pinned } → BFF PUT /me/badges/:id/pin
export async function PATCH(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()

  const body = await req.json().catch(() => ({}))
  const id = String(body.id ?? '')
  if (!/^\d+$/.test(id) || typeof body.is_pinned !== 'boolean') {
    return NextResponse.json({ success: false, error: 'invalid_body' }, { status: 400 })
  }

  try {
    await bffFetch(`/me/badges/${id}/pin`, {
      method: 'PUT',
      body: JSON.stringify({ is_pinned: body.is_pinned }),
      token: auth.token,
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
