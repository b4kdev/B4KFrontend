import { NextResponse } from 'next/server'

export interface ProfileTrip {
  id: string
  title: string
  is_published: boolean
  like_count: number
  save_count: number
  thumbnail_url: string | null
  stop_count: number
  created_at: string
}

const MOCK: ProfileTrip[] = [
  {
    id: 'p1',
    title: 'Seoul in 3 Days',
    is_published: true,
    like_count: 12,
    save_count: 5,
    thumbnail_url: null,
    stop_count: 8,
    created_at: '2026-05-20T10:00:00Z',
  },
  {
    id: 'p2',
    title: 'Busan Coast Road',
    is_published: false,
    like_count: 0,
    save_count: 0,
    thumbnail_url: null,
    stop_count: 5,
    created_at: '2026-06-01T09:00:00Z',
  },
  {
    id: 'p3',
    title: 'Jeju Hidden Gems',
    is_published: true,
    like_count: 7,
    save_count: 3,
    thumbnail_url: null,
    stop_count: 6,
    created_at: '2026-06-05T11:00:00Z',
  },
]

export async function GET() {
  return NextResponse.json(MOCK)
}

export async function DELETE() {
  return NextResponse.json({ success: true })
}
