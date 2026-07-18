import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// PATCH /api/badges/:id/pin  body: { is_pinned: boolean }
//   → BFF PUT /me/badges/:id/pin (max 3 pins + "earned only" enforced server-side).
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()

  if (!/^\d+$/.test(params.id)) {
    return NextResponse.json({ error: 'invalid_badge_id' }, { status: 400 })
  }
  const body = await req.json().catch(() => ({}))
  if (typeof body.is_pinned !== 'boolean') {
    return NextResponse.json({ error: 'invalid_is_pinned' }, { status: 400 })
  }

  try {
    await bffFetch(`/me/badges/${params.id}/pin`, {
      method: 'PUT',
      body: JSON.stringify({ is_pinned: body.is_pinned }),
      token: auth.token,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
