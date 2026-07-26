import { NextResponse } from 'next/server'
import { SEED } from './data'

export type { HomeCarouselSlide } from './data'

export async function GET() {
  return NextResponse.json(SEED)
}
