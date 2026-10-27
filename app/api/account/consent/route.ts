import { NextRequest, NextResponse } from 'next/server'
import { bffErrorResponse, bffFetch, getSessionAuth, unauthorized } from '@/lib/bff'
import { CONSENT_VERSION } from '@/lib/terms-consent'

// POST /api/account/consent   body: { age: true }
// Records the Consent step on the account (BFF POST /me/consent: one row in the server's consent
// log, server time): terms and privacy version and the 14+ confirmation. No marketing opt-in at
// launch: a body that still sends one is accepted and the field ignored.
export async function POST(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()

  const body = await req.json().catch(() => ({}))
  if (body.age !== true) return NextResponse.json({ error: 'age_required' }, { status: 400 })

  try {
    const consent = await bffFetch('/me/consent', {
      method: 'POST',
      token: auth.token,
      body: JSON.stringify({ terms_version: CONSENT_VERSION, privacy_version: CONSENT_VERSION, age_confirmed: true }),
    })
    return NextResponse.json({ ok: true, consent })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
