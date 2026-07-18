import { NextResponse } from 'next/server'

export interface HomePopularPlan {
  id: string
  title: string
  author_name: string
  stop_count: number
  save_count: number
  cover_image_url: string | null
  is_partner: boolean
}

const MOCK: HomePopularPlan[] = []

export async function GET() {
  return NextResponse.json(MOCK)
}
