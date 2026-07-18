import { NextResponse } from 'next/server'

export interface HomePromotion {
  id: string
  headline: string
  image_url: string | null
  cta_url: string
  cta_label: string
}

const MOCK: HomePromotion[] = []

export async function GET() {
  return NextResponse.json(MOCK)
}
