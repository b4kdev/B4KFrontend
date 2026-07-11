import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // Stub — real impl queries social.user_badges JOIN social.badge_definitions WHERE user_id = params.id
  void params
  return NextResponse.json({ items: [] })
}
