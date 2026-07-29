import { NextRequest, NextResponse } from 'next/server'
import { getMichelinNoodles, MICHELIN_NOODLES_TOTAL } from '@/lib/kfood-michelin-noodles'

export async function GET(req: NextRequest) {
  const includeUnverified =
    process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('includeUnverified') === '1'

  return NextResponse.json({
    totalCount: MICHELIN_NOODLES_TOTAL,
    items: getMichelinNoodles(includeUnverified),
  })
}
