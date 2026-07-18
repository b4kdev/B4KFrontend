import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth } from '@/lib/bff'

export type NotificationType = 'event_drop' | 'deal_expiring' | 'editorial_pick' | 'badge_earned' | 'challenge_new' | 'promotion'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  deep_link_url: string
  is_read: boolean
  created_at: string
}

export interface NotificationsData {
  notifications: Notification[]
  unread_count: number
}

interface BffNotification {
  id: number
  type: NotificationType
  title: string
  body: string | null
  deep_link_url: string | null
  is_read: boolean
  created_at: string
}

interface BffNotificationsData {
  notifications: BffNotification[]
  unread_count: number
  server_time?: string
}

// GET /api/notifications?limit=&offset= → BFF GET /me/notifications
// Soft guard preserved: signed out → empty list (the page shows its empty
// state instead of an error, matching the previous stub behavior).
export async function GET(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) {
    return NextResponse.json({ notifications: [], unread_count: 0 } satisfies NotificationsData)
  }

  const qs = new URLSearchParams()
  const limit = Number(req.nextUrl.searchParams.get('limit'))
  const offset = Number(req.nextUrl.searchParams.get('offset'))
  if (Number.isInteger(limit) && limit > 0) qs.set('limit', String(limit))
  if (Number.isInteger(offset) && offset >= 0) qs.set('offset', String(offset))

  try {
    const data = await bffFetch<BffNotificationsData>(
      `/me/notifications${qs.size ? `?${qs}` : ''}`,
      { token: auth.token },
    )
    const result: NotificationsData = {
      unread_count: data.unread_count,
      notifications: (data.notifications ?? []).map((n) => ({
        id: String(n.id),
        type: n.type,
        title: n.title,
        body: n.body ?? '',
        deep_link_url: n.deep_link_url ?? '',
        is_read: n.is_read,
        created_at: n.created_at,
      })),
    }
    return NextResponse.json(result)
  } catch (e) {
    return bffErrorResponse(e)
  }
}
