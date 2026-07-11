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

const MOCK: HomePopularPlan[] = [
  { id: 'plan-pp-01', title: 'Seoul BTS Trail · 5 Stops',    author_name: '@yuna_travels', stop_count: 5,  save_count: 91,  cover_image_url: null, is_partner: false },
  { id: 'plan-pp-02', title: 'Jeju Sunrise to Sunset',       author_name: '@jiho_explore',  stop_count: 8,  save_count: 64,  cover_image_url: null, is_partner: false },
  { id: 'plan-pp-03', title: 'Gyeongju in a Day',            author_name: '@seoultaste',    stop_count: 6,  save_count: 48,  cover_image_url: null, is_partner: true  },
  { id: 'plan-pp-04', title: 'Busan Street Food Loop',       author_name: '@travel.kr',     stop_count: 9,  save_count: 37,  cover_image_url: null, is_partner: false },
  { id: 'plan-pp-05', title: 'K-Beauty Gangnam Circuit',     author_name: '@beautyseeker',  stop_count: 4,  save_count: 29,  cover_image_url: null, is_partner: true  },
]

export async function GET() {
  return NextResponse.json(MOCK)
}
