import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// PATCH /api/notifications/:id  → BFF POST /me/notifications/:id/read

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    await bffFetch(`/me/notifications/${encodeURIComponent(params.id)}/read`, {
      method: 'POST',
      token: auth.token,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
