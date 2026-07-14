import { NextResponse } from 'next/server'

// SC-5 — spec mandates POST /api/notifications/mark-all-read (was PATCH /api/notifications).
// social.notifications SET is_read = true WHERE user_id = session.user.id
export async function POST() {
  // TODO: getServerSession → UPDATE social.notifications SET is_read = true WHERE user_id = session.user.id
  return NextResponse.json({ ok: true })
}
