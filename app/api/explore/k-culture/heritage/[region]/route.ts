import { NextRequest, NextResponse } from 'next/server'
import { getHeritageDetail } from '@/lib/kculture-heritage'

export async function GET(req: NextRequest, { params }: { params: { region: string } }) {
  const includeUnverified =
    process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('includeUnverified') === '1'

  const data = getHeritageDetail(params.region, includeUnverified)
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(data)
}
