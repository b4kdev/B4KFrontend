import { NextRequest, NextResponse } from 'next/server'
import { resolveMichelinNoodles } from '@/lib/kfood-michelin-noodles'

export async function GET(req: NextRequest) {
  const includeUnverified =
    process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('includeUnverified') === '1'

  return NextResponse.json(await resolveMichelinNoodles(includeUnverified))
}
