import { NextRequest, NextResponse } from 'next/server'
import { bffErrorResponse } from '@/lib/bff'
import { fetchCollectionDetail } from '@/lib/collections'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const locale = req.nextUrl.searchParams.get('locale') ?? 'en'
  try {
    const data = await fetchCollectionDetail(params.slug, locale)
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (e) {
    // A failed load is never a 404 (the screen reads 404 as Page not found): a 404 from one of
    // the collection's inner calls becomes 502 so the screen shows its error state.
    const res = bffErrorResponse(e)
    return res.status === 404 ? NextResponse.json({ error: 'Upstream error' }, { status: 502 }) : res
  }
}
