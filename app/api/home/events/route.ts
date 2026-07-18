import { NextResponse } from 'next/server'

export interface HomeEvent {
  id: string
  title: string
  location: string
  date_start: string
  image_url: string | null
}

const MOCK: HomeEvent[] = []

export async function GET() {
  return NextResponse.json(MOCK)
}
