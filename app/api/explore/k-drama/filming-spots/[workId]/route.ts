import { NextRequest, NextResponse } from 'next/server'
import { withDbPoiIds } from '@/lib/db-poi-mapping'
import { resolveFilmingSpotsDetail } from '@/lib/kdrama-filming-spots'

export async function GET(req: NextRequest, props: { params: Promise<{ workId: string }> }) {
  const params = await props.params;
  const includeUnverified =
    process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('includeUnverified') === '1'

  const data = await resolveFilmingSpotsDetail(params.workId, includeUnverified)
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ ...data, items: withDbPoiIds(data.items) })
}
