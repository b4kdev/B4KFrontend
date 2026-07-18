import { NextResponse } from 'next/server'

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

// No data yet — real notifications come from social.notifications once backend is wired.
const EMPTY: NotificationsData = {
  unread_count: 0,
  notifications: [],
}

export async function GET() {
  return NextResponse.json(EMPTY)
}
