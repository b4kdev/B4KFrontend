import { NextRequest, NextResponse } from 'next/server'
import { withDbPoiIds } from '@/lib/db-poi-mapping'
import { resolveMichelinNoodles } from '@/lib/kfood-michelin-noodles'

export async function GET(req: NextRequest) {
  const includeUnverified =
    process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('includeUnverified') === '1'

  const data = await resolveMichelinNoodles(includeUnverified)
  return NextResponse.json({ ...data, items: withDbPoiIds(data.items) })
}
