import { NextRequest, NextResponse } from 'next/server'
import { getPerfumeFlagships, PERFUME_FLAGSHIPS_TOTAL } from '@/lib/kbeauty-perfume-flagships'

export async function GET(req: NextRequest) {
  const includeUnverified =
    process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('includeUnverified') === '1'

  return NextResponse.json({
    totalCount: PERFUME_FLAGSHIPS_TOTAL,
    items: getPerfumeFlagships(includeUnverified),
  })
}
