import { NextRequest, NextResponse } from 'next/server'
import { fetchCollectionDetail } from '@/lib/collections'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const data = await fetchCollectionDetail(params.slug)
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(data)
}
