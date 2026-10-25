import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// POST /api/badges/evaluate → BFF POST /me/badges/evaluate: awards the badges the account has
// just earned (after a save or a publish) and returns their slugs.
export async function POST() {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    const data = await bffFetch<{ newly_awarded?: string[] }>('/me/badges/evaluate', { method: 'POST', token: auth.token })
    return NextResponse.json({ newly_awarded: data.newly_awarded ?? [] })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
