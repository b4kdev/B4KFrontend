import { NextRequest, NextResponse } from 'next/server'
import { getFilmingSpotsDetail } from '@/lib/kdrama-filming-spots'

export async function GET(req: NextRequest, { params }: { params: { workId: string } }) {
  const includeUnverified =
    process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('includeUnverified') === '1'

  const data = getFilmingSpotsDetail(params.workId, includeUnverified)
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(data)
}
