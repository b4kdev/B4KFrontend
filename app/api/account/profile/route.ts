import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// PATCH /api/account/profile
// body: { display_name?: string, bio?: string, trips_public?: boolean, saved_public?: boolean }
// display_name → BFF PUT /me (p_name). trips_public/saved_public → BFF PUT /me/visibility.
// `bio` has NO backing column/RPC param on the backend yet (api.update_profile only
// accepts name/preferred_lang/avatar_url) — accepted and validated here but not
// persisted. Needs a backend schema decision before this can round-trip for real.
// Badges tab visibility is NOT settable — always public per SPEC-09.
export async function PATCH(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()

  const body = await req.json().catch(() => ({}))
  if (typeof body.bio === 'string' && body.bio.length > 150) {
    return NextResponse.json({ ok: false, error: 'bio_too_long' }, { status: 400 })
  }

  try {
    if (typeof body.display_name === 'string') {
      await bffFetch('/me', {
        method: 'PUT',
        token: auth.token,
        body: JSON.stringify({ name: body.display_name }),
      })
    }
    if (typeof body.trips_public === 'boolean' || typeof body.saved_public === 'boolean') {
      await bffFetch('/me/visibility', {
        method: 'PUT',
        token: auth.token,
        body: JSON.stringify({
          trips_public: body.trips_public ?? null,
          saved_public: body.saved_public ?? null,
        }),
      })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
