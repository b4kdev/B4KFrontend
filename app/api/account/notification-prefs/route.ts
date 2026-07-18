import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// not exported — Next.js route files may only export handlers + route config
const NOTIF_TYPES = [
  'event_drop',
  'deal_expiring',
  'editorial_pick',
  'badge_earned',
  'challenge_new',
  'promotion',
] as const

export type NotifType = (typeof NOTIF_TYPES)[number]

export interface NotificationPref {
  notif_type: NotifType
  opt_out: boolean
}

// GET /api/account/notification-prefs → BFF GET /me/notification-prefs
// (6종 전부, 미설정=opt_out false 로 서버가 채워 반환)
export async function GET() {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    const data = await bffFetch<{ prefs: NotificationPref[] }>('/me/notification-prefs', {
      token: auth.token,
    })
    return NextResponse.json(data)
  } catch (e) {
    return bffErrorResponse(e)
  }
}

// PATCH /api/account/notification-prefs   body: { notif_type: NotifType, opt_out: boolean }
// → BFF PUT /me/notification-prefs (upserts one notif_type at a time)
export async function PATCH(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()

  const body = await req.json().catch(() => ({}))
  if (!NOTIF_TYPES.includes(body.notif_type) || typeof body.opt_out !== 'boolean') {
    return NextResponse.json({ ok: false, error: 'invalid_pref' }, { status: 400 })
  }
  try {
    await bffFetch('/me/notification-prefs', {
      method: 'PUT',
      token: auth.token,
      body: JSON.stringify({ notif_type: body.notif_type, opt_out: body.opt_out }),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
