import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// POST /api/account/restore → BFF POST /me/restore: cancels a scheduled account deletion
// (within the 30 days). The BFF side is still to be built.
export async function POST() {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    await bffFetch('/me/restore', { method: 'POST', token: auth.token })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
