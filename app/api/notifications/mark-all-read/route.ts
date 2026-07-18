import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// SC-5 — spec mandates POST /api/notifications/mark-all-read (was PATCH /api/notifications).
// → BFF POST /me/notifications/read-all
export async function POST() {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    await bffFetch('/me/notifications/read-all', { method: 'POST', token: auth.token })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
