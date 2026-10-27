import { NextResponse } from 'next/server'
import { bffFetch, getSessionAuth, unauthorized } from '@/lib/bff'

// GET /api/account/deletion → { deleted_at, restore_deadline } of the signed-in account (both null
// when it is not set to be deleted): the BFF profile. Until the deadline, POST /api/account/restore
// keeps the account.
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    const me = await bffFetch<{ deleted_at?: string | null; restore_deadline?: string | null }>('/me', { token: auth.token })
    return NextResponse.json({ deleted_at: me?.deleted_at ?? null, restore_deadline: me?.restore_deadline ?? null })
  } catch {
    return NextResponse.json({ deleted_at: null, restore_deadline: null })
  }
}
