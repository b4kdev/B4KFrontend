import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/account/profile
// body: { display_name?: string, bio?: string, trips_public?: boolean, saved_public?: boolean }
// Real impl: getServerSession → validate (display_name 1–40 chars, bio ≤ 150 chars)
//   → UPDATE accounts.users SET display_name, bio, trips_public, saved_public WHERE id = user
// Badges tab visibility is NOT settable — always public per SPEC-09.
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  if (typeof body.bio === 'string' && body.bio.length > 150) {
    return NextResponse.json({ ok: false, error: 'bio_too_long' }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
