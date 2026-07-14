import { NextResponse } from 'next/server'

export interface HomePromotion {
  id: string
  headline: string
  image_url: string | null
  cta_url: string
  cta_label: string
}

const MOCK: HomePromotion[] = [
  { id: 'promo-01', headline: '10% off all K-Beauty partner tours this month', image_url: null, cta_url: 'https://english.visitkorea.or.kr', cta_label: 'Claim offer' },
  { id: 'promo-02', headline: 'Free itinerary planning for Japan travelers',   image_url: null, cta_url: '/map?ai=open',                     cta_label: 'Plan with AI' },
]

export async function GET() {
  return NextResponse.json(MOCK)
}
