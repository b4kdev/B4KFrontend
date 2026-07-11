import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // Stub — real impl queries social.poi_saves JOIN service.places_snapshot WHERE user_id = params.id AND is_active = TRUE
  void params
  return NextResponse.json({ items: [] })
}
