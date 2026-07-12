import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/badges/:id/pin — toggle pin state for an earned badge (own profile only).
// Real impl (dev friend): UPDATE social.user_badges SET is_pinned = $is_pinned
//   WHERE user_id = <me> AND badge_id = $id;  (enforce max 3 pinned server-side)
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  void params.id
  return NextResponse.json({ ok: true })
}
