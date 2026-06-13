import { NextRequest, NextResponse } from 'next/server'
import { EXPLORE_MOCK } from '@/lib/mock/explore'

export async function GET(
  _req: NextRequest,
  { params }: { params: { category: string } }
) {
  const data = EXPLORE_MOCK[params.category]
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(data)
}
