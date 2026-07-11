import { NextResponse } from 'next/server'

export interface HomeEvent {
  id: string
  title: string
  location: string
  date_start: string
  image_url: string | null
}

const MOCK: HomeEvent[] = [
  { id: 'evt-01', title: 'Seoul Jazz Festival',          location: 'Olympic Park, Seoul',         date_start: '2026-08-22', image_url: null },
  { id: 'evt-02', title: 'Busan International Film Festival', location: 'BIFF Square, Busan',      date_start: '2026-10-01', image_url: null },
  { id: 'evt-03', title: 'Jinhae Cherry Blossom Festival',   location: 'Jinhae, South Gyeongsang', date_start: '2027-03-28', image_url: null },
]

export async function GET() {
  return NextResponse.json(MOCK)
}
