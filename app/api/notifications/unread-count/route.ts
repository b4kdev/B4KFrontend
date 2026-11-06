import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'
import { GAMIFICATION, notificationShown } from '@/lib/features'

// GET /api/notifications/unread-count  → { count: number }
// BFF GET /me/notifications returns { notifications, unread_count } — reuse it, page size 1.
// With gamification off its count includes hidden types (badges), so count the shown unread ones
// of the latest 50 instead: the bell never promises a notification the list does not show.

interface BffNotificationsList {
  notifications: { type: string; is_read: boolean }[]
  unread_count: number
}

export async function GET() {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    const data = await bffFetch<BffNotificationsList>(`/me/notifications?limit=${GAMIFICATION ? 1 : 50}`, {
      token: auth.token,
    })
    if (GAMIFICATION) return NextResponse.json({ count: data.unread_count ?? 0 })
    return NextResponse.json({ count: (data.notifications ?? []).filter((n) => !n.is_read && notificationShown(n.type)).length })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
