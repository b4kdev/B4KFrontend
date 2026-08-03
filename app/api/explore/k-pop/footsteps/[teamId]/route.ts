import { NextRequest, NextResponse } from 'next/server'
import { getFootstepsDetail } from '@/lib/kpop-footsteps'

export async function GET(req: NextRequest, { params }: { params: { teamId: string } }) {
  // Same dev-only preview gate as app/api/explore/[category]/route.ts — a no-op
  // outside development even if the query param is present.
  const includeUnverified =
    process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('includeUnverified') === '1'

  const data = getFootstepsDetail(params.teamId, includeUnverified)
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(data)
}
