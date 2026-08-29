import { NextRequest, NextResponse } from 'next/server'
import { resolvePerfumeFlagships } from '@/lib/kbeauty-perfume-flagships'

export async function GET(req: NextRequest) {
  const includeUnverified =
    process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('includeUnverified') === '1'

  return NextResponse.json(await resolvePerfumeFlagships(includeUnverified))
}
