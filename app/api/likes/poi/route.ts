import { NextRequest, NextResponse } from 'next/server'

// POST /api/likes/poi — like a POI (social.poi_likes)
// DELETE /api/likes/poi — unlike a POI
// Stub: returns success. Production: upsert/delete social.poi_likes.

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { place_id } = body
  if (!place_id) return NextResponse.json({ error: 'missing_place_id' }, { status: 400 })
  return NextResponse.json({ success: true, place_id, liked: true })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { place_id } = body
  if (!place_id) return NextResponse.json({ error: 'missing_place_id' }, { status: 400 })
  return NextResponse.json({ success: true, place_id, liked: false })
}
