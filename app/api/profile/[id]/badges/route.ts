import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse } from '@/lib/bff'

export interface OtherUserBadge {
  badge_id: string
  slug: string
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  earned: boolean
}

// GET /api/profile/:id/badges → BFF GET /profiles/:id/badges (anonymous allowed).
// Consumer contract (profile/[id]/page.tsx BadgesList): { items: OtherUserBadge[] }.
// Backend gap: the BFF returns *earned* badges only (badges_public respected),
// not the full 12-slot definition grid — unearned slots cannot be rendered until
// a public catalog endpoint exists. badges_public=false → { items: [] }.
// Unknown user → BFF 404 passed through.

interface BffUserBadges {
  visible: boolean
  badges: {
    badge_id: number
    slug: string
    name: string
    category: string
    rarity: OtherUserBadge['rarity']
    earned_at: string
    is_pinned: boolean
  }[]
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!/^\d+$/.test(params.id)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  try {
    const data = await bffFetch<BffUserBadges>(`/profiles/${params.id}/badges`)
    const items: OtherUserBadge[] = (data.badges ?? []).map((b) => ({
      badge_id: String(b.badge_id),
      slug: b.slug,
      name: b.name,
      rarity: b.rarity,
      earned: true, // BFF returns earned badges only
    }))
    return NextResponse.json({ items })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
