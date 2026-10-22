import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { CONSENT_VERSION } from '@/lib/terms-consent'

// POST /api/account/consent   body: { age: true }
// Stores the Consent step on the account (user_metadata.consent): terms and privacy version,
// 14+ confirmation and the server time of acceptance. No marketing opt-in at launch: a body that
// still sends one is accepted and the field ignored; older records keep theirs.
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (body.age !== true) return NextResponse.json({ error: 'age_required' }, { status: 400 })

  const consent = {
    terms_version: CONSENT_VERSION,
    privacy_version: CONSENT_VERSION,
    age_confirmed: true,
    accepted_at: new Date().toISOString(),
  }
  const { error } = await supabase.auth.updateUser({ data: { consent } })
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 })

  return NextResponse.json({ ok: true, consent })
}
