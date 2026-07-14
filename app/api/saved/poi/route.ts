import { NextRequest, NextResponse } from 'next/server'

// POST /api/saved/poi — save a POI (social.poi_saves)
// DELETE /api/saved/poi — unsave a POI
// Stub: returns success. Production: upsert/delete social.poi_saves.

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { poi_id } = body
  if (!poi_id) return NextResponse.json({ error: 'missing_poi_id' }, { status: 400 })
  return NextResponse.json({ success: true, poi_id, saved: true })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { poi_id } = body
  if (!poi_id) return NextResponse.json({ error: 'missing_poi_id' }, { status: 400 })
  return NextResponse.json({ success: true, poi_id, saved: false })
}
