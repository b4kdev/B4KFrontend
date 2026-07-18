import { NextResponse } from 'next/server'

// No data yet — real suggestions come from service.search_index.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  searchParams.get('q')
  return NextResponse.json({ suggestions: [] })
}
