import { NextResponse } from 'next/server'

const MOCK_SUGGESTIONS = [
  'Hongdae K-Pop café',
  'Gyeongbokgung Palace',
  'BTS Hangang Park',
  'Myeongdong street food',
  'Sinchon drama filming location',
  'Gangnam beauty clinic',
  'Bukchon Hanok Village',
  'HYBE HQ tour',
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim().toLowerCase() ?? ''
  const suggestions = q.length < 2
    ? []
    : MOCK_SUGGESTIONS.filter(s => s.toLowerCase().includes(q)).slice(0, 8)
  return NextResponse.json({ suggestions })
}
