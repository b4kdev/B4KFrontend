import { NextResponse } from 'next/server'
import type { HomeTrendingPoi } from '../trending/route'

export async function GET() {
  const empty: HomeTrendingPoi[] = []
  return NextResponse.json(empty)
}
