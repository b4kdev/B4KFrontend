import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// GET /api/notifications/unread-count  → { count: number }
// BFF GET /me/notifications returns { notifications, unread_count } — reuse it, page size 1.

interface BffNotificationsList {
  notifications: unknown[]
  unread_count: number
}

export async function GET() {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    const data = await bffFetch<BffNotificationsList>('/me/notifications?limit=1', {
      token: auth.token,
    })
    return NextResponse.json({ count: data.unread_count ?? 0 })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
