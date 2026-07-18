import { NextResponse } from 'next/server'
import type { HomeTrendingPoi } from '../trending/route'

// category param: 'k-pop' | 'k-drama' | 'k-beauty' | 'k-culture' | undefined (all)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  // category currently unused while empty — kept for shape/contract stability
  searchParams.get('category')
  const empty: HomeTrendingPoi[] = []
  return NextResponse.json(empty)
}
