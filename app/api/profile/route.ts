import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

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

// ── BFF payloads ─────────────────────────────────────────────────────────────
interface BffMe {
  id: number
  email: string | null
  name: string | null
  avatar_url: string | null
  preferred_lang: string | null
  provider: string | null
  created_at: string
}

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

interface BffBadge {
  badge_id: number
  slug: string
  name: string
  rarity: PinnedBadge['rarity']
  earned: boolean
  is_pinned: boolean
}

// Soft guard: signed-out visitors get an empty profile (profile/layout and the
// settings page render from this shape and must not hit the error branch just
// because there is no session).
function emptyProfile(): ProfileData {
  return {
    id: '',
    name: '',
    email: '',
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

// Compose ProfileData from the BFF:
//   GET /me                → identity (id, name, email, avatar_url, preferred_lang)
//   GET /profiles/:id      → counts + visibility flags (works for own id)
//   GET /me/badges         → pinned badges (is_pinned, earned)
// Backend gaps (BFF/DB has no column — kept at stub defaults):
//   bio, likes_received, transport_default, interests
async function buildProfile(token: string): Promise<ProfileData> {
  const me = await bffFetch<BffMe>('/me', { token })
  const [pub, myBadges] = await Promise.all([
    bffFetch<BffPublicProfile>(`/profiles/${me.id}`, { token }).catch(() => null),
    bffFetch<{ badges: BffBadge[] }>('/me/badges', { token }).catch(() => null),
  ])

  const pinned: PinnedBadge[] = (myBadges?.badges ?? [])
    .filter((b) => b.earned && b.is_pinned)
    .map((b) => ({ id: String(b.badge_id), slug: b.slug, name: b.name, rarity: b.rarity }))

  return {
    id: String(me.id),
    name: me.name ?? '',
    email: me.email ?? '',
    avatar_url: me.avatar_url ?? null,
    bio: null,                                  // backend gap — no bio column
    trips_count: pub?.trips_count ?? 0,
    saves_count: pub?.saves_count ?? 0,
    badges_count: pub?.badges_count ?? 0,
    likes_received: 0,                          // backend gap — no aggregate endpoint
    pinned_badges: pinned,
    preferred_lang: me.preferred_lang ?? 'en',
    transport_default: 'car',                   // backend gap — not stored server-side
    interests: [],                              // backend gap — not stored server-side
    trips_public: pub?.trips_public ?? true,
    saved_public: pub?.saved_public ?? false,
  }
}

export async function GET() {
  const auth = await getSessionAuth()
  if (!auth) return NextResponse.json(emptyProfile())
  try {
    return NextResponse.json(await buildProfile(auth.token))
  } catch (e) {
    return bffErrorResponse(e)
  }
}

// PATCH /api/profile — BFF PUT /me supports { name, preferred_lang, avatar_url }.
// The settings page also sends { transport_default, interests }; those have no
// backend column yet, so they are accepted (input shape validated) but ignored.
export async function PATCH(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()

  const body = await req.json().catch(() => ({}))
  const update: Record<string, string> = {}
  for (const field of ['name', 'preferred_lang', 'avatar_url'] as const) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== 'string') {
        return NextResponse.json({ error: `invalid_${field}` }, { status: 400 })
      }
      update[field] = body[field]
    }
  }

  try {
    if (Object.keys(update).length > 0) {
      await bffFetch('/me', { method: 'PUT', body: JSON.stringify(update), token: auth.token })
    }
    return NextResponse.json(await buildProfile(auth.token))
  } catch (e) {
    return bffErrorResponse(e)
  }
}
