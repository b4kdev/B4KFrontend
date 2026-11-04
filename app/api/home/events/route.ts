import { NextResponse } from 'next/server'

export interface HomeEvent {
  id: string
  title: string
  location: string
  date_start: string
  image_url: string | null
}

const MOCK: HomeEvent[] = []

// Same answer for everyone, built once (Next 15 no longer makes such GET handlers static by default).
export const dynamic = 'force-static'

export async function GET() {
  return NextResponse.json(MOCK)
}
