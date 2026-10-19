import { NextRequest, NextResponse } from 'next/server'
import { withDbPoiIds } from '@/lib/db-poi-mapping'
import { resolvePerfumeFlagships } from '@/lib/kbeauty-perfume-flagships'

export async function GET(req: NextRequest) {
  const includeUnverified =
    process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('includeUnverified') === '1'

  const data = await resolvePerfumeFlagships(includeUnverified)
  return NextResponse.json({ ...data, items: withDbPoiIds(data.items) })
}
