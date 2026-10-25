import { NextResponse } from 'next/server'
import { bffFetch, getSessionAuth, unauthorized } from '@/lib/bff'

// GET /api/account/deletion → { deleted_at } of the signed-in account (null when not set to be
// deleted). Reads the BFF profile; until the BFF returns deleted_at there, this is always null.
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    const me = await bffFetch<{ deleted_at?: string | null }>('/me', { token: auth.token })
    return NextResponse.json({ deleted_at: me?.deleted_at ?? null })
  } catch {
    return NextResponse.json({ deleted_at: null })
  }
}
