import { NextResponse } from 'next/server'

// GET /api/notifications/unread-count  → { count: number }

export async function GET() {
  // TODO: getServerSession → SELECT COUNT(*) FROM social.notifications WHERE user_id AND is_read = false
  return NextResponse.json({ count: 2 })
}
