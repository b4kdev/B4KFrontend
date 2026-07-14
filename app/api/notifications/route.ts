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

const MOCK: NotificationsData = {
  unread_count: 2,
  notifications: [
    { id: 'n-001', type: 'badge_earned',    title: 'Badge earned!',                 body: 'You earned the "First Save" badge. Check your profile.',         deep_link_url: '/profile/badges', is_read: false, created_at: '2026-06-09T08:30:00Z' },
    { id: 'n-002', type: 'editorial_pick',  title: 'B4K Editorial Pick',            body: 'Seoul After Dark: 8 rooftop spots you have not tried yet.',      deep_link_url: '/map',            is_read: false, created_at: '2026-06-09T07:00:00Z' },
    { id: 'n-003', type: 'event_drop',      title: 'New event near you',            body: 'Busan International Film Festival locations added to the map.',  deep_link_url: '/map',            is_read: true,  created_at: '2026-06-08T15:00:00Z' },
    { id: 'n-004', type: 'challenge_new',  title: 'New weekly challenge',          body: 'This week: visit 3 K-Drama filming locations. Earn a badge.',    deep_link_url: '/profile/badges', is_read: true,  created_at: '2026-06-07T09:00:00Z' },
    { id: 'n-005', type: 'deal_expiring',  title: 'Deal expiring in 24h',          body: 'Jeju Hidden Gem Package — offer ends tomorrow.',                 deep_link_url: '/map',            is_read: true,  created_at: '2026-06-06T12:00:00Z' },
    { id: 'n-006', type: 'promotion',      title: 'Exclusive offer inside',        body: 'Get 15% off Namsan Tower tickets this weekend only.',            deep_link_url: '/map',            is_read: true,  created_at: '2026-06-05T10:00:00Z' },
  ],
}

export async function GET() {
  return NextResponse.json(MOCK)
}
