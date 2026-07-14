import { NextRequest, NextResponse } from 'next/server'

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

// GET /api/account/notification-prefs
// Real impl: getServerSession → SELECT notif_type, opt_out FROM social.notification_prefs
//   WHERE user_id = user. Missing rows default to opt_out = FALSE (opted in).
export async function GET() {
  const prefs: NotificationPref[] = NOTIF_TYPES.map((notif_type) => ({
    notif_type,
    opt_out: notif_type === 'promotion',
  }))
  return NextResponse.json({ prefs })
}

// PATCH /api/account/notification-prefs   body: { notif_type: NotifType, opt_out: boolean }
// Real impl: getServerSession → INSERT INTO social.notification_prefs (user_id, notif_type, opt_out)
//   VALUES (user, $1, $2) ON CONFLICT (user_id, notif_type) DO UPDATE SET opt_out = $2
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  if (!NOTIF_TYPES.includes(body.notif_type) || typeof body.opt_out !== 'boolean') {
    return NextResponse.json({ ok: false, error: 'invalid_pref' }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
