import { NextRequest, NextResponse } from 'next/server'
import { fetchCollectionDetail } from '@/lib/collections'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const locale = req.nextUrl.searchParams.get('locale') ?? 'en'
  const data = await fetchCollectionDetail(params.slug, locale)
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(data)
}
