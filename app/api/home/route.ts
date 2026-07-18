import { NextResponse } from 'next/server'

export interface HomeTopPlan {
  id: string
  title: string
  author_name: string
  likes_count: number
  saves_count: number
  cover_image_url: string | null
}

export interface HomeSeasonalPoi {
  poi_id: string
  name_ko: string
  name_en: string
  display_region: string
  category: string
  primary_image_url: string | null
}

export interface HomeData {
  topPlans: HomeTopPlan[]
  seasonalPois: HomeSeasonalPoi[]
}

export async function GET() {
  return NextResponse.json<HomeData>({
    topPlans: [],
    seasonalPois: [],
  })
}
