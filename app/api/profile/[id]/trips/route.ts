import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // Stub — real impl queries ai.plans WHERE author_id = params.id AND is_published = TRUE AND is_active = TRUE
  void params
  return NextResponse.json({ items: [] })
}
