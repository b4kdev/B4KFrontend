import { NextResponse } from 'next/server'
import { bffFetch, getSessionAuth, unauthorized } from '@/lib/bff'

// GET /api/account/status → what a sign-in has to settle first, from the BFF profile:
// { deleted_at, restore_deadline } (both null when the account is not set to be deleted; until the
// deadline POST /api/account/restore keeps it) and { terms_version } of the account's last consent
// (null when none). `ok: false` when the profile could not be read.
export const dynamic = 'force-dynamic'

type Me = { deleted_at?: string | null; restore_deadline?: string | null; consent?: { terms_version?: string } | null }

export async function GET() {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    const me = await bffFetch<Me>('/me', { token: auth.token })
    return NextResponse.json({ ok: true, deleted_at: me?.deleted_at ?? null, restore_deadline: me?.restore_deadline ?? null, terms_version: me?.consent?.terms_version ?? null })
  } catch {
    return NextResponse.json({ ok: false, deleted_at: null, restore_deadline: null, terms_version: null })
  }
}
